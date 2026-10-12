import "server-only";
import { randomUUID } from "node:crypto";
import type { MealSlot, PlanEntry } from "@/domain/planning";
import { toActionError } from "@/server/errors";
import type { Supabase } from "@/server/modules/recipes/queries";

function isSlot(value: string | null): value is MealSlot {
  return value === "lunch" || value === "dinner";
}

export interface StoredPlan {
  id: string;
  version: number;
  people: number;
  mealCount: number;
  budgetCents: number | null;
  seed: number;
  entries: PlanEntry[];
  /** Date de fin des courses (« Finir les courses »), sinon null. */
  shoppingDoneAt: string | null;
  /** Positions (1..n) des plats déjà cuisinés. */
  cooked: Set<number>;
}

export async function readPlan(
  supabase: Supabase,
  householdId: string,
  weekStart: string,
): Promise<StoredPlan | null> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select(
      "id, version, people, meal_count, budget_cents, seed, shopping_done_at, meal_plan_entries (position, recipe_id, servings, locked, planned_on, meal_slot, leftover), meal_cookings (recipe_id)",
    )
    .eq("household_id", householdId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw new Error(`Lecture du menu impossible : ${error.message}`);
  if (!data) return null;
  const entries = [...(data.meal_plan_entries ?? [])].sort((a, b) => a.position - b.position);
  // Le journal compte les plats cuisinés par recette : on les attribue aux premières occurrences.
  const toMark = new Map<string, number>();
  for (const c of data.meal_cookings ?? [])
    toMark.set(c.recipe_id, (toMark.get(c.recipe_id) ?? 0) + 1);
  const cooked = new Set<number>();
  entries.forEach((e, i) => {
    // Un reste ne se cuisine pas : le journal ne concerne que les plats préparés.
    if (e.leftover) return;
    const left = toMark.get(e.recipe_id) ?? 0;
    if (left > 0) {
      cooked.add(i + 1);
      toMark.set(e.recipe_id, left - 1);
    }
  });
  return {
    id: data.id,
    version: data.version,
    people: data.people,
    mealCount: data.meal_count,
    budgetCents: data.budget_cents,
    seed: data.seed,
    entries: entries.map((e) => ({
      recipeId: e.recipe_id,
      servings: e.servings,
      locked: e.locked,
      day: e.planned_on && e.meal_slot ? e.planned_on : null,
      slot: e.planned_on && isSlot(e.meal_slot) ? e.meal_slot : null,
      ...(e.leftover ? { leftover: true } : {}),
    })),
    shoppingDoneAt: data.shopping_done_at,
    cooked,
  };
}

/** Enregistre le menu complet (atomique, idempotent, version optimiste). Lève une ActionError. */
export async function savePlan(
  supabase: Supabase,
  args: {
    householdId: string;
    weekStart: string;
    people: number;
    mealCount: number;
    budgetCents: number | null;
    seed: number;
    entries: readonly PlanEntry[];
    expectedVersion: number | null;
    idempotencyKey?: string;
  },
): Promise<{ planId: string; version: number }> {
  const { data, error } = await supabase.rpc("meal_plan_save", {
    p_household_id: args.householdId,
    p_week_start: args.weekStart,
    p_people: args.people,
    p_meal_count: Math.max(1, args.mealCount),
    p_budget_cents: args.budgetCents as number,
    p_seed: args.seed,
    p_entries: args.entries.map((e) => ({
      recipe_id: e.recipeId,
      servings: e.servings,
      locked: e.locked,
      // Jour et repas vont ensemble (contrainte en base).
      ...(e.day && e.slot ? { planned_on: e.day, slot: e.slot } : {}),
      ...(e.leftover ? { leftover: true } : {}),
    })),
    p_expected_version: args.expectedVersion as number,
    p_idempotency_key: args.idempotencyKey ?? randomUUID(),
  });
  if (error) throw toActionError(error);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Réponse inattendue à l'enregistrement du menu.");
  return { planId: row.plan_id, version: row.plan_version };
}
