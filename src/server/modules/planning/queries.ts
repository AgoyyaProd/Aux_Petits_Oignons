import "server-only";
import { randomUUID } from "node:crypto";
import {
  compareBySlot,
  isPlannedSlot,
  plannedSlots,
  slotKey,
  toPattern,
  weekSlots,
  type MealSlot,
} from "@/domain/planning";
import { millicentsToCents } from "@/domain/pricing";
import { todayIn } from "@/lib/dates";
import { addDays, formatSlot, isMonday, mondayOf } from "@/lib/week";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { costOfEntry, getPlanningCatalog } from "./catalog";
import { orderChoices } from "@/domain/planning/pick";
import { readWorking } from "./repository";
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
  /** Protéines d'une portion (g), null si le calcul n'est pas fiable. */
  proteinPerServing: number | null;
}

/**
 * Données de la page Menu pour une semaine (lundi) : le brouillon en cours s'il existe
 * (menu proposé, pas encore validé), sinon le menu validé.
 */
export async function getPlannerPage({ week }: { week?: string }) {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();

  const today = todayIn(household.timezone);
  const weekStart = week && isMonday(week) ? week : mondayOf(today);

  const settings = await supabase
    .from("households")
    .select("max_prep_minutes, reference_store, meal_slots, meals_per_cook")
    .eq("id", household.id)
    .single();
  if (settings.error) throw new Error(settings.error.message);

  const [plan, catalog, lastPrice] = await Promise.all([
    readWorking(supabase, household.id, weekStart),
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
        proteinPerServing: null,
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
      proteinPerServing: meta.proteinPerServing,
    };
  });
  // Affichage dans l'ordre de la semaine ; la position reste l'identifiant du plat.
  entries.sort((a, b) => compareBySlot(a, b) || a.position - b.position);

  const balance = await loadWeekBalance(
    supabase,
    entries.filter((e) => e.slug !== null).map((e) => ({ recipeId: e.recipeId, title: e.title })),
  );

  const pattern = toPattern(settings.data.meal_slots, settings.data.meals_per_cook);
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
      /** Un repas par case prévue de la semaine type. */
      mealCount: plannedSlots(weekStart, pattern).length,
    },
    /** Repas couverts par une cuisson (réglage du foyer). */
    mealsPerCook: pattern.mealsPerCook,
    plan: plan && {
      /** Version vue, renvoyée par chaque formulaire (« d3 » brouillon, « p2 » menu validé). */
      version: plan.token,
      /** Menu proposé ou modifié, pas encore validé : rien n'est enregistré. */
      isDraft: plan.isDraft,
      /** Un menu validé existe pour cette semaine (le brouillon le remplacera). */
      hasValidated: plan.plan !== null,
      people: plan.people,
      mealCount: plan.mealCount,
      budgetCents: plan.budgetCents,
      shoppingDoneAt: plan.plan?.shoppingDoneAt ?? null,
    },
    entries,
    /** Équilibre nutritionnel des repas du menu (repères PNNS). */
    balance,
    /** Objectif de protéines par part du foyer (g), et repas qui l'atteignent. */
    protein: proteinSummary(entries, catalog.profile.proteinTargetG ?? null),
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
      /** Repas prévu dans la semaine type du foyer. */
      planned: isPlannedSlot(ref, weekStart, pattern),
    })),
    candidateCount: catalog.candidates.length,
    /** Plats écartés par le matériel, les aliments non souhaités ou le temps maximal. */
    limits: catalog.limits,
    /**
     * Recettes pour choisir un plat par la recherche : celles qui conviennent au foyer, puis les
     * autres plats (hors allergies et régimes) avec la raison pour laquelle ils ne sont pas
     * proposés d'office.
     */
    choices: orderChoices(
      [
        ...catalog.candidates.map((c) => ({ c, favorite: Boolean(c.favorite), warning: null })),
        ...catalog.offProfile.map((c) => ({ c, favorite: false, warning: c.warning })),
      ].map(({ c, favorite, warning }) => {
        const meta = catalog.recipes.get(c.id)!;
        return {
          id: c.id,
          slug: meta.slug,
          title: meta.title,
          tags: meta.tags,
          totalMinutes: meta.totalMinutes,
          /** Coût d'une portion (ingrédients au prix connu), en centimes ; null sans prix. */
          centsPerServing:
            c.costPerServingMillicents === null
              ? null
              : millicentsToCents(c.costPerServingMillicents),
          partialPrice: c.missingPrices > 0,
          favorite: favorite || meta.rating === 1,
          warning: warning as string | null,
        };
      }),
    ),
    prices: { pricedIngredients, lastObservation: lastPrice.data?.observed_to ?? null },
    /** Une clé d'idempotence par formulaire affiché : un double envoi n'agit qu'une fois. */
    newKey: () => randomUUID(),
  };
}

function proteinSummary(entries: readonly PlannerEntryView[], target: number | null) {
  if (target === null) return null;
  const measured = entries.filter((e) => e.proteinPerServing !== null);
  return {
    target,
    measured: measured.length,
    reached: measured.filter((e) => e.proteinPerServing! >= target).length,
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
