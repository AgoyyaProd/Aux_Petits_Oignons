"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PotIcon } from "@/components/ui/icons";

/**
 * Mode cuisine : une étape à la fois, en grand, plein écran, l'écran reste allumé quand le
 * navigateur le permet. Fermeture par Échap ou le bouton ; flèches du clavier pour naviguer.
 */
export function CookMode({ title, steps }: { title: string; steps: string[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) return;
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    nav.wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => undefined);
    return () => {
      lock?.release().catch(() => undefined);
    };
  }, [open]);

  const last = steps.length - 1;
  return (
    <>
      <Button variant="secondary" onClick={() => (setIndex(0), setOpen(true))}>
        <PotIcon size={18} />
        Mode cuisine
      </Button>
      <dialog
        ref={dialog}
        aria-label={`Mode cuisine : ${title}`}
        onClose={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setIndex((i) => Math.min(last, i + 1));
          if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
        }}
        className="bg-background text-foreground m-0 h-dvh max-h-none w-screen max-w-none p-0 backdrop:bg-black/40"
      >
        <div className="mx-auto flex h-full max-w-2xl flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted truncate text-sm font-semibold">{title}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Quitter le mode cuisine"
              className="border-border flex size-11 items-center justify-center rounded-full border"
            >
              <CloseIcon size={20} />
            </button>
          </div>
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-valuenow={index + 1}
            aria-label="Progression"
            className="bg-surface-muted mt-4 h-1.5 overflow-hidden rounded-full"
          >
            <div
              className="bg-accent h-full rounded-full transition-[width]"
              style={{ width: `${((index + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-6 py-8" aria-live="polite">
            <p className="font-display text-accent-strong text-6xl font-semibold">{index + 1}</p>
            <p className="text-2xl leading-snug font-medium sm:text-3xl">{steps[index]}</p>
            <p className="text-muted text-sm">
              Étape {index + 1} sur {steps.length}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              className="min-h-14 text-base"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeftIcon size={20} />
              Précédente
            </Button>
            {index < last ? (
              <Button
                className="min-h-14 text-base"
                onClick={() => setIndex((i) => Math.min(last, i + 1))}
              >
                Suivante
                <ChevronRightIcon size={20} />
              </Button>
            ) : (
              <Button
                variant="accent"
                className="min-h-14 text-base"
                onClick={() => setOpen(false)}
              >
                Terminé
              </Button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
