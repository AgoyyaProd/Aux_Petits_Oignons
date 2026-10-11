/**
 * Familles utilisées pour varier le menu : au plus MAX_PER_FAMILY plats d'une même
 * famille de féculent ou de protéine (pas trois plats de pâtes dans la semaine).
 */
export const MAX_PER_FAMILY = 2;

const FAMILY_BY_SLUG: Record<string, string> = {
  pates: "feculent:pates",
  "pates-completes": "feculent:pates",
  gnocchi: "feculent:pates",
  "nouilles-riz": "feculent:pates",
  riz: "feculent:riz",
  "riz-complet": "feculent:riz",
  "riz-rond": "feculent:riz",
  "pomme-de-terre": "feculent:pomme-de-terre",
  "patate-douce": "feculent:pomme-de-terre",
  semoule: "feculent:cereales",
  boulgour: "feculent:cereales",
  quinoa: "feculent:cereales",
  "poulet-filet": "proteine:volaille",
  "poulet-cuisse": "proteine:volaille",
  "poulet-entier": "proteine:volaille",
  "dinde-escalope": "proteine:volaille",
  "boeuf-hache": "proteine:boeuf",
  "boeuf-steak": "proteine:boeuf",
  "boeuf-bourguignon": "proteine:boeuf",
  veau: "proteine:boeuf",
  agneau: "proteine:agneau",
  "porc-filet": "proteine:porc",
  "porc-cote": "proteine:porc",
  lardon: "proteine:porc",
  jambon: "proteine:porc",
  "jambon-cru": "proteine:porc",
  saucisse: "proteine:porc",
  chorizo: "proteine:porc",
  merguez: "proteine:merguez",
  saumon: "proteine:poisson",
  "saumon-fume": "proteine:poisson",
  cabillaud: "proteine:poisson",
  "thon-boite": "proteine:poisson",
  "sardine-boite": "proteine:poisson",
  crevette: "proteine:poisson",
  moule: "proteine:poisson",
  "lentille-verte": "proteine:legumineuses",
  "lentille-corail": "proteine:legumineuses",
  "pois-chiche": "proteine:legumineuses",
  "haricot-rouge": "proteine:legumineuses",
  "haricot-blanc": "proteine:legumineuses",
  tofu: "proteine:tofu",
  oeuf: "proteine:oeuf",
};

/** Familles d'une recette, d'après les slugs de ses ingrédients obligatoires. */
export function varietyKeys(ingredientSlugs: readonly string[]): string[] {
  const keys = new Set<string>();
  for (const slug of ingredientSlugs) {
    const family = FAMILY_BY_SLUG[slug];
    if (family) keys.add(family);
  }
  return [...keys].sort();
}

/** Types de plats proposés comme repas principal (ni dessert ni petit-déjeuner). */
export function isMainDish(tags: readonly string[]): boolean {
  if (tags.includes("dessert") || tags.includes("petit-dejeuner")) return false;
  return tags.some((t) => t === "plat" || t === "soupe" || t === "salade");
}
