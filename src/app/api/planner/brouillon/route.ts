import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";
import { isMonday } from "@/lib/week";
import { getCurrentUser } from "@/server/modules/auth/session";
import { discardDraft } from "@/server/modules/planning/repository";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Abandon du brouillon de menu quand on quitte la page sans valider (fermeture de l'onglet,
 * rechargement, navigation) : appelé par navigator.sendBeacon. Même origine uniquement ;
 * la RLS limite la suppression au foyer de l'utilisateur.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = new Set([
    new URL(publicEnv().NEXT_PUBLIC_SITE_URL).origin,
    request.nextUrl.origin,
  ]);
  if (origin && !allowed.has(origin)) return new NextResponse(null, { status: 403 });

  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });

  let week: unknown = null;
  try {
    week = JSON.parse(await request.text())?.week;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (typeof week !== "string" || !isMonday(week)) return new NextResponse(null, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("active_household_id")
    .eq("id", user.id)
    .single();
  if (!profile?.active_household_id) return new NextResponse(null, { status: 204 });
  await discardDraft(supabase, profile.active_household_id, week);
  return new NextResponse(null, { status: 204 });
}
