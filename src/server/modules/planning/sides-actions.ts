"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { todayIn } from "@/lib/dates";
import { formatWeek, isMonday, mondayOf } from "@/lib/week";
import { toActionError } from "@/server/errors";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type { PlannerState } from "./schema";

/**
 * « À côté » : recettes préparées en plus des repas (pain, brioche, gâteau, sauce…). Elles ne
 * comptent pas dans les repas du menu ; leurs ingrédients vont sur la liste de courses.
 */

const addSchema = z.object({
  recipeId: z.uuid(),
  key: z.uuid(),
  week: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || isMonday(v)),
  servings: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 40)),
});

/** Ajoute une recette « à côté » d'une semaine (la semaine en cours par défaut). */
export async function addSideAction(
  _prev: PlannerState,
  formData: FormData,
): Promise<PlannerState> {
  const { household } = await getCurrentContext();
  if (!household) return { status: "error", message: "Aucun foyer actif." };
  const parsed = addSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Formulaire expiré, recharge la page." };
  const { recipeId, key } = parsed.data;
  const today = todayIn(household.timezone);
  const week = parsed.data.week ?? mondayOf(today);
  const supabase = await createSupabaseServerClient();

  // Sans nombre de parts choisi : celui de la recette (une brioche fait 8 parts, pas 4).
  let servings = parsed.data.servings;
  if (servings === null) {
    const recipe = await supabase
      .from("recipes")
      .select("servings")
      .eq("id", recipeId)
      .eq("status", "published")
      .maybeSingle();
    if (recipe.error) return { status: "error", message: toActionError(recipe.error).message };
    if (!recipe.data) return { status: "error", message: "Recette introuvable." };
    servings = Math.min(40, Math.max(1, recipe.data.servings));
  }

  const { error } = await supabase.from("meal_plan_sides").upsert(
    {
      household_id: household.id,
      week_start: week,
      recipe_id: recipeId,
      servings,
      idempotency_key: key,
    },
    { onConflict: "household_id,idempotency_key", ignoreDuplicates: true },
  );
  if (error) return { status: "error", message: toActionError(error).message };
  refresh();
  return {
    status: "success",
    message:
      week === mondayOf(today)
        ? "Ajouté à côté des repas de la semaine."
        : `Ajouté à côté des repas (${formatWeek(week).toLowerCase()}).`,
  };
}

const servingsSchema = z.object({
  id: z.uuid(),
  servings: z.coerce.number().int().min(1).max(40),
});

/** Change le nombre de parts d'une recette « à côté » pas encore cuisinée. */
export async function updateSideServingsAction(formData: FormData): Promise<void> {
  const { household } = await getCurrentContext();
  if (!household) return;
  const parsed = servingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("meal_plan_sides")
    .update({ servings: parsed.data.servings })
    .eq("id", parsed.data.id)
    .eq("household_id", household.id);
  if (error) throw new Error(toActionError(error).message);
  refresh();
}

/** Retire une recette « à côté ». Sa cuisson éventuelle reste au journal. */
export async function removeSideAction(formData: FormData): Promise<void> {
  const { household } = await getCurrentContext();
  if (!household) return;
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("meal_plan_sides")
    .delete()
    .eq("id", id)
    .eq("household_id", household.id);
  if (error) throw new Error(toActionError(error).message);
  refresh();
}
