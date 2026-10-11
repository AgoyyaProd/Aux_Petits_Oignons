"use client";

import { useOptimistic, useTransition } from "react";
import { HeartIcon } from "@/components/ui/icons";
import { rateRecipeAction } from "@/server/modules/recipes/ratings-actions";

/** Cœur « enregistrer » sur une carte de recette (favori du foyer). */
export function FavoriteButton({
  recipeId,
  title,
  favorite,
  bordered = false,
}: {
  recipeId: string;
  title: string;
  favorite: boolean;
  /** Avec contour (sur fond clair, hors visuel). */
  bordered?: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(favorite);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      aria-label={optimistic ? `Retirer ${title} des favoris` : `Ajouter ${title} aux favoris`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          const form = new FormData();
          form.set("recipeId", recipeId);
          form.set("rating", optimistic ? "0" : "1");
          await rateRecipeAction(form);
        })
      }
      className={[
        "flex size-11 items-center justify-center rounded-full transition-colors",
        optimistic
          ? "bg-accent-strong text-white"
          : bordered
            ? "border-border-strong bg-surface text-foreground hover:border-forest border"
            : "bg-surface/90 text-foreground hover:bg-surface backdrop-blur",
      ].join(" ")}
    >
      <HeartIcon size={20} filled={optimistic} />
    </button>
  );
}
