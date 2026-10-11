import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckLine } from "@/components/shopping/check-line";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses, iconButtonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/domain/money";
import { formatShoppingQuantity } from "@/lib/format-quantity";
import { formatWeek } from "@/lib/week";
import {
  getShoppingPage,
  type ShoppingLineView,
  type ShoppingPage,
} from "@/server/modules/shopping/queries";

export const metadata: Metadata = { title: "Courses" };
export const maxDuration = 30;

export default function ShoppingRoute({ searchParams }: PageProps<"/shopping">) {
  return (
    <Suspense fallback={<PageSkeleton rows={5} />}>
      <ShoppingContent searchParams={searchParams} />
    </Suspense>
  );
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

async function ShoppingContent({ searchParams }: Pick<PageProps<"/shopping">, "searchParams">) {
  const sp = await searchParams;
  const page = await getShoppingPage(one(sp.semaine));
  if (!page) return <p className="text-muted">Aucun foyer actif.</p>;
  const byRecipe = one(sp.vue) === "recettes";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Liste de courses"
        description="Calculée à partir du menu, moins ce que tu as déjà. Coche au fur et à mesure dans le magasin."
      />
      <WeekNav page={page} />
      {!page.plan ? (
        <EmptyState
          title="Pas de menu cette semaine"
          action={
            <Link href={`/planner?semaine=${page.weekStart}`} className={buttonClasses("primary")}>
              Générer mon menu
            </Link>
          }
        >
          La liste de courses se calcule à partir des repas prévus.
        </EmptyState>
      ) : (
        <ListView page={page} byRecipe={byRecipe} />
      )}
    </div>
  );
}

function WeekNav({ page }: { page: ShoppingPage }) {
  return (
    <nav aria-label="Semaine" className="flex items-center gap-2">
      <Link
        href={`/shopping?semaine=${page.previousWeek}`}
        className={iconButtonClasses()}
        aria-label="Semaine précédente"
      >
        <ChevronLeftIcon size={20} />
      </Link>
      <span className="min-w-52 text-center font-semibold">
        {formatWeek(page.weekStart).replace("Semaine du", "Du")}
        {page.isCurrentWeek ? (
          <span className="text-muted block text-xs font-medium">Cette semaine</span>
        ) : null}
      </span>
      <Link
        href={`/shopping?semaine=${page.nextWeek}`}
        className={iconButtonClasses()}
        aria-label="Semaine suivante"
      >
        <ChevronRightIcon size={20} />
      </Link>
    </nav>
  );
}

type ListPage = Extract<ShoppingPage, { aisles: unknown }>;

