import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AddExpenseForm, EditExpense } from "@/components/budget/expense-forms";
import { ON_FOREST } from "@/components/ui/hero";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/domain/money";
import { formatLongDate, formatShortDate } from "@/lib/dates";
import type { WeekSpending } from "@/domain/budget/spending";
import { getBudgetPage, type BudgetWeek, type ExpenseView } from "@/server/modules/budget/queries";
import { getShoppingPage } from "@/server/modules/shopping/queries";

export const metadata: Metadata = { title: "Budget" };
export const maxDuration = 30;

export default function BudgetRoute() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Budget alimentaire"
        decor="leaf"
        description="Ce que coûtent tes menus, estimé avant les courses, et ce que tu as vraiment payé en caisse."
        actions={
          <Link href="/prices" className={ON_FOREST}>
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
  const paid = week.spending;
  // Marge réelle dès qu'une dépense est saisie, sinon estimée d'après le menu.
  const margin =
    budget === null
      ? null
      : paid
        ? budget - paid.foodCents
        : week.hasPlan
          ? budget - week.estimatedCents
          : null;
  const list = shopping && shopping.plan && "aisles" in shopping ? shopping : null;
  const toBuyCents = list
    ? list.aisles
        .flatMap((a) => a.lines)
        .filter((l) => !l.checked)
        .reduce((s, l) => s + (l.storeCents ?? 0), 0)
    : null;
  const prefix = week.isMinimum ? "≥ " : "≈ ";

  return (
    <div className="flex flex-col gap-10">
      <section
        aria-label="Cette semaine"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
      >
        <Stat label="Budget de la semaine" kind="objectif" fill="bg-brand-soft">
          {budget !== null ? formatCents(budget) : "Non fixé"}
        </Stat>
        <Stat label="Coût estimé du menu" kind="estimation" fill="bg-highlight-soft">
          {week.hasPlan ? `${prefix}${formatCents(week.estimatedCents)}` : "Pas de menu"}
        </Stat>
        <Stat
          label="Payé en caisse"
          kind="réel"
          fill="bg-accent-soft"
          foot={
            paid
              ? paid.nonFoodCents > 0
                ? `dont ${formatCents(paid.nonFoodCents)} non alimentaire`
                : undefined
              : list?.plan?.shoppingDoneAt
                ? "Courses faites, montant non saisi"
                : toBuyCents
                  ? `≈ ${formatCents(toBuyCents)} à payer en magasin`
                  : undefined
          }
        >
          {paid ? formatCents(paid.paidCents) : "Non saisi"}
        </Stat>
        <Stat
          label={margin !== null && margin < 0 ? "Dépassement" : "Marge restante"}
          kind={paid ? "réel" : "estimation"}
          fill="bg-leaf-soft"
          tone={margin !== null && margin < 0 ? "danger" : "success"}
        >
          {margin === null ? "—" : formatCents(Math.abs(margin))}
        </Stat>
      </section>

      <Paid
        spending={paid}
        menuCents={week.hasPlan ? week.estimatedCents : null}
        menuIsMinimum={week.isMinimum}
        expenses={page.expenses}
        today={page.today}
        formKey={page.newKey()}
        store={page.referenceStore}
      />

      <History weeks={page.weeks} />

      {list && list.aisles.length > 0 ? <ByAisle aisles={list.aisles} /> : null}
    </div>
  );
}

function Stat({
  label,
  kind,
  tone,
  fill,
  foot,
  children,
}: {
  label: string;
  kind: "objectif" | "estimation" | "réel";
  /** Précision sous le montant. */
  foot?: string;
  tone?: "danger" | "success";
  /** Fond de la tuile (couleur douce de la charte). */
  fill: string;
  children: ReactNode;
}) {
  return (
    <div className={`${fill} flex min-h-28 flex-col justify-between gap-2 rounded-3xl p-4 lg:p-5`}>
      <span className="text-muted text-sm leading-snug">
        {label} <span className="text-xs">({kind})</span>
      </span>
      <span
        className={`font-display text-2xl leading-tight font-semibold lg:text-3xl ${tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : ""}`}
      >
        {children}
      </span>
      {foot ? <span className="text-muted text-xs leading-snug">{foot}</span> : null}
    </div>
  );
}

/** Ce qui a vraiment été payé cette semaine, d'où vient l'écart, et la saisie des dépenses. */
function Paid({
  spending,
  menuCents,
  menuIsMinimum,
  expenses,
  today,
  formKey,
  store,
}: {
  spending: WeekSpending | null;
  menuCents: number | null;
  menuIsMinimum: boolean;
  expenses: ExpenseView[];
  today: string;
  formKey: string;
  store: string | null;
}) {
  const b = spending?.breakdown ?? null;
  return (
    <section aria-labelledby="paye" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="paye" className="type-section">
          Payé cette semaine
        </h2>
        <p className="text-muted text-sm">
          {spending
            ? b
              ? `${formatCents(spending.foodCents)} payés pour l'alimentaire. D'où ils viennent, d'après l'estimation de ta liste au moment des courses :`
              : "Ces dépenses ont été saisies à part : il n'y a pas d'estimation de liste à laquelle les comparer. Indique le total à la fin des courses pour voir d'où vient l'écart."
            : "Rien de saisi pour l'instant. À la fin des courses, indique le total de ton ticket, ou ajoute une dépense ci-dessous."}
        </p>
      </div>

      {spending && b ? <Breakdown foodCents={spending.foodCents} breakdown={b} /> : null}
      {spending && b && menuCents !== null ? (
        <p className="text-muted text-sm">
          Pour comparer : les plats du menu coûtent {menuIsMinimum ? "≥ " : "≈ "}
          {formatCents(menuCents)} en tout, ingrédients déjà chez toi compris.
        </p>
      ) : null}

      {expenses.length > 0 ? (
        <ul className="bg-surface border-border divide-border flex flex-col divide-y rounded-3xl border">
          {expenses.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3"
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold tabular-nums">
                  {formatCents(e.amountCents)}
                  {e.nonFoodCents > 0 ? (
                    <span className="text-muted text-sm font-normal">
                      {" "}
                      dont {formatCents(e.nonFoodCents)} non alimentaire
                    </span>
                  ) : null}
                </span>
                <span className="text-muted text-sm first-letter:uppercase">
                  {formatLongDate(e.spentOn)}
                  {e.storeLabel ? ` · ${e.storeLabel}` : ""}
                  {e.source === "courses" ? " · fin des courses" : ""}
                </span>
              </span>
              <EditExpense expense={e} today={today} />
            </li>
          ))}
        </ul>
      ) : null}

      <AddExpenseForm formKey={formKey} today={today} store={store} />
    </section>
  );
}

