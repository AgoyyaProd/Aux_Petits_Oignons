import {
  aggregateRequirements,
  bucketKey,
  computeMealRequirements,
  normalizeForIngredient,
  requireIngredient,
  type IngredientInfo,
  type PlannedMealInput,
} from "../requirements/requirements";
import { fromMilli, type Dimension, type Quantity } from "../units";

/** Un lot du garde-manger (une ligne de pantry_items). */
export interface StockLot {
  id: string;
  ingredientId: string;
  /** null = quantité inconnue : jamais comptée comme disponible. */
  quantity: Quantity | null;
  /** Date ISO « AAAA-MM-JJ ». */
  expiresOn: string | null;
  /** use_by = DLC (à ne plus consommer après), best_before = DDM (qualité optimale avant). */
  expiryKind: "use_by" | "best_before" | null;
  /** Un produit entamé est consommé en premier. */
  opened?: boolean;
  status: "active" | "depleted" | "discarded";
}

export interface ShoppingLine {
  ingredientId: string;
  ingredientName: string;
  dimension: Dimension;
  /** Besoin total de la période. */
  needed: Quantity;
  /** Part couverte par le stock utilisable. */
  fromStock: Quantity;
  /** Besoin théorique à acheter : max(0, besoin − stock utilisable). Jamais un conditionnement. */
  toBuy: Quantity;
  mealIds: string[];
  /** Coché dans le placard du foyer : présent par déclaration, rien à acheter. */
  inCupboard: boolean;
}

export type ShoppingWarning =
  /** Le produit est présent mais sa quantité est inconnue : non compté, à vérifier. */
  | { kind: "unknown_quantity_stock"; ingredientId: string; lotIds: string[] }
  /** Stock exprimé dans une unité sans conversion connue vers le besoin : non compté. */
  | { kind: "incompatible_stock"; ingredientId: string; lotIds: string[] }
  /** Lot dont la DLC tombe avant le repas : non compté pour ce repas. */
  | { kind: "use_by_before_meal"; ingredientId: string; lotId: string; mealId: string }
  /** Lot utilisé alors que sa DDM est dépassée le jour du repas : à vérifier. */
  | { kind: "best_before_passed"; ingredientId: string; lotId: string; mealId: string };

export interface ShoppingComputation {
  lines: ShoppingLine[];
  warnings: ShoppingWarning[];
}

interface Allocatable {
  lot: StockLot;
  remaining: number; // millièmes, dans la dimension du compartiment
  dimension: Dimension;
}

/** FEFO : entamés d'abord, puis péremption la plus proche, puis sans date ; ordre stable. */
function fefo(a: Allocatable, b: Allocatable): number {
  const openedA = a.lot.opened ? 0 : 1;
  const openedB = b.lot.opened ? 0 : 1;
  if (openedA !== openedB) return openedA - openedB;
  const ea = a.lot.expiresOn ?? "9999-12-31";
  const eb = b.lot.expiresOn ?? "9999-12-31";
  if (ea !== eb) return ea < eb ? -1 : 1;
  return a.lot.id < b.lot.id ? -1 : a.lot.id > b.lot.id ? 1 : 0;
}

/**
 * Calcule la liste de courses d'une période.
 *
 * 1. Besoins par repas, ajustés aux portions et normalisés par ingrédient.
 * 2. Le stock utilisable est alloué aux repas dans l'ordre chronologique (FEFO) :
 *    ce qu'un repas consomme n'est plus disponible pour le suivant, et un lot
 *    dont la DLC tombe avant un repas n'est pas compté pour ce repas.
 * 3. À acheter = somme des manques, soit max(0, besoin cumulé − stock utilisable)
 *    quand tout le stock est valable pour toute la période.
 *
 * Fonction pure : même entrée, même sortie. Aucune hypothèse de conditionnement.
 */
