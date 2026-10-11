import { DomainError } from "../errors";
import { fromMilli, tryConvert, type Dimension, type IngredientConversions } from "../units";

/**
 * Prix unitaire en centimes entiers par quantité de référence :
 * par kilogramme (masse), par litre (volume) ou par pièce (comptage).
 */
export interface UnitPrice {
  dimension: Dimension;
  centsPerRef: number;
}

/** Quantité de référence en millièmes d'unité de base : 1 kg = 1 000 000 mg-millièmes. */
export const REF_MILLI: Record<Dimension, number> = {
  mass: 1_000_000,
  volume: 1_000_000,
  count: 1_000,
};

export const REF_LABEL: Record<Dimension, string> = { mass: "kg", volume: "L", count: "pièce" };

/** Montant exact : `cents` centimes pour `milli` millièmes d'unité de base. */
export interface Rate {
  dimension: Dimension;
  cents: number;
  milli: number;
}

/** a × b / c arrondi au plus proche, en entiers exacts (BigInt contre les dépassements). */
export function mulDiv(a: number, b: number, c: number): number {
  if (c <= 0) throw new DomainError("INVALID_DIVISOR", "Diviseur nul.");
  const [A, B, C] = [BigInt(a), BigInt(b), BigInt(c)];
  return Number((2n * A * B + C) / (2n * C));
}

/**
 * Prix d'une quantité de référence dans la dimension cible, à partir d'un tarif exact.
 * La conversion passe uniquement par la densité et le poids unitaire de l'ingrédient :
 * sans eux, null (on ne devine jamais).
 */
export function rateToUnitPrice(
  rate: Rate,
  target: Dimension,
  conv: IngredientConversions,
): UnitPrice | null {
  if (rate.cents < 0 || rate.milli <= 0) return null;
  const ref = tryConvert(fromMilli(REF_MILLI[target], target), rate.dimension, conv);
  if (!ref || ref.milli === 0) return null;
  return { dimension: target, centsPerRef: mulDiv(rate.cents, ref.milli, rate.milli) };
}

/** Euros décimaux (« 2.99 ») -> centimes entiers ; null si invalide ou nul. */
export function eurosToCents(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0 || n > 10_000) return null;
  return Math.round(n * 100);
}
