import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client anonyme, sans session ni cookie : il ne lit que ce que la RLS ouvre aux visiteurs
 * (catalogue publié). Utilisable dans un cache partagé (plan du site, métadonnées).
 */
export function createSupabasePublicClient() {
  const env = publicEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
