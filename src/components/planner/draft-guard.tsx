"use client";

import { useEffect } from "react";

const DISCARD_URL = "/api/planner/brouillon";
const MESSAGE =
  "Ton menu n'est pas validé. Si tu quittes la page, il ne sera pas enregistré. Quitter quand même ?";

/** Brouillons affichés, par semaine : tient compte d'un démontage suivi d'un remontage immédiat. */
const mounted = new Map<string, number>();

function discard(week: string) {
  const body = JSON.stringify({ week });
  if (!navigator.sendBeacon?.(DISCARD_URL, new Blob([body], { type: "application/json" }))) {
    void fetch(DISCARD_URL, { method: "POST", body, keepalive: true }).catch(() => undefined);
  }
}

/** Le lien mène-t-il hors de ce menu (autre page, ou autre semaine) ? */
function leavesMenu(anchor: HTMLAnchorElement, week: string): boolean {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return true;
  if (url.pathname !== "/planner") return true;
  const target = url.searchParams.get("semaine");
  return target !== null && target !== week;
}

/**
 * Sécurité du brouillon de menu : tant qu'il n'est pas validé,
 *  - quitter la page (lien, fermeture, rechargement) demande confirmation ;
 *  - une fois la page quittée, le brouillon est abandonné : le menu revient à son état validé
 *    (ou à zéro). Rien n'est enregistré, la liste de courses ne change pas.
 */
export function DraftGuard({ week }: { week: string }) {
  useEffect(() => {
    mounted.set(week, (mounted.get(week) ?? 0) + 1);

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Requis par certains navigateurs pour afficher la confirmation.
      event.returnValue = "";
    };
    const onPageHide = (event: PageTransitionEvent) => {
      if (!event.persisted) discard(week);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || !leavesMenu(anchor, week)) return;
      if (!window.confirm(MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("click", onClick, true);
      mounted.set(week, (mounted.get(week) ?? 1) - 1);
      // Navigation dans l'application : la page du menu (ou cette semaine) est quittée.
      // Le délai laisse passer un démontage-remontage immédiat (mode strict, rafraîchissement).
      window.setTimeout(() => {
        if ((mounted.get(week) ?? 0) <= 0) discard(week);
      }, 400);
    };
  }, [week]);

  return null;
}
