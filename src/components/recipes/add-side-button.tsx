"use client";

import { useActionState } from "react";
import { buttonClasses, type ButtonVariant } from "@/components/ui/button";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import { idlePlanner } from "@/server/modules/planning/schema";
import { addSideAction } from "@/server/modules/planning/sides-actions";

/**
 * « Ajouter à côté » : la recette (pain, brioche, gâteau…) rejoint la semaine en plus des
 * repas, avec son nombre de parts ; ses ingrédients iront sur la liste de courses.
 */
export function AddSideButton({
  recipeId,
  formKey,
  variant = "secondary",
}: {
  recipeId: string;
  formKey: string;
  variant?: ButtonVariant;
}) {
  const [state, action, pending] = useActionState(addSideAction, idlePlanner);
  const done = state.status === "success";
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="recipeId" value={recipeId} />
      <input type="hidden" name="key" value={formKey} />
      <button type="submit" disabled={pending || done} className={buttonClasses(variant)}>
        {done ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
        {pending ? "Ajout…" : done ? "Ajouté à côté" : "Ajouter à côté"}
      </button>
      <span
        aria-live="polite"
        className={`max-w-56 text-xs ${state.status === "error" ? "text-danger" : "text-muted"}`}
      >
        {state.message ?? ""}
      </span>
    </form>
  );
}
