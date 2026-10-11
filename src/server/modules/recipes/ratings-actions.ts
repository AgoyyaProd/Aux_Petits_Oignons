"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { toActionError } from "@/server/errors";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

const rateSchema = z.object({
  recipeId: z.uuid(),
  rating: z.enum(["1", "-1", "0"]),
});

/**
 * Donne l'avis du foyer sur une recette (1 on aime, -1 pas pour nous, 0 retire l'avis).
 * Idempotent : renvoyer le même avis ne change rien.
 */
export async function rateRecipeAction(formData: FormData): Promise<void> {
  const parsed = rateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { household } = await getCurrentContext();
  if (!household) return;
  const supabase = await createSupabaseServerClient();
  const { recipeId, rating } = parsed.data;

  const { error } =
    rating === "0"
      ? await supabase
          .from("recipe_ratings")
          .delete()
          .eq("household_id", household.id)
          .eq("recipe_id", recipeId)
      : await supabase
          .from("recipe_ratings")
          .upsert(
            { household_id: household.id, recipe_id: recipeId, rating: Number(rating) },
            { onConflict: "household_id,recipe_id" },
          );
  if (error) throw new Error(toActionError(error).message);
  refresh();
}
