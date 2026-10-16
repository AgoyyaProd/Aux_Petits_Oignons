"use client";

import {
  createContext,
  useActionState,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { CloseIcon, ClockIcon, HeartIcon, SearchIcon } from "@/components/ui/icons";
import { formatCents } from "@/domain/money";
import { filterChoices } from "@/domain/planning/pick";
import { pickAddAction, pickEntryAction } from "@/server/modules/planning/actions";
import { idlePlanner, type PlannerState } from "@/server/modules/planning/schema";

export interface PickerChoice {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  totalMinutes: number;
  centsPerServing: number | null;
  partialPrice: boolean;
  favorite: boolean;
  /** Raison pour laquelle le plat n'est pas proposé d'office (matériel, aliment, temps). */
  warning: string | null;
}

/** Ce que le choix va faire : remplacer un plat, ou ajouter un plat dans une case. */
export type PickTarget =
  | { mode: "replace"; position: number; title: string }
  | { mode: "add"; slot: string; label: string };

const PickerContext = createContext<((target: PickTarget) => void) | null>(null);

/** Nombre de résultats affichés : la recherche affine, la liste reste légère. */
const SHOWN = 60;

/**
 * Une seule fenêtre de recherche pour toute la page : les recettes ne sont envoyées qu'une fois,
 * chaque bouton « Chercher » ne fait que l'ouvrir. Tout le catalogue de plats est choisissable
 * (hors allergies et régimes) : ceux qui ne conviennent pas d'office viennent après, signalés.
 */
export function RecipePickerProvider({
  choices,
  inPlan,
  base,
  formKey,
  children,
}: {
  choices: PickerChoice[];
  /** Recettes déjà au menu : affichées, mais non sélectionnables. */
  inPlan: string[];
  base: { week: string; version: string };
  formKey: string;
  children: ReactNode;
}) {
  const [target, setTarget] = useState<PickTarget | null>(null);
  return (
    <PickerContext.Provider value={setTarget}>
      {children}
      {target ? (
        <PickerDialog
          key={`${target.mode}-${"position" in target ? target.position : target.slot}`}
          target={target}
          choices={choices}
          inPlan={inPlan}
          base={base}
          formKey={formKey}
          onClose={() => setTarget(null)}
        />
      ) : null}
    </PickerContext.Provider>
  );
}

/** Bouton qui ouvre la recherche pour un plat ou une case. */
export function PickButton({
  target,
  className,
  children,
  label,
}: {
  target: PickTarget;
  className: string;
  children: ReactNode;
  label: string;
}) {
  const open = useContext(PickerContext);
  if (!open) return null;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => open(target)}
      className={className}
    >
      {children}
    </button>
  );
}

