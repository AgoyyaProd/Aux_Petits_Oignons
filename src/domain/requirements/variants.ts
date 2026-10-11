/**
 * Variantes d'ingrédients (Farfalle est une variante de Pâtes).
 *
 * Un besoin du parent (« Pâtes ») peut être couvert par le stock d'une variante (Farfalle),
 * sauf si la variante elle-même est demandée ailleurs : elle est alors réservée à ce besoin.
 * Un besoin d'une variante précise n'est couvert que par elle.
 */
export function remapVariantLots<T extends { ingredientId: string }>(
  lots: readonly T[],
  parentOf: ReadonlyMap<string, string>,
  required: ReadonlySet<string>,
): T[] {
  return lots.map((lot) => {
    const parent = parentOf.get(lot.ingredientId);
    if (!parent || required.has(lot.ingredientId) || !required.has(parent)) return lot;
    return { ...lot, ingredientId: parent };
  });
}

/** Ingrédients présents, en ajoutant le parent de chaque variante présente. */
export function withParents(
  present: Iterable<string>,
  parentOf: ReadonlyMap<string, string>,
): Set<string> {
  const out = new Set<string>();
  for (const id of present) {
    out.add(id);
    const parent = parentOf.get(id);
    if (parent) out.add(parent);
  }
  return out;
}
