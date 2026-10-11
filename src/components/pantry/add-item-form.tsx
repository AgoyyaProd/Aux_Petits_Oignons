"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { UNITS, type UnitCode } from "@/domain/units";
import { addPantryItemAction } from "@/server/modules/pantry/actions";
import { LOCATION_LABEL, LOCATIONS, type PantryFormState } from "@/server/modules/pantry/schema";

const initialState: PantryFormState = { status: "idle" };

const UNIT_OPTIONS = (Object.keys(UNITS) as UnitCode[]).map((code) => ({
  value: code,
  label: UNITS[code].label,
}));
const LOCATION_OPTIONS = LOCATIONS.map((value) => ({ value, label: LOCATION_LABEL[value] }));
const EXPIRY_OPTIONS = [
  { value: "use_by", label: "DLC (à consommer jusqu'au)" },
  { value: "best_before", label: "DDM (de préférence avant)" },
];

export function AddItemForm({
  householdId,
  ingredientNames,
  initialKey,
}: {
  householdId: string;
  ingredientNames: string[];
  initialKey: string;
}) {
  const [state, action, pending] = useActionState(addPantryItemAction, initialState);
  const key = state.nextKey ?? initialKey;
  const v = state.values ?? {};

  return (
    // key : un nouveau formulaire vierge après chaque ajout réussi, pour enchaîner les saisies.
    <form key={key} action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="idempotencyKey" value={key} />

      {state.message ? (
        <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <Field
        label="Ingrédient"
        name="ingredient"
        list="ingredient-names"
        autoComplete="off"
        placeholder="Ex. riz, lait, carottes…"
        required
        defaultValue={v.ingredient}
        error={state.fieldErrors?.ingredient}
      />
      <datalist id="ingredient-names">
        {ingredientNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <SelectField
        label="Emplacement"
        name="location"
        options={LOCATION_OPTIONS}
        defaultValue={v.location ?? "fridge"}
        error={state.fieldErrors?.location}
      />

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,8.5rem)] items-start gap-3">
        <Field
          label="Quantité"
          name="quantity"
          inputMode="decimal"
          placeholder="Inconnue"
          hint="Laisse vide si tu ne sais pas : le produit ne sera pas compté."
          defaultValue={v.quantity}
          error={state.fieldErrors?.quantity}
        />
        <SelectField
          label="Unité"
          name="unit"
          options={UNIT_OPTIONS}
          defaultValue={v.unit ?? "g"}
          error={state.fieldErrors?.unit}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="Date limite"
          name="expiresOn"
          type="date"
          defaultValue={v.expiresOn}
          error={state.fieldErrors?.expiresOn}
        />
        <SelectField
          label="Type de date"
          name="expiryKind"
          options={EXPIRY_OPTIONS}
          defaultValue={v.expiryKind ?? "use_by"}
        />
      </div>

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="opened"
          defaultChecked={v.opened === "on"}
          className="accent-brand size-4"
        />
        Produit déjà entamé
      </label>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" disabled={pending} className="sm:flex-1">
          {pending ? "Ajout…" : "Ajouter au garde-manger"}
        </Button>
        <Link href="/pantry" className={buttonClasses("secondary", "sm:flex-1")}>
          Terminé
        </Link>
      </div>
    </form>
  );
}
