import { IncompatibleUnitError, InvalidQuantityError } from "../errors";
import { BASE_UNIT, unitOf, type Dimension, type UnitCode } from "./units";

/**
 * Quantité exacte : un nombre ENTIER de millièmes de l'unité de base.
 * 1,5 kg -> { milli: 1_500_000, dimension: "mass" } (1 500 g × 1000).
 * Aucun calcul en virgule flottante sur les quantités : 0,1 + 0,2 vaut bien 0,3.
 * Précision : 0,001 g, 0,001 ml ou 0,001 pièce.
 */
export interface Quantity {
  readonly milli: number;
  readonly dimension: Dimension;
}

const SCALE = 1000;
/** Borne de sécurité : 1 000 tonnes, très en deçà de Number.MAX_SAFE_INTEGER. */
const MAX_MILLI = 1e12;

function make(milli: number, dimension: Dimension): Quantity {
  if (!Number.isSafeInteger(milli) || milli < 0 || milli > MAX_MILLI) {
    throw new InvalidQuantityError("Quantité hors limites.");
  }
  return Object.freeze({ milli, dimension });
}

/**
 * Lit un montant saisi (« 1,5 », « 2 », « 0.25 ») en millièmes, sans passer par un flottant.
 * Refuse les valeurs négatives, vides, non numériques ou à plus de 3 décimales.
 */
export function parseAmount(input: string | number): number {
  const raw = typeof input === "number" ? numberToPlainString(input) : input.trim();
  const match = /^(\d{1,9})(?:[.,](\d{1,3}))?$/.exec(raw);
  if (!match) {
    throw new InvalidQuantityError(
      `Quantité invalide : « ${String(input)} ». Utilise un nombre positif (3 décimales max).`,
    );
  }
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(3, "0"));
  return whole * SCALE + fraction;
}

function numberToPlainString(n: number): string {
  if (!Number.isFinite(n)) return "NaN";
  // toString évite l'arrondi silencieux ; 1e-7 donne « 1e-7 » et sera refusé.
  return n.toString();
}

/** Construit une quantité à partir d'un montant et d'une unité (« 1,5 » + « kg »). */
export function quantity(amount: string | number, unit: UnitCode | string): Quantity {
  const { dimension, toBase } = unitOf(unit);
  return make(parseAmount(amount) * toBase, dimension);
}

/** Construit une quantité directement en millièmes de l'unité de base (données déjà normalisées). */
export function fromMilli(milli: number, dimension: Dimension): Quantity {
  return make(milli, dimension);
}

/** Construit une quantité depuis une valeur en unité de base issue de la base (numeric(12,3)). */
export function fromBase(value: string | number, dimension: Dimension): Quantity {
  return make(parseAmount(value), dimension);
}

export const zero = (dimension: Dimension): Quantity => make(0, dimension);

function assertSameDimension(a: Quantity, b: Quantity): void {
  if (a.dimension !== b.dimension) {
    throw new IncompatibleUnitError(
      `Impossible de combiner une quantité en ${BASE_UNIT[a.dimension]} et une quantité en ${BASE_UNIT[b.dimension]}.`,
    );
  }
}

export function add(a: Quantity, b: Quantity): Quantity {
  assertSameDimension(a, b);
  return make(a.milli + b.milli, a.dimension);
}

/** Différence plancher à zéro : max(0, a − b). */
export function subtractFloorZero(a: Quantity, b: Quantity): Quantity {
  assertSameDimension(a, b);
  return make(Math.max(0, a.milli - b.milli), a.dimension);
}

export function min(a: Quantity, b: Quantity): Quantity {
  assertSameDimension(a, b);
  return a.milli <= b.milli ? a : b;
}

export function isZero(q: Quantity): boolean {
  return q.milli === 0;
}

/**
 * Multiplie par une fraction entière (ex. portions prévues / portions de la recette),
 * avec arrondi au millième le plus proche (demi vers le haut). Calcul entier exact.
 */
export function scale(q: Quantity, numerator: number, denominator: number): Quantity {
  if (!Number.isSafeInteger(numerator) || numerator < 0) {
    throw new InvalidQuantityError("Le multiplicateur doit être un entier positif ou nul.");
  }
  if (!Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new InvalidQuantityError("Le diviseur doit être un entier strictement positif.");
  }
  // BigInt : le produit intermédiaire peut dépasser Number.MAX_SAFE_INTEGER.
  const [m, n, d] = [BigInt(q.milli), BigInt(numerator), BigInt(denominator)];
  const rounded = (2n * m * n + d) / (2n * d);
  if (rounded > BigInt(MAX_MILLI)) throw new InvalidQuantityError("Quantité hors limites.");
  return make(Number(rounded), q.dimension);
}

/** Valeur dans l'unité de base, au format numeric attendu par PostgreSQL (« 1500.000 »). */
export function toBaseString(q: Quantity): string {
  const whole = Math.floor(q.milli / SCALE);
  const fraction = String(q.milli % SCALE).padStart(3, "0");
  return `${whole}.${fraction}`;
}

/** Valeur numérique dans une unité donnée (pour affichage uniquement). */
export function toUnitValue(q: Quantity, unit: UnitCode): number {
  const u = unitOf(unit);
  if (u.dimension !== q.dimension) {
    throw new IncompatibleUnitError(`Impossible d'exprimer cette quantité en ${u.label}.`);
  }
  return q.milli / SCALE / u.toBase;
}

const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

/** Affichage lisible : 1500 g -> « 1,5 kg », 250 ml -> « 250 ml », 3 pièces -> « 3 ». */
export function formatQuantity(q: Quantity): string {
  const base = q.milli / SCALE;
  switch (q.dimension) {
    case "mass":
      return base >= 1000
        ? `${numberFormat.format(base / 1000)} kg`
        : `${numberFormat.format(base)} g`;
    case "volume":
      return base >= 1000
        ? `${numberFormat.format(base / 1000)} l`
        : `${numberFormat.format(base)} ml`;
    case "count":
      return numberFormat.format(base);
  }
}
