"use client";

import { Button } from "@/components/ui/button";
import { AlertIcon } from "@/components/ui/icons";

/** Erreur inattendue dans un écran : explique quoi faire, sans détail technique. */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="text-danger">
        <AlertIcon size={40} />
      </span>
      <h1 className="type-page">Cet écran n&apos;a pas pu s&apos;afficher</h1>
      <p className="text-muted">
        Tes données ne sont pas perdues. Réessaie ; si le problème continue, recharge la page.
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
