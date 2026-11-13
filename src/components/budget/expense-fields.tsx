"use client";

import { useId } from "react";
import { Field } from "@/components/ui/field";

/** Enseignes proposées à la saisie (texte libre accepté). */
const STORES = [
  "Leclerc",
  "Super U",
  "Carrefour",
  "Intermarché",
  "Auchan",
  "Lidl",
  "Aldi",
  "Monoprix",
  "Marché",
];

/**
 * Champs d'une dépense : total payé, part non alimentaire, magasin, et la date quand elle
 * n'est pas celle du jour (page Budget). Montants saisis en euros, lus en centimes côté serveur.
 */
export function ExpenseFields({
  amount = "",
  nonFood = "",
  store = "",
  spentOn,
  maxDate,
  error,
  amountLabel = "Total payé (€)",
}: {
  amount?: string;
  nonFood?: string;
  store?: string;
  /** Date de la dépense ; sans valeur, le champ n'est pas affiché (aujourd'hui). */
  spentOn?: string;
  maxDate?: string;
  error?: { field?: "amount" | "nonFood" | "spentOn" | "store"; message?: string };
  amountLabel?: string;
}) {
  const list = useId();
  const err = (f: string) => (error?.field === f ? error.message : undefined);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field
        label={amountLabel}
        name="amount"
        inputMode="decimal"
        placeholder="Ex. 39,85"
        defaultValue={amount}
        error={err("amount")}
        autoComplete="off"
      />
      <Field
        label="Dont non alimentaire (€)"
        name="nonFood"
        inputMode="decimal"
        placeholder="Facultatif"
        defaultValue={nonFood}
        hint="Lessive, hygiène… : retiré avant de comparer au budget."
        error={err("nonFood")}
        autoComplete="off"
      />
      <Field
        label="Magasin"
        name="store"
        list={list}
        placeholder="Facultatif"
        defaultValue={store}
        error={err("store")}
        autoComplete="off"
      />
      <datalist id={list}>
        {STORES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {spentOn !== undefined ? (
        <Field
          label="Date"
          name="spentOn"
          type="date"
          defaultValue={spentOn}
          max={maxDate}
          error={err("spentOn")}
        />
      ) : null}
    </div>
  );
}
