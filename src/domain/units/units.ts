import { UnknownUnitError } from "../errors";

/** Dimension physique d'une quantité. Unités de base : g, ml, pièce. */
export type Dimension = "mass" | "volume" | "count";

export const DIMENSIONS: readonly Dimension[] = ["mass", "volume", "count"];

/**
 * Miroir de la table `units` (migration 0003). Facteurs entiers vers l'unité de base.
 * Un test de base de données vérifie que les deux restent identiques.
 */
export const UNITS = {
  g: { label: "g", dimension: "mass", toBase: 1 },
  kg: { label: "kg", dimension: "mass", toBase: 1000 },
  ml: { label: "ml", dimension: "volume", toBase: 1 },
  cl: { label: "cl", dimension: "volume", toBase: 10 },
  l: { label: "l", dimension: "volume", toBase: 1000 },
  tsp: { label: "c. à café", dimension: "volume", toBase: 5 },
  tbsp: { label: "c. à soupe", dimension: "volume", toBase: 15 },
  piece: { label: "pièce", dimension: "count", toBase: 1 },
} as const satisfies Record<string, { label: string; dimension: Dimension; toBase: number }>;

export type UnitCode = keyof typeof UNITS;

export const BASE_UNIT: Record<Dimension, UnitCode> = {
  mass: "g",
  volume: "ml",
  count: "piece",
};

export function isUnitCode(value: string): value is UnitCode {
  return Object.hasOwn(UNITS, value);
}

export function unitOf(code: string) {
  if (!isUnitCode(code)) throw new UnknownUnitError(code);
  return UNITS[code];
}
