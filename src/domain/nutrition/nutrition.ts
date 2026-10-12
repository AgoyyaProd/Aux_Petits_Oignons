import { tryConvert, type IngredientConversions, type Quantity } from "../units";

/**
 * Valeurs nutritionnelles estimées d'une recette, à partir de la table Ciqual (ANSES).
 *
 * Règles (aucune valeur devinée) :
 *  - seuls les ingrédients OBLIGATOIRES comptent (« sel, au goût » n'a pas de quantité) ;
 *  - la quantité est ramenée en grammes avec les conversions propres à l'ingrédient
 *    (densité, poids à la pièce) ; sans conversion connue, l'ingrédient n'est pas compté ;
 *  - un ingrédient sans aliment Ciqual correspondant n'est pas compté ;
 *  - une valeur que Ciqual ne mesure pas (NULL) n'est pas comptée : le total de ce nutriment
 *    est alors un MINIMUM, signalé comme partiel.
 * Les ingrédients non comptés sont listés pour que l'écran l'explique.
 */

export const NUTRIENTS = [
  "kcal",
  "proteins",
  "carbs",
  "sugars",
  "fat",
  "saturatedFat",
  "fiber",
  "salt",
] as const;
export type Nutrient = (typeof NUTRIENTS)[number];

/** Valeurs pour 100 g ; null = non mesuré par Ciqual. */
export type Per100g = Record<Nutrient, number | null>;

export interface NutritionLine {
  name: string;
  optional: boolean;
  quantity: Quantity | null;
  conversions: IngredientConversions;
  /** null = aucun aliment Ciqual relié à cet ingrédient. */
  per100g: Per100g | null;
}

export type SkipReason = "no_match" | "no_conversion";

export interface NutrientTotal {
  value: number;
  /** Au moins un ingrédient compté n'a pas de valeur pour ce nutriment : total minimal. */
  partial: boolean;
}

export interface RecipeNutrition {
  perServing: Record<Nutrient, NutrientTotal>;
  countedLines: number;
  skipped: { name: string; reason: SkipReason }[];
  /**
   * false quand les ingrédients non comptés pèsent trop (plus de MAX_SKIPPED_SHARE du poids
   * total) ou que leur poids est inconnu : les chiffres ne doivent alors pas être affichés.
   */
  reliable: boolean;
}

/** Part maximale du poids de la recette laissée hors calcul pour que l'estimation tienne. */
export const MAX_SKIPPED_SHARE = 0.2;

/** Masse en grammes d'une quantité, ou null si l'ingrédient ne porte pas la conversion. */
export function gramsOf(q: Quantity, conv: IngredientConversions): number | null {
  const mass = tryConvert(q, "mass", conv);
  return mass ? mass.milli / 1000 : null;
}

export function computeRecipeNutrition(
  lines: readonly NutritionLine[],
  servings: number,
): RecipeNutrition | null {
  if (!(servings > 0)) return null;
  const totals = Object.fromEntries(
    NUTRIENTS.map((n) => [n, { value: 0, partial: false }]),
  ) as Record<Nutrient, NutrientTotal>;
  const skipped: RecipeNutrition["skipped"] = [];
  let countedLines = 0;
  let countedGrams = 0;
  let skippedGrams = 0;
  let skippedUnknown = false;

  for (const line of lines) {
    if (line.optional || !line.quantity) continue;
    const grams = gramsOf(line.quantity, line.conversions);
    if (!line.per100g || grams === null) {
      skipped.push({ name: line.name, reason: line.per100g ? "no_conversion" : "no_match" });
      if (grams === null) skippedUnknown = true;
      else skippedGrams += grams;
      continue;
    }
    countedLines += 1;
    countedGrams += grams;
    for (const n of NUTRIENTS) {
      const v = line.per100g[n];
      if (v === null) totals[n].partial = true;
      else totals[n].value += (v * grams) / 100;
    }
  }

  if (countedLines === 0) return null;
  for (const n of NUTRIENTS) totals[n].value /= servings;
  const reliable =
    !skippedUnknown && skippedGrams <= MAX_SKIPPED_SHARE * (countedGrams + skippedGrams);
  return { perServing: totals, countedLines, skipped, reliable };
}

/** Arrondis d'affichage : kcal à l'unité, grammes à 1 décimale sous 10 g, sel au centième sous 1 g. */
export function roundNutrient(n: Nutrient, value: number): number {
  if (n === "kcal") return Math.round(value);
  if (n === "salt" && value < 1) return Math.round(value * 100) / 100;
  return value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
}

/**
 * Apports de référence pour un adulte (règlement UE n° 1169/2011, annexe XIII, partie B).
 * Les fibres n'y figurent pas.
 */
export const REFERENCE_INTAKES: Partial<Record<Nutrient, number>> = {
  kcal: 2000,
  proteins: 50,
  carbs: 260,
  sugars: 90,
  fat: 70,
  saturatedFat: 20,
  salt: 6,
};

/** Part des apports de référence, en % entier, ou null si le nutriment n'en a pas. */
export function referenceShare(n: Nutrient, value: number): number | null {
  const ref = REFERENCE_INTAKES[n];
  return ref ? Math.round((value / ref) * 100) : null;
}
