import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Utilisateur courant, vérifié auprès de Supabase Auth (getUser, pas getSession :
 * un cookie seul n'est pas une preuve). Mémorisé pour la durée d'une requête.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/** À appeler en tête de toute page ou action protégée. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Profil et foyer actif de l'utilisateur. Lu à travers la RLS :
 * si le foyer n'est plus accessible, il n'est simplement pas renvoyé.
 */
export const getCurrentContext = cache(async () => {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, active_household_id, households:active_household_id (id, name, people_count, weekly_budget_cents, currency, timezone)",
    )
    .eq("id", user.id)
    .single();

  if (error) throw new Error(`Lecture du profil impossible : ${error.message}`);

  let household = profile.households;
  if (!household) household = await fallbackHousehold(supabase, user.id);

  return {
    user,
    profile: { id: profile.id, displayName: profile.display_name },
    household,
  };
});

/**
 * Le foyer actif n'est plus accessible (membre retiré, départ du foyer) : on bascule sur
 * un autre foyer dont l'utilisateur est membre, en priorité le sien.
 */
async function fallbackHousehold(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data: memberships } = await supabase
    .from("household_members")
    .select(
      "role, joined_at, households (id, name, people_count, weekly_budget_cents, currency, timezone)",
    )
    .eq("user_id", userId)
    .order("joined_at");
  const pick =
    memberships?.find((m) => m.role === "owner" && m.households) ??
    memberships?.find((m) => m.households);
  if (!pick?.households) return null;
  await supabase
    .from("profiles")
    .update({ active_household_id: pick.households.id })
    .eq("id", userId);
  return pick.households;
}
