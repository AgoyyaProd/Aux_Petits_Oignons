import type { ButtonHTMLAttributes } from "react";

/**
 * Boutons :
 *  - primary : vert forêt, l'action principale de l'écran (une seule si possible) ;
 *  - accent : terracotta, ce qui demande l'attention (courses, cuisiner, inscription) ;
 *  - secondary : contour, action secondaire ;
 *  - ghost / text : actions discrètes.
 */
export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "text";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-foreground hover:bg-brand/90",
  accent: "bg-accent-strong text-white hover:bg-accent-strong/90 dark:text-forest",
  secondary:
    "border border-border-strong bg-surface text-foreground hover:border-brand hover:bg-brand-soft/60",
  ghost: "text-foreground hover:bg-brand-soft/70",
  text: "min-h-0 px-0 text-brand underline-offset-4 hover:underline",
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
