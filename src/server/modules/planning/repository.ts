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
  /** Journal des cuissons de la semaine : nombre de fois où chaque recette a été cuisinée. */
  cookedCounts: ReadonlyMap<string, number>;
}

/**
 * Le journal compte les plats cuisinés par recette : on les attribue aux premières
 * occurrences (un reste ne se cuisine pas). Renvoie les positions (1..n) cuisinées.
 */
export function markCooked(
  entries: readonly PlanEntry[],
  counts: ReadonlyMap<string, number>,
): Set<number> {
  const left = new Map(counts);
  const cooked = new Set<number>();
  entries.forEach((e, i) => {
    if (e.leftover) return;
    const n = left.get(e.recipeId) ?? 0;
    if (n > 0) {
      cooked.add(i + 1);
      left.set(e.recipeId, n - 1);
    }
  });
  return cooked;
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
  const cookedCounts = new Map<string, number>();
  for (const c of data.meal_cookings ?? [])
    cookedCounts.set(c.recipe_id, (cookedCounts.get(c.recipe_id) ?? 0) + 1);
  const planEntries: PlanEntry[] = entries.map((e) => ({
    recipeId: e.recipe_id,
    servings: e.servings,
    locked: e.locked,
    day: e.planned_on && e.meal_slot ? e.planned_on : null,
    slot: e.planned_on && isSlot(e.meal_slot) ? e.meal_slot : null,
    ...(e.leftover ? { leftover: true } : {}),
  }));
  return {
    id: data.id,
    version: data.version,
    people: data.people,
    mealCount: data.meal_count,
    budgetCents: data.budget_cents,
    seed: data.seed,
    entries: planEntries,
    shoppingDoneAt: data.shopping_done_at,
    cooked: markCooked(planEntries, cookedCounts),
    cookedCounts,
  };
}

/** Format d'échange des plats avec la base (menu et brouillon). */
function toJsonEntries(entries: readonly PlanEntry[]) {
  return entries.map((e) => ({
    recipe_id: e.recipeId,
    servings: e.servings,
    locked: e.locked,
    // Jour et repas vont ensemble (contrainte en base).
    ...(e.day && e.slot ? { planned_on: e.day, slot: e.slot } : {}),
    ...(e.leftover ? { leftover: true } : {}),
  }));
}

function fromJsonEntries(raw: unknown): PlanEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r) => {
    if (!r || typeof r !== "object") return [];
    const o = r as Record<string, unknown>;
    if (typeof o.recipe_id !== "string" || typeof o.servings !== "number") return [];
    const day = typeof o.planned_on === "string" ? o.planned_on : null;
    const slot = typeof o.slot === "string" && isSlot(o.slot) ? o.slot : null;
    return [
      {
        recipeId: o.recipe_id,
        servings: o.servings,
        locked: o.locked === true,
        day: day && slot ? day : null,
        slot: day && slot ? slot : null,
        ...(o.leftover === true ? { leftover: true } : {}),
      },
    ];
  });
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
    p_entries: toJsonEntries(args.entries),
    p_expected_version: args.expectedVersion as number,
    p_idempotency_key: args.idempotencyKey ?? randomUUID(),
  });
  if (error) throw toActionError(error);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Réponse inattendue à l'enregistrement du menu.");
  return { planId: row.plan_id, version: row.plan_version };
}

// ---------------------------------------------------------------------------
// Brouillon de menu (migration 0041) : ce que l'on modifie avant de valider.
// ---------------------------------------------------------------------------

/** Un brouillon resté sans modification plus longtemps est considéré comme abandonné. */
const DRAFT_TTL_MS = 12 * 60 * 60 * 1000;

export interface StoredDraft {
  revision: number;
  /** Version du menu validé au début du brouillon (null : aucun menu). */
  baseVersion: number | null;
  people: number;
  mealCount: number;
  budgetCents: number | null;
  seed: number;
  entries: PlanEntry[];
  /** Recettes écartées par « Changer » pendant ce brouillon. */
  rejected: string[];
}

