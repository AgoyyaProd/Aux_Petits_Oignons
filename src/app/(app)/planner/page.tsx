import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GenerateForm } from "@/components/planner/generate-form";
import { PlanActionButton } from "@/components/planner/entry-action";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { centsToInput, formatCents } from "@/domain/money";
import { formatShortDate } from "@/lib/dates";
import { formatWeek } from "@/lib/week";
import {
  addEntryAction,
  removeEntryAction,
  replaceEntryAction,
  setServingsAction,
  toggleLockAction,
} from "@/server/modules/planning/actions";
import {
  getPlannerPage,
  type PlannerEntryView,
  type PlannerPage,
} from "@/server/modules/planning/queries";

export const metadata: Metadata = { title: "Menu de la semaine" };

// La génération et la sauvegarde lisent recettes, prix et stock : on laisse de la marge.
export const maxDuration = 30;

export default function PlannerPageRoute({ searchParams }: PageProps<"/planner">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Menu de la semaine</h1>
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <PlannerContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function PlannerContent({ searchParams }: Pick<PageProps<"/planner">, "searchParams">) {
  const sp = await searchParams;
  const replace = Number(one(sp.remplacer));
  const page = await getPlannerPage({
    week: one(sp.semaine),
    replace: Number.isInteger(replace) ? replace : undefined,
  });
  if (!page) return <p className="text-muted">Aucun foyer actif.</p>;

  return (
    <div className="flex flex-col gap-5">
      <WeekNav page={page} />
      {page.plan ? (
        <PlanView page={page} error={one(sp.erreur) === "1"} />
      ) : (
        <EmptyPlan page={page} />
      )}
      <PriceSourceNote page={page} />
    </div>
  );
}

function WeekNav({ page }: { page: PlannerPage }) {
  const link = "text-brand flex min-h-11 min-w-11 items-center justify-center rounded-xl text-lg";
  return (
    <nav aria-label="Semaine" className="flex items-center justify-between gap-2">
      <Link
        href={`/planner?semaine=${page.previousWeek}`}
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
        href={`/planner?semaine=${page.nextWeek}`}
        className={link}
        aria-label="Semaine suivante"
      >
        →
      </Link>
    </nav>
  );
}

function EmptyPlan({ page }: { page: PlannerPage }) {
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Préparer le menu</h2>
        <p className="text-muted text-sm">
          Indique le nombre de repas, de personnes et ton budget : on te propose des plats
          compatibles avec tes préférences, qui utilisent d&apos;abord ce qui doit être consommé
          dans ton garde-manger. Tu pourras ensuite remplacer ou retirer chaque plat.
        </p>
      </div>
      <GenerateForm
        week={page.weekStart}
        version={null}
        formKey={page.newKey()}
        defaults={{
          mealCount: page.defaults.mealCount,
          people: page.defaults.people,
          budget: centsToInput(page.defaults.budgetCents),
        }}
        submitLabel="Proposer un menu"
      />
      <p className="text-muted text-xs">
        {page.candidateCount} recette{page.candidateCount > 1 ? "s" : ""} correspond
        {page.candidateCount > 1 ? "ent" : ""} à tes préférences.
      </p>
    </section>
  );
}

function PlanView({ page, error }: { page: PlannerPage; error: boolean }) {
  const plan = page.plan!;
  const base = { week: page.weekStart, version: plan.version };
  const lockedCount = page.entries.filter((e) => e.locked).length;

  return (
    <>
      <Summary page={page} />
      {error ? (
        <Alert tone="error">Ce remplacement n&apos;a pas pu être enregistré. Réessaie.</Alert>
      ) : null}
      <ol className="flex flex-col gap-3">
        {page.entries.map((entry) => (
          <li key={entry.position}>
            <EntryCard entry={entry} page={page} base={base} />
          </li>
        ))}
      </ol>
      {page.entries.length < 21 ? (
        <div className="flex">
          <PlanActionButton
            action={addEntryAction}
            fields={{ ...base, key: page.newKey() }}
            label="Ajouter un plat"
            pendingLabel="Ajout…"
            className={buttonClasses("secondary", "w-full")}
          >
            + Ajouter un plat
          </PlanActionButton>
        </div>
      ) : null}
      <details className="border-border bg-surface rounded-2xl border p-4">
        <summary className="cursor-pointer font-semibold">
          Modifier et relancer la proposition
        </summary>
        <div className="mt-4">
          <GenerateForm
            week={page.weekStart}
            version={plan.version}
            formKey={page.newKey()}
            defaults={{
              mealCount: plan.mealCount,
              people: plan.people,
              budget: centsToInput(plan.budgetCents),
            }}
            submitLabel="Relancer"
            lockedCount={lockedCount}
          />
        </div>
      </details>
    </>
  );
}

