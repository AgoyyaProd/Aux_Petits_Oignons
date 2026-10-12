"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Imprimer la page, ou partager le menu et la liste en texte (message, e-mail, notes…). */
export function PrintActions({ shareText }: { shareText: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const nav = navigator as Navigator & {
      share?: (d: { title: string; text: string }) => Promise<void>;
    };
    try {
      if (nav.share) {
        await nav.share({ title: "Menu de la semaine", text: shareText });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Partage annulé ou presse-papiers indisponible : rien à faire.
    }
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button type="button" onClick={() => window.print()}>
        Imprimer
      </Button>
      <Button type="button" variant="secondary" onClick={share}>
        {copied ? "Texte copié" : "Partager en texte"}
      </Button>
    </div>
  );
}
