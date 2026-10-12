import type { Instrumentation } from "next";

/**
 * Erreurs non rattrapées pendant le rendu ou dans une action serveur : enregistrées dans le
 * journal des erreurs (voir server/errors/report). Les erreurs « attendues » (redirection,
 * page introuvable) ne passent pas par ici.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const err = error as Error & { digest?: string };
  const { reportServerError } = await import("@/server/errors/report");
  await reportServerError({
    message: `${err.name ?? "Error"}: ${err.message ?? String(error)}`,
    digest: err.digest ?? null,
    path: request.path,
  });
};
