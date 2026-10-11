"use client";

import { useActionState } from "react";
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

  return (
    <form
      action={action}
      className="border-brand bg-brand-soft flex flex-col gap-3 rounded-2xl border p-4"
    >
      <input type="hidden" name="week" value={week} />
      <input type="hidden" name="recipeId" value={recipeId} />
      <input type="hidden" name="key" value={formKey} />
      <p className="text-sm">
        Ce plat est au menu ({servings} portion{servings > 1 ? "s" : ""}). Une fois préparé, ses
        ingrédients sont retirés de ton garde-manger (les produits du placard ne sont pas
        décomptés).
      </p>
      {state.status === "error" ? <Alert tone="error">{state.message}</Alert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Mise à jour du garde-manger…" : "Cuisiné"}
      </Button>
    </form>
  );
}
