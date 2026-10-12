import "server-only";
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
}

/**
 * Budget : estimations calculées à partir des menus et des prix indicatifs.
 * Les dépenses réellement payées ne sont pas encore enregistrées par l'application :
 * elles ne sont ni calculées ni simulées.
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
    .select("max_prep_minutes, weekly_budget_cents")
    .eq("id", household.id)
    .single();
  if (settings.error) throw new Error(settings.error.message);

  const [plans, catalog] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("week_start, budget_cents, meal_plan_entries (recipe_id, servings, leftover)")
      .eq("household_id", household.id)
      .gte("week_start", from)
      .lte("week_start", current),
    getPlanningCatalog(household.id, household.timezone, settings.data.max_prep_minutes),
  ]);
  if (plans.error) throw new Error(`Lecture des menus impossible : ${plans.error.message}`);

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
    });
  }

  return {
    today,
    currentWeek: current,
    householdBudgetCents: settings.data.weekly_budget_cents,
    weeks,
  };
}
