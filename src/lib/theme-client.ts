"use client";

import { THEME_KEY, type ThemeChoice } from "@/lib/theme";

/**
 * Lecture et changement du thème côté navigateur, partagés par le sélecteur des préférences
 * et le bouton de l'en-tête public : un seul réglage par appareil.
 */
const listeners = new Set<() => void>();

export function subscribeTheme(fn: () => void): () => void {
  listeners.add(fn);
  // Le thème appliqué peut aussi changer avec le système (mode automatique).
  const observer = new MutationObserver(fn);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => {
    listeners.delete(fn);
    observer.disconnect();
  };
}

/** Choix mémorisé : clair, sombre ou automatique. */
export function readThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

/** Thème réellement affiché (le mode automatique est déjà résolu par le script de <head>). */
export function readAppliedTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function chooseTheme(next: ThemeChoice): void {
  try {
    if (next === "auto") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  } catch {
    // Stockage indisponible (navigation privée) : le choix vaut pour la page en cours.
  }
  const apply = (window as Window & { __apoApplyTheme?: () => void }).__apoApplyTheme;
  if (apply) apply();
  else if (next !== "auto") document.documentElement.setAttribute("data-theme", next);
  listeners.forEach((fn) => fn());
}
