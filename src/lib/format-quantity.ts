import {
  BASE_UNIT,
  fromBase,
  isUnitCode,
  quantity as fromUnit,
  scale,
  toUnitValue,
  UNITS,
  type Dimension,
  type UnitCode,
} from "@/domain/units";

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 });

function unitLabel(unit: UnitCode, value: number): string {
  if (unit === "piece") return value > 1 ? "pièces" : "pièce";
  return UNITS[unit].label;
}

/**
 * Affiche une quantité stockée en unité de base (« 1500.000 », masse) dans l'unité
 * choisie à la saisie (« kg ») : « 1,5 kg ». Gère le signe pour les mouvements.
 * null -> « quantité inconnue ».
 */
export function formatStockQuantity(
  baseValue: string | null,
  dimension: Dimension,
  displayUnit: string,
  { signed = false } = {},
): string {
  if (baseValue === null) return "quantité inconnue";
  const negative = baseValue.trim().startsWith("-");
  const magnitude = baseValue.trim().replace(/^[-+]/, "");
  const q = fromBase(magnitude, dimension);

  const unit: UnitCode =
    isUnitCode(displayUnit) && UNITS[displayUnit].dimension === dimension
      ? displayUnit
      : BASE_UNIT[dimension];
  const value = toUnitValue(q, unit);
  const sign = signed ? (negative ? "−" : "+") : negative ? "−" : "";
  return `${sign}${number.format(value)} ${unitLabel(unit, value)}`;
}

const scaledNumber = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/**
 * Quantité d'une recette ajustée au nombre de portions, dans l'unité de la recette.
 * Calcul exact (domaine), affichage arrondi au dixième : « 375 g », « 1,5 c. à soupe ».
 */
export function formatRecipeQuantity(
  quantity: string,
  unit: string,
  servings: number,
  baseServings: number,
): string {
  if (!isUnitCode(unit)) return `${quantity} ${unit}`;
  const scaled = scale(fromUnit(quantity, unit), servings, baseServings);
  const exact = toUnitValue(scaled, unit);
  // Pièces et cuillères : on ne casse pas 3,75 œufs. Affichage à la demi-unité,
  // jamais sous 0,5, avec « ≈ » quand l'arrondi change la valeur. Le calcul des
  // courses, lui, garde la valeur exacte.
  if (ROUNDED_UNITS.has(unit)) {
    const rounded = Math.max(0.5, Math.round(exact * 2) / 2);
    const approx = Math.abs(rounded - exact) > 0.01 ? "≈ " : "";
    return `${approx}${scaledNumber.format(rounded)} ${unitLabel(unit, rounded)}`;
  }
  return `${scaledNumber.format(exact)} ${unitLabel(unit, exact)}`;
}

const ROUNDED_UNITS: ReadonlySet<UnitCode> = new Set(["piece", "tsp", "tbsp"]);

/** Unités proposées pour un produit : celles de sa dimension uniquement. */
export function unitsForDimension(dimension: Dimension): UnitCode[] {
  return (Object.keys(UNITS) as UnitCode[]).filter((u) => UNITS[u].dimension === dimension);
}
