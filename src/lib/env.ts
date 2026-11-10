import { z } from "zod";

/**
 * Variables publiques : lues explicitement (Next.js ne remplace que les accès
 * littéraux `process.env.NEXT_PUBLIC_*` dans le bundle client).
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY manquante"),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

/**
 * Adresse publique du site (liens des e-mails d'inscription et de connexion). Sans variable
 * explicite : l'adresse fournie par Vercel (production, puis aperçu), sinon localhost en
 * développement. Jamais localhost en silence sur un déploiement Vercel.
 */
export function resolveSiteUrl(env: Record<string, string | undefined>): string | undefined {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (env.VERCEL_ENV && env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  if (env.VERCEL_ENV) return undefined;
  return "http://localhost:3000";
}

export type PublicEnv = z.infer<typeof publicSchema>;

let cached: PublicEnv | undefined;

export function publicEnv(): PublicEnv {
  if (cached) return cached;
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: resolveSiteUrl({
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    }),
  });
  if (!parsed.success) {
    throw new Error(`Configuration invalide (.env.local) : ${z.prettifyError(parsed.error)}`);
  }
  cached = parsed.data;
  return cached;
}
