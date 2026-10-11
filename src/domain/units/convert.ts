import { IncompatibleUnitError } from "../errors";
import { fromMilli, parseAmount, type Quantity } from "./quantity";
import type { Dimension } from "./units";

/**
 * Conversions propres à un ingrédient (colonnes density_g_per_ml et piece_weight_g).
 * Absentes = conversion interdite : on ne devine jamais.
 */
export interface IngredientConversions {
  /** Masse d'un millilitre, en grammes (ex. huile : 0,92). */
  densityGPerMl?: string | number | null;
  /** Masse d'une pièce, en grammes (ex. œuf : 55). */
  pieceWeightG?: string | number | null;
}

/** Facteurs en millièmes, pour rester en arithmétique entière. */
function factors(conv: IngredientConversions) {
  const density = conv.densityGPerMl == null ? null : parseAmount(conv.densityGPerMl);
  const piece = conv.pieceWeightG == null ? null : parseAmount(conv.pieceWeightG);
  return {
    densityMilli: density && density > 0 ? density : null,
    pieceMilli: piece && piece > 0 ? piece : null,
  };
}

/**
 * a × b / c arrondi au plus proche (demi vers le haut), en entiers exacts.
 * BigInt : le produit intermédiaire peut dépasser Number.MAX_SAFE_INTEGER.
 */
function mulDiv(a: number, b: number, c: number): number {
  const [A, B, C] = [BigInt(a), BigInt(b), BigInt(c)];
  return Number((2n * A * B + C) / (2n * C));
}

/** Convertit vers la masse, si l'ingrédient le permet. */
function toMass(q: Quantity, f: ReturnType<typeof factors>): Quantity | null {
  switch (q.dimension) {
    case "mass":
      return q;
    case "volume":
      return f.densityMilli ? fromMilli(mulDiv(q.milli, f.densityMilli, 1000), "mass") : null;
    case "count":
      return f.pieceMilli ? fromMilli(mulDiv(q.milli, f.pieceMilli, 1000), "mass") : null;
  }
}

/** Convertit une masse vers la dimension cible, si l'ingrédient le permet. */
function fromMass(
  mass: Quantity,
  target: Dimension,
  f: ReturnType<typeof factors>,
): Quantity | null {
  switch (target) {
    case "mass":
      return mass;
    case "volume":
      return f.densityMilli ? fromMilli(mulDiv(mass.milli, 1000, f.densityMilli), "volume") : null;
    case "count":
      return f.pieceMilli ? fromMilli(mulDiv(mass.milli, 1000, f.pieceMilli), "count") : null;
  }
}

/** Renvoie la quantité convertie, ou null si l'ingrédient ne porte pas la conversion. */
export function tryConvert(
  q: Quantity,
  target: Dimension,
  conv: IngredientConversions,
): Quantity | null {
  if (q.dimension === target) return q;
  const f = factors(conv);
  const mass = toMass(q, f);
  return mass ? fromMass(mass, target, f) : null;
}

/** Comme tryConvert, mais lève IncompatibleUnitError plutôt que de renvoyer null. */
export function convert(
  q: Quantity,
  target: Dimension,
  conv: IngredientConversions,
  ingredientName = "cet ingrédient",
): Quantity {
  const result = tryConvert(q, target, conv);
  if (!result) {
    throw new IncompatibleUnitError(
      `Aucune conversion connue entre ${LABEL[q.dimension]} et ${LABEL[target]} pour ${ingredientName}.`,
    );
  }
  return result;
}

const LABEL: Record<Dimension, string> = { mass: "masse", volume: "volume", count: "pièces" };
