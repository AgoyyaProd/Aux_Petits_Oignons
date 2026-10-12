"use client";

import Link from "next/link";
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
  /** Repas couverts par une cuisson (semaine type du foyer). */
  mealsPerCook?: number;
}

/** Nombre de repas, de personnes et budget -> proposition de menu. */
export function GenerateForm({
  week,
  version,
  formKey,
  defaults,
  submitLabel,
  lockedCount = 0,
  mealsPerCook = 1,
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
      <p className="text-muted text-xs">
        {mealsPerCook > 1
          ? `Un plat cuisiné couvre ${mealsPerCook} repas : ses restes sont placés aux repas suivants. `
          : "Les plats sont placés sur les repas prévus de ta semaine type. "}
        <Link href="/settings#semaine" className="text-brand font-semibold underline">
          Ma semaine de repas
        </Link>
      </p>
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
