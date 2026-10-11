"use client";

import { useActionState, type ReactNode } from "react";
import type { PlannerState } from "@/server/modules/planning/schema";
import { idlePlanner } from "@/server/modules/planning/schema";

type Action = (prev: PlannerState, formData: FormData) => Promise<PlannerState>;

/**
 * Petit formulaire d'action sur le menu (garder, retirer, portions, ajouter).
 * Les champs cachés portent la semaine, la version lue et une clé d'idempotence.
 */
export function PlanActionButton({
  action,
  fields,
  label,
  children,
  className,
  pendingLabel,
}: {
  action: Action;
  fields: Record<string, string | number>;
  label: string;
  children: ReactNode;
  className: string;
  pendingLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, idlePlanner);
  return (
    <form action={formAction} className="contents">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        aria-label={label}
        title={state.status === "error" ? state.message : label}
        disabled={pending}
        className={`${className} ${state.status === "error" ? "ring-danger ring-2" : ""}`}
      >
        {pending && pendingLabel ? pendingLabel : children}
      </button>
      {state.status === "error" && state.message ? (
        <span role="alert" className="text-danger basis-full text-xs">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
