"use client";

import { useActionState } from "react";
import { CalendarIcon, CheckIcon } from "@/components/ui/icons";
import { buttonClasses, type ButtonVariant } from "@/components/ui/button";
import { addRecipeToPlanAction } from "@/server/modules/planning/actions";
import { idlePlanner } from "@/server/modules/planning/schema";

/** « Ajouter au menu » : place la recette sur la première case libre de la semaine. */
export function AddToMenuButton({
  recipeId,
  variant = "secondary",
  compact = false,
}: {
  recipeId: string;
  variant?: ButtonVariant;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(addRecipeToPlanAction, idlePlanner);
  const done = state.status === "success";
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
