import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";
import { AlertIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/domain/money";
import { formatShortDate } from "@/lib/dates";
import { getBudgetPage, type BudgetWeek } from "@/server/modules/budget/queries";
import { getShoppingPage } from "@/server/modules/shopping/queries";

export const metadata: Metadata = { title: "Budget" };
export const maxDuration = 30;

export default function BudgetRoute() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Budget alimentaire"
        description="Ce que coûtent tes menus, estimé avant les courses à partir des prix indicatifs et de tes propres prix."
        actions={
          <Link href="/prices" className={buttonClasses("secondary")}>
            Mes prix
          </Link>
        }
      />
      <Suspense fallback={<PageSkeleton rows={3} />}>
        <BudgetContent />
      </Suspense>
    </div>
  );
}

async function BudgetContent() {
  const [page, shopping] = await Promise.all([getBudgetPage(), getShoppingPage()]);
  if (!page) return <p className="text-muted">Aucun foyer actif.</p>;
  const week = page.weeks.at(-1)!;
  const budget = week.budgetCents ?? page.householdBudgetCents;
  const margin = budget !== null ? budget - week.estimatedCents : null;
  const list = shopping && shopping.plan && "aisles" in shopping ? shopping : null;
  const toBuyCents = list
    ? list.aisles
        .flatMap((a) => a.lines)
        .filter((l) => !l.checked)
        .reduce((s, l) => s + (l.cents ?? 0), 0)
    : null;
  const prefix = week.isMinimum ? "≥ " : "≈ ";

  return (
    <div className="flex flex-col gap-10">
      <section
        aria-label="Cette semaine"
        className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Stat label="Budget de la semaine" kind="objectif">
          {budget !== null ? formatCents(budget) : "Non fixé"}
        </Stat>
        <Stat label="Coût estimé du menu" kind="estimation">
          {week.hasPlan ? `${prefix}${formatCents(week.estimatedCents)}` : "Pas de menu"}
        </Stat>
        <Stat
          label="Marge restante"
          kind="estimation"
          tone={margin !== null && margin < 0 ? "danger" : "success"}
        >
          {margin === null || !week.hasPlan
            ? "—"
            : margin < 0
              ? `${formatCents(-margin)} de dépassement`
              : formatCents(margin)}
        </Stat>
        <Stat label="Achats à venir" kind="estimation">
          {toBuyCents === null
            ? "—"
            : list?.plan?.shoppingDoneAt
              ? "Courses faites"
              : `≈ ${formatCents(toBuyCents)}`}
        </Stat>
      </section>

      <section
        aria-labelledby="reel"
        className="border-border bg-surface flex gap-4 rounded-2xl border p-5"
      >
        <span className="text-warning mt-0.5 shrink-0">
          <AlertIcon size={22} />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 id="reel" className="font-semibold">
            Dépenses réelles : pas encore suivies
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            L&apos;application ne connaît pas encore ce que tu as réellement payé en caisse. Les
            montants de cette page sont des estimations, signalées par ≈ (ou ≥ quand un prix
            manque), jamais présentées comme des dépenses.
          </p>
        </div>
      </section>

      <History weeks={page.weeks} />

      {list && list.aisles.length > 0 ? <ByAisle aisles={list.aisles} /> : null}
    </div>
  );
}

function Stat({
  label,
  kind,
  tone,
  children,
}: {
  label: string;
  kind: "objectif" | "estimation";
  tone?: "danger" | "success";
  children: ReactNode;
}) {
  return (
    <div className="border-border flex flex-col gap-1 border-t pt-4">
      <span className="text-muted text-sm">
        {label} <span className="text-xs">({kind})</span>
      </span>
      <span
        className={`font-display text-3xl font-semibold ${tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : ""}`}
      >
        {children}
      </span>
    </div>
  );
}

