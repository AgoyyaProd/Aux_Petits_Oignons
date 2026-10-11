import type { Dimension, IngredientConversions } from "../units";
import { eurosToCents, rateToUnitPrice, REF_MILLI, type Rate } from "./unit-price";

/**
 * Un relevé de prix Open Prices, réduit aux champs utiles.
 * CATEGORY : produit brut, prix au kilo ou à la pièce.
 * PRODUCT  : produit emballé, prix du paquet et contenance du produit.
 */
export interface PriceObservation {
  type: "CATEGORY" | "PRODUCT";
  price: number | string;
  pricePer?: string | null;
  discounted?: boolean | null;
  productName?: string | null;
  productQuantity?: number | null;
  productQuantityUnit?: string | null;
}

export type RejectReason = "invalid_price" | "discounted" | "unknown_quantity" | "unconvertible";

/** Contenance d'un produit emballé, en millièmes d'unité de base. */
function packageRate(cents: number, quantity: number, unit: string): Rate | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  const factors: Record<string, [Dimension, number]> = {
    g: ["mass", 1_000],
    kg: ["mass", 1_000_000],
    ml: ["volume", 1_000],
    cl: ["volume", 10_000],
    l: ["volume", 1_000_000],
  };
  const f = factors[unit.trim().toLowerCase()];
  if (!f) return null;
  const milli = Math.round(quantity * f[1]);
  return milli > 0 ? { dimension: f[0], cents, milli } : null;
}

/**
 * Nombre de pièces lu dans le nom du produit (« 6 œufs », « Boîte de 12 »).
 * Volontairement strict : un nom ambigu ne donne rien plutôt qu'un nombre deviné.
 */
export function parsePieceCount(name: string | null | undefined): number | null {
  if (!name) return null;
  const patterns = [
    /(?:^|[^\d,.])(\d{1,2})\s*(?:x\s*)?(?:gros\s+|petits?\s+)?(?:œufs?|oeufs?|ufs|pi[eè]ces?|pcs)\b/i,
    /\bbo[iî]te\s+de\s+(\d{1,2})\b/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(name);
    if (match) {
      const n = Number(match[1]);
      if (n >= 1 && n <= 60) return n;
    }
  }
  return null;
}

/**
 * Ramène un relevé au prix d'une quantité de référence dans la dimension de l'ingrédient.
 * Renvoie le prix en centimes, ou la raison du rejet.
 */
export function normalizeObservation(
  obs: PriceObservation,
  target: Dimension,
  conv: IngredientConversions,
): { centsPerRef: number } | { rejected: RejectReason } {
  const cents = eurosToCents(obs.price);
  if (cents === null) return { rejected: "invalid_price" };
  // Une promotion ne reflète pas le prix habituel.
  if (obs.discounted) return { rejected: "discounted" };

  let rate: Rate | null = null;
  if (obs.type === "CATEGORY") {
    if (obs.pricePer === "KILOGRAM") rate = { dimension: "mass", cents, milli: REF_MILLI.mass };
    else if (obs.pricePer === "UNIT") rate = { dimension: "count", cents, milli: REF_MILLI.count };
  } else {
    const pieces = target === "count" ? parsePieceCount(obs.productName) : null;
    if (pieces) rate = { dimension: "count", cents, milli: pieces * REF_MILLI.count };
    else if (obs.productQuantity != null && obs.productQuantityUnit) {
      rate = packageRate(cents, obs.productQuantity, obs.productQuantityUnit);
    }
  }
  if (!rate) return { rejected: "unknown_quantity" };

  const unit = rateToUnitPrice(rate, target, conv);
  if (!unit || unit.centsPerRef <= 0) return { rejected: "unconvertible" };
  return { centsPerRef: unit.centsPerRef };
}
