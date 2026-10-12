"use client";

import { useEffect } from "react";

/** Pages publiques : personne n'y est connecté, les pages gardées d'un compte sont effacées. */
const SIGNED_OUT_PATHS = new Set(["/", "/login", "/signup"]);

export async function clearOfflinePages(): Promise<void> {
  try {
    navigator.serviceWorker?.controller?.postMessage({ type: "clear-pages" });
    if ("caches" in window) await caches.delete("apo-pages");
  } catch {
    // Pas de stockage disponible : rien à effacer.
  }
}

/**
 * Enregistre le service worker (production uniquement) et prépare la consultation hors ligne
 * de la liste de courses et du menu de la semaine.
 */
export function ServiceWorkerSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    if (SIGNED_OUT_PATHS.has(window.location.pathname)) void clearOfflinePages();

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(async (reg) => {
        if (SIGNED_OUT_PATHS.has(window.location.pathname) || !navigator.onLine) return;
        const sw = reg.active ?? (await navigator.serviceWorker.ready).active;
        sw?.postMessage({ type: "warm", urls: ["/shopping", "/planner"] });
      })
      .catch(() => {
        // Navigateur sans service worker ou mode privé strict : l'appli marche sans.
      });
  }, []);
  return null;
}
