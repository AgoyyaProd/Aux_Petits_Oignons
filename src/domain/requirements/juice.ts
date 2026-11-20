import { fromMilli, scale, type Quantity } from "../units";

/**
 * Jus d'agrume tiré du fruit en stock (voir migration 0094).
 *
 * Les recettes demandent le fruit (citron) pour le zeste, les quartiers ou les rondelles, et
 * le jus comme « jus de citron ». Un citron en stock peut donc couvrir un besoin de jus, au
 * rendement déclaré (ml par fruit) ; l'inverse jamais. Si la recette demande aussi le fruit,
 * les fruits restent réservés au fruit.
 */
export interface JuiceSource {
  /** Ingrédient « jus » (dimension volume). */
  productId: string;
  /** Fruit (dimension pièce). */
  sourceId: string;
  /** Rendement en dixièmes de ml par fruit (47 ml → 470), pour un calcul entier exact. */
  tenthsMlPerPiece: number;
}

/** Rendement lu en base (numeric « 47.0 ») → dixièmes de ml. */
export function tenthsOf(mlPerPiece: string | number): number {
  return Math.round(Number(mlPerPiece) * 10);
}

/** Jus obtenu d'une quantité de fruits. */
export function juiceFromPieces(pieces: Quantity, tenthsMlPerPiece: number): Quantity {
  return fromMilli(scale(pieces, tenthsMlPerPiece, 10).milli, "volume");
}

/** Fruits à presser pour une quantité de jus (arrondi au millième de fruit). */
export function piecesFromJuice(juice: Quantity, tenthsMlPerPiece: number): Quantity {
  return fromMilli(scale(juice, 10, tenthsMlPerPiece).milli, "count");
}

/**
 * Présente les fruits en stock comme du jus quand une recette demande le jus et pas le fruit.
 * Un lot converti garde son identifiant ; `juiceOf` permet de revenir aux fruits pour le
 * décompte. Lots de quantité inconnue ou d'une autre dimension : laissés tels quels.
 */
export function juiceLots<T extends { ingredientId: string; quantity: Quantity | null }>(
  lots: readonly T[],
  sources: readonly JuiceSource[],
  required: ReadonlySet<string>,
): (T & { juiceOf?: JuiceSource })[] {
  const bySource = new Map(sources.map((s) => [s.sourceId, s]));
  return lots.map((lot) => {
    const s = bySource.get(lot.ingredientId);
    if (
      !s ||
      !required.has(s.productId) ||
      required.has(s.sourceId) ||
      !lot.quantity ||
      lot.quantity.dimension !== "count"
    ) {
      return lot;
    }
    return {
      ...lot,
      ingredientId: s.productId,
      quantity: juiceFromPieces(lot.quantity, s.tenthsMlPerPiece),
      juiceOf: s,
    };
  });
}
