"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { savePreferencesAction } from "@/server/modules/households/actions";
import { idleForm } from "@/server/modules/households/schema";

interface Option {
  code: string;
  label: string;
}

interface Props {
  householdId: string;
  diets: Option[];
  allergens: Option[];
  selectedDiets: string[];
  selectedAllergens: string[];
}

export function PreferencesForm(props: Props) {
  const [state, action, pending] = useActionState(savePreferencesAction, idleForm);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="householdId" value={props.householdId} />
      {state.message ? (
        <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <CheckboxGroup
        legend="Régimes"
        name="diets"
        options={props.diets}
        selected={props.selectedDiets}
      />
      <CheckboxGroup
        legend="Allergies"
        hint="Toute recette contenant l'un de ces allergènes sera exclue, y compris les suggestions."
        name="allergens"
        options={props.allergens}
        selected={props.selectedAllergens}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer les préférences"}
      </Button>
    </form>
  );
}

function CheckboxGroup({
  legend,
  hint,
  name,
  options,
  selected,
}: {
  legend: string;
  hint?: string;
  name: string;
  options: Option[];
  selected: string[];
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      {hint ? <p className="text-muted -mt-1 mb-1 text-xs">{hint}</p> : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.code}
            className="border-border bg-surface has-checked:border-brand has-checked:bg-brand-soft flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 text-sm"
          >
            <input
              type="checkbox"
              name={name}
              value={option.code}
              defaultChecked={selected.includes(option.code)}
              className="accent-brand size-4"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
