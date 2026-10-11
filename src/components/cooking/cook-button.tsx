"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cookAction, type CookState } from "@/server/modules/cooking/actions";

const idle: CookState = { status: "idle" };

/** « Cuisiné » : retire les ingrédients du plat du garde-manger (une seule fois). */
export function CookButton({
  week,
  recipeId,
  servings,
  formKey,
}: {
  week: string;
  recipeId: string;
  servings: number;
  formKey: string;
}) {
  const [state, action, pending] = useActionState(cookAction, idle);
  const [confirming, setConfirming] = useState(false);

  if (state.status === "success") {
    return (
      <Alert tone="success">
        {state.message}
        {state.missing?.length ? (
          <span className="mt-1 block text-xs">
            Pas trouvé en stock (rien retiré) : {state.missing.join(", ")}.
          </span>
        ) : null}
      </Alert>
    );
  }

  // Deux temps : le stock n'est décompté qu'après confirmation explicite.
  if (!confirming && state.status !== "error") {
    return (
      <Button variant="accent" onClick={() => setConfirming(true)}>
        J&apos;ai cuisiné ce plat
      </Button>
    );
  }

  return (
    <form
      action={action}
      className="border-accent/40 bg-accent-soft flex flex-col gap-3 rounded-2xl border p-4"
    >
      <input type="hidden" name="week" value={week} />
      <input type="hidden" name="recipeId" value={recipeId} />
      <input type="hidden" name="key" value={formKey} />
      <p className="text-sm leading-relaxed">
        Retirer les ingrédients de ce plat ({servings} portion{servings > 1 ? "s" : ""}) de ton
        garde-manger ? Les produits du placard (épices, huile…) ne sont pas décomptés.
      </p>
      {state.status === "error" ? <Alert tone="error">{state.message}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Mise à jour du garde-manger…" : "Confirmer et retirer du stock"}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
