"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { generatePlanAction } from "@/server/modules/planning/actions";
import { idlePlanner } from "@/server/modules/planning/schema";

interface Props {
  week: string;
  version: number | null;
  formKey: string;
  defaults: { mealCount: number; people: number; budget: string };
  submitLabel: string;
  lockedCount?: number;
}

/** Nombre de repas, de personnes et budget -> proposition de menu. */
export function GenerateForm({
  week,
  version,
  formKey,
  defaults,
  submitLabel,
  lockedCount = 0,
}: Props) {
  const [state, action, pending] = useActionState(generatePlanAction, idlePlanner);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="week" value={week} />
      <input type="hidden" name="version" value={version ?? ""} />
      <input type="hidden" name="key" value={formKey} />
      {state.message ? (
        <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field
          label="Repas"
          name="mealCount"
          type="number"
          inputMode="numeric"
          min={1}
          max={21}
          defaultValue={defaults.mealCount}
          error={state.fieldErrors?.mealCount}
        />
        <Field
          label="Personnes"
          name="people"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          defaultValue={defaults.people}
          error={state.fieldErrors?.people}
        />
        <Field
          label="Budget (€)"
          name="budget"
          inputMode="decimal"
          placeholder="Sans limite"
          defaultValue={defaults.budget}
          error={state.fieldErrors?.budget}
          className="col-span-2 sm:col-span-1"
        />
      </div>
      {lockedCount > 0 ? (
        <p className="text-muted text-xs">
          {lockedCount} plat{lockedCount > 1 ? "s" : ""} gardé{lockedCount > 1 ? "s" : ""} : il
          {lockedCount > 1 ? "s restent" : " reste"} dans le nouveau menu.
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Calcul du menu…" : submitLabel}
      </Button>
    </form>
  );
}
