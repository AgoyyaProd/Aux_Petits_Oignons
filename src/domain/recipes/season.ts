/**
 * Saisonnalité des fruits et légumes frais, France métropolitaine.
 *
 * Calendrier fixe, établi à partir des calendriers de saison usuels (pleine saison de
 * production en France, hors primeurs et serres). Il est volontairement prudent : un mois
 * de transition n'est compté que s'il est largement admis. Les produits disponibles toute
 * l'année (carotte, oignon, pomme de terre, champignon de Paris…) et les produits importés
 * (banane, avocat, mangue, agrumes) ne sont PAS listés : ils sont neutres, ni « de saison »
 * ni « hors saison ».
 *
 * Clés : identifiants (slug) des ingrédients du référentiel. Valeurs : mois 1 à 12.
 */
export const SEASON_MONTHS: Readonly<Record<string, readonly number[]>> = {
  // Légumes d'été
  tomate: [6, 7, 8, 9],
  "tomate-cerise": [6, 7, 8, 9],
  courgette: [6, 7, 8, 9],
  aubergine: [6, 7, 8, 9],
  poivron: [7, 8, 9, 10],
  concombre: [5, 6, 7, 8, 9],
  "haricot-vert": [6, 7, 8, 9],
  "petit-pois": [5, 6, 7],
  mais: [8, 9],
  radis: [4, 5, 6, 7],
  asperge: [4, 5, 6],
  artichaut: [5, 6, 7, 8, 9],
  fenouil: [6, 7, 8, 9, 10],
  // Légumes d'automne et d'hiver
  potiron: [9, 10, 11, 12],
  butternut: [9, 10, 11, 12, 1, 2],
  "chou-fleur": [9, 10, 11, 12, 1, 2, 3, 4],
  brocoli: [6, 7, 8, 9, 10, 11],
  poireau: [9, 10, 11, 12, 1, 2, 3, 4],
  endive: [10, 11, 12, 1, 2, 3, 4],
  "chou-vert": [10, 11, 12, 1, 2, 3],
  "chou-rouge": [10, 11, 12, 1, 2, 3],
  navet: [10, 11, 12, 1, 2, 3],
  "celeri-rave": [10, 11, 12, 1, 2, 3],
  "celeri-branche": [6, 7, 8, 9, 10],
  mache: [10, 11, 12, 1, 2, 3],
  epinard: [3, 4, 5, 9, 10, 11],
  "patate-douce": [9, 10, 11, 12],
  // Fruits
  fraise: [4, 5, 6, 7],
  framboise: [6, 7, 8, 9],
  myrtille: [7, 8, 9],
  abricot: [6, 7, 8],
  peche: [6, 7, 8, 9],
  raisin: [8, 9, 10],
  pomme: [8, 9, 10, 11, 12, 1, 2, 3, 4],
  poire: [8, 9, 10, 11, 12, 1],
  kiwi: [11, 12, 1, 2, 3],
};

export type SeasonStatus = "in" | "out" | null;

/** Le produit est-il de saison ce mois-ci ? null s'il n'a pas de saison (neutre). */
export function ingredientSeason(slug: string, month: number): SeasonStatus {
  const months = SEASON_MONTHS[slug];
  if (!months) return null;
  return months.includes(month) ? "in" : "out";
}

/**
 * Statut d'une recette pour un mois donné, d'après ses ingrédients OBLIGATOIRES :
 *  - « hors saison » dès qu'un produit de saison est hors saison (ratatouille en janvier) ;
 *  - « de saison » si au moins un produit saisonnier y figure et que tous sont de saison ;
 *  - neutre sinon (aucun produit saisonnier : pâtes au thon, riz au lait…).
 */
export function recipeSeason(
  ingredients: readonly { slug: string; optional: boolean }[],
  month: number,
): SeasonStatus {
  let any = false;
  for (const i of ingredients) {
    if (i.optional) continue;
    const s = ingredientSeason(i.slug, month);
    if (s === "out") return "out";
    if (s === "in") any = true;
  }
  return any ? "in" : null;
}

/** Produits saisonniers d'une recette qui sont hors saison ce mois-ci (pour l'expliquer). */
export function outOfSeasonIngredients<T extends { slug: string; optional: boolean }>(
  ingredients: readonly T[],
  month: number,
): T[] {
  return ingredients.filter((i) => !i.optional && ingredientSeason(i.slug, month) === "out");
}

/** Poids dans le générateur : un plat de saison est favorisé, un plat hors saison écarté. */
export const SEASON_BONUS = 1.5;
export const OUT_OF_SEASON_MALUS = 2.5;

export function seasonScore(status: SeasonStatus | undefined): number {
  return status === "in" ? SEASON_BONUS : status === "out" ? -OUT_OF_SEASON_MALUS : 0;
}

/** Mois (1 à 12) d'une date ISO « AAAA-MM-JJ ». */
export function monthOf(isoDate: string): number {
  return Number(isoDate.slice(5, 7));
}
