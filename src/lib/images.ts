/**
 * Images de l'interface, centralisées ici : les photographies définitives seront fournies
 * plus tard. Ajouter une entrée suffit à remplacer l'emplacement neutre correspondant,
 * sans modifier les composants.
 *
 * Les chemins sont relatifs au dossier public/ (ex. "/images/recettes/poulet-basquaise.jpg").
 */

/**
 * Recettes qui ont une photo : public/images/recettes/<slug>.webp (1200 × 900) et
 * <slug>-600.webp (600 × 450, pour les vignettes). Format 4:3, recadrage centré.
 */
const RECIPES_WITH_PHOTO: readonly string[] = [
  "agneau-raisins-semoule",
  "aubergines-parmesane",
  "blanquette-veau",
  "boeuf-bourguignon",
  "boeuf-brocoli-saute",
  "bowl-saumon-fume-avocat",
  "buddha-bowl-quinoa",
  "cabillaud-pane-haricots-verts",
  "cabillaud-poireaux",
  "cake-banane",
  "chili-con-carne",
  "chili-sin-carne",
  "chou-fleur-roti-curry",
  "coquillettes-jambon-emmental",
  "soupe-miso-legumes",
  "yaourt-granola-fruits",
];

/** Photo principale d'une recette, par slug. */
export const RECIPE_IMAGES: Readonly<Record<string, string>> = Object.fromEntries(
  RECIPES_WITH_PHOTO.map((slug) => [slug, `/images/recettes/${slug}.webp`]),
);

/** Variante légère d'une photo de recette (600 px), pour le srcset. */
export function recipeImageSmall(src: string): string | null {
  return /^\/images\/recettes\/[a-z0-9-]+\.webp$/.test(src)
    ? src.replace(/\.webp$/, "-600.webp")
    : null;
}

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
