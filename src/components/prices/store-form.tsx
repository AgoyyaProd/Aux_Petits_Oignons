"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { saveReferenceStoreAction } from "@/server/modules/prices/actions";
import { STORES, type PriceFormState } from "@/server/modules/prices/schema";

const idle: PriceFormState = { status: "idle" };
const OPTIONS = [{ value: "", label: "Aucun" }, ...STORES.map((s) => ({ value: s, label: s }))];

export function StoreForm({ householdId, store }: { householdId: string; store: string | null }) {
  const [state, action, pending] = useActionState(saveReferenceStoreAction, idle);
  const options =
    store && !STORES.includes(store as (typeof STORES)[number])
      ? [...OPTIONS, { value: store, label: store }]
      : OPTIONS;
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="householdId" value={householdId} />
      {state.message ? (
        <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <SelectField
          label="Magasin de référence"
          name="store"
          options={options}
          defaultValue={store ?? ""}
        />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
