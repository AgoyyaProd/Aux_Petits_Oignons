import "server-only";
import { monthOf } from "@/domain/recipes/season";
import { randomUUID } from "node:crypto";
import {
  compareBySlot,
  slotKey,
  suggestReplacements,
  weekSlots,
  type MealSlot,
} from "@/domain/planning";
import { todayIn } from "@/lib/dates";
import { addDays, formatSlot, isMonday, mondayOf } from "@/lib/week";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { costOfEntry, getPlanningCatalog } from "./catalog";
import { recentRecipeIds } from "@/server/modules/recipes/ratings";
import { readPlan } from "./repository";
import { loadWeekBalance } from "@/server/modules/recipes/nutrition-data";

export interface PlannerEntryView {
  position: number;
  recipeId: string;
  slug: string | null;
  title: string;
  /** Étiquettes de la recette (type de plat), pour le visuel. */
  tags: string[];
  servings: number;
  locked: boolean;
  totalMinutes: number | null;
  /** Coût des ingrédients dont le prix est connu, en centimes. */
  cents: number;
  missingNames: string[];
  available: boolean;
  /** Plat déjà cuisiné : ses ingrédients ont été retirés du garde-manger. */
  cooked: boolean;
  /** Recette favorite du foyer. */
  favorite: boolean;
  /** Jour et repas, ou null si le plat n'est pas encore placé. */
  day: string | null;
  slot: MealSlot | null;
  /** Reste d'un plat cuisiné en double : son coût est compté dans ce plat. */
  leftover: boolean;
  /** Repas où le plat est cuisiné (« Lundi 12 soir »), pour un reste placé. */
  leftoverOf: string | null;
  /** Ce plat est cuisiné en double : un reste est prévu plus tard. */
  hasLeftovers: boolean;
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
    getPlanningCatalog(household.id, household.timezone, settings.data.max_prep_minutes),
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
        tags: [],
        servings: e.servings,
        locked: e.locked,
        totalMinutes: null,
        cents: 0,
        missingNames: [],
        available: false,
        favorite: false,
        cooked: plan!.cooked.has(i + 1),
        day: e.day ?? null,
        slot: e.slot ?? null,
        leftover: Boolean(e.leftover),
        leftoverOf: null,
        hasLeftovers: false,
      };
    }
    const source = e.leftover
      ? plan!.entries.find((s) => s.recipeId === e.recipeId && !s.leftover)
      : undefined;
    const cost = e.leftover
      ? { cents: 0, missingNames: [] as string[] }
      : costOfEntry(meta, e.servings, catalog.priceBook);
    return {
      position: i + 1,
      recipeId: e.recipeId,
      slug: meta.slug,
      title: meta.title,
      tags: meta.tags,
      servings: e.servings,
      locked: e.locked,
      totalMinutes: meta.totalMinutes,
      cents: cost.cents,
      missingNames: cost.missingNames,
      available: meta.compatible,
      favorite: meta.rating === 1,
      cooked: plan!.cooked.has(i + 1),
      day: e.day ?? null,
      slot: e.slot ?? null,
      leftover: Boolean(e.leftover),
      leftoverOf: source?.day && source.slot ? formatSlot(source.day, source.slot) : null,
      hasLeftovers:
        !e.leftover && plan!.entries.some((o) => o.leftover && o.recipeId === e.recipeId),
    };
  });
  // Affichage dans l'ordre de la semaine ; la position reste l'identifiant du plat.
  entries.sort((a, b) => compareBySlot(a, b) || a.position - b.position);

  let replacements: ReplacementView[] = [];
  if (plan && replace && replace >= 1 && replace <= plan.entries.length) {
    const servings = plan.entries[replace - 1]!.servings;
    const recent = await recentRecipeIds(supabase, household.id, weekStart);
    replacements = suggestReplacements(catalog.candidates, plan.entries, replace - 1, {
      people: servings,
      budgetCents: plan.budgetCents,
      seed: plan.seed,
      recentRecipeIds: recent,
      profile: catalog.profile,
      month: monthOf(weekStart),
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

  const balance = await loadWeekBalance(
    supabase,
    entries.filter((e) => e.slug !== null).map((e) => ({ recipeId: e.recipeId, title: e.title })),
  );

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
    /** Équilibre nutritionnel des repas du menu (repères PNNS). */
    balance,
    totals: {
      cents: entries.reduce((s, e) => s + e.cents, 0),
      entriesWithMissing: entries.filter((e) => e.missingNames.length > 0).length,
      missingNames: [...missing].sort((a, b) => a.localeCompare(b, "fr")),
    },
    today,
    /** Cases de la semaine pour placer un plat (valeur « AAAA-MM-JJ:lunch|dinner »). */
    slots: weekSlots(weekStart).map((ref) => ({
      value: slotKey(ref),
      label: formatSlot(ref.day, ref.slot),
      day: ref.day,
    })),
    replace: replace ?? null,
    replacements,
    candidateCount: catalog.candidates.length,
    prices: { pricedIngredients, lastObservation: lastPrice.data?.observed_to ?? null },
    /** Une clé d'idempotence par formulaire affiché : un double envoi n'agit qu'une fois. */
    newKey: () => randomUUID(),
  };
}

export type PlannerPage = NonNullable<Awaited<ReturnType<typeof getPlannerPage>>>;

/** La recette est-elle au menu de la semaine en cours du foyer ? */
export async function isInCurrentPlan(recipeId: string): Promise<boolean> {
  const { household } = await getCurrentContext();
  if (!household) return false;
  const supabase = await createSupabaseServerClient();
  const week = mondayOf(todayIn(household.timezone));
  const { data, error } = await supabase
    .from("meal_plan_entries")
    .select("recipe_id, meal_plans!inner (week_start, household_id)")
    .eq("recipe_id", recipeId)
    .eq("meal_plans.household_id", household.id)
    .eq("meal_plans.week_start", week)
    .limit(1);
  if (error) throw new Error(`Lecture du menu impossible : ${error.message}`);
  return (data ?? []).length > 0;
}
