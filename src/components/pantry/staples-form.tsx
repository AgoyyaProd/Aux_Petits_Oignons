"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { StapleGroup } from "@/server/modules/pantry/staples";
import { saveStaplesAction, type StaplesState } from "@/server/modules/pantry/staples-actions";

const idle: StaplesState = { status: "idle" };

export function StaplesForm({
  householdId,
  groups,
}: {
  householdId: string;
  groups: StapleGroup[];
}) {
  const [state, action, pending] = useActionState(saveStaplesAction, idle);
  const [count, setCount] = useState(
    groups.reduce((n, g) => n + g.items.filter((i) => i.checked).length, 0),
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-5"
      onChange={(e) =>
        setCount(e.currentTarget.querySelectorAll('input[name="staples"]:checked').length)
      }
    >
      <input type="hidden" name="householdId" value={householdId} />
      {groups.map((group) => (
        <fieldset key={group.label} className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">{group.label}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.items.map((item) => (
              <label
                key={item.id}
                className="border-border bg-surface has-checked:border-brand has-checked:bg-brand-soft flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm"
              >
                <input
                  type="checkbox"
                  name="staples"
                  value={item.id}
                  defaultChecked={item.checked}
                  className="accent-brand size-4 shrink-0"
                />
                <span className="min-w-0">{item.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="bg-background/95 sticky bottom-16 flex flex-col gap-2 py-2 md:bottom-0">
        {state.message ? (
          <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : `Enregistrer mon placard (${count})`}
        </Button>
      </div>
    </form>
  );
}
