"use client";

import { buttonClasses } from "@/components/ui/button";
import { clearOfflinePages } from "@/components/pwa/service-worker";

/** Déconnexion : efface d'abord les pages gardées pour le hors ligne sur cet appareil. */
export function SignOutButton() {
  return (
    <button
      type="submit"
      className={buttonClasses("secondary")}
      onClick={() => void clearOfflinePages()}
    >
      Se déconnecter
    </button>
  );
}
