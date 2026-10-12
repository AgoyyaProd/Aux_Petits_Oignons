"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";

/**
 * Bandeau masquable pour la journée, sur cet appareil. La clé contient la date et le contenu
 * (ex. la liste des produits) : si un nouveau produit arrive, le bandeau revient.
 * Le stockage du navigateur peut être indisponible (navigation privée) : le bandeau reste
 * alors simplement affiché.
 */
const STORAGE_KEY = "apo-banner-dismissed";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function DismissibleBanner({
  dismissKey,
  label,
  children,
}: {
  dismissKey: string;
  label: string;
  children: ReactNode;
}) {
  const dismissed = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => read() === dismissKey,
    () => false,
  );
  if (dismissed) return null;

  return (
    <section
      aria-label={label}
      className="bg-accent-soft border-accent/30 relative flex flex-col gap-4 rounded-2xl border p-5 pr-14 sm:p-6 sm:pr-16"
    >
      {children}
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, dismissKey);
          } catch {
            // Pas de stockage : rien à mémoriser.
          }
          listeners.forEach((fn) => fn());
        }}
        aria-label="Masquer jusqu'à demain"
        title="Masquer jusqu'à demain"
        className="text-muted hover:bg-surface/70 hover:text-foreground absolute top-3 right-3 flex size-10 items-center justify-center rounded-full"
      >
        <CloseIcon size={18} />
      </button>
    </section>
  );
}
