"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UNITS, type UnitCode } from "@/domain/units";
import { unitsForDimension } from "@/lib/format-quantity";
import { putAwayAction, type PutAwayState } from "@/server/modules/shopping/actions";

export interface PutAwayLine {
  ingredientId: string;
  name: string;
  dimension: "mass" | "volume" | "count";
  value: string;
  unit: UnitCode;
  location: "pantry" | "fridge" | "freezer";
  include: boolean;
}

const idle: PutAwayState = { status: "idle" };
const LOCATIONS = [
  { value: "fridge", label: "Frigo" },
  { value: "pantry", label: "Placard" },
  { value: "freezer", label: "Congélateur" },
];
const input =
  "bg-surface border-border min-h-10 w-full min-w-0 rounded-lg border px-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function PutAwayForm({
  week,
  formKey,
  lines,
}: {
  week: string;
  formKey: string;
  lines: PutAwayLine[];
}) {
  const [state, action, pending] = useActionState(putAwayAction, idle);
  const invalid = new Set(state.invalid ?? []);

  if (state.status === "success") {
    return <Alert tone="success">{state.message} Retrouve-les dans ton garde-manger.</Alert>;
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="week" value={week} />
      <input type="hidden" name="key" value={formKey} />
      <input type="hidden" name="count" value={lines.length} />
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <ul className="flex flex-col gap-3">
        {lines.map((line, i) => (
          <li
            key={`${line.ingredientId}|${line.dimension}`}
            className={`bg-surface flex flex-col gap-3 rounded-2xl border p-3 ${invalid.has(i) ? "border-danger" : "border-border"}`}
          >
            <input type="hidden" name={`ingredientId-${i}`} value={line.ingredientId} />
            <label className="flex items-center gap-3 font-medium">
              <input
                type="checkbox"
                name={`include-${i}`}
                defaultChecked={line.include}
                className="accent-brand size-5"
              />
              {line.name}
            </label>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,6rem)_minmax(0,8rem)] gap-2">
              <input
                name={`quantity-${i}`}
                defaultValue={line.value}
                inputMode="decimal"
                aria-label={`Quantité achetée de ${line.name}`}
                className={input}
              />
              <select
                name={`unit-${i}`}
                defaultValue={line.unit}
                aria-label="Unité"
                className={input}
              >
                {unitsForDimension(line.dimension).map((u) => (
                  <option key={u} value={u}>
                    {UNITS[u].label}
                  </option>
                ))}
              </select>
              <select
                name={`location-${i}`}
                defaultValue={line.location}
                aria-label="Emplacement"
                className={input}
              >
                {LOCATIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,8rem)] gap-2">
              <input
                type="date"
                name={`expiresOn-${i}`}
                aria-label={`Date limite de ${line.name} (facultatif)`}
                className={input}
              />
              <select
                name={`expiryKind-${i}`}
                defaultValue="use_by"
                aria-label="Type de date"
                className={input}
              >
                <option value="use_by">DLC</option>
                <option value="best_before">DDM</option>
              </select>
            </div>
          </li>
        ))}
      </ul>
      <div className="bg-background/95 sticky bottom-16 py-2 md:bottom-0">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Rangement…" : "Ranger au garde-manger"}
        </Button>
      </div>
    </form>
  );
}
