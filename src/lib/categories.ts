/** Catégories d'ingrédients, dans l'ordre d'un parcours en magasin (rayons). */
export const AISLES: { category: string; label: string }[] = [
  { category: "fruits", label: "Fruits" },
  { category: "legumes", label: "Légumes" },
  { category: "viandes", label: "Boucherie" },
  { category: "poissons", label: "Poissonnerie" },
  { category: "oeufs_laitiers", label: "Crèmerie" },
  { category: "fromages", label: "Fromages" },
  { category: "feculents", label: "Pâtes, riz, pain" },
  { category: "legumineuses", label: "Légumineuses" },
  { category: "epicerie_salee", label: "Épicerie salée" },
  { category: "epicerie_sucree", label: "Épicerie sucrée" },
  { category: "condiments", label: "Sauces et condiments" },
  { category: "epices_herbes", label: "Épices et herbes" },
  { category: "matieres_grasses", label: "Huiles et beurre" },
  { category: "boissons", label: "Boissons" },
];

const LABELS = new Map(AISLES.map((a) => [a.category, a.label]));

export function categoryLabel(category: string): string {
  return LABELS.get(category) ?? "Autres";
}

/**
 * Rayons dans l'ordre choisi par le foyer (ordre de son magasin). Les catégories absentes du
 * choix, ou ajoutées plus tard, suivent dans l'ordre par défaut ; les inconnues sont ignorées.
 */
export function orderedAisles(order: readonly string[] | null | undefined) {
  if (!order?.length) return AISLES;
  const known = new Map(AISLES.map((a) => [a.category, a]));
  const seen = new Set<string>();
  const out: { category: string; label: string }[] = [];
  for (const c of order) {
    const a = known.get(c);
    if (a && !seen.has(c)) {
      out.push(a);
      seen.add(c);
    }
  }
  for (const a of AISLES) if (!seen.has(a.category)) out.push(a);
  return out;
}
