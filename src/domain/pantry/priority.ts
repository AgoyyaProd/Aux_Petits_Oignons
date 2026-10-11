/** Règle D8 : à consommer en priorité si DLC dans 3 jours ou moins, ou produit entamé. */
export const PRIORITY_THRESHOLD_DAYS = 3;

export interface ExpiryInfo {
  expiresOn: string | null;
  expiryKind: "use_by" | "best_before" | null;
  openedAt: string | null;
}

export type ExpiryState =
  | { kind: "none" }
  | { kind: "expired"; days: number; label: "DLC" | "DDM" }
  | { kind: "soon"; days: number; label: "DLC" | "DDM" }
  | { kind: "later"; days: number; label: "DLC" | "DDM" };

/** Nombre de jours calendaires entre deux dates ISO « AAAA-MM-JJ » (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function expiryState(item: ExpiryInfo, today: string): ExpiryState {
  if (!item.expiresOn || !item.expiryKind) return { kind: "none" };
  const days = daysBetween(today, item.expiresOn);
  const label = item.expiryKind === "use_by" ? "DLC" : "DDM";
  if (days < 0) return { kind: "expired", days: -days, label };
  if (days <= PRIORITY_THRESHOLD_DAYS) return { kind: "soon", days, label };
  return { kind: "later", days, label };
}

/**
 * Priorité : DLC proche ou dépassée, ou produit entamé.
 * Une DDM proche ne rend pas le produit prioritaire (il reste consommable après).
 */
export function isPriority(item: ExpiryInfo, today: string): boolean {
  if (item.openedAt) return true;
  const state = expiryState(item, today);
  return item.expiryKind === "use_by" && (state.kind === "soon" || state.kind === "expired");
}

/** Ordre d'affichage : priorités d'abord, puis péremption la plus proche, puis sans date. */
export function comparePantryItems(a: ExpiryInfo, b: ExpiryInfo, today: string): number {
  const pa = isPriority(a, today) ? 0 : 1;
  const pb = isPriority(b, today) ? 0 : 1;
  if (pa !== pb) return pa - pb;
  const ea = a.expiresOn ?? "9999-12-31";
  const eb = b.expiresOn ?? "9999-12-31";
  return ea < eb ? -1 : ea > eb ? 1 : 0;
}
