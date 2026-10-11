"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { signUpAction } from "@/server/modules/auth/actions";
import { idleState } from "@/server/modules/auth/schema";

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, idleState);

  if (state.status === "success") {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <Field
        label="Prénom ou pseudo"
        name="displayName"
        autoComplete="given-name"
        hint="Facultatif. Visible par les membres de ton foyer."
        defaultValue={state.values?.displayName}
        error={state.fieldErrors?.displayName}
      />
      <Field
        label="Adresse e-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Field
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="8 caractères minimum, avec au moins une lettre et un chiffre."
        error={state.fieldErrors?.password}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
    </form>
  );
}
