import type { Quantity } from "../units/quantity";

/** Format standard d'un produit vendu en paquet, tel qu'affiché sur la liste de courses. */
export interface PackFormat {
  /** Taille du paquet dans l'unité de base de l'ingrédient (g, ml ou pièce). */
  size: number;
  /** Libellé du paquet, ex. « boîte de 40 cl ». */
  label: string;
  /** Dimension dans laquelle `size` est exprimée (celle de l'ingrédient). */
  dimension: Quantity["dimension"];
}

/**
 * Indication de format pour un achat : « 1 boîte de 40 cl », « 2 × pot de 190 g ».
 * Purement informatif : le besoin affiché reste la quantité exacte. Aucune conversion :
 * sans format, ou si l'achat n'est pas dans la dimension du format, rien n'est affiché.
 */
export function packHint(toBuy: Quantity, pack: PackFormat | undefined): string | null {
  if (!pack || toBuy.milli <= 0 || toBuy.dimension !== pack.dimension || pack.size <= 0) {
    return null;
  }
  const count = Math.ceil(toBuy.milli / (pack.size * 1000) - 1e-9);
  return count === 1 ? `1 ${pack.label}` : `${count} × ${pack.label}`;
}