/** Coût estimé des menus semaine par semaine, avec le budget fixé en repère. */
function History({ weeks }: { weeks: BudgetWeek[] }) {
  const max = Math.max(1, ...weeks.map((w) => Math.max(w.estimatedCents, w.budgetCents ?? 0)));
  return (
    <section aria-labelledby="historique" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="historique" className="type-section">
          Coût estimé des menus, 8 dernières semaines
        </h2>
        <p className="text-muted text-sm">
          Barre : coût estimé du menu. Trait : budget fixé cette semaine-là.
        </p>
      </div>
      <figure className="flex flex-col gap-3">
        <div
          className="border-border flex h-56 items-end gap-2 border-b sm:gap-4"
          aria-hidden="true"
        >
          {weeks.map((w) => {
            const h = (w.estimatedCents / max) * 100;
            const b = w.budgetCents !== null ? (w.budgetCents / max) * 100 : null;
            return (
              <div
                key={w.weekStart}
                className="group relative flex h-full flex-1 items-end justify-center"
                title={`Semaine du ${formatShortDate(w.weekStart)} : ${w.hasPlan ? `${w.isMinimum ? "≥" : "≈"} ${formatCents(w.estimatedCents)}` : "pas de menu"}${w.budgetCents !== null ? `, budget ${formatCents(w.budgetCents)}` : ""}`}
              >
                {w.hasPlan ? (
                  <div
                    className="bg-brand w-full max-w-12 rounded-t-[4px]"
                    style={{ height: `${Math.max(h, 1)}%` }}
                  />
                ) : null}
                {b !== null ? (
                  <div
                    className="border-accent-strong absolute inset-x-0 border-t-2 border-dashed"
                    style={{ bottom: `${b}%` }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 sm:gap-4" aria-hidden="true">
          {weeks.map((w) => (
            <span key={w.weekStart} className="text-muted flex-1 text-center text-xs">
              {formatShortDate(w.weekStart)}
            </span>
          ))}
        </div>
        <details>
          <summary className="text-brand cursor-pointer text-sm font-semibold">
            Voir les valeurs
          </summary>
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">Coût estimé des menus et budget par semaine</caption>
            <thead className="text-muted text-left">
              <tr>
                <th scope="col" className="py-1.5 font-medium">
                  Semaine du
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  Coût estimé
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  Budget
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {weeks.map((w) => (
                <tr key={w.weekStart}>
                  <td className="py-1.5">{formatShortDate(w.weekStart)}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {w.hasPlan
                      ? `${w.isMinimum ? "≥ " : "≈ "}${formatCents(w.estimatedCents)}`
                      : "pas de menu"}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {w.budgetCents !== null ? formatCents(w.budgetCents) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </figure>
    </section>
  );
}

/** Répartition de la liste de courses de la semaine par rayon (articles avec un prix). */
function ByAisle({
  aisles,
}: {
  aisles: { category: string; label: string; lines: { cents: number | null }[] }[];
}) {
  const rows = aisles
    .map((a) => ({
      label: a.label,
      cents: a.lines.reduce((s, l) => s + (l.cents ?? 0), 0),
      unpriced: a.lines.filter((l) => l.cents === null).length,
    }))
    .filter((r) => r.cents > 0 || r.unpriced > 0)
    .sort((a, b) => b.cents - a.cents);
  const max = Math.max(1, ...rows.map((r) => r.cents));
  return (
    <section aria-labelledby="rayons" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="rayons" className="type-section">
          Courses de la semaine par rayon
        </h2>
        <p className="text-muted text-sm">Estimation, articles déjà chez toi exclus.</p>
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li
            key={r.label}
            className="grid grid-cols-[8.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 text-sm sm:grid-cols-[11rem_minmax(0,1fr)_6rem]"
          >
            <span className="truncate font-medium">{r.label}</span>
            <span className="bg-surface-muted h-3 overflow-hidden rounded-full">
              <span
                className="bg-leaf block h-full rounded-full"
                style={{ width: `${(r.cents / max) * 100}%` }}
              />
            </span>
            <span className="text-right tabular-nums">
              {r.unpriced ? "≥ " : "≈ "}
              {formatCents(r.cents)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
