"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cookAction, cookOffMenuAction, type CookState } from "@/server/modules/cooking/actions";

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

/**
 * « J'ai cuisiné ce plat » pour une recette qui n'est pas au menu : on choisit le nombre de
 * portions, puis les ingrédients sont retirés du garde-manger après confirmation.
 */
export function CookOffMenuButton({
  recipeId,
  defaultServings,
  formKey,
}: {
  recipeId: string;
  defaultServings: number;
  formKey: string;
}) {
  const [state, action, pending] = useActionState(cookOffMenuAction, idle);
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

  if (!confirming && state.status !== "error") {
    return (
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        J&apos;ai cuisiné ce plat (hors menu)
      </Button>
    );
  }

  return (
    <form
      action={action}
      className="border-accent/40 bg-accent-soft flex flex-col gap-3 rounded-2xl border p-4"
    >
      <input type="hidden" name="recipeId" value={recipeId} />
      <input type="hidden" name="key" value={formKey} />
      <p className="text-sm leading-relaxed">
        Ce plat n&apos;est pas au menu. Combien de portions as-tu préparées ? Leurs ingrédients
        seront retirés de ton garde-manger (les produits du placard ne sont pas décomptés).
      </p>
      <label className="flex items-center gap-3 text-sm font-medium">
        Portions
        <input
          type="number"
          name="servings"
          min={1}
          max={40}
          step={1}
          required
          defaultValue={defaultServings}
          className="bg-surface border-border focus-visible:ring-brand min-h-10 w-20 rounded-lg border px-3 text-base outline-none focus-visible:ring-2"
        />
      </label>
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
