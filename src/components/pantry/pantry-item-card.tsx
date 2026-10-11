"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { expiryState } from "@/domain/pantry/priority";
import { UNITS } from "@/domain/units";
import { categoryLabel } from "@/lib/categories";
import { formatShortDate } from "@/lib/dates";
import { formatStockQuantity, unitsForDimension } from "@/lib/format-quantity";
import { applyMovementAction, updateDetailsAction } from "@/server/modules/pantry/actions";
import type { PantryItemView } from "@/server/modules/pantry/queries";
import { LOCATION_LABEL, LOCATIONS, type PantryFormState } from "@/server/modules/pantry/schema";

const initialState: PantryFormState = { status: "idle" };
type Mode = "consumption" | "correction" | "discard" | "details" | null;

const MODE_LABEL: Record<Exclude<Mode, null>, string> = {
  consumption: "J'en ai utilisé",
  correction: "Corriger",
  discard: "Jeter",
  details: "Détails",
};

export function PantryItemCard({
  item,
  today,
  initialKey,
}: {
  item: PantryItemView;
  today: string;
  initialKey: string;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [moveState, moveAction, movePending] = useActionState(applyMovementAction, initialState);
  const [detailsState, detailsAction, detailsPending] = useActionState(
    updateDetailsAction,
    initialState,
  );
  // Une même clé est réutilisée tant que l'action n'a pas réussi : un nouvel essai
  // après une coupure réseau est rejoué par la base au lieu d'être compté deux fois.
  const key = moveState.nextKey ?? initialKey;
  const unknown = item.quantityBase === null;
  const units = unitsForDimension(item.dimension).map((u) => ({
    value: u,
    label: UNITS[u].label,
  }));
  const lastMessage = mode === "details" ? detailsState : moveState;

  return (
    <li className="border-border bg-surface rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate font-semibold">{item.ingredientName}</p>
          <p className="text-sm">
            <span className={unknown ? "text-muted italic" : "font-medium"}>
              {formatStockQuantity(item.quantityBase, item.dimension, item.displayUnit)}
            </span>
            <span className="text-muted"> · {categoryLabel(item.category)}</span>
          </p>
        </div>
        <ExpiryBadge item={item} today={today} />
      </div>

      {lastMessage.message && mode === null ? (
        <div className="mt-3">
          <Alert tone={lastMessage.status === "success" ? "success" : "error"}>
            {lastMessage.message}
          </Alert>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Actions">
        {(Object.keys(MODE_LABEL) as Exclude<Mode, null>[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(mode === m ? null : m)}
            className={[
              "min-h-10 rounded-full border px-3.5 text-sm font-medium transition-colors",
              mode === m
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-foreground hover:border-brand",
            ].join(" ")}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      {mode === "consumption" || mode === "correction" || mode === "discard" ? (
        <form
          action={moveAction}
          className="border-border mt-3 flex flex-col gap-3 border-t pt-3"
          noValidate
        >
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="expectedVersion" value={item.version} />
          <input type="hidden" name="idempotencyKey" value={key} />
          <input type="hidden" name="kind" value={mode} />

          {moveState.message ? (
            <Alert tone={moveState.status === "success" ? "success" : "error"}>
              {moveState.message}
            </Alert>
          ) : null}

          {mode === "discard" ? (
            <p className="text-sm">
              Retirer tout le produit du stock (périmé, abîmé…). L&apos;historique est conservé.
            </p>
          ) : (
            <>
              {mode === "consumption" && unknown ? (
                <Alert tone="info">
                  Quantité inconnue : utilise « Corriger » pour indiquer ce qu&apos;il reste.
                </Alert>
              ) : null}
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,8.5rem)] items-start gap-3">
                <Field
                  label={mode === "consumption" ? "Quantité utilisée" : "Quantité restante réelle"}
                  name="quantity"
                  inputMode="decimal"
                  required
                  autoFocus
                  defaultValue={moveState.values?.quantity}
                  error={moveState.fieldErrors?.quantity}
                />
                <SelectField
                  label="Unité"
                  name="unit"
                  options={units}
                  defaultValue={moveState.values?.unit ?? item.displayUnit}
                />
              </div>
            </>
          )}
          {mode === "discard" ? <input type="hidden" name="unit" value={item.displayUnit} /> : null}

          <Button
            type="submit"
            variant={mode === "discard" ? "secondary" : "primary"}
            disabled={movePending || (mode === "consumption" && unknown)}
          >
            {movePending ? "Enregistrement…" : mode === "discard" ? "Confirmer : jeter" : "Valider"}
          </Button>
        </form>
      ) : null}

      {mode === "details" ? (
        <form
          action={detailsAction}
          className="border-border mt-3 flex flex-col gap-3 border-t pt-3"
        >
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="expectedVersion" value={item.version} />
          {detailsState.message ? (
            <Alert tone={detailsState.status === "success" ? "success" : "error"}>
              {detailsState.message}
            </Alert>
          ) : null}
          <SelectField
            label="Emplacement"
            name="location"
            options={LOCATIONS.map((value) => ({ value, label: LOCATION_LABEL[value] }))}
            defaultValue={item.location}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Date limite"
              name="expiresOn"
              type="date"
              defaultValue={item.expiresOn ?? ""}
              error={detailsState.fieldErrors?.expiresOn}
            />
            <SelectField
              label="Type de date"
              name="expiryKind"
              options={[
                { value: "use_by", label: "DLC" },
                { value: "best_before", label: "DDM" },
              ]}
              defaultValue={item.expiryKind ?? "use_by"}
            />
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="opened"
              defaultChecked={item.openedAt !== null}
              className="accent-brand size-4"
            />
            Produit entamé
          </label>
          <Button type="submit" disabled={detailsPending}>
            {detailsPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      ) : null}
    </li>
  );
}

function ExpiryBadge({ item, today }: { item: PantryItemView; today: string }) {
  const state = expiryState(item, today);
  const opened = item.openedAt !== null;
  if (state.kind === "none") {
    return opened ? <Badge tone="soon">Entamé</Badge> : null;
  }
  const date = formatShortDate(item.expiresOn!);
  if (state.kind === "expired") {
    return (
      <Badge tone={state.label === "DLC" ? "danger" : "soon"}>
        {state.label} dépassée ({date})
      </Badge>
    );
  }
  if (state.kind === "soon") {
    const when =
      state.days === 0 ? "aujourd'hui" : state.days === 1 ? "demain" : `dans ${state.days} j`;
    return (
      <Badge tone={state.label === "DLC" ? (state.days <= 1 ? "urgent" : "soon") : "neutral"}>
        {state.label} {when}
      </Badge>
    );
  }
  return (
    <Badge tone={opened ? "soon" : "neutral"}>
      {opened ? "Entamé, " : ""}
      {state.label} {date}
    </Badge>
  );
}
