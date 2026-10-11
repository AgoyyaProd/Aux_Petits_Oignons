"use client";

import { useActionState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { BasketIcon, CheckIcon } from "@/components/ui/icons";
import { addExtraAction, type ExtraState } from "@/server/modules/shopping/actions";

const idle: ExtraState = { status: "idle" };

/** « Ajouter à ma liste » pour un ingrédient (ajout manuel, une fois par semaine). */
export function AddExtraButton({ ingredientId, label }: { ingredientId: string; label: string }) {
  const [state, action, pending] = useActionState(addExtraAction, idle);
  const done = state.status === "success";
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="ingredientId" value={ingredientId} />
      <input type="hidden" name="label" value={label} />
      <button type="submit" disabled={pending || done} className={buttonClasses("primary")}>
        {done ? <CheckIcon size={18} /> : <BasketIcon size={18} />}
        {done ? "Sur ma liste" : "Ajouter à ma liste"}
      </button>
      <span aria-live="polite" className="text-muted text-xs">
        {state.message ?? ""}
      </span>
    </form>
  );
}
