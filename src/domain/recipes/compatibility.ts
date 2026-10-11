/**
 * Règles de compatibilité entre une recette et un foyer. Fonctions pures.
 *
 * - Allergie déclarée : exclusion STRICTE, y compris si l'allergène vient d'un
 *   ingrédient facultatif (pour une allergie, le doute exclut).
 * - Régime : exclusion si un ingrédient est incompatible.
 * - Dégoût : la recette reste proposée mais signalée.
 */

export interface RecipeFlags {
  allergens: readonly string[];
  dietConflicts: readonly string[];
  ingredientIds: readonly string[];
}

export interface HouseholdConstraints {
  allergens: ReadonlySet<string>;
  diets: ReadonlySet<string>;
  dislikedIngredientIds: ReadonlySet<string>;
}

export type ExclusionReason =
  { kind: "allergen"; codes: string[] } | { kind: "diet"; codes: string[] };

export interface Compatibility {
  compatible: boolean;
  reasons: ExclusionReason[];
  /** Ingrédients que le foyer préfère éviter (non bloquant). */
  disliked: string[];
}

export const NO_CONSTRAINTS: HouseholdConstraints = {
  allergens: new Set(),
  diets: new Set(),
  dislikedIngredientIds: new Set(),
};

export function checkCompatibility(
  recipe: RecipeFlags,
  household: HouseholdConstraints,
): Compatibility {
  const reasons: ExclusionReason[] = [];
  const allergens = recipe.allergens.filter((a) => household.allergens.has(a)).sort();
  if (allergens.length) reasons.push({ kind: "allergen", codes: allergens });
  const diets = recipe.dietConflicts.filter((d) => household.diets.has(d)).sort();
  if (diets.length) reasons.push({ kind: "diet", codes: diets });

  return {
    compatible: reasons.length === 0,
    reasons,
    disliked: recipe.ingredientIds.filter((id) => household.dislikedIngredientIds.has(id)),
  };
}

/** Minuscules, sans accents ni ponctuation : « Crème brûlée ! » -> « creme brulee ». */
export function normalizeText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Recherche : chaque mot saisi doit apparaître (début de mot) dans le titre,
 * la description ou un ingrédient. « poul riz » trouve « Poulet … riz ».
 */
export function matchesSearch(
  recipe: { title: string; description?: string | null; ingredientNames: readonly string[] },
  query: string,
): boolean {
  const terms = normalizeText(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;
  const words = normalizeText(
    [recipe.title, recipe.description ?? "", ...recipe.ingredientNames].join(" "),
  ).split(" ");
  return terms.every((term) => words.some((word) => word.startsWith(term)));
}

export interface StockCoverage {
  /** Ingrédients obligatoires présents en stock (quantité connue et non nulle). */
  inStock: number;
  /** Nombre d'ingrédients obligatoires. */
  total: number;
}

/**
 * Part des ingrédients obligatoires déjà présents. Indicateur de présence seulement :
 * le calcul des quantités manquantes reste celui de la liste de courses.
 * Un produit à quantité inconnue ne compte pas (règle : jamais considéré disponible).
 */
export function stockCoverage(
  requiredIngredientIds: readonly string[],
  availableIngredientIds: ReadonlySet<string>,
): StockCoverage {
  const unique = [...new Set(requiredIngredientIds)];
  return {
    inStock: unique.filter((id) => availableIngredientIds.has(id)).length,
    total: unique.length,
  };
}
