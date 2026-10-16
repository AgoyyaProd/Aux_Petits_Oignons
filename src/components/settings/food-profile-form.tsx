"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { saveFoodProfileAction } from "@/server/modules/households/actions";
import { EATING_STYLES, idleForm, OBJECTIVES } from "@/server/modules/households/schema";

interface Option {
  code: string;
  label: string;
}

interface Props {
  householdId: string;
  allergens: Option[];
  selectedAllergens: string[];
  equipmentOptions: Option[];
  profile: {
    style: string;
    objectives: string[];
    equipment: string[] | null;
    noPork: boolean;
  };
}

const chip =
  "border-border bg-surface has-checked:border-forest has-checked:bg-forest has-checked:text-cream relative flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent";

/**
 * Profil alimentaire du foyer : régime (un seul), sans porc, allergies, objectifs, matériel.
 * Le régime strict (pescétarien, végétarien, végétalien) et les allergies EXCLUENT des
 * recettes ; flexitarien et les objectifs ORIENTENT seulement les propositions.
 */
export function FoodProfileForm(props: Props) {
  const [state, action, pending] = useActionState(saveFoodProfileAction, idleForm);
  const equipmentUnset = props.profile.equipment === null;

  return (
    <form action={action} className="flex flex-col gap-8">
      <input type="hidden" name="householdId" value={props.householdId} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Mon régime</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {EATING_STYLES.map((s) => (
            <label
              key={s.code}
              className="border-border bg-surface has-checked:border-forest has-checked:bg-forest/5 has-focus-visible:outline-accent flex cursor-pointer items-start gap-3 rounded-2xl border p-4 has-focus-visible:outline-2"
            >
              <input
                type="radio"
                name="style"
                value={s.code}
                defaultChecked={props.profile.style === s.code}
                className="accent-forest mt-1 size-4"
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{s.label}</span>
                <span className="text-muted text-sm">{s.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <label className={`${chip} self-start`}>
          <input
            type="checkbox"
            name="noPork"
            defaultChecked={props.profile.noPork}
            className="sr-only"
          />
          Sans porc
        </label>
        <p className="text-muted text-sm">
          Pescétarien, végétarien, végétalien et sans porc excluent les recettes concernées.
          Flexitarien ne les exclut pas : il limite les plats avec viande dans les menus proposés.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Mes objectifs</legend>
        <p className="text-muted -mt-1 text-sm">
          Ils orientent les menus proposés, sans jamais exclure de recette.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {OBJECTIVES.map((o) => (
            <label
              key={o.code}
              className="border-border bg-surface has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-accent group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 has-focus-visible:outline-2"
            >
              <input
                type="checkbox"
                name="objectives"
                value={o.code}
                defaultChecked={props.profile.objectives.includes(o.code)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="border-border-strong peer-checked:border-accent-strong peer-checked:bg-accent-strong mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 text-white"
              >
                <CheckIcon size={14} strokeWidth={3} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{o.label}</span>
                <span className="text-muted text-sm">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Mon matériel</legend>
        <p className="text-muted -mt-1 text-sm">
          {equipmentUnset
            ? "Pas encore renseigné : toutes les recettes sont proposées. Décoche ce que tu n'as pas."
            : "Coche tout ce que tu as dans ta cuisine. Un ustensile décoché retire du menu toutes les recettes qui en ont besoin : sans plaques, poêle ni casserole, il ne reste presque aucun plat."}
        </p>
        <div className="flex flex-wrap gap-2">
          {props.equipmentOptions.map((e) => (
            <label key={e.code} className={chip}>
              <input
                type="checkbox"
                name="equipment"
                value={e.code}
                defaultChecked={equipmentUnset || props.profile.equipment!.includes(e.code)}
                className="sr-only"
              />
              {e.label}
            </label>
          ))}
        </div>
        <p className="text-muted text-xs">
          Le matériel nécessaire à chaque recette est déduit de ses étapes (poêle, casserole,
          cuisson au four, moule…). Un faitout remplace une casserole et un plat à gratin un plat
          allant au four. Aucune recette ne demande encore de friteuse sans huile.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Allergies</legend>
        <p className="text-muted -mt-1 text-sm">
          Toute recette contenant l&apos;un de ces allergènes est exclue, même s&apos;il est
          facultatif.
        </p>
        <div className="flex flex-wrap gap-2">
          {props.allergens.map((a) => (
            <label key={a.code} className={chip}>
              <input
                type="checkbox"
                name="allergens"
                value={a.code}
                defaultChecked={props.selectedAllergens.includes(a.code)}
                className="sr-only"
              />
              {a.label}
            </label>
          ))}
        </div>
      </fieldset>

      {state.message ? (
        <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <Button type="submit" variant="forest" disabled={pending} className="self-start">
        {pending ? "Enregistrement…" : "Enregistrer mes préférences"}
      </Button>
    </form>
  );
}
