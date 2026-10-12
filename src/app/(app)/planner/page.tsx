import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlanActionButton } from "@/components/planner/entry-action";
import { GenerateForm } from "@/components/planner/generate-form";
import { SlotSelect } from "@/components/planner/slot-select";
import { WeekBalancePanel } from "@/components/planner/week-balance";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClasses, iconButtonClasses } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartIcon,
  LockIcon,
  MinusIcon,
  PlusIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { ACTIONS_ROW, Responsive } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { centsToInput, formatCents } from "@/domain/money";
import { formatShortDate } from "@/lib/dates";
import { formatDay, formatWeek } from "@/lib/week";
import {
  addEntryAction,
  removeEntryAction,
  reorganizeAction,
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
    <Suspense fallback={<PageSkeleton rows={4} />}>
      <PlannerContent searchParams={searchParams} />
    </Suspense>
  );
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type Base = { week: string; version: number };

async function PlannerContent({ searchParams }: Pick<PageProps<"/planner">, "searchParams">) {
  const sp = await searchParams;
  const replace = Number(one(sp.remplacer));
  const page = await getPlannerPage({
    week: one(sp.semaine),
    replace: Number.isInteger(replace) ? replace : undefined,
  });
  if (!page) return <p className="text-muted">Aucun foyer actif.</p>;
  const base = page.plan ? { week: page.weekStart, version: page.plan.version } : null;

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex w-full flex-col gap-3 sm:w-auto">
          <h1 className="type-page">Mon menu de la semaine</h1>
          <WeekNav page={page} />
        </div>
        {base ? (
          <div className={ACTIONS_ROW}>
            <PlanActionButton
              action={reorganizeAction}
              fields={{ ...base, key: page.newKey() }}
              label="Réorganiser ma semaine : replacer les plats non cuisinés sur les prochains repas"
              pendingLabel="Réorganisation…"
              className={buttonClasses("secondary")}
            >
              <Responsive short="Réorganiser" long="Réorganiser ma semaine" />
            </PlanActionButton>
            <a href="#generer" className={buttonClasses("primary")}>
              <RefreshIcon size={18} />
              <Responsive short="Générer" long="Générer mon menu" />
            </a>
          </div>
        ) : null}
      </header>

      {page.plan && base ? (
        <>
          <Summary page={page} />
          {one(sp.erreur) === "1" ? (
            <Alert tone="error">Ce remplacement n&apos;a pas pu être enregistré. Réessaie.</Alert>
          ) : null}
          <Replacements page={page} base={base} />
          <WeekGrid page={page} base={base} />
          <WeekBalancePanel balance={page.balance} />
          <Regenerate page={page} />
        </>
      ) : (
        <EmptyPlan page={page} />
      )}
      <PriceSourceNote page={page} />
    </div>
  );
}

function WeekNav({ page }: { page: PlannerPage }) {
  return (
    <nav aria-label="Semaine" className="flex w-full items-center justify-between gap-2 sm:w-auto">
      <Link
        href={`/planner?semaine=${page.previousWeek}`}
        className={iconButtonClasses()}
        aria-label="Semaine précédente"
      >
        <ChevronLeftIcon size={20} />
      </Link>
      <span className="flex-1 text-center font-semibold sm:min-w-52">
        {formatWeek(page.weekStart).replace("Semaine du", "Du")}
        {page.isCurrentWeek ? (
          <span className="text-muted block text-xs font-medium">Cette semaine</span>
        ) : null}
      </span>
      <Link
        href={`/planner?semaine=${page.nextWeek}`}
        className={iconButtonClasses()}
        aria-label="Semaine suivante"
      >
        <ChevronRightIcon size={20} />
      </Link>
    </nav>
  );
}

