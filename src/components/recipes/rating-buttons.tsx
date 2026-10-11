"use client";

import { useOptimistic, useTransition } from "react";
import { rateRecipeAction } from "@/server/modules/recipes/ratings-actions";

type Rating = 1 | -1 | null;

/** « On aime » / « Pas pour nous » : avis partagé par le foyer, appliqué au générateur. */
export function RatingButtons({ recipeId, rating }: { recipeId: string; rating: Rating }) {
  const [optimistic, setOptimistic] = useOptimistic<Rating, Rating>(rating, (_, next) => next);
  const [pending, startTransition] = useTransition();

  const send = (next: Rating) =>
    startTransition(async () => {
      setOptimistic(next);
      const form = new FormData();
      form.set("recipeId", recipeId);
      form.set("rating", next === null ? "0" : String(next));
      await rateRecipeAction(form);
    });

  const base =
    "inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition disabled:opacity-60";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Avis du foyer">
        <button
          type="button"
          aria-pressed={optimistic === 1}
          disabled={pending}
          onClick={() => send(optimistic === 1 ? null : 1)}
          className={`${base} ${
            optimistic === 1
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border bg-surface hover:bg-brand-soft"
          }`}
        >
          <span aria-hidden="true">{optimistic === 1 ? "♥" : "♡"}</span> On aime
        </button>
        <button
          type="button"
          aria-pressed={optimistic === -1}
          disabled={pending}
          onClick={() => send(optimistic === -1 ? null : -1)}
          className={`${base} ${
            optimistic === -1
              ? "border-danger bg-danger-soft text-danger"
              : "border-border bg-surface hover:bg-brand-soft"
          }`}
        >
          Pas pour nous
        </button>
      </div>
      <p className="text-muted text-xs">
        {optimistic === 1
          ? "Favori du foyer : proposé plus souvent dans les menus."
          : optimistic === -1
            ? "Ce plat ne sera plus proposé dans les menus."
            : "Ton avis aide à composer les prochains menus."}
      </p>
    </div>
  );
}
