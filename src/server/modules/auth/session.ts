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

  return {
    user,
    profile: { id: profile.id, displayName: profile.display_name },
    household: profile.households,
  };
});
