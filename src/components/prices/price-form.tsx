"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { saveHouseholdPriceAction } from "@/server/modules/prices/actions";
import type { PriceFormState } from "@/server/modules/prices/schema";

const idle: PriceFormState = { status: "idle" };

export function PriceForm({
  householdId,
  ingredientId,
  dimension,
  refLabel,
  defaultPrice,
  defaultUrl,
}: {
  householdId: string;
  ingredientId: string;
  dimension: string;
  refLabel: string;
  defaultPrice: string;
  defaultUrl: string;
}) {
  const [state, action, pending] = useActionState(saveHouseholdPriceAction, idle);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="ingredientId" value={ingredientId} />
      <input type="hidden" name="dimension" value={dimension} />
      {state.message ? (
        <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <Field
          label={`Mon prix (€ / ${refLabel})`}
          name="price"
          inputMode="decimal"
          placeholder="2,49"
          defaultValue={defaultPrice}
          error={state.fieldErrors?.price}
        />
        <Field
          label="Lien de la fiche produit (facultatif)"
          name="sourceUrl"
          type="url"
          placeholder="https://…"
          defaultValue={defaultUrl}
          error={state.fieldErrors?.sourceUrl}
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer mon prix"}
      </Button>
    </form>
  );
}