function EmptyPlan({ page }: { page: PlannerPage }) {
  return (
    <section
      id="generer"
      className="bg-forest text-cream grid gap-8 rounded-2xl p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr]"
    >
      <div className="flex flex-col gap-3">
        <h2 className="type-page">Générer mon menu</h2>
        <p className="leading-relaxed text-[#d8e2da]">
          Indique le nombre de repas, de personnes et ton budget. Les plats proposés respectent tes
          allergies et régimes, ton temps de préparation, utilisent d&apos;abord les produits à
          consommer vite et ce que tu as en stock. Tu pourras ensuite les déplacer, les remplacer ou
          en retirer.
        </p>
        <p className="text-sm text-[#b9cbb1]">
          {page.candidateCount} recette{page.candidateCount > 1 ? "s" : ""} compatible
          {page.candidateCount > 1 ? "s" : ""} avec tes préférences.
        </p>
      </div>
      <div className="bg-surface text-foreground rounded-xl p-5">
        <GenerateForm
          week={page.weekStart}
          version={null}
          formKey={page.newKey()}
          defaults={{
            mealCount: page.defaults.mealCount,
            people: page.defaults.people,
            budget: centsToInput(page.defaults.budgetCents),
          }}
          submitLabel="Générer mon menu"
        />
      </div>
    </section>
  );
}

function Regenerate({ page }: { page: PlannerPage }) {
  const plan = page.plan!;
  const lockedCount = page.entries.filter((e) => e.locked).length;
  return (
    <section
      id="generer"
      aria-labelledby="generer-titre"
      className="bg-surface border-border grid scroll-mt-24 gap-6 rounded-2xl border p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]"
    >
      <div className="flex flex-col gap-2">
        <h2 id="generer-titre" className="type-section">
          Générer à nouveau
        </h2>
        <p className="text-muted text-sm leading-relaxed">
          Les plats marqués « Gardé » et ceux déjà cuisinés restent ; les autres sont remplacés par
          une nouvelle proposition, en évitant les plats des deux semaines précédentes.
        </p>
      </div>
      <GenerateForm
        week={page.weekStart}
        version={plan.version}
        formKey={page.newKey()}
        defaults={{
          mealCount: plan.mealCount,
          people: plan.people,
          budget: centsToInput(plan.budgetCents),
        }}
        submitLabel="Générer mon menu"
        lockedCount={lockedCount}
      />
    </section>
  );
}

