import "server-only";
import { randomUUID } from "node:crypto";
import { todayIn } from "@/lib/dates";
import { addDays, mondayOf } from "@/lib/week";
import { getCurrentContext } from "@/server/modules/auth/session";
import { readPlan } from "@/server/modules/planning/repository";
import { createSupabaseServerClient } from "@/server/supabase/server";

export type CookStatus =
  | { kind: "ready"; week: string; servings: number; formKey: string }
  | { kind: "cooked"; cookedAt: string };

/**
 * Le bouton « Cuisiné » n'apparaît que si la recette est au menu (semaine en cours, à venir
 * ou passée) ET que les courses de cette semaine sont finies. Sinon : rien.
 */
export async function getCookStatus(recipeId: string): Promise<CookStatus | null> {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();
  const current = mondayOf(todayIn(household.timezone));
  let cookedAt: string | null = null;

  for (const week of [current, addDays(current, 7), addDays(current, -7)]) {
    const plan = await readPlan(supabase, household.id, week);
    if (!plan || !plan.shoppingDoneAt) continue;
    const index = plan.entries.findIndex(
      (e, i) => e.recipeId === recipeId && !e.leftover && !plan.cooked.has(i + 1),
    );
    if (index >= 0) {
      return {
        kind: "ready",
        week,
        servings: plan.entries[index]!.servings,
        formKey: randomUUID(),
      };
    }
    if (plan.entries.some((e) => e.recipeId === recipeId) && !cookedAt) {
      const last = await supabase
        .from("meal_cookings")
        .select("cooked_at")
        .eq("household_id", household.id)
        .eq("recipe_id", recipeId)
        .order("cooked_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      cookedAt = last.data?.cooked_at ?? null;
    }
  }
  return cookedAt ? { kind: "cooked", cookedAt } : null;
}
