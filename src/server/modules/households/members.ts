import "server-only";
import { getCurrentContext } from "@/server/modules/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export interface HouseholdMember {
  userId: string;
  name: string | null;
  role: "owner" | "member";
  joinedAt: string;
  isMe: boolean;
}

/** Membres du foyer actif, invitations en attente (propriétaire) et foyers de l'utilisateur. */
export async function getMembersSection() {
  const { user, household } = await getCurrentContext();
  if (!household) return null;
  const supabase = await createSupabaseServerClient();

  const [members, mine] = await Promise.all([
    supabase
      .from("household_members")
      .select("user_id, role, joined_at")
      .eq("household_id", household.id)
      .order("joined_at"),
    supabase
      .from("household_members")
      .select("households (id, name)")
      .eq("user_id", user.id)
      .order("joined_at"),
  ]);
  if (members.error) throw new Error(`Lecture des membres impossible : ${members.error.message}`);
  if (mine.error) throw new Error(`Lecture des foyers impossible : ${mine.error.message}`);

  const ids = members.data.map((m) => m.user_id);
  const profiles = await supabase.from("profiles").select("id, display_name").in("id", ids);
  if (profiles.error) throw new Error(`Lecture des profils impossible : ${profiles.error.message}`);
  const names = new Map(profiles.data.map((p) => [p.id, p.display_name]));

  const isOwner = members.data.some((m) => m.user_id === user.id && m.role === "owner");

  let invitations: { id: string; email: string; expiresAt: string }[] = [];
  if (isOwner) {
    const pending = await supabase
      .from("household_invitations")
      .select("id, email, expires_at")
      .eq("household_id", household.id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (pending.error)
      throw new Error(`Lecture des invitations impossible : ${pending.error.message}`);
    invitations = pending.data.map((i) => ({
      id: i.id,
      email: String(i.email),
      expiresAt: i.expires_at,
    }));
  }

  return {
    householdId: household.id,
    isOwner,
    members: members.data.map<HouseholdMember>((m) => ({
      userId: m.user_id,
      name: names.get(m.user_id) ?? null,
      role: m.role,
      joinedAt: m.joined_at,
      isMe: m.user_id === user.id,
    })),
    invitations,
    households: mine.data.flatMap((m) => (m.households ? [m.households] : [])),
  };
}
