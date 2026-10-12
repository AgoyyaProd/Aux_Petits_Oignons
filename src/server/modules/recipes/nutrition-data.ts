import "server-only";
import {
  computeRecipeNutrition,
  portionProfile,
  weekBalance,
  type Per100g,
  type WeekBalance,
} from "@/domain/nutrition";
import { fromBase } from "@/domain/units";
import type { Supabase } from "@/server/modules/recipes/queries";

/** Colonnes nutritionnelles d'un ingrédient (table Ciqual reliée). */
export const NUTRITION_COLUMNS =
  "ingredient_nutrition (kcal, proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)";

type NumLike = number | string | null;
export interface NutritionRow {
  kcal: NumLike;
  proteins_g: NumLike;
  carbs_g: NumLike;
  sugars_g: NumLike;
  fat_g: NumLike;
  saturated_fat_g: NumLike;
  fiber_g: NumLike;
  salt_g: NumLike;
}

const num = (v: NumLike): number | null => (v === null ? null : Number(v));

/** Valeurs pour 100 g d'une ligne Ciqual, NULL conservés (jamais devinés). */
export function per100gFrom(n: NutritionRow | null): Per100g | null {
  return n
    ? {
        kcal: num(n.kcal),
        proteins: num(n.proteins_g),
        carbs: num(n.carbs_g),
        sugars: num(n.sugars_g),
        fat: num(n.fat_g),
        saturatedFat: num(n.saturated_fat_g),
        fiber: num(n.fiber_g),
        salt: num(n.salt_g),
      }
    : null;
}

/**
 * Équilibre d'un menu : une entrée par repas planifié (une même recette deux fois compte
 * deux repas). Les valeurs sont celles d'une portion de chaque recette.
 */
export async function loadWeekBalance(
  supabase: Supabase,
  meals: readonly { recipeId: string; title: string }[],
): Promise<WeekBalance | null> {
  if (meals.length === 0) return null;
  const ids = [...new Set(meals.map((m) => m.recipeId))];
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `id, servings, recipe_ingredients (quantity_base, dimension, is_optional, ingredients (slug, name, category, density_g_per_ml, piece_weight_g, ${NUTRITION_COLUMNS}))`,
    )
    .in("id", ids);
  if (error) throw new Error(`Lecture des recettes du menu impossible : ${error.message}`);

  const byId = new Map(
    (data ?? []).map((r) => {
      const lines = (r.recipe_ingredients ?? []).map((l) => ({
        slug: l.ingredients?.slug ?? "",
        category: l.ingredients?.category ?? "",
        name: l.ingredients?.name ?? "?",
        optional: l.is_optional,
        quantity:
          l.quantity_base !== null && l.dimension
            ? fromBase(String(l.quantity_base), l.dimension)
            : null,
        conversions: {
          densityGPerMl: l.ingredients?.density_g_per_ml ?? null,
          pieceWeightG: l.ingredients?.piece_weight_g ?? null,
        },
        per100g: per100gFrom(l.ingredients?.ingredient_nutrition ?? null),
      }));
      return [
        r.id,
        {
          nutrition: computeRecipeNutrition(lines, r.servings),
          profile: portionProfile(lines, r.servings),
        },
      ] as const;
    }),
  );

  return weekBalance(
    meals.flatMap((m) => {
      const r = byId.get(m.recipeId);
      return r ? [{ title: m.title, ...r }] : [];
    }),
  );
}
