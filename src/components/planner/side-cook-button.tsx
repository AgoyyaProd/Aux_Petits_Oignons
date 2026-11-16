"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { cookSideAction, type CookState } from "@/server/modules/cooking/actions";

const idle: CookState = { status: "idle" };

/**
 * « C'est prêt » pour une recette « à côté » : retire ses ingrédients du garde-manger, après
 * confirmation (une seule fois).
 */
export function SideCookButton({
  sideId,
  servings,
  formKey,
}: {
  sideId: string;
  servings: number;
  formKey: string;
}) {
  const [state, action, pending] = useActionState(cookSideAction, idle);
  const [confirming, setConfirming] = useState(false);

  if (state.status === "success") {
    return (
      <p role="status" className="text-success text-xs font-medium">
        {state.message}
        {state.missing?.length ? (
          <span className="text-muted block font-normal">
            Pas trouvé en stock (rien retiré) : {state.missing.join(", ")}.
          </span>
        ) : null}
      </p>
    );
  }

  if (!confirming && state.status !== "error") {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-brand inline-flex min-h-8 items-center gap-1 text-xs font-semibold hover:underline"
      >
        <CheckIcon size={13} /> C&apos;est prêt
      </button>
    );
  }

  return (
    <form action={action} className="bg-accent-soft flex w-full flex-col gap-2 rounded-xl p-3">
      <input type="hidden" name="sideId" value={sideId} />
      <input type="hidden" name="key" value={formKey} />
      <p className="text-xs leading-relaxed">
        Retirer les ingrédients ({servings} part{servings > 1 ? "s" : ""}) du garde-manger ? Le
        placard (épices, huile…) n&apos;est pas décompté.
      </p>
      {state.status === "error" ? (
        <p role="alert" className="text-danger text-xs font-medium">
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="accent" className="min-h-9 px-3 text-sm" disabled={pending}>
          {pending ? "Mise à jour…" : "Confirmer"}
        </Button>
        <Button
          variant="ghost"
          className="min-h-9 px-3 text-sm"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
