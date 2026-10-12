import "server-only";
import { randomUUID } from "node:crypto";
import { costMillicents, millicentsToCents } from "@/domain/pricing";
import {
  computeShoppingList,
  purchaseQuantity,
  remapVariantLots,
  type IngredientInfo,
  type PlannedMealInput,
  type ShoppingWarning,
  type StockLot,
} from "@/domain/shopping";
import { mealDateFor } from "@/domain/planning";
import { fromBase, type Dimension, type Quantity } from "@/domain/units";
import { AISLES, orderedAisles } from "@/lib/categories";
import { todayIn } from "@/lib/dates";
import { addDays, isMonday, mondayOf } from "@/lib/week";
import { getCurrentContext } from "@/server/modules/auth/session";
import { getPlanningCatalog } from "@/server/modules/planning/catalog";
import { readPlan } from "@/server/modules/planning/repository";
import { createSupabaseServerClient } from "@/server/supabase/server";

/** Rayons, dans l'ordre d'un parcours de magasin. */
export { AISLES };

/** Emplacement proposé au rangement, modifiable. */
export function defaultLocation(category: string): "pantry" | "fridge" | "freezer" {
  return ["viandes", "poissons", "oeufs_laitiers", "fromages", "legumes"].includes(category)
    ? "fridge"
    : "pantry";
}

export interface ShoppingLineView {
  ingredientId: string;
  name: string;
  category: string;
  dimension: Dimension;
  /** Besoin total, déjà en stock, à acheter (arrondi aux pièces entières). */
  needed: Quantity;
  fromStock: Quantity;
  toBuy: Quantity;
  /** Coût estimé de l'achat, en centimes ; null si pas de prix. */
  cents: number | null;
  recipes: string[];
  checked: boolean;
}

