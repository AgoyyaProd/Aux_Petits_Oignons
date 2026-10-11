/**
 * Images de l'interface, centralisées ici : les photographies définitives seront fournies
 * plus tard. Ajouter une entrée suffit à remplacer l'emplacement neutre correspondant,
 * sans modifier les composants.
 *
 * Les chemins sont relatifs au dossier public/ (ex. "/images/recettes/poulet-basquaise.jpg").
 */

/** Photo principale d'une recette, par slug. */
export const RECIPE_IMAGES: Readonly<Record<string, string>> = {};

/** Photo d'un ingrédient, par identifiant. */
export const INGREDIENT_IMAGES: Readonly<Record<string, string>> = {};

/** Visuels de la vitrine. */
export const SITE_IMAGES: Readonly<{ hero: string | null }> = { hero: null };

export function recipeImage(slug: string | null | undefined): string | null {
  return slug ? (RECIPE_IMAGES[slug] ?? null) : null;
}

export function ingredientImage(id: string): string | null {
  return INGREDIENT_IMAGES[id] ?? null;
}
