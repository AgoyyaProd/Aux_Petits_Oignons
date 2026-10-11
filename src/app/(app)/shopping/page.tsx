import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckLine } from "@/components/shopping/check-line";
import { buttonClasses } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/domain/money";
import { formatShoppingQuantity } from "@/lib/format-quantity";
import { formatWeek } from "@/lib/week";
import { getShoppingPage, type ShoppingPage } from "@/server/modules/shopping/queries";

export const metadata: Metadata = { title: "Courses" };
export const maxDuration = 30;

export default function ShoppingRoute({ searchParams }: PageProps<"/shopping">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Liste de courses</h1>
      <Suspense fallback={<PageSkeleton rows={5} />}>
        <ShoppingContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ShoppingContent({ searchParams }: Pick<PageProps<"/shopping">, "searchParams">) {
  const sp = await searchParams;
  const page = await getShoppingPage(typeof sp.semaine === "string" ? sp.semaine : undefined);
  if (!page) return <p className="text-muted">Aucun foyer actif.</p>;

  return (
    <div className="flex flex-col gap-5">
      <WeekNav page={page} />
      {!page.plan ? (
        <section className="border-border bg-surface flex flex-col items-start gap-3 rounded-2xl border p-4">
          <p className="text-sm">
            Aucun menu pour cette semaine : la liste se calcule à partir du menu.
          </p>
          <Link href={`/planner?semaine=${page.weekStart}`} className={buttonClasses("primary")}>
            Préparer le menu
          </Link>
        </section>
      ) : (
        <ListView page={page} />
      )}
    </div>
  );
}

function WeekNav({ page }: { page: ShoppingPage }) {
  const link = "text-brand flex min-h-11 min-w-11 items-center justify-center rounded-xl text-lg";
  return (
    <nav aria-label="Semaine" className="flex items-center justify-between gap-2">
      <Link
        href={`/shopping?semaine=${page.previousWeek}`}
        className={link}
        aria-label="Semaine précédente"
      >
        ←
      </Link>
      <div className="flex flex-col items-center text-center">
        <span className="font-semibold">{formatWeek(page.weekStart)}</span>
        {page.isCurrentWeek ? <span className="text-muted text-xs">Cette semaine</span> : null}
      </div>
      <Link
        href={`/shopping?semaine=${page.nextWeek}`}
        className={link}
        aria-label="Semaine suivante"
      >
        →
      </Link>
    </nav>
  );
}

function ListView({ page }: { page: Extract<ShoppingPage, { aisles: unknown }> }) {
  const { totals } = page;
  return (
    <>
      <section className="border-border bg-surface flex flex-col gap-2 rounded-2xl border p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted text-sm">
            {totals.lines} article{totals.lines > 1 ? "s" : ""} · {totals.checked} dans le panier
          </span>
          <span className="text-xl font-bold tabular-nums">
            {totals.unpriced ? "≥ " : "≈ "}
            {formatCents(totals.knownCents)}
          </span>
        </div>
        <p className="text-muted text-xs">
          Pour {page.plan!.mealCount} plat{page.plan!.mealCount > 1 ? "s" : ""} ({page.plan!.people}{" "}
          pers.), déduction faite de ton garde-manger et de ton placard. Quantités nécessaires, pas
          des tailles de paquet.
          {totals.unpriced ? ` ${totals.unpriced} article(s) sans prix, non comptés.` : ""}
        </p>
        {totals.lines > 0 ? (
          <Link
            href={`/shopping/ranger?semaine=${page.weekStart}`}
            className={buttonClasses(totals.checked ? "primary" : "secondary", "mt-1")}
          >
            Ranger mes courses au garde-manger
          </Link>
        ) : null}
      </section>

      {page.warnings.length ? (
        <ul className="border-border bg-brand-soft flex flex-col gap-1 rounded-2xl border p-3 text-sm">
          {page.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      {totals.lines === 0 ? (
        <p className="text-success text-sm font-medium">
          Rien à acheter : ton garde-manger et ton placard couvrent tout le menu.
        </p>
      ) : null}

      {page.aisles.map((aisle) => (
        <section key={aisle.category} className="flex flex-col gap-1">
          <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
            {aisle.label}
          </h2>
          <ul className="border-border bg-surface divide-border divide-y rounded-2xl border px-4">
            {aisle.lines.map((line) => (
              <li key={`${line.ingredientId}|${line.dimension}`}>
                <CheckLine
                  week={page.weekStart}
                  ingredientId={line.ingredientId}
                  dimension={line.dimension}
                  checked={line.checked}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{line.name}</span>
                    <span className="shrink-0 tabular-nums">
                      {formatShoppingQuantity(line.toBuy)}
                    </span>
                  </span>
                  <span className="text-muted flex justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate">
                      {line.fromStock.milli > 0
                        ? `${formatShoppingQuantity(line.fromStock)} déjà en stock · `
                        : ""}
                      {line.recipes.join(", ")}
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
      ))}

      {page.covered.length || page.cupboard.length ? (
        <details className="border-border bg-surface rounded-2xl border p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            Déjà chez toi ({page.covered.length + page.cupboard.length})
          </summary>
          <ul className="text-muted mt-3 flex flex-col gap-1 text-sm">
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
    </>
  );
}
