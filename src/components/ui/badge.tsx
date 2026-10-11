import type { ReactNode } from "react";

/**
 * Badges de catégorie et d'état. Les couleurs encodent un sens :
 *  - urgent (terracotta) : à consommer vite, dépassé ;
 *  - soon (ocre) : bientôt, à surveiller ;
 *  - leaf (sauge) : végétal, positif, en stock ;
 *  - brand (forêt) : état acquis (cuisiné, favori) ;
 *  - neutral : information.
 */
const tones = {
  urgent: "bg-accent-soft text-accent-strong",
  soon: "bg-highlight-soft text-warning",
  leaf: "bg-leaf-soft text-success",
  brand: "bg-brand text-brand-foreground",
  neutral: "bg-surface-muted text-muted border border-border",
  danger: "bg-danger-soft text-danger",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
