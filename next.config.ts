import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Origines Supabase autorisées pour les appels du navigateur (API et temps réel).
 * Lue au build, comme les autres variables publiques.
 */
function supabaseOrigins(): string[] {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const ws = `${url.protocol === "https:" ? "wss" : "ws"}://${url.host}`;
    return [url.origin, ws];
  } catch {
    return ["https://*.supabase.co", "wss://*.supabase.co"];
  }
}

const siteIsHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

/**
 * Politique de sécurité du contenu, sans nonce : le rendu partiel (cacheComponents) sert des
 * pages en partie statiques, incompatibles avec un nonce par requête. Les scripts en ligne
 * restent donc permis (thème, amorçage de Next.js), mais tout le reste est fermé : pas
 * d'intégration dans un cadre (clickjacking), pas d'objet, pas d'envoi de formulaire ni
 * d'appel réseau vers un autre site que Supabase.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Adobe Fonts : la feuille (use.typekit.net) importe un compteur d'usage (p.typekit.net).
  "style-src 'self' 'unsafe-inline' https://use.typekit.net https://p.typekit.net",
  "img-src 'self' blob: data:",
  "font-src 'self' https://use.typekit.net",
  `connect-src 'self' ${supabaseOrigins().join(" ")}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(siteIsHttps && !isDev ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
