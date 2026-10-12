"use client";

import { useSyncExternalStore } from "react";
import { chooseTheme, readAppliedTheme, subscribeTheme } from "@/lib/theme-client";

const ICON = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/**
 * Bouton clair / sombre des pages publiques (accueil, connexion). Il enregistre le même
 * réglage que « Mes préférences » ; le mode automatique reste disponible là-bas.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, readAppliedTheme, () => null);
  const next = theme === "dark" ? "light" : "dark";
  // Avant l'hydratation le thème n'est pas encore lu : libellé neutre, icône choisie en CSS.
  const label =
    theme === null
      ? "Changer de thème"
      : next === "dark"
        ? "Passer en mode sombre"
        : "Passer en mode clair";

  return (
    <button
      type="button"
      onClick={() => chooseTheme(next)}
      aria-label={label}
      title={label}
      className={`border-border text-foreground hover:bg-surface-muted inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors ${className}`}
    >
      {/* Les deux icônes sont rendues ; la variante dark (data-theme) choisit, sans flash. */}
      <svg {...ICON} className="dark:hidden">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
      <svg {...ICON} className="hidden dark:block">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
    </button>
  );
}