/** Liste de courses de la semaine, recalculée à partir du menu, du stock et du placard. */
export async function getShoppingPage(week?: string) {
  const { household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();

  const today = todayIn(household.timezone);
  const weekStart = week && isMonday(week) ? week : mondayOf(today);
  const base = {
    householdId: household.id,
    weekStart,
    previousWeek: addDays(weekStart, -7),
    nextWeek: addDays(weekStart, 7),
    isCurrentWeek: weekStart === mondayOf(today),
  };

  const settings = await supabase
    .from("households")
    .select("max_prep_minutes, aisle_order")
    .eq("id", household.id)
    .single();
  if (settings.error) throw new Error(settings.error.message);

  const [plan, catalog, ingredients, pantry, checks, extrasRes] = await Promise.all([
    readPlan(supabase, household.id, weekStart),
    getPlanningCatalog(household.id, household.timezone, settings.data.max_prep_minutes),
    supabase
      .from("ingredients")
      .select("id, name, category, default_dimension, density_g_per_ml, piece_weight_g, parent_id"),
    supabase
      .from("pantry_items")
      .select(
        "id, ingredient_id, quantity_base, dimension, expires_on, expiry_kind, opened_at, status",
      )
      .eq("household_id", household.id)
      .eq("status", "active"),
    supabase
      .from("shopping_checks")
      .select("ingredient_id, dimension")
      .eq("household_id", household.id)
      .eq("week_start", weekStart),
    supabase
      .from("shopping_extras")
      .select("id, label, quantity_text, checked, ingredients (category), recipes (title)")
      .eq("household_id", household.id)
      .eq("week_start", weekStart)
      .order("created_at"),
  ]);
  for (const r of [ingredients, pantry, checks, extrasRes]) {
    if (r.error) throw new Error(`Lecture de la liste impossible : ${r.error.message}`);
  }
  /** Ajouts manuels : affichés à part, jamais fusionnés avec les besoins calculés. */
  const extras = extrasRes.data!.map((e) => ({
    id: e.id,
    label: e.label,
    quantity: e.quantity_text,
    checked: e.checked,
    category: e.ingredients?.category ?? null,
    recipe: e.recipes?.title ?? null,
  }));
  if (!plan || plan.entries.length === 0) return { ...base, plan: null, extras };

  const info = new Map<string, IngredientInfo>();
  const category = new Map<string, string>();
  for (const i of ingredients.data!) {
    info.set(i.id, {
      id: i.id,
      name: i.name,
      defaultDimension: i.default_dimension,
      conversions: { densityGPerMl: i.density_g_per_ml, pieceWeightG: i.piece_weight_g },
    });
    category.set(i.id, i.category);
  }

  // Chaque plat est daté de son jour au planning (ou d'aujourd'hui s'il n'est pas placé) :
  // un produit du garde-manger ne compte que s'il sera encore bon ce jour-là.
  const titles = new Map<string, string>();
  const meals: PlannedMealInput[] = [];
  plan.entries.forEach((e, i) => {
    const meta = catalog.recipes.get(e.recipeId);
    // Un plat déjà cuisiné n'a plus besoin de rien.
    if (!meta || plan.cooked.has(i + 1)) return;
    const id = `plat-${i + 1}`;
    titles.set(id, meta.title);
    meals.push({
      id,
      date: mealDateFor(e.day, weekStart, today),
      slot: e.slot ?? "dinner",
      servings: e.servings,
      recipe: {
        id: meta.id,
        servings: meta.baseServings,
        lines: meta.lines.flatMap((l) =>
          l.quantity
            ? [{ ingredientId: l.ingredientId, quantity: l.quantity, optional: l.optional }]
            : [],
        ),
      },
    });
  });

  const stock: StockLot[] = pantry.data!.map((p) => ({
    id: p.id,
    ingredientId: p.ingredient_id,
    quantity: p.quantity_base === null ? null : fromBase(String(p.quantity_base), p.dimension),
    expiresOn: p.expires_on,
    expiryKind: p.expiry_kind,
    opened: p.opened_at !== null,
    status: p.status,
  }));
  const staples = await supabase
    .from("household_staples")
    .select("ingredient_id")
    .eq("household_id", household.id);
  if (staples.error) throw new Error(staples.error.message);

  // Variantes : des farfalle en stock couvrent un besoin de « Pâtes ».
  const parentOf = new Map(
    ingredients.data!.filter((i) => i.parent_id).map((i) => [i.id, i.parent_id!]),
  );
  const required = new Set(meals.flatMap((m) => m.recipe.lines.map((l) => l.ingredientId)));
  const result = computeShoppingList({
    meals,
    ingredients: info,
    stock: remapVariantLots(stock, parentOf, required),
    cupboard: new Set(staples.data.map((s) => s.ingredient_id)),
  });

  const checked = new Set(checks.data!.map((c) => `${c.ingredient_id}|${c.dimension}`));
  const toBuy: ShoppingLineView[] = [];
  const covered: ShoppingLineView[] = [];
  const cupboard: { name: string }[] = [];
  let knownCents = 0;
  let unpriced = 0;

  for (const line of result.lines) {
    if (line.inCupboard) {
      cupboard.push({ name: line.ingredientName });
      continue;
    }
    const buy = purchaseQuantity(line.toBuy);
    const price = catalog.priceBook.get(line.ingredientId);
    const cost =
      buy.milli > 0 && price
        ? costMillicents(buy, price.unit, info.get(line.ingredientId)!.conversions)
        : null;
    const view: ShoppingLineView = {
      ingredientId: line.ingredientId,
      name: line.ingredientName,
      category: category.get(line.ingredientId) ?? "epicerie_salee",
      dimension: line.dimension,
      needed: line.needed,
      fromStock: line.fromStock,
      toBuy: buy,
      cents: cost === null ? null : millicentsToCents(cost),
      recipes: line.mealIds.map((id) => titles.get(id) ?? "?"),
      checked: checked.has(`${line.ingredientId}|${line.dimension}`),
    };
    if (buy.milli > 0) {
      toBuy.push(view);
      if (view.cents === null) unpriced += 1;
      else knownCents += view.cents;
    } else {
      covered.push(view);
    }
  }

  const aisles = orderedAisles(settings.data.aisle_order)
    .map((a) => ({
      ...a,
      lines: toBuy.filter((l) => l.category === a.category),
    }))
    .filter((a) => a.lines.length > 0);

  return {
    ...base,
    extras,
    plan: {
      mealCount: plan.entries.length - plan.cooked.size,
      people: plan.people,
      shoppingDoneAt: plan.shoppingDoneAt,
    },
    aisles,
    covered,
    cupboard,
    warnings: describeWarnings(result.warnings, info),
    totals: {
      lines: toBuy.length,
      checked: toBuy.filter((l) => l.checked).length,
      knownCents,
      unpriced,
    },
    newKey: () => randomUUID(),
  };
}

function describeWarnings(
  warnings: readonly ShoppingWarning[],
  info: ReadonlyMap<string, IngredientInfo>,
): string[] {
  const name = (id: string) => info.get(id)?.name ?? "?";
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of warnings) {
    const text =
      w.kind === "unknown_quantity_stock"
        ? `${name(w.ingredientId)} : en stock sans quantité connue, non compté. Vérifie avant d'acheter.`
        : w.kind === "incompatible_stock"
          ? `${name(w.ingredientId)} : stock dans une unité impossible à comparer, non compté.`
          : w.kind === "use_by_before_meal"
            ? `${name(w.ingredientId)} : un lot a dépassé sa DLC, il n'est pas compté.`
            : `${name(w.ingredientId)} : un lot a dépassé sa DDM, compté mais à vérifier.`;
    if (!seen.has(text)) {
      seen.add(text);
      out.push(text);
    }
  }
  return out;
}

export type ShoppingPage = NonNullable<Awaited<ReturnType<typeof getShoppingPage>>>;
