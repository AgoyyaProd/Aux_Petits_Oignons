import type { ButtonHTMLAttributes } from "react";

/**
 * Boutons (charte) :
 *  - primary : terracotta, l'appel à l'action principal de l'écran (souvent avec une flèche) ;
 *  - forest : vert forêt plein, actions de structure (se connecter, tout ajouter, valider) ;
 *  - accent : synonyme de primary, conservé pour les écrans existants ;
 *  - secondary : blanc avec contour ;
 *  - ghost / text : actions discrètes.
 * Le terracotta des boutons est la version foncée de la marque (#C2502F) : texte blanc lisible
 * (contraste AA). Le terracotta vif (#E76F51) reste celui du logo et des formes.
 */
export type ButtonVariant = "primary" | "forest" | "accent" | "secondary" | "ghost" | "text";

const terracotta = "bg-accent-strong text-white hover:bg-accent-strong/90 dark:text-forest";
const variants: Record<ButtonVariant, string> = {
  primary: terracotta,
  accent: terracotta,
  forest: "bg-forest text-cream hover:bg-forest/90 dark:bg-brand dark:text-brand-foreground",
  secondary:
    "border border-border-strong bg-surface text-foreground hover:border-forest hover:bg-surface",
  ghost: "text-foreground hover:bg-surface-muted",
  text: "min-h-0 px-0 text-accent-strong underline-offset-4 hover:underline",
};

export function buttonClasses(variant: ButtonVariant = "primary", extra = "") {
  return [
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold",
    "transition-colors disabled:cursor-not-allowed disabled:opacity-55",
    variants[variant],
    extra,
  ].join(" ");
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}

/** Bouton icône rond (44 px), libellé obligatoire pour les lecteurs d'écran. */
export function iconButtonClasses(extra = "") {
  return [
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground",
    "transition-colors hover:border-brand hover:bg-brand-soft/60 disabled:opacity-55",
    extra,
  ].join(" ");
}
