"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { addAvoidedFoodAction, removeAvoidedFoodAction } from "@/server/modules/households/actions";
import type { FormState } from "@/server/modules/households/schema";

const initialState: FormState<"ingredient"> = { status: "idle" };

interface Props {
  householdId: string;
  avoidedFoods: { id: string; name: string }[];
  ingredientNames: string[];
}

export function AvoidedFoodsForm({ householdId, avoidedFoods, ingredientNames }: Props) {
  const [state, action, pending] = useActionState(addAvoidedFoodAction, initialState);
  const already = new Set(avoidedFoods.map((f) => f.name));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm">
        Les recettes où l&apos;un de ces aliments est indispensable sont masquées. S&apos;il
        n&apos;est que facultatif, la recette reste proposée et on te signale de le laisser de côté.
      </p>

      {avoidedFoods.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Aliments non souhaités">
          {avoidedFoods.map((food) => (
            <li key={food.id}>
              <form
                action={removeAvoidedFoodAction}
                className="bg-brand-soft text-brand flex items-center gap-1 rounded-full py-1 pr-1 pl-3 text-sm font-medium"
              >
                <input type="hidden" name="householdId" value={householdId} />
                <input type="hidden" name="ingredientId" value={food.id} />
                {food.name}
                <RemoveButton name={food.name} />
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted text-sm italic">Aucun aliment pour l&apos;instant.</p>
      )}

      <form action={action} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="householdId" value={householdId} />
        {state.message ? (
          <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
        ) : null}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <Field
            label="Ajouter un aliment"
            name="ingredient"
            list="avoided-ingredient-names"
            autoComplete="off"
            placeholder="Ex. champignons, coriandre…"
            error={state.fieldErrors?.ingredient}
          />
          <Button type="submit" variant="secondary" disabled={pending} className="mt-[1.625rem]">
            {pending ? "Ajout…" : "Ajouter"}
          </Button>
        </div>
        <datalist id="avoided-ingredient-names">
          {ingredientNames
            .filter((name) => !already.has(name))
            .map((name) => (
              <option key={name} value={name} />
            ))}
        </datalist>
      </form>
    </div>
  );
}

function RemoveButton({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Retirer ${name}`}
      className="hover:bg-brand flex size-7 items-center justify-center rounded-full transition hover:text-white disabled:opacity-50"
    >
      ×
    </button>
  );
}
