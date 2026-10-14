import "server-only";
import { addDays } from "@/lib/week";
import type { Supabase } from "./queries"; // type seul : pas de dépendance circulaire à l'exécution

export type Rating = 1 | -1;

/** Avis du foyer : 1 = on aime (favori), -1 = pas pour nous. Absent = neutre. */
export async function loadRatings(
  supabase: Supabase,
  householdId: string,
): Promise<Map<string, Rating>> {
  const { data, error } = await supabase
    .from("recipe_ratings")
    .select("recipe_id, rating")
    .eq("household_id", householdId);
  if (error) throw new Error(`Lecture des avis impossible : ${error.message}`);
  return new Map(data.map((r) => [r.recipe_id, r.rating === 1 ? 1 : -1]));
}

/** Semaines de menus prises en compte par la mémoire du tirage. */
export const HISTORY_WEEKS = 6;
/** Durée pendant laquelle un plat écarté avec « Changer » a moins de chances. */
export const SKIP_DAYS = 28;

export interface MenuHistory {
  /** Plats du menu de la semaine précédente : évités tant qu'il reste d'autres choix. */
  recent: string[];
  /** Semaines écoulées depuis le dernier menu de chaque recette (2 à 6). */
  history: Record<string, number>;
  /** Plats écartés avec « Changer » ces dernières semaines. */
  skipped: string[];
}

/** Mémoire des menus du foyer avant la semaine `weekStart` (lundi). */
export async function menuHistory(
  supabase: Supabase,
  householdId: string,
  weekStart: string,
): Promise<MenuHistory> {
  const since = new Date(Date.now() - SKIP_DAYS * 86_400_000).toISOString();
  const [plans, skips] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("week_start, meal_plan_entries (recipe_id)")
      .eq("household_id", householdId)
      .gte("week_start", addDays(weekStart, -7 * HISTORY_WEEKS))
      .lt("week_start", weekStart),
    supabase
      .from("recipe_skips")
      .select("recipe_id")
      .eq("household_id", householdId)
      .gte("skipped_at", since),
  ]);
  if (plans.error) throw new Error(`Lecture de l'historique impossible : ${plans.error.message}`);
  if (skips.error) throw new Error(`Lecture de l'historique impossible : ${skips.error.message}`);
  const history: Record<string, number> = {};
  for (const p of plans.data) {
    const weeks = Math.round(
      (Date.parse(`${weekStart}T00:00:00Z`) - Date.parse(`${p.week_start}T00:00:00Z`)) /
        (7 * 86_400_000),
    );
    for (const e of p.meal_plan_entries ?? []) {
      history[e.recipe_id] = Math.min(history[e.recipe_id] ?? Infinity, weeks);
    }
  }
  return {
    recent: Object.keys(history).filter((id) => history[id]! <= 1),
    history,
    skipped: [...new Set(skips.data.map((s) => s.recipe_id))],
  };
}

/** Historique d'une recette pour le foyer : fois cuisinée, dernière fois, dernière semaine au menu. */
export async function recipeHistory(supabase: Supabase, householdId: string, recipeId: string) {
  const [cooked, planned] = await Promise.all([
    supabase
      .from("meal_cookings")
      .select("cooked_at")
      .eq("household_id", householdId)
      .eq("recipe_id", recipeId)
      .order("cooked_at", { ascending: false }),
    supabase
      .from("meal_plan_entries")
      .select("meal_plans!inner (week_start)")
      .eq("household_id", householdId)
      .eq("recipe_id", recipeId),
  ]);
  if (cooked.error) throw new Error(cooked.error.message);
  if (planned.error) throw new Error(planned.error.message);
  const weeks = planned.data
    .map((p) => p.meal_plans?.week_start)
    .filter((w): w is string => Boolean(w))
    .sort();
  return {
    cookedCount: cooked.data.length,
    lastCookedAt: cooked.data[0]?.cooked_at ?? null,
    plannedWeeks: weeks.length,
    lastPlannedWeek: weeks.at(-1) ?? null,
  };
}
