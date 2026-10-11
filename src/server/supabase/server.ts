import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase lié à la session de l'utilisateur (cookies).
 * Toutes les requêtes passent avec son JWT : la RLS s'applique.
 * À créer à chaque requête, jamais en variable globale.
 */
export async function createSupabaseServerClient() {
  const env = publicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Appelé depuis un Server Component : les cookies sont en lecture seule.
            // Sans conséquence, le proxy rafraîchit la session à chaque requête.
          }
        },
      },
    },
  );
}