function ListView({ page, byRecipe }: { page: ListPage; byRecipe: boolean }) {
  const { totals } = page;
  const plan = page.plan!;
  const done = Boolean(plan.shoppingDoneAt);
  const ratio = totals.lines ? totals.checked / totals.lines : 0;
  const base = `/shopping?semaine=${page.weekStart}`;

  // Vue par recette : chaque article sous la première recette qui l'utilise.
  const groups = byRecipe
    ? (() => {
        const map = new Map<string, ShoppingLineView[]>();
        for (const a of page.aisles) {
          for (const l of a.lines) {
            const key = l.recipes[0] ?? "Autres";
            map.set(key, [...(map.get(key) ?? []), l]);
          }
        }
        return [...map.entries()].map(([label, lines]) => ({ key: label, label, lines }));
      })()
    : page.aisles.map((a) => ({ key: a.category, label: a.label, lines: a.lines }));

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
      <div className="flex flex-col gap-6">
        {page.warnings.length ? (
          <Alert tone="warning">
            <ul className="flex flex-col gap-1">
              {page.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Affichage"
            className="bg-surface-muted inline-flex rounded-full p-1"
          >
            <Link
              href={base}
              aria-current={!byRecipe ? "true" : undefined}
              scroll={false}
              className={`min-h-10 rounded-full px-4 py-2 text-sm font-semibold ${!byRecipe ? "bg-surface shadow-sm" : "text-muted"}`}
            >
              Par rayon
            </Link>
            <Link
              href={`${base}&vue=recettes`}
              aria-current={byRecipe ? "true" : undefined}
              scroll={false}
              className={`min-h-10 rounded-full px-4 py-2 text-sm font-semibold ${byRecipe ? "bg-surface shadow-sm" : "text-muted"}`}
            >
              Par recette
            </Link>
          </div>
          <span className="text-muted text-sm">
            Quantités nécessaires, pas des tailles de paquet.
          </span>
        </div>

        {totals.lines === 0 ? (
          <EmptyState title="Rien à acheter">
            Ton garde-manger et ton placard couvrent tout le menu.
          </EmptyState>
        ) : (
          groups.map((group) => (
            <section key={group.key} aria-label={group.label} className="flex flex-col gap-2">
              <h2 className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-semibold">{group.label}</span>
                <span className="text-muted text-sm">
                  {group.lines.filter((l) => l.checked).length}/{group.lines.length}
                </span>
              </h2>
              <ul className="border-border bg-surface divide-border divide-y rounded-2xl border px-4">
                {group.lines.map((line) => (
                  <li key={`${line.ingredientId}|${line.dimension}`}>
                    <CheckLine
                      week={page.weekStart}
                      ingredientId={line.ingredientId}
                      dimension={line.dimension}
                      checked={line.checked}
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="item-name text-base font-semibold">{line.name}</span>
                        <span className="shrink-0 text-base font-semibold tabular-nums">
                          {formatShoppingQuantity(line.toBuy)}
                        </span>
                      </span>
                      <span className="text-muted flex justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate">
                          {line.fromStock.milli > 0
                            ? `${formatShoppingQuantity(line.fromStock)} déjà chez toi, `
                            : ""}
                          {byRecipe
                            ? line.recipes.length > 1
                              ? `aussi pour ${line.recipes.slice(1).join(", ")}`
                              : ""
                            : line.recipes.join(", ")}
                        </span>
                        <span className="shrink-0">
                          {line.cents !== null ? `≈ ${formatCents(line.cents)}` : "sans prix"}
                        </span>
                      </span>
                    </CheckLine>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        {page.covered.length || page.cupboard.length ? (
          <details className="border-border bg-surface rounded-2xl border p-4">
            <summary className="cursor-pointer font-semibold">
              Déjà chez toi ({page.covered.length + page.cupboard.length})
            </summary>
            <ul className="text-muted mt-3 flex flex-col gap-1.5 text-sm">
              {page.covered.map((l) => (
                <li key={`${l.ingredientId}|${l.dimension}`}>
                  {l.name} : {formatShoppingQuantity(l.needed)} (garde-manger)
                </li>
              ))}
              {page.cupboard.map((c) => (
                <li key={c.name}>{c.name} (placard)</li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      {/* Récapitulatif : barre collée en bas sur téléphone (au-dessus des onglets), colonne
          à droite sur ordinateur. */}
      <aside
        aria-label="Récapitulatif"
        className="bg-surface border-border fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 border-t px-4 py-3 shadow-[var(--shadow-md)] lg:sticky lg:top-8 lg:bottom-auto lg:flex lg:flex-col lg:gap-4 lg:rounded-2xl lg:border lg:p-5 lg:shadow-none"
      >
        <div className="mx-auto flex max-w-xl items-center gap-4 lg:flex-col lg:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">
                {totals.checked}/{totals.lines} dans le panier
              </span>
              <span className="font-display text-lg font-semibold lg:text-2xl">
                {totals.unpriced ? "≥ " : "≈ "}
                {formatCents(totals.knownCents)}
              </span>
            </div>
            <span
              role="img"
              aria-label={`${totals.checked} articles sur ${totals.lines}`}
              className="bg-surface-muted h-2 overflow-hidden rounded-full"
            >
              <span
                className="bg-brand block h-full rounded-full transition-[width]"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </span>
            <span className="text-muted hidden text-sm lg:block">
              Estimation pour {plan.mealCount} plat{plan.mealCount > 1 ? "s" : ""} ({plan.people}{" "}
              pers.).
              {totals.unpriced
                ? ` ${totals.unpriced} article${totals.unpriced > 1 ? "s" : ""} sans prix, non compté${totals.unpriced > 1 ? "s" : ""}.`
                : ""}{" "}
              Le prix payé en magasin peut différer.
            </span>
          </div>
          {done ? (
            <Badge tone="leaf">Courses faites</Badge>
          ) : (
            <Link
              href={`/shopping/ranger?semaine=${page.weekStart}`}
              className={buttonClasses("accent", "shrink-0")}
            >
              Finir les courses
            </Link>
          )}
        </div>
        {done ? (
          <p className="text-muted mt-2 hidden text-sm lg:block">
            Marque tes plats « Cuisiné » depuis leur recette pour mettre le stock à jour.
          </p>
        ) : null}
      </aside>
      {/* Espace réservé à la barre collée sur téléphone. */}
      <div aria-hidden="true" className="h-20 lg:hidden" />
    </div>
  );
}
