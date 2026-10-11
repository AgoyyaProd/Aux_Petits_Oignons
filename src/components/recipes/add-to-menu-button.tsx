"use client";

import { useActionState } from "react";
import { ArrowRightIcon, CalendarIcon, CheckIcon } from "@/components/ui/icons";
import { buttonClasses, type ButtonVariant } from "@/components/ui/button";
import { addRecipeToPlanAction } from "@/server/modules/planning/actions";
import { idlePlanner } from "@/server/modules/planning/schema";

/** « Ajouter au menu » : place la recette sur la première case libre de la semaine. */
export function AddToMenuButton({
  recipeId,
  variant = "secondary",
  compact = false,
  iconOnly = false,
}: {
  recipeId: string;
  variant?: ButtonVariant;
  compact?: boolean;
  /** Bouton rond avec icône seule (cartes de recette). */
  iconOnly?: boolean;
}) {
  const [state, action, pending] = useActionState(addRecipeToPlanAction, idlePlanner);
  const done = state.status === "success";
  if (iconOnly) {
    return (
      <form action={action}>
        <input type="hidden" name="recipeId" value={recipeId} />
        <button
          type="submit"
          disabled={pending}
          aria-label={done ? "Ajouté au menu" : "Ajouter au menu de la semaine"}
          title={state.message ?? "Ajouter au menu de la semaine"}
          className={[
            "relative z-10 flex size-10 items-center justify-center rounded-full border transition-colors",
            done
              ? "bg-leaf-soft text-success border-transparent"
              : "border-border-strong bg-surface hover:border-forest",
          ].join(" ")}
        >
          {done ? <CheckIcon size={18} /> : <CalendarIcon size={18} />}
        </button>
      </form>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="recipeId" value={recipeId} />
      <button
        type="submit"
        disabled={pending}
        className={buttonClasses(variant, compact ? "min-h-10 px-4" : "")}
      >
        {done ? <CheckIcon size={18} /> : <CalendarIcon size={18} />}
        {pending ? "Ajout…" : done ? "Au menu" : "Ajouter au menu"}
        {!done && !pending && variant === "primary" ? <ArrowRightIcon size={18} /> : null}
      </button>
      <span
        aria-live="polite"
        className={`text-xs ${state.status === "error" ? "text-danger" : "text-muted"}`}
      >
        {state.message ?? ""}
      </span>
    </form>
  );
}
