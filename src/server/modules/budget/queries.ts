import "server-only";
import { randomUUID } from "node:crypto";
import { weekSpending, type WeekSpending } from "@/domain/budget/spending";
import { todayIn } from "@/lib/dates";
import { addDays, mondayOf } from "@/lib/week";
import { getCurrentContext } from "@/server/modules/auth/session";
import { costOfEntry, getPlanningCatalog } from "@/server/modules/planning/catalog";
import { createSupabaseServerClient } from "@/server/supabase/server";

/** Nombre de semaines affichées dans l'historique. */
export const BUDGET_WEEKS = 8;

export interface BudgetWeek {
  weekStart: string;
  /** Budget fixé pour ce menu (ou celui du foyer), en centimes ; null si aucun. */
  budgetCents: number | null;
  /** Coût estimé des plats du menu (ingrédients au prix connu), en centimes. */
  estimatedCents: number;
  /** Des ingrédients sans prix : l'estimation est un minimum. */
  isMinimum: boolean;
  hasPlan: boolean;
  /** Ce qui a vraiment été payé (dépenses saisies) ; null si rien n'a été saisi. */
  spending: WeekSpending | null;
}

export interface ExpenseView {
  id: string;
  weekStart: string;
  spentOn: string;
  storeLabel: string | null;
  amountCents: number;
  nonFoodCents: number;
  source: "courses" | "manuel";
}

/**
 * Budget : estimations calculées à partir des menus et des prix indicatifs, et dépenses
 * réellement payées telles que le foyer les a saisies (0084). Rien n'est simulé : une
 * semaine sans saisie n'a pas de montant payé.
 */
export async function getBudgetPage() {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();
  const today = todayIn(household.timezone);
  const current = mondayOf(today);
  const from = addDays(current, -7 * (BUDGET_WEEKS - 1));

  const settings = await supabase
    .from("households")
    .select("max_prep_minutes, weekly_budget_cents, reference_store")
    .eq("id", household.id)
    .single();
  if (settings.error) throw new Error(settings.error.message);

  const [plans, catalog, expenses] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("week_start, budget_cents, meal_plan_entries (recipe_id, servings, leftover)")
      .eq("household_id", household.id)
      .gte("week_start", from)
      .lte("week_start", current),
    getPlanningCatalog(household.id, household.timezone, settings.data.max_prep_minutes),
    supabase
      .from("household_expenses")
      .select(
        "id, week_start, spent_on, store_label, amount_cents, non_food_cents, estimated_store_cents, estimated_meals_cents, estimate_is_minimum, source, created_at",
      )
      .eq("household_id", household.id)
      .gte("week_start", from)
      .lte("week_start", current)
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (plans.error) throw new Error(`Lecture des menus impossible : ${plans.error.message}`);
  if (expenses.error) {
    throw new Error(`Lecture des dépenses impossible : ${expenses.error.message}`);
  }
  const expensesByWeek = new Map<string, typeof expenses.data>();
  for (const e of expenses.data) {
    expensesByWeek.set(e.week_start, [...(expensesByWeek.get(e.week_start) ?? []), e]);
  }

  const byWeek = new Map(plans.data.map((p) => [p.week_start, p]));
  const weeks: BudgetWeek[] = [];
  for (let i = 0; i < BUDGET_WEEKS; i += 1) {
    const weekStart = addDays(from, 7 * i);
    const plan = byWeek.get(weekStart);
    let estimatedCents = 0;
    let isMinimum = false;
    for (const e of plan?.meal_plan_entries ?? []) {
      // Un reste est déjà payé avec le plat cuisiné en double.
      if (e.leftover) continue;
      const meta = catalog.recipes.get(e.recipe_id);
      if (!meta) {
        isMinimum = true;
        continue;
      }
      const cost = costOfEntry(meta, e.servings, catalog.priceBook);
      estimatedCents += cost.cents;
      if (cost.missingNames.length) isMinimum = true;
    }
    weeks.push({
      weekStart,
      budgetCents: plan ? plan.budget_cents : null,
      estimatedCents,
      isMinimum,
      hasPlan: Boolean(plan),
      spending: weekSpending(
        (expensesByWeek.get(weekStart) ?? []).map((e) => ({
          amountCents: e.amount_cents,
          nonFoodCents: e.non_food_cents,
          estimatedStoreCents: e.estimated_store_cents,
          estimatedMealsCents: e.estimated_meals_cents,
          estimateIsMinimum: e.estimate_is_minimum,
        })),
      ),
    });
  }

  return {
    today,
    currentWeek: current,
    householdBudgetCents: settings.data.weekly_budget_cents,
    referenceStore: settings.data.reference_store,
    weeks,
    /** Dépenses de la semaine en cours, la plus récente d'abord. */
    expenses: (expensesByWeek.get(current) ?? []).map((e): ExpenseView => ({
      id: e.id,
      weekStart: e.week_start,
      spentOn: e.spent_on,
      storeLabel: e.store_label,
      amountCents: e.amount_cents,
      nonFoodCents: e.non_food_cents,
      source: e.source === "courses" ? "courses" : "manuel",
    })),
    newKey: () => randomUUID(),
  };
}

/** Magasin de référence du foyer (proposé par défaut à la saisie d'une dépense). */
export async function getReferenceStore(): Promise<string | null> {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("households")
    .select("reference_store")
    .eq("id", household.id)
    .single();
  if (error) throw new Error(error.message);
  return data.reference_store;
}
