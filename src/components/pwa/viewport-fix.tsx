"use client";

import { useEffect } from "react";

const FIELD = "input, textarea, select, [contenteditable='true']";

/**
 * iPhone (surtout l'appli installée) : après la fermeture du clavier, Safari laisse parfois la
 * zone d'affichage décalée. Les éléments fixes (barre d'onglets, total des courses) remontent
 * alors au milieu de l'écran et l'en-tête disparaît, jusqu'au rechargement.
 *
 * Dès que le clavier se referme (plus aucun champ actif, ou la zone visible retrouve sa
 * hauteur), on recale la page sur sa propre position de défilement : Safari recalcule la zone
 * d'affichage et les éléments fixes retrouvent leur place.
 */
export function ViewportFix() {
  useEffect(() => {
    const vv = window.visualViewport;
    let timer: number | undefined;

    const realign = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (document.activeElement?.matches(FIELD)) return;
        // Zoom volontaire (pincement) : on ne touche à rien.
        if (vv && vv.scale > 1.01) return;
        window.scrollTo({ top: window.scrollY, left: 0, behavior: "instant" });
      }, 120);
    };

    const onFocusOut = (e: FocusEvent) => {
      if ((e.target as Element | null)?.matches?.(FIELD)) realign();
    };

    document.addEventListener("focusout", onFocusOut);
    vv?.addEventListener("resize", realign);
    window.addEventListener("orientationchange", realign);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("focusout", onFocusOut);
      vv?.removeEventListener("resize", realign);
      window.removeEventListener("orientationchange", realign);
    };
  }, []);

  return null;
}