function Summary({ page }: { page: PlannerPage }) {
  const plan = page.plan!;
  const { cents, entriesWithMissing, missingNames } = page.totals;
  const budget = plan.budgetCents;
  const over = budget !== null && cents > budget;
  const prefix = entriesWithMissing > 0 ? "≥ " : "≈ ";

  return (
    <section
      aria-label="Coût estimé"
      className="border-border bg-surface flex flex-col gap-2 rounded-2xl border p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-muted text-sm">
          {page.entries.length} plat{page.entries.length > 1 ? "s" : ""} · {plan.people} pers.
        </span>
        <span className="text-2xl font-bold tabular-nums">
          {prefix}
          {formatCents(cents)}
        </span>
      </div>
      {budget !== null ? (
        <p className={`text-sm font-medium ${over ? "text-danger" : "text-success"}`}>
          {over
            ? `Dépasse ton budget de ${formatCents(cents - budget)} (budget ${formatCents(budget)}).`
            : `Dans ton budget : il reste ${formatCents(budget - cents)} sur ${formatCents(budget)}.`}
        </p>
      ) : null}
      {plan.shoppingDoneAt ? (
        <p className="text-success text-sm font-medium">
          Courses faites ✓ Quand tu as préparé un plat, ouvre sa recette et appuie sur « Cuisiné »
          pour retirer ses ingrédients du garde-manger.
        </p>
      ) : (
        <Link
          href={`/shopping?semaine=${page.weekStart}`}
          className="text-brand text-sm font-medium underline"
        >
          Voir la liste de courses
        </Link>
      )}
      {entriesWithMissing > 0 ? (
        <p className="text-muted text-xs">
          Sans prix connu, non comptés : {missingNames.join(", ")}. Le total est donc un minimum.{" "}
          <Link href="/prices" className="text-brand font-medium underline">
            Ajouter mes prix
          </Link>
        </p>
      ) : null}
    </section>
  );
}

