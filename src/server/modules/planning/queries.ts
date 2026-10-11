import "server-only";
import { randomUUID } from "node:crypto";
import { suggestReplacements } from "@/domain/planning";
import { todayIn } from "@/lib/dates";
import { addDays, isMonday, mondayOf } from "@/lib/week";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { costOfEntry, loadPlanningCatalog } from "./catalog";
import { readPlan } from "./repository";

export interface PlannerEntryView {
  position: number;
  recipeId: string;
  slug: string | null;
  title: string;
  servings: number;
  locked: boolean;
  totalMinutes: number | null;
  /** Coût des ingrédients dont le prix est connu, en centimes. */
  cents: number;
  missingNames: string[];
  available: boolean;
  /** Plat déjà cuisiné : ses ingrédients ont été retirés du garde-manger. */
  cooked: boolean;
}

export interface ReplacementView {
  recipeId: string;
  slug: string;
  title: string;
  totalMinutes: number;
  cents: number;
  missing: number;
}

/** Données de la page Menu pour une semaine (lundi), avec propositions de remplacement. */
export async function getPlannerPage({ week, replace }: { week?: string; replace?: number }) {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();

  const today = todayIn(household.timezone);
  const weekStart = week && isMonday(week) ? week : mondayOf(today);

  const settings = await supabase
    .from("households")
    .select("max_prep_minutes, reference_store")
    .eq("id", household.id)
    .single();
  if (settings.error) throw new Error(settings.error.message);

  const [plan, catalog, lastPrice] = await Promise.all([
    readPlan(supabase, household.id, weekStart),
    loadPlanningCatalog(supabase, {
      id: household.id,
      timezone: household.timezone,
      maxPrepMinutes: settings.data.max_prep_minutes,
    }),
    supabase
      .from("reference_prices")
      .select("observed_to")
      .eq("source", "open_prices")
      .order("observed_to", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const entries: PlannerEntryView[] = (plan?.entries ?? []).map((e, i) => {
    const meta = catalog.recipes.get(e.recipeId);
    if (!meta) {
      return {
        position: i + 1,
        recipeId: e.recipeId,
        slug: null,
        title: "Recette indisponible",
        servings: e.servings,
        locked: e.locked,
        totalMinutes: null,
        cents: 0,
        missingNames: [],
        available: false,
        cooked: plan!.cooked.has(i + 1),
      };
    }
    const cost = costOfEntry(meta, e.servings, catalog.priceBook);
    return {
      position: i + 1,
      recipeId: e.recipeId,
      slug: meta.slug,
      title: meta.title,
      servings: e.servings,
      locked: e.locked,
      totalMinutes: meta.totalMinutes,
      cents: cost.cents,
      missingNames: cost.missingNames,
      available: meta.compatible,
      cooked: plan!.cooked.has(i + 1),
    };
  });

  let replacements: ReplacementView[] = [];
  if (plan && replace && replace >= 1 && replace <= plan.entries.length) {
    const servings = plan.entries[replace - 1]!.servings;
    replacements = suggestReplacements(catalog.candidates, plan.entries, replace - 1, {
      people: servings,
      budgetCents: plan.budgetCents,
      seed: plan.seed,
    }).flatMap((id) => {
      const meta = catalog.recipes.get(id);
      if (!meta) return [];
      const cost = costOfEntry(meta, servings, catalog.priceBook);
      return [
        {
          recipeId: id,
          slug: meta.slug,
          title: meta.title,
          totalMinutes: meta.totalMinutes,
          cents: cost.cents,
          missing: cost.missingNames.length,
        },
      ];
    });
  }

  const missing = new Set(entries.flatMap((e) => e.missingNames));
  const pricedIngredients = [...catalog.priceBook.values()].filter(
    (p) => p.source !== "free",
  ).length;

  return {
    householdId: household.id,
    weekStart,
    previousWeek: addDays(weekStart, -7),
    nextWeek: addDays(weekStart, 7),
    isCurrentWeek: weekStart === mondayOf(today),
    referenceStore: settings.data.reference_store,
    defaults: {
      people: household.people_count,
      budgetCents: household.weekly_budget_cents,
      mealCount: 5,
    },
    plan: plan && {
      version: plan.version,
      people: plan.people,
      mealCount: plan.mealCount,
      budgetCents: plan.budgetCents,
      shoppingDoneAt: plan.shoppingDoneAt,
    },
    entries,
    totals: {
      cents: entries.reduce((s, e) => s + e.cents, 0),
      entriesWithMissing: entries.filter((e) => e.missingNames.length > 0).length,
      missingNames: [...missing].sort((a, b) => a.localeCompare(b, "fr")),
    },
    replace: replace ?? null,
    replacements,
    candidateCount: catalog.candidates.length,
    prices: { pricedIngredients, lastObservation: lastPrice.data?.observed_to ?? null },
    /** Une clé d'idempotence par formulaire affiché : un double envoi n'agit qu'une fois. */
    newKey: () => randomUUID(),
  };
}

export type PlannerPage = NonNullable<Awaited<ReturnType<typeof getPlannerPage>>>;