export function computeShoppingList(input: {
  meals: readonly PlannedMealInput[];
  ingredients: ReadonlyMap<string, IngredientInfo>;
  stock: readonly StockLot[];
  /** Ingrédients cochés dans le placard (épices, condiments…) : jamais à acheter. */
  cupboard?: ReadonlySet<string>;
}): ShoppingComputation {
  const cupboard = input.cupboard ?? new Set<string>();
  const { ingredients } = input;
  const requirements = computeMealRequirements(input.meals, ingredients);
  const neededIngredients = new Set(requirements.map((r) => r.ingredientId));
  const neededBuckets = new Set(
    requirements.map((r) => bucketKey(r.ingredientId, r.quantity.dimension)),
  );

  const warnings: ShoppingWarning[] = [];
  const unknownQuantity = new Map<string, string[]>();
  const incompatible = new Map<string, string[]>();
  const buckets = new Map<string, Allocatable[]>();

  for (const lot of input.stock) {
    if (lot.status !== "active" || !neededIngredients.has(lot.ingredientId)) continue;
    if (lot.quantity === null) {
      pushTo(unknownQuantity, lot.ingredientId, lot.id);
      continue;
    }
    if (lot.quantity.milli === 0) continue;
    const info = requireIngredient(ingredients, lot.ingredientId);
    const normalized = normalizeForIngredient(lot.quantity, info);
    const key = bucketKey(lot.ingredientId, normalized.dimension);
    if (!neededBuckets.has(key)) {
      pushTo(incompatible, lot.ingredientId, lot.id);
      continue;
    }
    pushTo(buckets, key, {
      lot,
      remaining: normalized.milli,
      dimension: normalized.dimension,
    });
  }
  for (const lots of buckets.values()) lots.sort(fefo);

  const shortfall = new Map<string, number>();
  const warnedUseBy = new Set<string>();
  const warnedBestBefore = new Set<string>();

  for (const req of requirements) {
    const key = bucketKey(req.ingredientId, req.quantity.dimension);
    let missing = req.quantity.milli;

    for (const entry of buckets.get(key) ?? []) {
      if (missing === 0) break;
      if (entry.remaining === 0) continue;
      const { lot } = entry;
      const expiredBeforeMeal = lot.expiresOn !== null && lot.expiresOn < req.date;

      if (expiredBeforeMeal && lot.expiryKind === "use_by") {
        if (!warnedUseBy.has(lot.id)) {
          warnedUseBy.add(lot.id);
          warnings.push({
            kind: "use_by_before_meal",
            ingredientId: lot.ingredientId,
            lotId: lot.id,
            mealId: req.mealId,
          });
        }
        continue;
      }
      if (expiredBeforeMeal && !warnedBestBefore.has(lot.id)) {
        warnedBestBefore.add(lot.id);
        warnings.push({
          kind: "best_before_passed",
          ingredientId: lot.ingredientId,
          lotId: lot.id,
          mealId: req.mealId,
        });
      }

      const taken = Math.min(entry.remaining, missing);
      entry.remaining -= taken;
      missing -= taken;
    }

    shortfall.set(key, (shortfall.get(key) ?? 0) + missing);
  }

  for (const [ingredientId, lotIds] of unknownQuantity) {
    warnings.push({ kind: "unknown_quantity_stock", ingredientId, lotIds });
  }
  for (const [ingredientId, lotIds] of incompatible) {
    warnings.push({ kind: "incompatible_stock", ingredientId, lotIds });
  }

  const lines: ShoppingLine[] = aggregateRequirements(requirements).map((total) => {
    const { dimension } = total.quantity;
    const inCupboard = cupboard.has(total.ingredientId);
    const toBuyMilli = inCupboard
      ? 0
      : (shortfall.get(bucketKey(total.ingredientId, dimension)) ?? 0);
    return {
      ingredientId: total.ingredientId,
      ingredientName: requireIngredient(ingredients, total.ingredientId).name,
      dimension,
      needed: total.quantity,
      fromStock: fromMilli(total.quantity.milli - toBuyMilli, dimension),
      toBuy: fromMilli(toBuyMilli, dimension),
      mealIds: total.mealIds,
      inCupboard,
    };
  });

  lines.sort(
    (a, b) =>
      a.ingredientName.localeCompare(b.ingredientName, "fr") ||
      a.dimension.localeCompare(b.dimension),
  );

  return { lines, warnings };
}

function pushTo<T>(map: Map<string, T[]>, key: string, value: T): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/**
 * Quantité à acheter arrondie pour le magasin : les pièces à l'unité supérieure
 * (1,5 oignon -> 2), masses et volumes inchangés. Jamais en dessous du besoin.
 */
export function purchaseQuantity(toBuy: Quantity): Quantity {
  if (toBuy.dimension !== "count") return toBuy;
  return fromMilli(Math.ceil(toBuy.milli / 1000) * 1000, "count");
}