/** Barre empilée : plats du menu, reste au garde-manger, autres achats ou écarts de prix. */
function Breakdown({
  foodCents,
  breakdown,
}: {
  foodCents: number;
  breakdown: NonNullable<WeekSpending["breakdown"]>;
}) {
  const approx = breakdown.isMinimum ? "≥ " : "≈ ";
  const parts = [
    {
      label: "Plats du menu",
      note: "achats prévus pour les recettes de la semaine",
      cents: breakdown.meals,
      color: "bg-brand",
      prefix: approx,
    },
    {
      label: "Reste au garde-manger",
      note: "les paquets entiers dépassent la quantité des recettes",
      cents: breakdown.pantry,
      color: "bg-highlight",
      prefix: approx,
    },
    {
      label:
        breakdown.other >= 0 ? "Autres achats ou écarts de prix" : "Moins cher que l'estimation",
      note:
        breakdown.other >= 0
          ? "hors liste, ou prix différents de l'estimation"
          : "la caisse a coûté moins que la liste estimée",
      cents: breakdown.other,
      color: "bg-accent",
      prefix: "",
    },
  ];
  const total = Math.max(
    1,
    breakdown.meals + breakdown.pantry + Math.max(0, breakdown.other),
    foodCents,
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface-muted flex h-4 overflow-hidden rounded-full" aria-hidden="true">
        {parts
          .filter((p) => p.cents > 0)
          .map((p) => (
            <span
              key={p.label}
              className={p.color}
              style={{ width: `${(p.cents / total) * 100}%` }}
            />
          ))}
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.label} className="flex gap-3">
            <span className={`${p.color} mt-1.5 size-3 shrink-0 rounded-full`} aria-hidden="true" />
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{p.label}</span>
              <span className="font-display text-xl font-semibold tabular-nums">
                {p.cents < 0 ? "− " : p.prefix}
                {formatCents(Math.abs(p.cents))}
              </span>
              <span className="text-muted text-xs">{p.note}</span>
            </span>
          </li>
        ))}
      </ul>
      {breakdown.isMinimum ? (
        <p className="text-muted text-xs">
          Des produits de la liste n&apos;avaient pas de prix : l&apos;estimation est un minimum, et
          les « autres achats » sont surestimés d&apos;autant.
        </p>
      ) : null}
    </div>
  );
}

/** Coût estimé et payé semaine par semaine, avec le budget fixé en repère. */
function History({ weeks }: { weeks: BudgetWeek[] }) {
  const max = Math.max(
    1,
    ...weeks.map((w) => Math.max(w.estimatedCents, w.budgetCents ?? 0, w.spending?.foodCents ?? 0)),
  );
  return (
    <section aria-labelledby="historique" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="historique" className="type-section">
          Estimé et payé, 8 dernières semaines
        </h2>
        <p className="text-muted text-sm">
          Barre verte : coût estimé du menu. Barre orange : payé pour l&apos;alimentaire (saisi).
          Trait : budget fixé cette semaine-là.
        </p>
      </div>
      <figure className="flex flex-col gap-3">
        <div
          className="border-border flex h-56 items-end gap-2 border-b sm:gap-4"
          aria-hidden="true"
        >
          {weeks.map((w) => {
            const h = (w.estimatedCents / max) * 100;
            const p = w.spending ? (w.spending.foodCents / max) * 100 : null;
            const b = w.budgetCents !== null ? (w.budgetCents / max) * 100 : null;
            return (
              <div
                key={w.weekStart}
                className="group relative flex h-full flex-1 items-end justify-center gap-1"
                title={`Semaine du ${formatShortDate(w.weekStart)} : ${w.hasPlan ? `${w.isMinimum ? "≥" : "≈"} ${formatCents(w.estimatedCents)}` : "pas de menu"}${w.spending ? `, payé ${formatCents(w.spending.foodCents)}` : ""}${w.budgetCents !== null ? `, budget ${formatCents(w.budgetCents)}` : ""}`}
              >
                {w.hasPlan ? (
                  <div
                    className="bg-brand w-full max-w-8 rounded-t-[4px]"
                    style={{ height: `${Math.max(h, 1)}%` }}
                  />
                ) : null}
                {p !== null ? (
                  <div
                    className="bg-accent w-full max-w-8 rounded-t-[4px]"
                    style={{ height: `${Math.max(p, 1)}%` }}
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
            <caption className="sr-only">
              Coût estimé des menus, montant payé et budget par semaine
            </caption>
            <thead className="text-muted text-left">
              <tr>
                <th scope="col" className="py-1.5 font-medium">
                  Semaine du
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  Coût estimé
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  Payé
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
                    {w.spending ? formatCents(w.spending.foodCents) : "non saisi"}
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
