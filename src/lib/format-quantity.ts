import {
  BASE_UNIT,
  fromBase,
  isUnitCode,
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

/** Unités proposées pour un produit : celles de sa dimension uniquement. */
export function unitsForDimension(dimension: Dimension): UnitCode[] {
  return (Object.keys(UNITS) as UnitCode[]).filter((u) => UNITS[u].dimension === dimension);
}
