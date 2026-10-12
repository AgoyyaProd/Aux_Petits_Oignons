"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client Supabase du navigateur, utilisé UNIQUEMENT pour écouter les signaux temps réel
 * (aucune lecture ni écriture de données : elles passent par les actions serveur). Il porte
 * la session de l'utilisateur, ce qui permet de rejoindre les canaux privés de son foyer.
 */
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function browserSupabase() {
  if (client) return client;
  const env = publicEnv();
  client = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return client;
}
