/**
 * Ce que le garde-manger dit au générateur de menus, en trois niveaux :
 *  1. à finir en priorité : produit entamé ou DLC proche (règle D8, voir priority.ts) ;
 *  2. frais du frigo : produit périssable rangé au frigo (légumes, fruits, laitages, fromages,
 *     viandes, poissons), à utiliser avant le placard et le congélateur ;
 *  3. le reste du stock (placard, congélateur), qui compte selon la quantité disponible.
 */
import { juiceFromPieces, type JuiceSource } from "@/domain/requirements/juice";
import { fromBase, toBaseString, type Dimension } from "@/domain/units";

/** Catégories périssables : au frigo, elles passent avant le placard. */
export const FRESH_CATEGORIES: ReadonlySet<string> = new Set([
  "legumes",
  "fruits",
  "fromages",
  "oeufs_laitiers",
  "viandes",
  "poissons",
]);

export interface StockLot {
  ingredientId: string;
  /** Quantité en unité de base (g, ml, pièce). */
  quantityBase: number;
  dimension: Dimension;
  location: "pantry" | "fridge" | "freezer";
  category: string | null;
}

/** Produit frais du frigo (niveau 2). */
export function isFresh(lot: Pick<StockLot, "location" | "category">): boolean {
  return lot.location === "fridge" && FRESH_CATEGORIES.has(lot.category ?? "");
}

/** Quantité en stock par ingrédient et par dimension. */
export type StockQuantities = ReadonlyMap<string, ReadonlyMap<Dimension, number>>;

/**
 * Additionne les lots par ingrédient et par dimension. Une variante en stock (Penne) compte
 * aussi pour son parent (Pâtes), comme pour la présence (voir withParents).
 */
export function stockQuantities(
  lots: readonly StockLot[],
  parentOf: ReadonlyMap<string, string>,
): StockQuantities {
  const out = new Map<string, Map<Dimension, number>>();
  const add = (id: string, dimension: Dimension, q: number) => {
    const byDim = out.get(id) ?? new Map<Dimension, number>();
    byDim.set(dimension, (byDim.get(dimension) ?? 0) + q);
    out.set(id, byDim);
  };
  for (const lot of lots) {
    if (!(lot.quantityBase > 0)) continue;
    add(lot.ingredientId, lot.dimension, lot.quantityBase);
    const parent = parentOf.get(lot.ingredientId);
    if (parent) add(parent, lot.dimension, lot.quantityBase);
  }
  return out;
}

export interface CoverageLine {
  ingredientId: string;
  /** Quantité demandée par la recette (unité de base), null si « selon le goût ». */
  quantityBase: number | null;
  dimension: Dimension | null;
}

/** Part d'une ligne couverte quand le stock est insuffisant. */
export const PARTIAL_COVERAGE = 0.5;

/**
 * Part des ingrédients obligatoires couverte par le stock, entre 0 et 1 :
 *  - placard déclaré (sel, huile…) ou eau : couvert ;
 *  - en stock en quantité suffisante, ou quantité non comparable (pas de quantité dans la
 *    recette, ou unité d'une autre dimension : aucune conversion implicite) : couvert ;
 *  - en stock mais en quantité insuffisante : à moitié ;
 *  - absent : non couvert.
 * Chaque ingrédient compte une fois (quantités additionnées s'il revient sur plusieurs lignes).
 */
export function quantityCoverage(
  lines: readonly CoverageLine[],
  stock: StockQuantities,
  staple: ReadonlySet<string>,
): number {
  const need = new Map<string, { dimension: Dimension | null; quantity: number | null }>();
  for (const l of lines) {
    const prev = need.get(l.ingredientId);
    if (!prev) {
      need.set(l.ingredientId, { dimension: l.dimension, quantity: l.quantityBase });
    } else if (
      prev.quantity !== null &&
      l.quantityBase !== null &&
      prev.dimension === l.dimension
    ) {
      prev.quantity += l.quantityBase;
    } else {
      prev.quantity = null;
    }
  }
  if (need.size === 0) return 0;
  let covered = 0;
  for (const [id, n] of need) {
    if (staple.has(id)) {
      covered += 1;
      continue;
    }
    const have = stock.get(id);
    if (!have || have.size === 0) continue;
    const sameDim = n.dimension ? have.get(n.dimension) : undefined;
    if (n.quantity === null || sameDim === undefined || sameDim >= n.quantity) covered += 1;
    else covered += PARTIAL_COVERAGE;
  }
  return covered / need.size;
}

/**
 * Lots de jus tirés des fruits en stock (citron → jus de citron, au rendement déclaré). Le
 * fruit reste aussi compté pour lui-même : pour classer les plats, on ne sait pas encore si la
 * recette demande le fruit, le jus ou les deux.
 */
export function juiceStockLots(
  lots: readonly StockLot[],
  sources: readonly JuiceSource[],
): StockLot[] {
  const bySource = new Map(sources.map((s) => [s.sourceId, s]));
  return lots.flatMap((lot) => {
    const s = bySource.get(lot.ingredientId);
    if (!s || lot.dimension !== "count" || !(lot.quantityBase > 0)) return [];
    const juice = juiceFromPieces(
      fromBase(lot.quantityBase.toFixed(3), "count"),
      s.tenthsMlPerPiece,
    );
    return [
      {
        ...lot,
        ingredientId: s.productId,
        dimension: "volume" as const,
        quantityBase: Number(toBaseString(juice)),
      },
    ];
  });
}
