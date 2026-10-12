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
  "bowl-saumon-fume-avocat",
  "buddha-bowl-quinoa",
  "cabillaud-pane-haricots-verts",
  "cabillaud-poireaux",
  "cake-banane",
  "chili-con-carne",
  "chili-sin-carne",
  "chou-fleur-roti-curry",
  "coquillettes-jambon-emmental",
  "courgettes-farcies-boulgour",
  "couscous-legumes",
  "crepes-jambon-fromage",
  "crevettes-curry-coco",
  "croque-monsieur",
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
  "gnocchis-epinards-lardons",
  "gnocchis-pesto",
  "gratin-chou-fleur",
  "gratin-courgettes",
  "gratin-dauphinois",
  "gratin-pates-brocoli",
  "gratin-poireaux-jambon",
  "hachis-parmentier",
  "lasagnes-bolognaise",
  "lasagnes-epinards-ricotta",
  "lentilles-corail-dahl",
  "lentilles-vertes-legumes",
  "linguine-crevettes-ail",
  "macaronis-gratines",
  "merguez-semoule-legumes",
  "minestrone",
  "moules-marinieres",
  "mousse-chocolat",
  "nouilles-sautees-tofu",
  "oeufs-cocotte",
  "omelette-champignons",
  "one-pot-pasta-legumes",
  "paella-poulet-chorizo",
  "pancakes",
  "papillotes-saumon-legumes",
  "patates-douces-feta-pois-chiches",
  "pates-thon-tomate",
  "pates-tomate-basilic",
  "penne-arrabbiata",
  "penne-courgettes-feta",
  "poelee-saucisses-lentilles",
  "pommes-de-terre-farcies",
  "pommes-de-terre-oeufs-plat",
  "porc-caramel",
  "porc-moutarde",
  "potee-chou-saucisses",
  "poulet-basquaise",
  "poulet-citron-olives",
  "poulet-curry-coco",
  "poulet-grenailles-thym",
  "poulet-miel-soja",
  "poulet-roti-legumes",
  "poulet-yaourt-epices-basmati",
  "puree-saucisses",
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
  "tagliatelles-champignons-creme",
  "tarte-fine-tomate-mozzarella",
  "tarte-poireaux-chevre",
  "tofu-croustillant-brocoli",
  "tortilla-espagnole",
  "veloute-brocoli",
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
