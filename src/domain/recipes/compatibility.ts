/**
 * Règles de compatibilité entre une recette et un foyer. Fonctions pures.
 *
 * - Allergie déclarée : exclusion STRICTE, y compris si l'allergène vient d'un
 *   ingrédient facultatif (pour une allergie, le doute exclut).
 * - Régime : exclusion si un ingrédient est incompatible.
 * - Aliment non souhaité : exclusion s'il est obligatoire dans la recette ;
 *   s'il n'est que facultatif, la recette reste proposée et l'ingrédient est à retirer.
 * - Matériel : exclusion si la recette demande un appareil que le foyer n'a pas
 *   (seulement quand le foyer a renseigné son matériel).
 */

export interface RecipeFlags {
  allergens: readonly string[];
  dietConflicts: readonly string[];
  ingredients: readonly { id: string; optional: boolean }[];
  /** Matériel requis (déduit des étapes) ; absent = inconnu, aucune exclusion. */
  equipment?: readonly string[];
}

export interface HouseholdConstraints {
  allergens: ReadonlySet<string>;
  diets: ReadonlySet<string>;
  /** Aliments que le foyer ne veut pas manger. */
  avoidedIngredientIds: ReadonlySet<string>;
  /** Matériel possédé ; null ou absent = non renseigné (aucun filtre). */
  equipment?: ReadonlySet<string> | null;
}

export type ExclusionReason =
  | { kind: "allergen"; codes: string[] }
  | { kind: "diet"; codes: string[] }
  | { kind: "ingredient"; ids: string[] }
  | { kind: "equipment"; codes: string[] };

export interface Compatibility {
  compatible: boolean;
  reasons: ExclusionReason[];
  /** Ingrédients non souhaités mais facultatifs : la recette se fait sans eux. */
  toRemove: string[];
}

export const NO_CONSTRAINTS: HouseholdConstraints = {
  allergens: new Set(),
  diets: new Set(),
  avoidedIngredientIds: new Set(),
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
  if (household.equipment) {
    const have = household.equipment;
    const missing = [...new Set(recipe.equipment ?? [])].filter((e) => !have.has(e)).sort();
    if (missing.length) reasons.push({ kind: "equipment", codes: missing });
  }

  const avoided = recipe.ingredients.filter((i) => household.avoidedIngredientIds.has(i.id));
  // Un même ingrédient peut figurer deux fois : obligatoire l'emporte sur facultatif.
  const required = [...new Set(avoided.filter((i) => !i.optional).map((i) => i.id))];
  if (required.length) reasons.push({ kind: "ingredient", ids: required });
  const toRemove = [
    ...new Set(avoided.filter((i) => i.optional && !required.includes(i.id)).map((i) => i.id)),
  ];

  return { compatible: reasons.length === 0, reasons, toRemove };
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
