"use client";

import { useEffect } from "react";
import { browserSupabase } from "@/lib/supabase-browser";

/**
 * Signale au journal des erreurs l'erreur affichée par un écran d'erreur (une seule fois).
 * En production, une erreur venue du serveur n'a qu'un message générique et une empreinte
 * (digest) : c'est l'empreinte qui permet de la retrouver dans les journaux serveur.
 */
export function useReportError(error: Error & { digest?: string }) {
  useEffect(() => {
    void browserSupabase()
      .rpc("report_app_error", {
        p_kind: "client",
        p_message: `${error.name}: ${error.message}`.slice(0, 500),
        p_digest: error.digest,
        p_path: window.location.pathname,
        p_release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 12),
      })
      .then(
        () => undefined,
        () => undefined,
      );
  }, [error]);
}
