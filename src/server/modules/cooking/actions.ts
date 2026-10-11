"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { planCooking, type CookLot } from "@/domain/cooking";
import type { IngredientInfo, RecipeLine } from "@/domain/shopping";
import { fromBase, toBaseString } from "@/domain/units";
import { todayIn } from "@/lib/dates";
import { formatShoppingQuantity } from "@/lib/format-quantity";
import { isMonday } from "@/lib/week";
import { toActionError } from "@/server/errors";
import { getCurrentContext } from "@/server/modules/auth/session";
import { readPlan } from "@/server/modules/planning/repository";
import { createSupabaseServerClient } from "@/server/supabase/server";

const schema = z.object({
  week: z.string().refine(isMonday),
  recipeId: z.uuid(),
  key: z.uuid(),
});

export type CookState = {
  status: "idle" | "error" | "success";
  message?: string;
  missing?: string[];
};

/**
 * « Cuisiné » : calcule le décompte (domaine, FEFO, sans conversion devinée) à partir du stock
 * actuel, puis l'applique en une opération atomique et idempotente (meal_cook).
 */
export async function cookAction(_prev: CookState, formData: FormData): Promise<CookState> {
  const { household } = await getCurrentContext();
  if (!household) return { status: "error", message: "Aucun foyer actif." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Formulaire expiré, recharge la page." };
  const { week, recipeId, key } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const plan = await readPlan(supabase, household.id, week);
  const index =
    plan?.entries.findIndex((e, i) => e.recipeId === recipeId && !plan.cooked.has(i + 1)) ?? -1;
  if (!plan || index < 0) {
    return {
      status: "error",
      message: "Ce plat n'est plus à cuisiner dans le menu. Recharge la page.",
    };
  }
  const servings = plan.entries[index]!.servings;

  const recipe = await supabase
    .from("recipes")
    .select(
      "servings, recipe_ingredients (ingredient_id, quantity_base, dimension, is_optional, ingredients (name, default_dimension, density_g_per_ml, piece_weight_g))",
    )
    .eq("id", recipeId)
    .single();
  if (recipe.error) return { status: "error", message: toActionError(recipe.error).message };

  const info = new Map<string, IngredientInfo>();
  const lines: RecipeLine[] = [];
  for (const l of recipe.data.recipe_ingredients ?? []) {
    if (!l.ingredients) continue;
    info.set(l.ingredient_id, {
      id: l.ingredient_id,
      name: l.ingredients.name,
      defaultDimension: l.ingredients.default_dimension,
      conversions: {
        densityGPerMl: l.ingredients.density_g_per_ml,
        pieceWeightG: l.ingredients.piece_weight_g,
      },
    });
    if (l.quantity_base === null || !l.dimension) continue;
    lines.push({
      ingredientId: l.ingredient_id,
      quantity: fromBase(String(l.quantity_base), l.dimension),
      optional: l.is_optional,
    });
  }

  const ingredientIds = [...info.keys()];
  const [pantry, staples] = await Promise.all([
    supabase
      .from("pantry_items")
      .select(
        "id, ingredient_id, quantity_base, dimension, expires_on, expiry_kind, opened_at, version",
      )
      .eq("household_id", household.id)
      .eq("status", "active")
      .in("ingredient_id", ingredientIds),
    supabase.from("household_staples").select("ingredient_id").eq("household_id", household.id),
  ]);
  if (pantry.error) return { status: "error", message: toActionError(pantry.error).message };
  if (staples.error) return { status: "error", message: toActionError(staples.error).message };

  const lots: CookLot[] = pantry.data.map((p) => ({
    id: p.id,
    ingredientId: p.ingredient_id,
    quantity: p.quantity_base === null ? null : fromBase(String(p.quantity_base), p.dimension),
    expiresOn: p.expires_on,
    expiryKind: p.expiry_kind,
    opened: p.opened_at !== null,
    version: p.version,
  }));
  const result = planCooking({
    lines,
    servings,
    baseServings: recipe.data.servings,
    ingredients: info,
    lots,
    cupboard: new Set(staples.data.map((s) => s.ingredient_id)),
    today: todayIn(household.timezone),
  });

  const missing = result.missing.map((m) => ({
    ingredient_id: m.ingredientId,
    name: info.get(m.ingredientId)?.name ?? "?",
    quantity_base: toBaseString(m.quantity),
    dimension: m.quantity.dimension,
  }));
  const { data, error } = await supabase.rpc("meal_cook", {
    p_household_id: household.id,
    p_week_start: week,
    p_recipe_id: recipeId,
    p_servings: servings,
    p_consumptions: result.consumptions.map((c) => ({
      item_id: c.lotId,
      quantity_base: toBaseString(c.quantity),
      expected_version: c.version,
    })),
    p_missing: missing,
    p_idempotency_key: key,
  });
  if (error) {
    const e = toActionError(error);
    if (e.kind === "conflict") refresh();
    return { status: "error", message: e.message };
  }

  refresh();
  const consumed = (data as { consumed?: number } | null)?.consumed ?? result.consumptions.length;
  return {
    status: "success",
    message:
      consumed > 0
        ? `Bon appétit ! ${consumed} produit${consumed > 1 ? "s" : ""} retiré${consumed > 1 ? "s" : ""} du garde-manger.`
        : "Bon appétit ! Rien à retirer du garde-manger.",
    missing: result.missing.map(
      (m) => `${info.get(m.ingredientId)?.name ?? "?"} (${formatShoppingQuantity(m.quantity)})`,
    ),
  };
}
