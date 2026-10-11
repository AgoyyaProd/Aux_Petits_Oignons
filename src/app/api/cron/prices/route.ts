import { timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { syncReferencePrices } from "@/server/modules/prices/sync";

/**
 * Mise à jour nocturne des prix indicatifs (Vercel Cron, voir vercel.json).
 * Protégée par CRON_SECRET, que Vercel envoie dans l'en-tête Authorization.
 * Seule exception au client service_role dans l'application : écrire des prix de
 * référence publics, sans aucune donnée de foyer.
 */
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Non autorisé", { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY absente" }, { status: 503 });
  }
  try {
    const summary = await syncReferencePrices(createSupabaseAdminClient(), { deadlineMs: 50_000 });
    return Response.json(summary);
  } catch (error) {
    console.error("Synchronisation des prix (cron) en échec", error);
    return Response.json({ error: "échec" }, { status: 500 });
  }
}
