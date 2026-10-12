import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Enregistre une erreur serveur dans le journal (table app_errors, via report_app_error).
 * Données minimales : type, message tronqué, empreinte Next.js, chemin sans paramètres,
 * version déployée. Ne lève jamais : un échec du journal ne doit pas aggraver l'erreur.
 */
export async function reportServerError(input: {
  message: string;
  digest?: string | null;
  path?: string | null;
}) {
  try {
    const env = publicEnv();
    const supabase = createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    await supabase.rpc("report_app_error", {
      p_kind: "server",
      p_message: input.message.slice(0, 500),
      p_digest: input.digest ?? undefined,
      p_path: input.path ?? undefined,
      p_release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12),
    });
  } catch {
    // Journal indisponible : on n'insiste pas.
  }
}
