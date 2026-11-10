import { fromMilli, type Dimension, type Quantity } from "../units";

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

interface SplittableLot {
  id: string;
  ingredientId: string;
  quantity: Quantity | null;
  expiresOn: string | null;
  opened?: boolean;
}

/**
 * Comme `remapVariantLots`, mais une variante demandée elle-même n'est réservée qu'à hauteur
 * de son propre besoin : le reste de ses lots sert au parent. Exemple : 1 L de crème liquide,
 * un dessert qui en demande 20 cl et des plats salés qui demandent « crème » — 20 cl restent à
 * la crème liquide, 80 cl couvrent la crème.
 *
 * `demand` : besoin de chaque variante, dans les unités des recettes. Sans conversion devinée :
 * un lot dont la dimension diffère de celle du besoin, ou de quantité inconnue, reste réservé
 * en entier à la variante (prudent : on ne promet pas au parent ce qu'on ne sait pas compter).
 * Les lots de la variante sont réservés dans l'ordre de consommation : entamés d'abord, puis
 * par date limite.
 */
export function splitVariantLots<T extends SplittableLot>(
  lots: readonly T[],
  parentOf: ReadonlyMap<string, string>,
  required: ReadonlySet<string>,
  demand: ReadonlyMap<string, readonly Quantity[]>,
): T[] {
  const remaining = new Map<string, Map<Dimension, number>>();
  for (const [id, needs] of demand) {
    const byDim = new Map<Dimension, number>();
    for (const q of needs) byDim.set(q.dimension, (byDim.get(q.dimension) ?? 0) + q.milli);
    remaining.set(id, byDim);
  }
  const order = [...lots].sort(
    (a, b) =>
      Number(Boolean(b.opened)) - Number(Boolean(a.opened)) ||
      (a.expiresOn ?? "9999-12-31").localeCompare(b.expiresOn ?? "9999-12-31") ||
      a.id.localeCompare(b.id),
  );
  const out: T[] = [];
  for (const lot of order) {
    const parent = parentOf.get(lot.ingredientId);
    if (!parent || !required.has(parent)) {
      out.push(lot);
      continue;
    }
    if (!required.has(lot.ingredientId)) {
      out.push({ ...lot, ingredientId: parent });
      continue;
    }
    const byDim = remaining.get(lot.ingredientId);
    const left = lot.quantity ? byDim?.get(lot.quantity.dimension) : undefined;
    if (!lot.quantity || left === undefined) {
      out.push(lot);
      continue;
    }
    const keep = Math.min(lot.quantity.milli, left);
    byDim!.set(lot.quantity.dimension, left - keep);
    if (keep > 0) out.push({ ...lot, quantity: fromMilli(keep, lot.quantity.dimension) });
    const rest = lot.quantity.milli - keep;
    if (rest > 0) {
      out.push({
        ...lot,
        ingredientId: parent,
        quantity: fromMilli(rest, lot.quantity.dimension),
      });
    }
  }
  return out;
}
