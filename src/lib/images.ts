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
  "bolognaise",
  "boulettes-boeuf-sauce-tomate",
  "bowl-saumon-fume-avocat",
  "buddha-bowl-quinoa",
  "cabillaud-pane-haricots-verts",
  "cabillaud-poireaux",
  "cake-banane",
  "chili-con-carne",
  "chili-sin-carne",
  "chou-fleur-roti-curry",
  "chou-rouge-braise-pommes-saucisses",
  "clafoutis-poires",
  "cookies-chocolat",
  "coquillettes-jambon-emmental",
  "cotes-porc-pommes",
  "courgettes-farcies-boulgour",
  "couscous-legumes",
  "creme-chocolat",
  "crepes-jambon-fromage",
  "crepes-sucrees",
  "crevettes-curry-coco",
  "croque-monsieur",
  "crumble-poires-chocolat",
  "crumble-pommes",
  "curry-pois-chiches-epinards",
  "dinde-creme-champignons",
  "endives-jambon",
  "fajitas-poulet",
  "falafels-four",
  "farfalle-saumon-epinards",
  "filet-mignon-miel-moutarde",
  "frittata-legumes",
  "fusilli-pesto-poulet",
  "galettes-pommes-de-terre",
  "gaspacho",
  "gateau-yaourt",
  "gnocchis-epinards-lardons",
  "gnocchis-pesto",
  "granola-maison",
  "gratin-chou-fleur",
  "gratin-courgettes",
  "gratin-dauphinois",
  "gratin-pates-brocoli",
  "gratin-poireaux-jambon",
  "gratin-pommes-de-terre-comte",
  "hachis-parmentier",
  "lasagnes-bolognaise",
  "lasagnes-epinards-ricotta",
  "lentilles-corail-dahl",
  "lentilles-vertes-legumes",
  "linguine-crevettes-ail",
  "macaronis-gratines",
  "merguez-semoule-legumes",
  "minestrone",
  "moelleux-chocolat",
  "moules-marinieres",
  "mousse-chocolat",
  "muffins-myrtilles",
  "nouilles-sautees-tofu",
  "oeufs-brouilles-tartines",
  "oeufs-cocotte",
  "omelette-champignons",
  "one-pot-pasta-legumes",
  "overnight-oats-fruits-rouges",
  "paella-poulet-chorizo",
  "pain-perdu",
  "pancakes",
  "papillotes-saumon-legumes",
  "parmentier-patate-douce-lentilles",
  "patates-douces-feta-pois-chiches",
  "pates-thon-tomate",
  "pates-tomate-basilic",
  "penne-arrabbiata",
  "penne-courgettes-feta",
  "poelee-saucisses-lentilles",
  "poires-belle-helene",
  "pommes-au-four",
  "pommes-de-terre-farcies",
  "pommes-de-terre-oeufs-plat",
  "porc-caramel",
  "porc-moutarde",
  "porridge-pommes-cannelle",
  "pot-au-feu",
  "potee-chou-saucisses",
  "poulet-basquaise",
  "poulet-citron-olives",
  "poulet-curry-coco",
  "poulet-grenailles-thym",
  "poulet-miel-soja",
  "poulet-roti-legumes",
  "poulet-roti-legumes-hiver",
  "poulet-yaourt-epices-basmati",
  "puree-celeri-cotes-porc",
  "puree-saucisses",
  "quiche-lardons",
  "quiche-thon-tomate",
  "ratatouille",
  "rigatoni-saucisse-tomate",
  "risotto-butternut",
  "risotto-champignons",
  "risotto-petits-pois-jambon",
  "riz-au-lait",
  "riz-cantonais",
  "riz-haricots-rouges",
  "riz-saute-legumes-oeuf",
  "rougail-saucisses",
  "salade-boulgour-legumes-rotis",
  "salade-cesar-poulet",
  "salade-chevre-chaud",
  "salade-fenouil-orange-pois-chiches",
  "salade-fruits-oranges",
  "salade-grecque",
  "salade-lentilles-feta",
  "salade-nicoise",
  "salade-pates-thon",
  "salade-piemontaise",
  "salade-quinoa-avocat-mais",
  "salade-riz-thon",
  "saumon-grenailles-citron",
  "saumon-riz-brocoli",
  "shakshuka",
  "smoothie-bowl-banane-framboise",
  "soupe-legumes-hiver",
  "soupe-lentilles-corail-carottes",
  "soupe-miso-legumes",
  "soupe-oignon-gratinee",
  "soupe-potiron",
  "soupe-thai-poulet-coco",
  "soupe-tomate-pois-chiches",
  "spaghetti-aglio-olio",
  "spaghetti-carbonara",
  "steak-hache-frites-four",
  "steak-haricots-verts",
  "taboule",
  "tacos-poulet",
  "tagliatelles-champignons-creme",
  "tarte-fine-tomate-mozzarella",
  "tarte-poireaux-chevre",
  "tarte-pommes",
  "tartines-fromage-blanc-poire",
  "tofu-croustillant-brocoli",
  "tortilla-espagnole",
  "veloute-brocoli",
  "veloute-butternut-coco",
  "veloute-carottes-cumin",
  "veloute-champignons",
  "veloute-poireaux-pommes-de-terre",
  "wraps-thon-crudites",
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
export const SITE_IMAGES: Readonly<{ hero: string | null }> = {
  hero: "/images/recettes/buddha-bowl-quinoa.webp",
};

export function recipeImage(slug: string | null | undefined): string | null {
  return slug ? (RECIPE_IMAGES[slug] ?? null) : null;
}

export function ingredientImage(id: string): string | null {
  return INGREDIENT_IMAGES[id] ?? null;
}
