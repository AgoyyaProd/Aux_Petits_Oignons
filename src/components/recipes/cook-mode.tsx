"use client";

import { useEffect, useRef, useState } from "react";
import { StepTimerButtons, TimerTray, useKitchen } from "@/components/recipes/kitchen";
import { StepIngredients } from "@/components/recipes/recipe-body";
import { Button } from "@/components/ui/button";
import type { RecipeDetail } from "@/server/modules/recipes/queries";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PotIcon } from "@/components/ui/icons";

/**
 * Mode cuisine : une étape à la fois, en grand, plein écran, l'écran reste allumé quand le
 * navigateur le permet. Chaque étape montre ses ingrédients (quantités pour le nombre de
 * portions choisi) et ses minuteurs. Fermeture par Échap ou le bouton ; flèches du clavier.
 */
export function CookMode({
  title,
  steps,
  ingredients,
  stepDetails,
}: {
  title: string;
  steps: string[];
  ingredients: RecipeDetail["ingredients"];
  stepDetails: RecipeDetail["stepDetails"];
}) {
  const { servings, baseServings } = useKitchen();
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
        <div className="flex h-full flex-col">
          {/* Bandeau vert « Marché » : recette, fermeture, avancement. */}
          <header className="bg-forest text-cream relative shrink-0 overflow-hidden rounded-b-[1.75rem] px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-5">
            <span
              aria-hidden="true"
              className="bg-highlight absolute -top-12 -right-12 hidden size-32 rounded-full sm:block"
            />
            <div className="relative mx-auto flex max-w-2xl flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold">
                  {title} · {servings} pers.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Quitter le mode cuisine"
                  className="text-cream flex size-11 shrink-0 items-center justify-center rounded-full bg-white/12 hover:bg-white/20"
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
                className="h-1.5 overflow-hidden rounded-full bg-white/15"
              >
                <div
                  className="bg-highlight h-full rounded-full transition-[width]"
                  style={{ width: `${((index + 1) / steps.length) * 100}%` }}
                />
              </div>
              <p className="text-xs font-medium text-[#a9cfb2]">
                Étape {index + 1} sur {steps.length}
              </p>
            </div>
          </header>
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-1 flex-col justify-center gap-6 overflow-y-auto py-8">
              <p
                aria-hidden="true"
                className="bg-highlight font-display grid size-16 place-items-center rounded-full text-3xl font-semibold text-[#13261f]"
              >
                {index + 1}
              </p>
              <p className="text-2xl leading-snug font-medium sm:text-3xl" aria-live="polite">
                {steps[index]}
              </p>
              <StepIngredients
                ids={stepDetails[index]?.ingredientIds ?? []}
                ingredients={ingredients}
                servings={servings}
                base={baseServings}
                size="lg"
              />
              <StepTimerButtons
                step={index + 1}
                timers={stepDetails[index]?.timers ?? []}
                size="lg"
              />
            </div>
            <TimerTray className="mb-3" />
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
        </div>
      </dialog>
    </>
  );
}
