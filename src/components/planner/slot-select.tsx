"use client";

import { useActionState, useRef } from "react";
import { setSlotAction } from "@/server/modules/planning/actions";
import { idlePlanner } from "@/server/modules/planning/schema";

interface Props {
  week: string;
  version: string;
  formKey: string;
  position: number;
  value: string;
  title: string;
  options: { value: string; label: string; taken: string | null }[];
}

/** Choix du jour et du repas d'un plat ; enregistré dès qu'on change la valeur. */
export function SlotSelect({ week, version, formKey, position, value, title, options }: Props) {
  const [state, action, pending] = useActionState(setSlotAction, idlePlanner);
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className="flex flex-col gap-1">
      <input type="hidden" name="week" value={week} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="key" value={formKey} />
      <input type="hidden" name="position" value={position} />
      <select
        name="slot"
        defaultValue={value}
        disabled={pending}
        aria-label={`Déplacer ${title}`}
        onChange={() => form.current?.requestSubmit()}
        className="border-border bg-surface min-h-11 w-full rounded-lg border px-3 text-sm disabled:opacity-60"
      >
        <option value="">Pas encore placé</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
            {o.taken && o.value !== value ? ` (échanger avec ${o.taken})` : ""}
          </option>
        ))}
      </select>
      {state.status === "error" && state.message ? (
        <span role="alert" className="text-danger text-xs">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
