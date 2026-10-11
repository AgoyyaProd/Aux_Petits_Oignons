"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { magicLinkAction, signInAction } from "@/server/modules/auth/actions";
import { idleState } from "@/server/modules/auth/schema";

export function SignInForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [pwState, pwAction, pwPending] = useActionState(signInAction, idleState);
  const [mlState, mlAction, mlPending] = useActionState(magicLinkAction, idleState);

  if (mode === "magic") {
    return (
      <form action={mlAction} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        {mlState.message ? (
          <Alert tone={mlState.status === "success" ? "success" : "error"}>{mlState.message}</Alert>
        ) : null}
        <Field
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={mlState.values?.email}
          error={mlState.fieldErrors?.email}
        />
        <Button type="submit" disabled={mlPending}>
          {mlPending ? "Envoi…" : "Recevoir un lien de connexion"}
        </Button>
        <Button variant="ghost" onClick={() => setMode("password")}>
          Utiliser mon mot de passe
        </Button>
      </form>
    );
  }

  return (
    <form action={pwAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      {pwState.message ? <Alert tone="error">{pwState.message}</Alert> : null}
      <Field
        label="Adresse e-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={pwState.values?.email}
        error={pwState.fieldErrors?.email}
      />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={pwState.fieldErrors?.password}
      />
      <Button type="submit" disabled={pwPending}>
        {pwPending ? "Connexion…" : "Se connecter"}
      </Button>
      <Button variant="ghost" onClick={() => setMode("magic")}>
        Recevoir un lien par e-mail
      </Button>
    </form>
  );
}