function Summary({ page }: { page: PlannerPage }) {
  const plan = page.plan!;
  const { cents, entriesWithMissing, missingNames } = page.totals;
  const budget = plan.budgetCents;
  const over = budget !== null && cents > budget;
  const cooked = page.entries.filter((e) => e.cooked).length;
  const minutes = page.entries.reduce((s, e) => s + (e.totalMinutes ?? 0), 0);

  return (
    <section
      aria-label="Résumé de la semaine"
      className="border-border grid grid-cols-2 gap-x-6 gap-y-5 border-y py-5 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center lg:gap-x-8"
    >
      <div className="col-span-2 flex flex-col gap-2 lg:col-span-1">
        <span className="text-muted text-sm">Coût estimé du menu</span>
        <span className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold">
            {entriesWithMissing > 0 ? "≥ " : "≈ "}
            {formatCents(cents)}
          </span>
          {budget !== null ? (
            <span className="text-muted text-sm">sur {formatCents(budget)}</span>
          ) : null}
        </span>
        {budget !== null ? (
          <span className="bg-surface-muted h-2 overflow-hidden rounded-full">
            <span
              className={`block h-full rounded-full ${over ? "bg-danger" : "bg-brand"}`}
              style={{
                width: `${Math.min(100, Math.round((cents / Math.max(1, budget)) * 100))}%`,
              }}
            />
          </span>
        ) : null}
        {budget !== null ? (
          <span className={`text-sm font-medium ${over ? "text-danger" : "text-success"}`}>
            {over
              ? `${formatCents(cents - budget)} au-dessus du budget`
              : `${formatCents(budget - cents)} de marge`}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-muted text-sm">Repas</span>
        <span className="font-display text-2xl font-semibold">{page.entries.length}</span>
        <span className="text-muted text-sm">
          {cooked} cuisiné{cooked > 1 ? "s" : ""}, {plan.people} pers.
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-muted text-sm">Temps en cuisine</span>
        <span className="font-display text-2xl font-semibold">
          {minutes >= 60
            ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`
            : `${minutes} min`}
        </span>
        <span className="text-muted text-sm">sur la semaine</span>
      </div>
      <div className="col-span-2 flex flex-col items-start gap-2 lg:col-span-1">
        {plan.shoppingDoneAt ? (
          <Badge tone="leaf">Courses faites</Badge>
        ) : (
          <Link
            href={`/shopping?semaine=${page.weekStart}`}
            className={buttonClasses("accent", "max-lg:w-full")}
          >
            Voir la liste de courses
          </Link>
        )}
      </div>
      {entriesWithMissing > 0 ? (
        <p className="text-muted col-span-2 text-sm lg:col-span-4">
          Sans prix connu, non comptés : {missingNames.join(", ")}. Le total est donc un minimum.{" "}
          <Link href="/prices" className="text-brand font-semibold underline">
            Ajouter mes prix
          </Link>
        </p>
      ) : null}
    </section>
  );
}

/**
 * La semaine : sur ordinateur, une grille « Déjeuner / Dîner × 7 jours » ; sur téléphone,
 * une liste chronologique précédée de pastilles de jours. Un seul DOM, deux mises en page :
 * chaque jour devient `display: contents` sur ordinateur et ses cases se rangent dans la
 * colonne du jour.
 */
function WeekGrid({ page, base }: { page: PlannerPage; base: Base }) {
  const days = [...new Set(page.slots.map((s) => s.day))];
  const unplaced = page.entries.filter((e) => !e.day);
  return (
    <section aria-label="Repas de la semaine" className="flex flex-col gap-6">
      <nav aria-label="Aller au jour" className="lg:hidden">
        <ul className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const isToday = day === page.today;
            return (
              <li key={day}>
                <a
                  href={`#jour-${day}`}
                  className={[
                    "flex min-h-14 flex-col items-center justify-center rounded-xl border text-xs font-semibold",
                    isToday
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-border bg-surface",
                  ].join(" ")}
                >
                  {formatDay(day).split(" ")[0]!.slice(0, 3)}
                  <span className="font-display text-lg leading-none">
                    {day.slice(8).replace(/^0/, "")}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <ol className="grid gap-6 lg:grid-cols-[5.5rem_repeat(7,minmax(0,1fr))] lg:gap-x-3 lg:gap-y-3">
        <li aria-hidden="true" className="hidden lg:col-start-1 lg:row-start-1 lg:block" />
        {(["lunch", "dinner"] as const).map((slot, i) => (
          <li
            key={slot}
            aria-hidden="true"
            className={`text-muted hidden pt-2 text-sm font-semibold lg:col-start-1 lg:block ${i === 0 ? "lg:row-start-2" : "lg:row-start-3"}`}
          >
            {slot === "lunch" ? "Déjeuner" : "Dîner"}
          </li>
        ))}
        {days.map((day, column) => {
          const isToday = day === page.today;
          const past = day < page.today;
          const col = { gridColumnStart: column + 2 };
          return (
            <li
              key={day}
              id={`jour-${day}`}
              className="flex scroll-mt-20 flex-col gap-2.5 lg:contents"
            >
              <h2
                style={col}
                className={[
                  "flex items-baseline gap-2 lg:row-start-1 lg:flex-col lg:items-center lg:gap-0 lg:rounded-xl lg:px-3 lg:py-2",
                  isToday ? "text-accent-strong lg:bg-accent-soft" : "",
                  past && !isToday ? "text-muted" : "",
                ].join(" ")}
              >
                <span className="text-sm font-semibold">
                  {formatDay(day).split(" ")[0]}
                  {isToday ? <span className="lg:hidden"> · aujourd&apos;hui</span> : null}
                </span>
                <span className="font-display text-2xl leading-none font-semibold">
                  {day.slice(8).replace(/^0/, "")}
                </span>
              </h2>
              {(["lunch", "dinner"] as const).map((slot) => {
                const meals = page.entries.filter((e) => e.day === day && e.slot === slot);
                return (
                  <div
                    key={slot}
                    style={col}
                    className={`flex flex-col gap-1.5 ${slot === "lunch" ? "lg:row-start-2" : "lg:row-start-3"}`}
                  >
                    <span className="text-muted text-xs font-semibold lg:sr-only">
                      {slot === "lunch" ? "Déjeuner" : "Dîner"}
                    </span>
                    {meals.length ? (
                      meals.map((m) => (
                        <EntryTile key={m.position} entry={m} page={page} base={base} />
                      ))
                    ) : (
                      <PlanActionButton
                        action={addEntryAction}
                        fields={{ ...base, key: page.newKey(), slot: `${day}:${slot}` }}
                        label={`Proposer un plat pour ${formatDay(day)} ${slot === "lunch" ? "midi" : "soir"}`}
                        pendingLabel="…"
                        className="border-border-strong text-muted hover:border-accent hover:text-accent-strong bg-surface/60 flex min-h-14 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm font-medium transition-colors lg:min-h-40 lg:flex-col"
                      >
                        <PlusIcon size={20} />
                        <span className="lg:sr-only">Ajouter</span>
                      </PlanActionButton>
                    )}
                  </div>
                );
              })}
            </li>
          );
        })}
      </ol>
      {unplaced.length ? (
        <section aria-labelledby="non-places" className="flex flex-col gap-3">
          <h2 id="non-places" className="type-section">
            Pas encore placés
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {unplaced.map((m) => (
              <li key={m.position}>
                <EntryTile entry={m} page={page} base={base} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function EntryTile({
  entry,
  page,
  base,
}: {
  entry: PlannerEntryView;
  page: PlannerPage;
  base: Base;
}) {
  const fields = { ...base, position: entry.position };
  const replacing = page.replace === entry.position;
  const small =
    "border-border bg-surface hover:border-brand inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-medium";

  return (
    <article
      className={[
        "flex flex-col gap-2 rounded-xl border p-3",
        entry.cooked
          ? "bg-leaf-soft border-transparent"
          : replacing
            ? "bg-surface border-accent"
            : entry.locked
              ? "bg-surface border-brand"
              : "bg-surface border-border",
      ].join(" ")}
    >
      <div className="flex gap-3 lg:flex-col lg:gap-2">
        <div className="size-14 shrink-0 overflow-hidden rounded-lg lg:aspect-[4/3] lg:size-auto lg:w-full">
          <RecipeVisual slug={entry.slug ?? entry.title} title={entry.title} tags={entry.tags} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          {entry.slug ? (
            <Link
              href={`/recipes/${entry.slug}`}
              className="text-[0.9375rem] leading-snug font-semibold hover:underline lg:text-sm"
            >
              {entry.favorite ? (
                <HeartIcon
                  size={14}
                  filled
                  className="text-accent-strong mr-1 inline align-[-1px]"
                />
              ) : null}
              {entry.title}
            </Link>
          ) : (
            <span className="text-muted text-sm font-semibold">{entry.title}</span>
          )}
          <span className="text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            {entry.totalMinutes !== null ? (
              <span className="inline-flex items-center gap-1">
                <ClockIcon size={13} /> {entry.totalMinutes} min
              </span>
            ) : null}
            <span>{entry.servings} p.</span>
            <span>
              {entry.missingNames.length ? "≥ " : "≈ "}
              {formatCents(entry.cents)}
            </span>
          </span>
          <span className="flex flex-wrap gap-1">
            {entry.cooked ? <Badge tone="leaf">Cuisiné</Badge> : null}
            {entry.locked && !entry.cooked ? (
              <Badge tone="neutral">
                <LockIcon size={12} /> Gardé
              </Badge>
            ) : null}
          </span>
        </div>
      </div>

      {!entry.cooked && !entry.available ? (
        <p className="text-danger text-xs font-medium">
          Ne correspond plus à tes préférences : remplace-le.
        </p>
      ) : null}

      {!entry.cooked ? (
        <details className="group">
          <summary className="text-brand flex min-h-9 cursor-pointer list-none items-center text-sm font-semibold hover:underline [&::-webkit-details-marker]:hidden">
            Modifier
          </summary>
          <div className="flex flex-col gap-3 pt-2">
            <SlotSelect
              week={base.week}
              version={base.version}
              formKey={page.newKey()}
              position={entry.position}
              value={entry.day && entry.slot ? `${entry.day}:${entry.slot}` : ""}
              title={entry.title}
              options={page.slots.map((s) => ({
                value: s.value,
                label: s.label,
                taken:
                  page.entries.find((e) => e.day && e.slot && `${e.day}:${e.slot}` === s.value)
                    ?.title ?? null,
              }))}
            />
            <div
              className="flex items-center justify-between gap-2"
              role="group"
              aria-label="Portions"
            >
              <PlanActionButton
                action={setServingsAction}
                fields={{
                  ...fields,
                  servings: Math.max(1, entry.servings - 1),
                  key: page.newKey(),
                }}
                label="Une portion de moins"
                className={iconButtonClasses()}
              >
                <MinusIcon size={18} />
              </PlanActionButton>
              <span className="text-sm font-semibold tabular-nums">
                {entry.servings} portion{entry.servings > 1 ? "s" : ""}
              </span>
              <PlanActionButton
                action={setServingsAction}
                fields={{
                  ...fields,
                  servings: Math.min(40, entry.servings + 1),
                  key: page.newKey(),
                }}
                label="Une portion de plus"
                className={iconButtonClasses()}
              >
                <PlusIcon size={18} />
              </PlanActionButton>
            </div>
            <div className="flex flex-wrap gap-2">
              <PlanActionButton
                action={toggleLockAction}
                fields={{ ...fields, key: page.newKey() }}
                label={
                  entry.locked ? "Ne plus garder ce plat" : "Garder ce plat si je génère à nouveau"
                }
                className={`${small} ${entry.locked ? "border-brand bg-brand-soft" : ""}`}
              >
                <LockIcon size={15} />
                {entry.locked ? "Gardé" : "Garder"}
              </PlanActionButton>
              <Link
                href={
                  replacing
                    ? `/planner?semaine=${page.weekStart}`
                    : `/planner?semaine=${page.weekStart}&remplacer=${entry.position}#remplacer`
                }
                className={small}
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
        </details>
      ) : null}
    </article>
  );
}

function Replacements({ page, base }: { page: PlannerPage; base: Base }) {
  if (!page.replace) return null;
  const entry = page.entries.find((e) => e.position === page.replace);
  if (!entry) return null;
  return (
    <section
      id="remplacer"
      aria-labelledby="remplacer-titre"
      className="bg-accent-soft scroll-mt-24 rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="remplacer-titre" className="type-section">
          Remplacer « {entry.title} »
        </h2>
        <Link href={`/planner?semaine=${page.weekStart}`} className={buttonClasses("text")}>
          Annuler
        </Link>
      </div>
      {page.replacements.length === 0 ? (
        <p className="text-muted mt-3 text-sm">Aucune autre recette compatible à proposer.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {page.replacements.map((r) => (
            <li key={r.recipeId}>
              <form
                action={replaceEntryAction}
                className="bg-surface flex h-full flex-col gap-3 rounded-xl p-3"
              >
                <input type="hidden" name="week" value={base.week} />
                <input type="hidden" name="version" value={base.version} />
                <input type="hidden" name="key" value={page.newKey()} />
                <input type="hidden" name="position" value={entry.position} />
                <input type="hidden" name="recipeId" value={r.recipeId} />
                <div className="flex items-center gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg">
                    <RecipeVisual slug={r.slug} title={r.title} tags={[]} />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-semibold">{r.title}</span>
                    <span className="text-muted text-xs">
                      {r.totalMinutes} min, {r.missing ? "au moins " : "environ "}
                      {formatCents(r.cents)}
                    </span>
                  </div>
                </div>
                <button type="submit" className={buttonClasses("primary", "mt-auto min-h-10")}>
                  Choisir ce plat
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PriceSourceNote({ page }: { page: PlannerPage }) {
  return (
    <p className="text-muted text-xs leading-relaxed">
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
