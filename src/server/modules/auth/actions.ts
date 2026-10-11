"use server";

import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { safeRedirectPath } from "@/lib/routes";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  magicLinkSchema,
  signInSchema,
  signUpSchema,
  toFieldErrors,
  type AuthFormState,
} from "./schema";

/** Messages volontairement génériques : ne pas révéler si un compte existe. */
const GENERIC_SIGNIN_ERROR = "E-mail ou mot de passe incorrect.";

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Confirme d'abord ton adresse e-mail (lien reçu à l'inscription)."
        : GENERIC_SIGNIN_ERROR;
    return { status: "error", message, values };
  }

  redirect(safeRedirectPath(parsed.data.next));
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  const values = {
    email: String(formData.get("email") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
  };
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: parsed.data.displayName ? { display_name: parsed.data.displayName } : {},
      emailRedirectTo: `${publicEnv().NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    const message =
      error.code === "weak_password"
        ? "Mot de passe trop faible : 8 caractères minimum, avec lettres et chiffres."
        : "Inscription impossible pour le moment. Réessaie dans quelques instants.";
    return { status: "error", message, values };
  }

  // Confirmation d'e-mail activée : pas encore de session.
  if (!data.session) {
    return {
      status: "success",
      message: "Compte créé. Clique sur le lien reçu par e-mail pour l'activer.",
    };
  }
  redirect("/dashboard");
}

export async function magicLinkAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = magicLinkSchema.safeParse(Object.fromEntries(formData));
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error), values };
  }

  const next = safeRedirectPath(parsed.data.next);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      // Pas de création de compte implicite par lien magique.
      shouldCreateUser: false,
      emailRedirectTo: `${publicEnv().NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  // Même réponse que le compte existe ou non (pas d'énumération d'adresses).
  if (error && error.status !== undefined && error.status >= 500) {
    return {
      status: "error",
      message: "Envoi impossible pour le moment. Réessaie plus tard.",
      values,
    };
  }
  return {
    status: "success",
    message: "Si un compte existe pour cette adresse, un lien de connexion vient d'être envoyé.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
