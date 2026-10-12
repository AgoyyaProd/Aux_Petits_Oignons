"use client";

import { useSyncExternalStore } from "react";

function subscribe(fn: () => void) {
  window.addEventListener("online", fn);
  window.addEventListener("offline", fn);
  return () => {
    window.removeEventListener("online", fn);
    window.removeEventListener("offline", fn);
  };
}

/** Bandeau affiché sans réseau : la page vient de la dernière version enregistrée. */
export function OfflineBanner() {
  const offline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false,
  );
  if (!offline) return null;
  return (
    <div
      role="status"
      className="bg-highlight-soft text-foreground border-border border-b px-4 py-2 text-center text-sm print:hidden"
    >
      Hors ligne : tu consultes la dernière version enregistrée. Les modifications reviendront avec
      le réseau.
    </div>
  );
}
