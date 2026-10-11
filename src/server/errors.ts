import "server-only";

/** Erreur renvoyée par Supabase/PostgREST (forme minimale utile). */
interface DbErrorLike {
  code?: string;
  message?: string;
  hint?: string | null;
}

/**
 * Codes applicatifs levés par nos fonctions SQL (migration 0007) : leurs messages
 * sont rédigés pour l'utilisateur et peuvent être affichés tels quels.
 */
const APP_CODES = new Set(["AP404", "AP409", "AP422"]);

export type ActionErrorKind = "not_found" | "conflict" | "invalid" | "forbidden" | "unexpected";

export class ActionError extends Error {
  constructor(
    readonly kind: ActionErrorKind,
    message: string,
  ) {
    super(message);
  }
}

/** Traduit une erreur de base en message affichable, sans jamais exposer de détail technique. */
export function toActionError(error: DbErrorLike): ActionError {
  const code = error.code ?? "";
  if (APP_CODES.has(code) && error.message) {
    const kind = code === "AP404" ? "not_found" : code === "AP409" ? "conflict" : "invalid";
    return new ActionError(kind, error.message);
  }
  if (code === "42501") {
    return new ActionError("forbidden", "Action non autorisée pour ton compte.");
  }
  if (code === "23503" || code === "23514" || code === "22P02") {
    return new ActionError("invalid", "Certaines valeurs ne sont pas acceptées.");
  }
  console.error("Erreur base de données inattendue", { code, message: error.message });
  return new ActionError("unexpected", "Une erreur est survenue. Réessaie dans un instant.");
}
