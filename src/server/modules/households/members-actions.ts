"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { toActionError } from "@/server/errors";
import { requireUser } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  firstErrors,
  invitationIdSchema,
  invitationTokenSchema,
  inviteSchema,
  memberSchema,
  switchHouseholdSchema,
  type FormState,
  type InviteState,
} from "./schema";

/** Codes levés par les fonctions d'invitation (migration 0002). */
const FORBIDDEN = "42501";
const INVALID = "22023";

/**
 * Crée une invitation (propriétaire uniquement, vérifié en base). Le jeton clair est
 * renvoyé une seule fois : seul son empreinte est stockée. Aucun e-mail n'est envoyé,
 * le propriétaire partage le lien lui-même.
 */
export async function createInvitationAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  await requireUser();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstErrors<"email">(parsed.error) };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_household_invitation", {
    p_household_id: parsed.data.householdId,
    p_email: parsed.data.email,
  });
  if (error) {
    if (error.code === FORBIDDEN) {
      return { status: "error", message: "Seul le propriétaire du foyer peut inviter." };
    }
    if (error.code === INVALID) {
      return { status: "error", fieldErrors: { email: "Adresse e-mail invalide." } };
    }
    return { status: "error", message: toActionError(error).message };
  }
  refresh();
  return {
    status: "success",
    message: "Invitation créée.",
    token: data,
    email: parsed.data.email,
  };
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = invitationIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("household_invitations")
    .delete()
    .eq("household_id", parsed.data.householdId)
    .eq("id", parsed.data.invitationId);
  if (error) throw new Error(toActionError(error).message);
  refresh();
}

/** Le propriétaire retire un membre (la RLS refuse tout autre cas). */
export async function removeMemberAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.userId === user.id) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("household_id", parsed.data.householdId)
    .eq("user_id", parsed.data.userId);
  if (error) throw new Error(toActionError(error).message);
  refresh();
}

/** Un membre (non propriétaire) quitte le foyer ; il bascule sur un autre de ses foyers. */
export async function leaveHouseholdAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = switchHouseholdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("household_members")
    .delete()
    .eq("household_id", parsed.data.householdId)
    .eq("user_id", user.id)
    .select("user_id");
  if (error) throw new Error(toActionError(error).message);
  if (!data?.length) throw new Error("Le propriétaire ne peut pas quitter son propre foyer.");
  redirect("/dashboard");
}

/** Change de foyer actif (la RLS du profil n'accepte qu'un foyer dont on est membre). */
export async function switchHouseholdAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = switchHouseholdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ active_household_id: parsed.data.householdId })
    .eq("id", user.id);
  if (error) throw new Error(toActionError(error).message);
  redirect("/dashboard");
}

/** Accepte une invitation. Même message pour tous les échecs (jeton inconnu, expiré, autre e-mail). */
export async function acceptInvitationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const token = invitationTokenSchema.safeParse(formData.get("token"));
  if (!token.success) return { status: "error", message: "Invitation invalide ou expirée." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("accept_household_invitation", { p_token: token.data });
  if (error) {
    if (error.code === INVALID) {
      return {
        status: "error",
        message:
          "Invitation invalide ou expirée. Vérifie que tu es connecté avec l'adresse e-mail invitée.",
      };
    }
    return { status: "error", message: toActionError(error).message };
  }
  redirect("/dashboard");
}
