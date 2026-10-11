import { scale, tryConvert, type IngredientConversions, type Quantity } from "../units";
import { mulDiv, REF_MILLI, type UnitPrice } from "./unit-price";

/**
 * Coût d'une quantité, en MILLIÈMES de centime (entier) pour cumuler sans perte.
 * null si la quantité ne peut pas être exprimée dans la dimension du prix.
 */
export function costMillicents(
  q: Quantity,
  price: UnitPrice,
  conv: IngredientConversions,
): number | null {
  const converted = tryConvert(q, price.dimension, conv);
  if (!converted) return null;
  return mulDiv(converted.milli, price.centsPerRef * 1000, REF_MILLI[price.dimension]);
}

export interface CostLine {
  ingredientId: string;
  quantity: Quantity | null;
  optional: boolean;
  conversions: IngredientConversions;
}

export type MissingPriceReason = "no_price" | "no_quantity" | "unconvertible";

export interface CostEstimate {
  /** Somme des lignes chiffrées, en millièmes de centime. */
  millicents: number;
  /** Lignes obligatoires dont le coût n'a pas pu être calculé (jamais estimé au hasard). */
  missing: { ingredientId: string; reason: MissingPriceReason }[];
  pricedLines: number;
  requiredLines: number;
}

/**
 * Coût d'une recette pour `servings` portions (recette écrite pour `baseServings`).
 * Les ingrédients facultatifs ne sont pas comptés, comme dans la liste de courses.
 */
export function estimateRecipeCost(
  lines: readonly CostLine[],
  servings: number,
  baseServings: number,
  priceOf: (ingredientId: string) => UnitPrice | null,
): CostEstimate {
  const estimate: CostEstimate = { millicents: 0, missing: [], pricedLines: 0, requiredLines: 0 };
  for (const line of lines) {
    if (line.optional) continue;
    estimate.requiredLines += 1;
    if (!line.quantity) {
      estimate.missing.push({ ingredientId: line.ingredientId, reason: "no_quantity" });
      continue;
    }
    const price = priceOf(line.ingredientId);
    if (!price) {
      estimate.missing.push({ ingredientId: line.ingredientId, reason: "no_price" });
      continue;
    }
    const cost = costMillicents(
      scale(line.quantity, servings, baseServings),
      price,
      line.conversions,
    );
    if (cost === null) {
      estimate.missing.push({ ingredientId: line.ingredientId, reason: "unconvertible" });
      continue;
    }
    estimate.millicents += cost;
    estimate.pricedLines += 1;
  }
  return estimate;
}

/** Millièmes de centime -> centimes entiers (arrondi au plus proche). */
export function millicentsToCents(millicents: number): number {
  return Math.round(millicents / 1000);
}
