import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";
import { safeRedirectPath } from "@/lib/routes";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Retour des liens e-mail (confirmation d'inscription, lien magique) en flux PKCE :
 * échange le code contre une session, puis redirige vers un chemin interne.
 * L'origine vient de NEXT_PUBLIC_SITE_URL, jamais des en-têtes de la requête :
 * même domaine que les cookies de session, pas d'en-tête Host falsifiable.
 */
export async function GET(request: NextRequest) {
  const origin = publicEnv().NEXT_PUBLIC_SITE_URL;
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const failure = new URL("/login", origin);
  failure.searchParams.set("error", "link");
  return NextResponse.redirect(failure);
}