function PickerDialog({
  target,
  choices,
  inPlan,
  base,
  formKey,
  onClose,
}: {
  target: PickTarget;
  choices: PickerChoice[];
  inPlan: string[];
  base: { week: string; version: string };
  formKey: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState(false);
  const [quick, setQuick] = useState(false);
  const deferred = useDeferredValue(query);
  const [state, formAction, pending] = useActionState<PlannerState, FormData>(
    target.mode === "replace" ? pickEntryAction : pickAddAction,
    idlePlanner,
  );

  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    search.current?.focus();
  }, []);
  useEffect(() => {
    if (state.status === "success") onClose();
  }, [state, onClose]);

  const taken = useMemo(() => new Set(inPlan), [inPlan]);
  const results = useMemo(
    () =>
      filterChoices(choices, {
        query: deferred,
        favoritesOnly: favorites,
        maxMinutes: quick ? 30 : null,
      }),
    [choices, deferred, favorites, quick],
  );

  const chip = (on: boolean) =>
    `inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium ${
      on ? "border-brand bg-brand-soft text-brand" : "border-border bg-surface hover:border-brand"
    }`;

  return (
    <dialog
      ref={dialog}
      aria-label="Choisir un plat"
      onClose={onClose}
      className="bg-background text-foreground sm:border-border m-auto h-[min(42rem,100dvh)] max-h-none w-[min(36rem,100vw)] max-w-none overflow-hidden p-0 backdrop:bg-black/40 max-sm:h-dvh sm:rounded-2xl sm:border sm:shadow-2xl"
    >
      <form action={formAction} className="flex h-full flex-col">
        <input type="hidden" name="week" value={base.week} />
        <input type="hidden" name="version" value={base.version} />
        <input type="hidden" name="key" value={formKey} />
        {target.mode === "replace" ? (
          <input type="hidden" name="position" value={target.position} />
        ) : (
          <input type="hidden" name="slot" value={target.slot} />
        )}

        <header className="border-border flex flex-col gap-3 border-b px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold">Choisir un plat</h2>
              <p className="text-muted truncate text-sm">
                {target.mode === "replace"
                  ? `À la place de « ${target.title} »`
                  : `Pour ${target.label}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Fermer la recherche"
              className="border-border flex size-10 shrink-0 items-center justify-center rounded-full border"
            >
              <CloseIcon size={18} />
            </button>
          </div>
          <label className="relative block">
            <span className="sr-only">Rechercher une recette</span>
            <SearchIcon
              size={18}
              className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            />
            <input
              ref={search}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // Entrée ne doit pas envoyer le formulaire sans recette choisie.
                if (e.key === "Enter") e.preventDefault();
              }}
              placeholder="Curry, poulet, lentilles…"
              className="bg-surface border-border hover:border-border-strong focus-visible:border-brand focus-visible:ring-brand/25 min-h-11 w-full rounded-lg border pr-3 pl-10 text-base outline-none focus-visible:ring-2"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={favorites}
              onClick={() => setFavorites((v) => !v)}
              className={chip(favorites)}
            >
              <HeartIcon size={14} filled={favorites} /> Favoris
            </button>
            <button
              type="button"
              aria-pressed={quick}
              onClick={() => setQuick((v) => !v)}
              className={chip(quick)}
            >
              <ClockIcon size={14} /> 30 min max
            </button>
            <span className="text-muted ml-auto text-xs" aria-live="polite">
              {results.length} recette{results.length > 1 ? "s" : ""}
            </span>
          </div>
          {state.status === "error" && state.message ? (
            <p role="alert" className="text-danger text-sm font-medium">
              {state.message}
            </p>
          ) : null}
        </header>

        <ul className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {results.length === 0 ? (
            <li className="text-muted px-3 py-8 text-center text-sm">
              Aucune recette ne correspond. Les plats qui ne respectent pas tes allergies ou ton
              régime ne sont jamais proposés.
            </li>
          ) : null}
          {results.slice(0, SHOWN).map((c, i, shown) => {
            const already = taken.has(c.id);
            const firstOff = c.warning !== null && (i === 0 || shown[i - 1]?.warning === null);
            return (
              <li key={c.id}>
                {firstOff ? (
                  <p className="text-muted border-border mt-2 border-t px-2 pt-3 pb-1 text-xs">
                    Hors de tes réglages (matériel, aliments, temps) : tu peux quand même les
                    choisir.
                  </p>
                ) : null}
                <button
                  type="submit"
                  name="recipeId"
                  value={c.id}
                  disabled={already || pending}
                  className="hover:bg-surface flex w-full items-center gap-3 rounded-xl p-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                    <RecipeVisual slug={c.slug} title={c.title} sizes="56px" iconSize={18} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="line-clamp-2 text-sm leading-snug font-semibold">
                      {c.favorite ? (
                        <HeartIcon
                          size={12}
                          filled
                          className="text-accent-strong mr-1 inline align-[-1px]"
                        />
                      ) : null}
                      {c.title}
                    </span>
                    <span className="text-muted flex flex-wrap items-center gap-x-2 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon size={12} /> {c.totalMinutes} min
                      </span>
                      {c.centsPerServing !== null ? (
                        <span>
                          {c.partialPrice ? "≥ " : "≈ "}
                          {formatCents(c.centsPerServing)} / part
                        </span>
                      ) : null}
                      {already ? <span className="font-medium">Déjà au menu</span> : null}
                    </span>
                    {c.warning ? (
                      <span className="text-accent-strong text-xs font-medium">{c.warning}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
          {results.length > SHOWN ? (
            <li className="text-muted px-3 py-3 text-center text-xs">
              {results.length - SHOWN} autres recettes : précise ta recherche.
            </li>
          ) : null}
        </ul>
      </form>
    </dialog>
  );
}
