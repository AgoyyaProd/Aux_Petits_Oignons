"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { acceptInvitationAction } from "@/server/modules/households/members-actions";
import type { FormState } from "@/server/modules/households/schema";

const idle: FormState = { status: "idle" };

export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvitationAction, idle);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Un instant…" : "Rejoindre le foyer"}
      </Button>
    </form>
  );
}
