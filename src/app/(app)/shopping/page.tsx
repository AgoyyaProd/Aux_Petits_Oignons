import type { Metadata } from "next";
import Link from "next/link";
import { ingredientImage } from "@/lib/images";
import { Suspense } from "react";
import { CheckLine } from "@/components/shopping/check-line";
import { ShoppingLiveRefresh } from "@/components/shopping/live-refresh";
import { AddExtraForm, ExportListButton, ExtraLine } from "@/components/shopping/extras";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Hero, HeroWeekNav, ON_FOREST } from "@/components/ui/hero";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRightIcon, CheckIcon, PlusIcon } from "@/components/ui/icons";
import { Responsive } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/domain/money";
import { formatShoppingQuantity } from "@/lib/format-quantity";
import { formatWeek } from "@/lib/week";
import { checkAllAction } from "@/server/modules/shopping/actions";
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

type Extra = ShoppingPage["extras"][number];

async function ShoppingContent({ searchParams }: Pick<PageProps<"/shopping">, "searchParams">) {
  const sp = await searchParams;
  const page = await getShoppingPage(one(sp.semaine));
  if (!page) return <p className="text-muted">Aucun foyer actif.</p>;
  const byRecipe = one(sp.vue) === "recettes";
  const list = page.plan && "aisles" in page ? page : null;
  const lines = list ? list.aisles.flatMap((a) => a.lines) : [];
  const exportText = buildExport(page.weekStart, list?.aisles ?? [], page.extras);
  const allChecked = lines.every((l) => l.checked) && page.extras.every((e) => e.checked);

  return (
    <div className="flex flex-col gap-6">
      <Hero
        title="Ma liste de courses"
        decor="circle"
        actions={
          <>
            {lines.length + page.extras.length > 0 && !allChecked ? (
              <form action={checkAllAction}>
                <input type="hidden" name="week" value={page.weekStart} />
                <input
                  type="hidden"
                  name="lines"
                  value={JSON.stringify(lines.map((l) => ({ i: l.ingredientId, d: l.dimension })))}
                />
                <button type="submit" className={ON_FOREST}>
                  <CheckIcon size={18} />
                  <Responsive short="Tout cocher" long="Cocher les achats" />
                  <span className="tabular-nums opacity-75">
                    (
                    {lines.filter((l) => l.checked).length +
                      page.extras.filter((e) => e.checked).length}
                    /{lines.length + page.extras.length})
                  </span>
                </button>
              </form>
            ) : null}
            {lines.length + page.extras.length > 0 ? (
              <ExportListButton text={exportText} variant="glass" />
            ) : null}
            {page.isCurrentWeek ? (
              <a href="#ajouts" className={buttonClasses("primary")}>
                <PlusIcon size={18} />
                <Responsive short="Ajouter" long="Ajouter un produit" />
              </a>
            ) : null}
          </>
        }
      >
        <HeroWeekNav
          previous={`/shopping?semaine=${page.previousWeek}`}
          next={`/shopping?semaine=${page.nextWeek}`}
          label={formatWeek(page.weekStart).replace("Semaine du", "Du")}
          sub={page.isCurrentWeek ? "Cette semaine" : undefined}
        />
        <ShoppingLiveRefresh householdId={page.householdId} week={page.weekStart} />
      </Hero>

      {!list ? (
        <>
          <EmptyState
            title="Pas de menu cette semaine"
            action={
              <Link
                href={`/planner?semaine=${page.weekStart}`}
                className={buttonClasses("primary")}
              >
                Générer mon menu
                <ArrowRightIcon size={18} />
              </Link>
            }
          >
            La liste se calcule à partir des repas prévus. Tu peux quand même y ajouter des articles
            à la main.
          </EmptyState>
          {page.isCurrentWeek ? <Extras extras={page.extras} /> : null}
        </>
      ) : (
        <ListView page={list} byRecipe={byRecipe} />
      )}
    </div>
  );
}

