import "server-only";
import { randomUUID } from "node:crypto";
import { costMillicents, millicentsToCents } from "@/domain/pricing";
import {
  computeShoppingList,
  packHint,
  purchaseQuantity,
  splitVariantLots,
  type IngredientInfo,
  type PlannedMealInput,
  type ShoppingWarning,
  type StockLot,
  wholePacks,
} from "@/domain/shopping";
import { mealDateFor } from "@/domain/planning";
import {
  formatQuantity,
  fromBase,
  isUnitCode,
  quantity,
  scale,
  type Dimension,
  type Quantity,
} from "@/domain/units";
import { AISLES, orderedAisles } from "@/lib/categories";
import { todayIn } from "@/lib/dates";
import { addDays, isMonday, mondayOf } from "@/lib/week";
import { getCurrentContext } from "@/server/modules/auth/session";
import { getPlanningCatalog } from "@/server/modules/planning/catalog";
import { loadFreeIngredientIds } from "@/server/modules/prices/price-book";
import { readPlan } from "@/server/modules/planning/repository";
import { fetchAll } from "@/server/supabase/fetch-all";
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
  /** Slug de l'ingrédient, pour sa photo (lib/images). */
  slug: string | null;
  name: string;
  category: string;
  dimension: Dimension;
  /** Besoin total, déjà en stock, à acheter (arrondi aux pièces entières). */
  needed: Quantity;
  fromStock: Quantity;
  toBuy: Quantity;
  /** Format correspondant à l'achat (« 1 boîte de 40 cl », « 2 × 300 g ») : indicatif. */
  packHint: string | null;
  /** D'où vient ce format ; null si l'achat est chiffré au poids exact. */
  packSource: PurchaseFormatSource | null;
  /** Besoin de chaque plat, quand l'aliment sert à plusieurs plats de la semaine. */
  perRecipe: { recipe: string; quantity: Quantity }[];
  /** Coût de la quantité utilisée par les repas, en centimes ; null si pas de prix. */
  cents: number | null;
  /** Coût en paquets entiers (à payer en magasin) ; = cents sans format connu. */
  storeCents: number | null;
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
      .select(
        "id, slug, name, category, default_dimension, density_g_per_ml, piece_weight_g, parent_id",
      ),
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
  const slugs = new Map<string, string>();
  for (const i of ingredients.data!) {
    slugs.set(i.id, i.slug);
    info.set(i.id, {
      id: i.id,
      name: i.name,
      defaultDimension: i.default_dimension,
      conversions: { densityGPerMl: i.density_g_per_ml, pieceWeightG: i.piece_weight_g },
    });
    category.set(i.id, i.category);
  }

  const formats = await loadPurchaseFormats(supabase, catalog.packages, info);

  // Chaque plat est daté de son jour au planning (ou d'aujourd'hui s'il n'est pas placé) :
  // un produit du garde-manger ne compte que s'il sera encore bon ce jour-là.
  const titles = new Map<string, string>();
  const meals: PlannedMealInput[] = [];
  plan.entries.forEach((e, i) => {
    const meta = catalog.recipes.get(e.recipeId);
    // Un plat déjà cuisiné n'a plus besoin de rien ; un reste est compté dans son plat cuisiné.
    if (!meta || plan.cooked.has(i + 1) || e.leftover) return;
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
  const [staples, free] = await Promise.all([
    supabase.from("household_staples").select("ingredient_id").eq("household_id", household.id),
    loadFreeIngredientIds(supabase),
  ]);
  if (staples.error) throw new Error(staples.error.message);

  // Variantes : des farfalle en stock couvrent un besoin de « Pâtes ».
  const parentOf = new Map(
    ingredients.data!.filter((i) => i.parent_id).map((i) => [i.id, i.parent_id!]),
  );
  // Seuls les ingrédients obligatoires réservent du stock (un facultatif ne s'achète pas).
  // Une variante demandée garde la part de son propre besoin ; le reste sert au parent.
  const required = new Set<string>();
  const variantDemand = new Map<string, Quantity[]>();
  for (const m of meals) {
    for (const l of m.recipe.lines) {
      if (l.optional) continue;
      required.add(l.ingredientId);
      if (!parentOf.has(l.ingredientId)) continue;
      const need = scale(l.quantity, m.servings, m.recipe.servings);
      variantDemand.set(l.ingredientId, [...(variantDemand.get(l.ingredientId) ?? []), need]);
    }
  }
  const result = computeShoppingList({
    meals,
    ingredients: info,
    stock: splitVariantLots(stock, parentOf, required, variantDemand),
    cupboard: new Set([...staples.data.map((s) => s.ingredient_id), ...free]),
  });

  const checked = new Set(checks.data!.map((c) => `${c.ingredient_id}|${c.dimension}`));
  const toBuy: ShoppingLineView[] = [];
  const covered: ShoppingLineView[] = [];
  const cupboard: { name: string }[] = [];
  let knownCents = 0;
  let storeCents = 0;
  let byWeight = 0;
  let unpriced = 0;

  for (const line of result.lines) {
    // L'eau du robinet n'a rien à faire sur la liste, même au placard.
    if (free.has(line.ingredientId)) continue;
    if (line.inCupboard) {
      cupboard.push({ name: line.ingredientName });
      continue;
    }
    const buy = purchaseQuantity(line.toBuy);
    const price = catalog.priceBook.get(line.ingredientId);
    const conversions = info.get(line.ingredientId)!.conversions;
    const cost = buy.milli > 0 && price ? costMillicents(buy, price.unit, conversions) : null;
    // En magasin : paquets entiers quand le format est connu, sinon la quantité exacte.
    const format = formats.get(line.ingredientId);
    const packs = wholePacks(buy, format);
    const storeCost =
      buy.milli > 0 && price
        ? costMillicents(packs?.quantity ?? buy, price.unit, conversions)
        : null;
    const view: ShoppingLineView = {
      ingredientId: line.ingredientId,
      slug: slugs.get(line.ingredientId) ?? null,
      name: line.ingredientName,
      category: category.get(line.ingredientId) ?? "epicerie_salee",
      dimension: line.dimension,
      needed: line.needed,
      fromStock: line.fromStock,
      toBuy: buy,
      packHint: packHint(buy, format),
      packSource: packs ? format!.source : null,
      cents: cost === null ? null : millicentsToCents(cost),
      storeCents: storeCost === null ? null : millicentsToCents(storeCost),
      recipes: line.mealIds.map((id) => titles.get(id) ?? "?"),
      perRecipe: line.perMeal.map((p) => ({
        recipe: titles.get(p.mealId) ?? "?",
        quantity: p.quantity,
      })),
      checked: checked.has(`${line.ingredientId}|${line.dimension}`),
    };
    if (buy.milli > 0) {
      toBuy.push(view);
      if (view.cents === null) unpriced += 1;
      else knownCents += view.cents;
      if (view.storeCents !== null) storeCents += view.storeCents;
      if (view.storeCents !== null && !packs) byWeight += 1;
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
      mealCount: plan.entries.filter((e, i) => !e.leftover && !plan.cooked.has(i + 1)).length,
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
      /** À payer en magasin : paquets entiers quand le format est connu. */
      storeCents,
      /** Lignes chiffrées au poids exact faute de format (vrac, ou format inconnu). */
      byWeight,
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

/** D'où vient le format d'achat retenu pour un ingrédient. */
export type PurchaseFormatSource = "standard" | "receipt" | "open_prices";

interface PurchaseFormat {
  size: number;
  label: string;
  dimension: Dimension;
  source: PurchaseFormatSource;
}

/**
 * Format d'achat de chaque ingrédient, dans sa dimension (aucune conversion) :
 *  1. format standard (0065), choisi à la main ;
 *  2. contenance du dernier ticket de caisse (ce qui est réellement acheté) ;
 *  3. contenance la plus courante relevée par Open Prices (0083).
 */
async function loadPurchaseFormats(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  packages: ReadonlyMap<string, { size: number | null; label?: string | null }>,
  info: ReadonlyMap<string, IngredientInfo>,
): Promise<Map<string, PurchaseFormat>> {
  const [open, receipts] = await Promise.all([
    supabase.from("purchase_formats").select("ingredient_id, quantity_base, label"),
    fetchAll(
      (from, to) =>
        supabase
          .from("receipt_prices")
          .select("ingredient_id, pack_quantity, pack_unit, purchased_on, id")
          .order("purchased_on", { ascending: false })
          .order("id", { ascending: false })
          .range(from, to),
      "des formats des tickets",
    ),
  ]);
  if (open.error) throw new Error(`Lecture des formats impossible : ${open.error.message}`);

  const formats = new Map<string, PurchaseFormat>();
  const dimensionOf = (id: string) => info.get(id)?.defaultDimension;
  for (const f of open.data) {
    const dimension = dimensionOf(f.ingredient_id);
    if (!dimension) continue;
    formats.set(f.ingredient_id, {
      size: Number(f.quantity_base),
      label: f.label,
      dimension,
      source: "open_prices",
    });
  }
  // Du plus récent au plus ancien : le premier ticket compatible l'emporte.
  const fromReceipt = new Set<string>();
  for (const r of receipts) {
    if (fromReceipt.has(r.ingredient_id)) continue;
    const dimension = dimensionOf(r.ingredient_id);
    if (!dimension || !isUnitCode(r.pack_unit)) continue;
    const q = quantity(String(r.pack_quantity), r.pack_unit);
    if (q.dimension !== dimension || q.milli <= 0) continue;
    fromReceipt.add(r.ingredient_id);
    formats.set(r.ingredient_id, {
      size: q.milli / 1000,
      label: formatLabel(q),
      dimension,
      source: "receipt",
    });
  }
  for (const [id, p] of packages) {
    const dimension = dimensionOf(id);
    if (p.size === null || !p.label || !dimension) continue;
    formats.set(id, { size: p.size, label: p.label, dimension, source: "standard" });
  }
  return formats;
}

/** « 300 g », « 1 kg », « 75 cl », « 4 pièces » : contenance d'un ticket. */
function formatLabel(q: Quantity): string {
  if (q.dimension !== "count") return formatQuantity(q);
  const n = q.milli / 1000;
  return `${formatQuantity(q)} pièce${n > 1 ? "s" : ""}`;
}
