"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { centsToInput } from "@/domain/money";
import { saveHouseholdSettingsAction } from "@/server/modules/households/actions";
import type { FormState, SettingsFieldName } from "@/server/modules/households/schema";

const initialState: FormState<SettingsFieldName> = { status: "idle" };

interface Props {
  household: {
    id: string;
    name: string;
    people_count: number;
    weekly_budget_cents: number | null;
    max_prep_minutes: number | null;
  };
  isOwner: boolean;
}

export function HouseholdForm({ household, isOwner }: Props) {
  const [state, action, pending] = useActionState(saveHouseholdSettingsAction, initialState);
  const disabled = !isOwner || pending;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="householdId" value={household.id} />
      {!isOwner ? (
        <Alert tone="info">Seul le propriétaire du foyer peut modifier ces réglages.</Alert>
      ) : null}
      {state.message ? (
        <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <Field
        label="Nom du foyer"
        name="name"
        defaultValue={household.name}
        disabled={!isOwner}
        required
        error={state.fieldErrors?.name}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Personnes"
          name="peopleCount"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          defaultValue={household.people_count}
          disabled={!isOwner}
          error={state.fieldErrors?.peopleCount}
        />
        <Field
          label="Budget / semaine (€)"
          name="weeklyBudget"
          inputMode="decimal"
          placeholder="Facultatif"
          defaultValue={centsToInput(household.weekly_budget_cents)}
          disabled={!isOwner}
          error={state.fieldErrors?.weeklyBudget}
        />
      </div>
      <Field
        label="Temps de préparation maximum (minutes)"
        name="maxPrepMinutes"
        type="number"
        inputMode="numeric"
        min={5}
        max={600}
        placeholder="Facultatif"
        defaultValue={household.max_prep_minutes ?? ""}
        disabled={!isOwner}
        hint="Temps de travail en cuisine, hors cuisson et attente (levée, marinade). Les recettes plus longues ne sont pas proposées."
        error={state.fieldErrors?.maxPrepMinutes}
      />
      {isOwner ? (
        <Button type="submit" disabled={disabled}>
          {pending ? "Enregistrement…" : "Enregistrer le foyer"}
        </Button>
      ) : null}
    </form>
  );
}