function EntryCard({
  entry,
  page,
  base,
}: {
  entry: PlannerEntryView;
  page: PlannerPage;
  base: { week: string; version: number };
}) {
  const small =
    "border-border hover:bg-brand-soft flex min-h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm";
  const fields = { ...base, position: entry.position };
  const replacing = page.replace === entry.position;

  return (
    <article
      className={[
        "bg-surface flex flex-col gap-3 rounded-2xl border p-4",
        entry.locked ? "border-brand" : "border-border",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          {entry.slug ? (
            <Link href={`/recipes/${entry.slug}`} className="font-semibold hover:underline">
              {entry.title}
            </Link>
          ) : (
            <span className="text-muted font-semibold">{entry.title}</span>
          )}
          <span className="text-muted text-xs">
            {entry.totalMinutes !== null ? `${entry.totalMinutes} min · ` : ""}
            {entry.cooked ? "Cuisiné ✓" : entry.locked ? "Gardé" : `Plat ${entry.position}`}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="font-semibold tabular-nums">
            {entry.missingNames.length ? "≥ " : "≈ "}
            {formatCents(entry.cents)}
          </span>
          {entry.missingNames.length ? (
            <span className="text-muted text-xs">{entry.missingNames.length} sans prix</span>
          ) : null}
        </div>
      </div>

      {entry.cooked ? null : !entry.available ? (
        <Alert tone="error">
          Cette recette ne correspond plus à tes préférences : remplace-la.
        </Alert>
      ) : null}

      {entry.cooked ? (
        <p className="text-muted text-sm">
          {entry.servings} portion{entry.servings > 1 ? "s" : ""} · ingrédients retirés du
          garde-manger.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1" role="group" aria-label="Portions">
            <PlanActionButton
              action={setServingsAction}
              fields={{ ...fields, servings: Math.max(1, entry.servings - 1), key: page.newKey() }}
              label="Une portion de moins"
              className={small}
            >
              −
            </PlanActionButton>
            <span className="min-w-20 text-center text-sm tabular-nums">
              {entry.servings} portion{entry.servings > 1 ? "s" : ""}
            </span>
            <PlanActionButton
              action={setServingsAction}
              fields={{ ...fields, servings: Math.min(40, entry.servings + 1), key: page.newKey() }}
              label="Une portion de plus"
              className={small}
            >
              +
            </PlanActionButton>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <PlanActionButton
              action={toggleLockAction}
              fields={{ ...fields, key: page.newKey() }}
              label={entry.locked ? "Ne plus garder ce plat" : "Garder ce plat si je relance"}
              className={`${small} ${entry.locked ? "bg-brand-soft text-brand" : ""}`}
            >
              {entry.locked ? "Gardé ✓" : "Garder"}
            </PlanActionButton>
            <Link
              href={
                replacing
                  ? `/planner?semaine=${page.weekStart}`
                  : `/planner?semaine=${page.weekStart}&remplacer=${entry.position}`
              }
              className={small}
              scroll={false}
            >
              {replacing ? "Annuler" : "Remplacer"}
            </Link>
            <PlanActionButton
              action={removeEntryAction}
              fields={{ ...fields, key: page.newKey() }}
              label={`Retirer ${entry.title} du menu`}
              className={`${small} text-danger`}
            >
              Retirer
            </PlanActionButton>
          </div>
        </div>
      )}

      {replacing ? <Replacements page={page} entry={entry} base={base} /> : null}
    </article>
  );
}

function Replacements({
  page,
  entry,
  base,
}: {
  page: PlannerPage;
  entry: PlannerEntryView;
  base: { week: string; version: number };
}) {
  if (page.replacements.length === 0) {
    return <p className="text-muted text-sm">Aucune autre recette compatible à proposer.</p>;
  }
  return (
    <div className="border-border flex flex-col gap-2 border-t pt-3">
      <p className="text-sm font-medium">Remplacer par :</p>
      <ul className="flex flex-col gap-2">
        {page.replacements.map((r) => (
          <li key={r.recipeId}>
            <form
              action={replaceEntryAction}
              className="bg-background flex items-center justify-between gap-3 rounded-xl p-3"
            >
              <input type="hidden" name="week" value={base.week} />
              <input type="hidden" name="version" value={base.version} />
              <input type="hidden" name="key" value={page.newKey()} />
              <input type="hidden" name="position" value={entry.position} />
              <input type="hidden" name="recipeId" value={r.recipeId} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{r.title}</span>
                <span className="text-muted text-xs">
                  {r.totalMinutes} min · {r.missing ? "≥ " : "≈ "}
                  {formatCents(r.cents)}
                </span>
              </div>
              <button type="submit" className={buttonClasses("primary", "min-h-10 shrink-0 px-3")}>
                Choisir
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PriceSourceNote({ page }: { page: PlannerPage }) {
  return (
    <p className="text-muted text-xs">
      Prix indicatifs : médiane des relevés publics{" "}
      <a
        href="https://prices.openfoodfacts.org"
        className="underline"
        target="_blank"
        rel="noreferrer"
      >
        Open Prices
      </a>{" "}
      (Open Food Facts, licence ODbL) faits en France
      {page.prices.lastObservation
        ? `, dernier relevé le ${formatShortDate(page.prices.lastObservation)}`
        : ""}
      . Ce ne sont pas les prix exacts{" "}
      {page.referenceStore ? `de ${page.referenceStore}` : "de ton magasin"} :{" "}
      <Link href="/prices" className="text-brand font-medium underline">
        tes propres prix
      </Link>{" "}
      les remplacent. Aucun prix n&apos;est inventé : un ingrédient sans relevé reste « sans prix ».
    </p>
  );
}