export async function readDraft(
  supabase: Supabase,
  householdId: string,
  weekStart: string,
): Promise<StoredDraft | null> {
  const { data, error } = await supabase
    .from("meal_plan_drafts")
    .select(
      "revision, base_version, people, meal_count, budget_cents, seed, entries, rejected, updated_at",
    )
    .eq("household_id", householdId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw new Error(`Lecture du brouillon impossible : ${error.message}`);
  if (!data) return null;
  if (Date.now() - new Date(data.updated_at).getTime() > DRAFT_TTL_MS) {
    await discardDraft(supabase, householdId, weekStart);
    return null;
  }
  return {
    revision: data.revision,
    baseVersion: data.base_version,
    people: data.people,
    mealCount: data.meal_count,
    budgetCents: data.budget_cents,
    seed: data.seed,
    entries: fromJsonEntries(data.entries),
    rejected: data.rejected ?? [],
  };
}

/** Crée ou modifie le brouillon (révision optimiste, idempotent). Lève une ActionError. */
export async function saveDraft(
  supabase: Supabase,
  args: {
    householdId: string;
    weekStart: string;
    baseVersion: number | null;
    expectedRevision: number | null;
    people: number;
    mealCount: number;
    budgetCents: number | null;
    seed: number;
    entries: readonly PlanEntry[];
    rejected: readonly string[];
    idempotencyKey: string;
  },
): Promise<number> {
  const { data, error } = await supabase.rpc("meal_plan_draft_save", {
    p_household_id: args.householdId,
    p_week_start: args.weekStart,
    p_base_version: args.baseVersion as number,
    p_expected_revision: args.expectedRevision as number,
    p_people: args.people,
    p_meal_count: Math.max(1, Math.min(21, args.mealCount)),
    p_budget_cents: args.budgetCents as number,
    p_seed: args.seed,
    p_entries: toJsonEntries(args.entries),
    p_rejected: args.rejected.slice(-300),
    p_key: args.idempotencyKey,
  });
  if (error) throw toActionError(error);
  return data;
}

/** Valide le brouillon : il devient le menu de la semaine (une transaction). */
export async function validateDraft(
  supabase: Supabase,
  args: { householdId: string; weekStart: string; revision: number; idempotencyKey: string },
): Promise<{ planId: string; version: number }> {
  const { data, error } = await supabase.rpc("meal_plan_draft_validate", {
    p_household_id: args.householdId,
    p_week_start: args.weekStart,
    p_expected_revision: args.revision,
    p_idempotency_key: args.idempotencyKey,
  });
  if (error) throw toActionError(error);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Réponse inattendue à la validation du menu.");
  return { planId: row.plan_id, version: row.plan_version };
}

/** Abandonne le brouillon de la semaine (sans effet s'il n'y en a pas). */
export async function discardDraft(
  supabase: Supabase,
  householdId: string,
  weekStart: string,
): Promise<void> {
  const { error } = await supabase
    .from("meal_plan_drafts")
    .delete()
    .eq("household_id", householdId)
    .eq("week_start", weekStart);
  if (error) throw new Error(`Abandon du brouillon impossible : ${error.message}`);
}

/**
 * Ce que l'on affiche et modifie : le brouillon s'il existe, sinon le menu validé.
 * `token` identifie la version vue (« d3 » : brouillon révision 3, « p2 » : menu version 2) ;
 * chaque formulaire le renvoie pour détecter une modification concurrente.
 */
export interface WorkingPlan {
  token: string;
  isDraft: boolean;
  people: number;
  mealCount: number;
  budgetCents: number | null;
  seed: number;
  entries: PlanEntry[];
  cooked: Set<number>;
  rejected: string[];
  plan: StoredPlan | null;
  draft: StoredDraft | null;
}

export async function readWorking(
  supabase: Supabase,
  householdId: string,
  weekStart: string,
): Promise<WorkingPlan | null> {
  const [plan, draft] = await Promise.all([
    readPlan(supabase, householdId, weekStart),
    readDraft(supabase, householdId, weekStart),
  ]);
  if (draft) {
    return {
      token: `d${draft.revision}`,
      isDraft: true,
      people: draft.people,
      mealCount: draft.mealCount,
      budgetCents: draft.budgetCents,
      seed: draft.seed,
      entries: draft.entries,
      cooked: markCooked(draft.entries, plan?.cookedCounts ?? new Map()),
      rejected: draft.rejected,
      plan,
      draft,
    };
  }
  if (!plan) return null;
  return {
    token: `p${plan.version}`,
    isDraft: false,
    people: plan.people,
    mealCount: plan.mealCount,
    budgetCents: plan.budgetCents,
    seed: plan.seed,
    entries: plan.entries,
    cooked: plan.cooked,
    rejected: [],
    plan,
    draft: null,
  };
}