function buildExport(
  week: string,
  aisles: { label: string; lines: ShoppingLineView[] }[],
  extras: Extra[],
) {
  const out = [`Courses — ${formatWeek(week)}`];
  for (const a of aisles) {
    const todo = a.lines.filter((l) => !l.checked);
    if (!todo.length) continue;
    out.push("", a.label);
    for (const l of todo)
      out.push(
        `- ${l.name} : ${formatShoppingQuantity(l.toBuy)}${l.packHint ? ` (${l.packHint})` : ""}`,
      );
  }
  const todoExtras = extras.filter((e) => !e.checked);
  if (todoExtras.length) {
    out.push("", "Ajouts");
    for (const e of todoExtras) out.push(`- ${e.label}${e.quantity ? ` : ${e.quantity}` : ""}`);
  }
  return out.join("\n");
}

function Extras({ extras }: { extras: Extra[] }) {
  return (
    <section
      id="ajouts"
      aria-labelledby="ajouts-titre"
      className="flex scroll-mt-24 flex-col gap-2"
    >
      <h2 id="ajouts-titre" className="flex items-baseline justify-between gap-3">
        <span className="text-lg font-semibold">Ajouts</span>
        <span className="text-muted text-sm">hors menu, quantités telles que saisies</span>
      </h2>
      {extras.length ? (
        <ul className="border-border bg-surface divide-border divide-y rounded-2xl border px-4">
          {extras.map((e) => (
            <li key={e.id}>
              <ExtraLine
                id={e.id}
                label={e.label}
                quantity={e.quantity}
                note={e.recipe ? `Pour ${e.recipe}` : null}
                checked={e.checked}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <AddExtraForm />
    </section>
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
    <div className="flex flex-col gap-6">
      {/* Récapitulatif : en haut sur ordinateur, collé en bas (au-dessus des onglets) sur téléphone. */}
      <section
        aria-label="Récapitulatif"
        className="bg-surface border-border lg:bg-leaf-soft fixed inset-x-0 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-10 border-t px-4 py-3 shadow-[var(--shadow-md)] lg:static lg:rounded-3xl lg:border-0 lg:px-6 lg:py-5 lg:shadow-none"
      >
        <div className="mx-auto flex max-w-xl items-center gap-4 lg:max-w-none">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="text-muted flex items-center gap-2 text-xs whitespace-nowrap lg:text-sm">
              <span>À payer en magasin</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {totals.checked}/{totals.lines} dans le panier
              </span>
            </p>
            <p className="flex items-baseline gap-3">
              <span className="font-display text-xl font-semibold whitespace-nowrap lg:text-2xl">
                {totals.unpriced ? "≥ " : "≈ "}
                {formatCents(totals.storeCents)}
              </span>
              <span className="text-muted hidden text-sm lg:inline">
                En paquets entiers.{" "}
                {totals.storeCents > totals.knownCents
                  ? `Dont ≈ ${formatCents(totals.knownCents)} pour les ${plan.mealCount} plat${plan.mealCount > 1 ? "s" : ""} (${plan.people} pers.), ≈ ${formatCents(totals.storeCents - totals.knownCents)} restent au garde-manger.`
                  : `Pour ${plan.mealCount} plat${plan.mealCount > 1 ? "s" : ""} (${plan.people} pers.).`}
                {totals.unpriced
                  ? ` ${totals.unpriced} article${totals.unpriced > 1 ? "s" : ""} sans prix.`
                  : ""}
              </span>
            </p>
            {totals.storeCents > totals.knownCents ? (
              <p className="text-muted text-xs lg:hidden">
                Dont ≈ {formatCents(totals.knownCents)} pour les repas, le reste au garde-manger.
              </p>
            ) : null}
            <span
              role="img"
              aria-label={`${totals.checked} articles sur ${totals.lines}`}
              className="bg-surface-muted h-1.5 overflow-hidden rounded-full lg:max-w-md"
            >
              <span
                className="bg-forest dark:bg-brand block h-full rounded-full transition-[width]"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </span>
          </div>
          {done ? (
            <span className="shrink-0">
              <Badge tone="leaf">Courses faites</Badge>
            </span>
          ) : (
            <Link
              href={`/shopping/ranger?semaine=${page.weekStart}`}
              className={buttonClasses("forest", "shrink-0")}
            >
              Finir les courses
            </Link>
          )}
        </div>
      </section>

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
            className={`min-h-10 rounded-full px-4 py-2 text-sm font-semibold ${!byRecipe ? "bg-forest text-cream" : "text-muted"}`}
          >
            Par rayon
          </Link>
          <Link
            href={`${base}&vue=recettes`}
            aria-current={byRecipe ? "true" : undefined}
            scroll={false}
            className={`min-h-10 rounded-full px-4 py-2 text-sm font-semibold ${byRecipe ? "bg-forest text-cream" : "text-muted"}`}
          >
            Par recette
          </Link>
        </div>
        <span className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          Quantité nécessaire ; en dessous, les paquets à prendre.
          {!byRecipe ? (
            <Link href="/settings#rayons" className="text-foreground underline underline-offset-2">
              Ordre de mon magasin
            </Link>
          ) : null}
        </span>
      </div>

      {totals.lines === 0 ? (
        <EmptyState title="Rien à acheter pour le menu">
          Ton garde-manger et ton placard couvrent tout le menu.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          <div
            aria-hidden="true"
            className="text-muted hidden grid-cols-[2.75rem_minmax(0,1fr)_9rem_7rem] gap-4 px-4 text-xs font-semibold tracking-wide uppercase lg:grid"
          >
            <span />
            <span>Produit</span>
            <span className="text-right">Quantité</span>
            <span className="text-right">Prix estimé</span>
          </div>
          {groups.map((group) => (
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
                      image={ingredientImage(line.slug)}
                      name={line.name}
                    >
                      <span className="flex flex-col gap-0.5 lg:grid lg:grid-cols-[minmax(0,1fr)_9rem_7rem] lg:items-center lg:gap-4">
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="item-name text-base font-semibold">{line.name}</span>
                            <span className="shrink-0 text-right text-base font-semibold tabular-nums lg:hidden">
                              {formatShoppingQuantity(line.toBuy)}
                              {line.packHint ? (
                                <span className="text-muted block text-xs font-normal">
                                  {line.packHint}
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <span className="text-muted flex justify-between gap-3 text-sm">
                            {line.perRecipe.length > 1 ? (
                              <SharedNeed line={line} />
                            ) : (
                              <span className="min-w-0 truncate">
                                {line.fromStock.milli > 0
                                  ? `${formatShoppingQuantity(line.fromStock)} déjà chez toi, `
                                  : ""}
                                {byRecipe ? "" : line.recipes.join(", ")}
                              </span>
                            )}
                            <span className="shrink-0 lg:hidden">
                              {line.storeCents !== null
                                ? `≈ ${formatCents(line.storeCents)}`
                                : "sans prix"}
                            </span>
                          </span>
                        </span>
                        <span className="hidden text-right font-semibold tabular-nums lg:block">
                          {formatShoppingQuantity(line.toBuy)}
                          {line.packHint ? (
                            <span className="text-muted block text-xs font-normal">
                              {line.packHint}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={`hidden text-right tabular-nums lg:block ${line.storeCents === null ? "text-muted text-sm" : "font-medium"}`}
                        >
                          {line.storeCents !== null
                            ? `≈ ${formatCents(line.storeCents)}`
                            : "sans prix"}
                        </span>
                      </span>
                    </CheckLine>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {page.isCurrentWeek ? <Extras extras={page.extras} /> : null}

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
      {/* Espace réservé à la barre collée sur téléphone. */}
      <div aria-hidden="true" className="h-20 lg:hidden" />
    </div>
  );
}

/**
 * Aliment partagé entre plusieurs plats : le détail du calcul, pour comprendre pourquoi il
 * faut en racheter alors qu'il en reste (« Dahl 300 ml + Satay 225 ml − 200 ml chez toi »).
 */
function SharedNeed({ line }: { line: ShoppingLineView }) {
  return (
    <span className="min-w-0">
      {line.perRecipe.map((p, i) => (
        <span key={p.recipe}>
          {i > 0 ? " + " : ""}
          {p.recipe}{" "}
          <span className="text-foreground tabular-nums">{formatShoppingQuantity(p.quantity)}</span>
        </span>
      ))}
      {line.fromStock.milli > 0 ? (
        <>
          {" "}
          − <span className="tabular-nums">{formatShoppingQuantity(line.fromStock)}</span> déjà chez
          toi
        </>
      ) : null}
    </span>
  );
}
