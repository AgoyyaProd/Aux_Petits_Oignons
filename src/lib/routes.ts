/** Chemins accessibles sans session. Tout le reste exige une connexion. */
const PUBLIC_PATHS = [
  "/",
  // Catalogue de recettes : ouvert à tous (lecture seule pour un visiteur).
  "/recipes",
  "/login",
  "/signup",
  "/manifest.webmanifest",
  "/apercu",
  "/apercu/menu",
  // Service worker et page de secours hors ligne : chargés sans session.
  "/sw.js",
  "/hors-ligne",
] as const;
// /api/cron/ : appelé par Vercel Cron sans session ; la route vérifie son propre secret.
const PUBLIC_PREFIXES = ["/auth/", "/api/cron/", "/recipes/"] as const;

export function isPublicPath(pathname: string): boolean {
  return (
    (PUBLIC_PATHS as readonly string[]).includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

export const DEFAULT_AFTER_LOGIN = "/dashboard";

/**
 * N'accepte qu'un chemin interne (« /planner?week=… »).
 * Refuse URL absolues, « //domaine », schémas et barres obliques inverses :
 * empêche les redirections ouvertes après connexion.
 */
export function safeRedirectPath(raw: unknown, fallback: string = DEFAULT_AFTER_LOGIN): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, "http://internal.invalid");
    if (url.origin !== "http://internal.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** Rubriques réservées aux comptes, pour expliquer une redirection vers la connexion. */
const MEMBER_AREAS: readonly [prefix: string, label: string][] = [
  ["/planner", "ton menu de la semaine"],
  ["/shopping", "ta liste de courses"],
  ["/pantry", "ton garde-manger"],
  ["/budget", "ton budget"],
  ["/prices", "tes prix"],
  ["/settings", "tes préférences"],
  ["/ingredients", "la fiche de cet ingrédient"],
];

/** « ton garde-manger » pour /pantry/… ; null si la page n'a pas besoin d'explication. */
export function memberAreaLabel(path: string): string | null {
  const hit = MEMBER_AREAS.find(([p]) => path === p || path.startsWith(`${p}/`));
  return hit ? hit[1] : null;
}
