/** Seuil sous lequel un prix indicatif est signalé « peu de relevés ». */
export const MIN_RELIABLE_SAMPLE = 5;

/** Écart maximal toléré autour de la médiane (facteur) avant d'écarter un relevé. */
const OUTLIER_FACTOR = 2.5;

function median(sorted: readonly number[]): number {
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted[mid] ?? 0;
  return sorted.length % 2 === 1 ? upper : Math.round(((sorted[mid - 1] ?? upper) + upper) / 2);
}

/**
 * Médiane robuste : on écarte les relevés à plus d'un facteur 2,5 de la médiane
 * (mauvaise catégorie, produit premium, erreur de saisie), puis on reprend la médiane.
 * Renvoie null s'il n'y a aucun relevé : pas de prix plutôt qu'un prix inventé.
 */
export function robustMedian(values: readonly number[]): { value: number; kept: number } | null {
  const clean = values.filter((v) => Number.isSafeInteger(v) && v > 0).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const first = median(clean);
  const kept = clean.filter((v) => v * OUTLIER_FACTOR >= first && v <= first * OUTLIER_FACTOR);
  return { value: median(kept), kept: kept.length };
}
