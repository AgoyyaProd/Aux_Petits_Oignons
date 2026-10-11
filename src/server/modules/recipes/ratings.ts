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

/** Nombre de semaines précédentes dont les plats sont évités par le générateur. */
export const RECENT_WEEKS = 2;

/** Recettes au menu des semaines précédant `weekStart` (lundi). */
export async function recentRecipeIds(
  supabase: Supabase,
  householdId: string,
  weekStart: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select("meal_plan_entries (recipe_id)")
    .eq("household_id", householdId)
    .gte("week_start", addDays(weekStart, -7 * RECENT_WEEKS))
    .lt("week_start", weekStart);
  if (error) throw new Error(`Lecture de l'historique impossible : ${error.message}`);
  return [...new Set(data.flatMap((p) => (p.meal_plan_entries ?? []).map((e) => e.recipe_id)))];
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
