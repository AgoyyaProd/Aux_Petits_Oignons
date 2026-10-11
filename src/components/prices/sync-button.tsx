"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { runPriceSyncAction, type SyncState } from "@/server/modules/prices/actions";

const idle: SyncState = { status: "idle" };

export function SyncButton() {
  const [state, action, pending] = useActionState(runPriceSyncAction, idle);
  return (
    <form action={action} className="flex flex-col gap-3">
      {state.message ? (
        <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Mise à jour en cours (jusqu'à 1 minute)…" : "Mettre à jour les prix indicatifs"}
      </Button>
    </form>
  );
}
