import Link from "next/link";
import type { ReactNode } from "react";
import { DraftGuard } from "@/components/planner/draft-guard";
import { PlanActionButton } from "@/components/planner/entry-action";
import { GenerateForm } from "@/components/planner/generate-form";
import { WeekBalancePanel } from "@/components/planner/week-balance";
import { RecipePickerProvider } from "@/components/planner/recipe-picker";
import { WeekGrid, type Base } from "@/components/planner/week-grid";
import { Alert } from "@/components/ui/alert";
import { catalogLimitMessage } from "@/domain/planning/pick";
import { Badge } from "@/components/ui/badge";
import { buttonClasses, iconButtonClasses } from "@/components/ui/button";
import {
  BasketIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  RefreshIcon,
  SwapIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { centsToInput, formatCents } from "@/domain/money";
import { formatShortDate } from "@/lib/dates";
import { formatWeek } from "@/lib/week";
import {
  discardDraftAction,
  reorganizeAction,
  validatePlanAction,
} from "@/server/modules/planning/actions";
import type { PlannerPage } from "@/server/modules/planning/queries";

/**
 * Page « Mon menu » : la semaine (brouillon en cours ou menu validé), ses chiffres, la
 * génération et la barre de validation. Rendue par app/(app)/planner/page.tsx.
 */
export function PlannerView({
  page,
  justValidated,
}: {
  page: PlannerPage;
  justValidated: boolean;
}) {
  const plan = page.plan;
  const base: Base | null = plan ? { week: page.weekStart, version: plan.version } : null;
  const validated = justValidated && plan && !plan.isDraft;

  return (
    <div className={`flex flex-col gap-6 lg:gap-8 ${plan?.isDraft ? "pb-28 lg:pb-24" : ""}`}>
      {plan?.isDraft ? <DraftGuard week={page.weekStart} /> : null}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="type-page">Mon menu</h1>
          <p className="text-muted">
            {plan?.isDraft
              ? "Proposition en cours : change ce qui ne te tente pas, puis valide."
              : plan
                ? "Ta semaine de repas, validée."
                : "Aucun menu pour cette semaine."}
          </p>
        </div>
        <WeekNav page={page} />
      </header>

      <CatalogLimitNotice page={page} />

      {validated ? (
        <Alert tone="success">
          Menu validé : ta liste de courses est prête.{" "}
          <Link
            href={`/shopping?semaine=${page.weekStart}`}
            className="font-semibold underline underline-offset-2"
          >
            Voir la liste de courses
          </Link>
        </Alert>
      ) : null}

      {plan && base ? (
        <>
          <Toolbar page={page} base={base} />
          <Summary page={page} />
          <RecipePickerProvider
            choices={page.choices}
            inPlan={page.entries.map((e) => e.recipeId)}
            base={base}
            formKey={page.newKey()}
          >
            <WeekGrid page={page} base={base} />
          </RecipePickerProvider>
          <WeekBalancePanel balance={page.balance} protein={page.protein} />
          <Regenerate page={page} />
          {plan.isDraft ? <DraftDock page={page} base={base} /> : null}
        </>
      ) : (
        <EmptyPlan page={page} />
      )}
      <PriceSourceNote page={page} />
    </div>
  );
}

/** Prévient quand les réglages du foyer (souvent le matériel) laissent trop peu de plats. */
function CatalogLimitNotice({ page }: { page: PlannerPage }) {
  const message = catalogLimitMessage(page.candidateCount, page.limits);
  if (!message) return null;
  return (
    <Alert tone="warning">
      {message} Le menu tourne donc sur peu de recettes.{" "}
      <Link href="/settings#preferences" className="font-semibold underline underline-offset-2">
        Vérifier mon matériel et mes préférences
      </Link>
      {page.plan ? " — ou choisis n'importe quel plat avec « Chercher »." : "."}
    </Alert>
  );
}

function WeekNav({ page }: { page: PlannerPage }) {
  return (
    <nav
      aria-label="Semaine"
      className="bg-surface border-border flex items-center gap-1 self-stretch rounded-full border p-1 lg:self-auto"
    >
      <Link
        href={`/planner?semaine=${page.previousWeek}`}
        className={iconButtonClasses("border-transparent")}
        aria-label="Semaine précédente"
      >
        <ChevronLeftIcon size={20} />
      </Link>
      <span className="flex flex-1 flex-col items-center px-3 text-center lg:min-w-56">
        <span className="text-sm font-semibold">
          {formatWeek(page.weekStart).replace("Semaine du", "Du")}
        </span>
        <span className="text-muted text-xs">
          {page.isCurrentWeek ? "Cette semaine" : "Autre semaine"}
        </span>
      </span>
      <Link
        href={`/planner?semaine=${page.nextWeek}`}
        className={iconButtonClasses("border-transparent")}
        aria-label="Semaine suivante"
      >
        <ChevronRightIcon size={20} />
      </Link>
    </nav>
  );
}

/** Statut du menu et actions secondaires (une ligne défilante sur téléphone). */
function Toolbar({ page, base }: { page: PlannerPage; base: Base }) {
  const plan = page.plan!;
  const chip = buttonClasses("secondary", "min-h-10 shrink-0 px-4");
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline-flex">
        {plan.isDraft ? (
          <Badge tone="soon">Pas encore validé</Badge>
        ) : (
          <Badge tone="leaf">
            <CheckIcon size={13} /> Menu validé
          </Badge>
        )}
      </span>
      <div className="-mx-4 flex flex-1 gap-2 overflow-x-auto px-4 sm:mx-0 sm:justify-end sm:px-0">
        <PlanActionButton
          action={reorganizeAction}
          fields={{ ...base, key: page.newKey() }}
          label="Réorganiser : replacer les plats non cuisinés sur les prochains repas"
          pendingLabel="Réorganisation…"
          className={chip}
        >
          <SwapIcon size={17} />
          Réorganiser
        </PlanActionButton>
        <a href="#generer" className={chip}>
          <RefreshIcon size={17} />
          Générer à nouveau
        </a>
        {plan.isDraft ? null : (
          <Link href={`/planner/imprimer?semaine=${page.weekStart}`} className={chip}>
            Imprimer
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  children,
  foot,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <div className="bg-surface border-border flex min-w-0 flex-col gap-1 rounded-2xl border p-3 sm:p-4">
      <span className="text-muted flex items-center gap-1.5 text-xs sm:text-sm">
        {icon}
        {label}
      </span>
      <span className="font-display text-lg leading-tight font-semibold sm:text-2xl">
        {children}
      </span>
      {foot ? <span className="text-muted text-xs max-sm:line-clamp-2">{foot}</span> : null}
    </div>
  );
}

function Summary({ page }: { page: PlannerPage }) {
  const plan = page.plan!;
  const { cents, entriesWithMissing, missingNames } = page.totals;
  const budget = plan.budgetCents;
  const over = budget !== null && cents > budget;
  const cooked = page.entries.filter((e) => e.cooked).length;
  const cooking = page.entries.filter((e) => !e.leftover);
  const minutes = cooking.reduce((s, e) => s + (e.totalMinutes ?? 0), 0);

  return (
    <section aria-label="Résumé de la semaine" className="flex flex-col gap-3">
      <div
        className={`grid grid-cols-3 gap-2 sm:gap-3 ${plan.isDraft ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
      >
        <div className="bg-surface border-border flex min-w-0 flex-col gap-1 rounded-2xl border p-3 sm:p-4">
          <span className="text-muted flex items-center gap-1.5 text-xs sm:text-sm">
            <WalletIcon size={16} />
            Coût
          </span>
          <span className="font-display text-lg leading-tight font-semibold sm:text-2xl">
            {entriesWithMissing > 0 ? "≥ " : "≈ "}
            {formatCents(cents)}
          </span>
          {budget !== null ? (
            <>
              <span className="bg-surface-muted h-1.5 overflow-hidden rounded-full">
                <span
                  className={`block h-full rounded-full ${over ? "bg-danger" : "bg-brand"}`}
                  style={{
                    width: `${Math.min(100, Math.round((cents / Math.max(1, budget)) * 100))}%`,
                  }}
                />
              </span>
              <span className={`text-xs font-medium ${over ? "text-danger" : "text-success"}`}>
                {over
                  ? `${formatCents(cents - budget)} de trop`
                  : `${formatCents(budget - cents)} de marge`}
                <span className="text-muted max-sm:hidden"> sur {formatCents(budget)}</span>
              </span>
            </>
          ) : null}
        </div>
        <Stat
          icon={<CheckIcon size={16} />}
          label="Repas"
          foot={`${cooking.length} à cuisiner · ${plan.people} pers.${cooked ? ` · ${cooked} cuisiné${cooked > 1 ? "s" : ""}` : ""}`}
        >
          {page.entries.length}
        </Stat>
        <Stat icon={<ClockIcon size={16} />} label="En cuisine" foot="sur la semaine">
          {minutes >= 60
            ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`
            : `${minutes} min`}
        </Stat>
        {plan.isDraft ? null : (
          <div className="bg-surface border-border col-span-3 flex flex-col justify-between gap-2 rounded-2xl border p-3 sm:p-4 lg:col-span-1">
            <span className="text-muted flex items-center gap-1.5 text-sm">
              <BasketIcon size={16} />
              Courses
            </span>
            {plan.shoppingDoneAt ? (
              <Badge tone="leaf">Courses faites</Badge>
            ) : (
              <Link
                href={`/shopping?semaine=${page.weekStart}`}
                className={buttonClasses("accent", "w-full")}
              >
                Voir la liste de courses
              </Link>
            )}
          </div>
        )}
      </div>
      {entriesWithMissing > 0 ? (
        <p className="text-muted text-xs">
          Sans prix connu, non comptés : {missingNames.join(", ")}. Le total est donc un minimum.{" "}
          <Link href="/prices" className="text-brand font-semibold underline">
            Ajouter mes prix
          </Link>
        </p>
      ) : null}
    </section>
  );
}

/** Barre de validation, toujours visible tant que le menu n'est pas validé. */
function DraftDock({ page, base }: { page: PlannerPage; base: Base }) {
  const plan = page.plan!;
  return (
    <div
      role="region"
      aria-label="Valider le menu"
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-3 pb-2 lg:bottom-6 lg:left-64 lg:px-12"
    >
      <div className="bg-forest text-cream mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl p-3 shadow-2xl sm:p-4 dark:bg-[#1b3a30]">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">Menu pas encore validé</span>
          <span className="text-xs text-[#c9d6cc]">
            {page.entries.length} repas · {page.totals.entriesWithMissing > 0 ? "≥ " : "≈ "}
            {formatCents(page.totals.cents)}.{" "}
            {plan.hasValidated
              ? "La liste de courses suivra à la validation ; sinon, ton menu précédent est conservé."
              : "La liste de courses est créée à la validation ; sinon, rien n'est enregistré."}
          </span>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <PlanActionButton
            action={discardDraftAction}
            fields={{ ...base, key: page.newKey() }}
            label={plan.hasValidated ? "Annuler les modifications" : "Abandonner ce menu"}
            pendingLabel="…"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-white/30 px-4 text-sm font-semibold hover:bg-white/10 sm:flex-none"
          >
            Annuler
          </PlanActionButton>
          <PlanActionButton
            action={validatePlanAction}
            fields={{ ...base, key: page.newKey() }}
            label="Valider le menu et créer la liste de courses"
            pendingLabel="Validation…"
            className={buttonClasses("primary", "flex-1 sm:flex-none")}
          >
            <CheckIcon size={18} />
            Valider le menu
          </PlanActionButton>
        </div>
      </div>
    </div>
  );
}

function EmptyPlan({ page }: { page: PlannerPage }) {
  return (
    <section
      id="generer"
      className="bg-forest text-cream grid gap-8 rounded-3xl p-6 sm:p-8 lg:grid-cols-[1fr_1.1fr] lg:p-10"
    >
      <div className="flex flex-col gap-4">
        <h2 className="type-page">Composer ma semaine</h2>
        <ol className="flex flex-col gap-3 text-[#d8e2da]">
          {[
            "Indique le nombre de repas, de personnes et ton budget.",
            "Le menu respecte tes allergies, ton régime et ton temps, et utilise d'abord ce qui est à finir.",
            "Un plat ne te tente pas ? « Changer » en tire un autre au hasard, autant de fois que tu veux.",
            "Valide : ta liste de courses est créée à ce moment-là.",
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="bg-cream/15 text-cream grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold">
                {i + 1}
              </span>
              <span className="leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-[#b9cbb1]">
          {page.candidateCount} recette{page.candidateCount > 1 ? "s" : ""} compatible
          {page.candidateCount > 1 ? "s" : ""} avec tes préférences.
        </p>
      </div>
      <div className="bg-surface text-foreground rounded-2xl p-5 sm:p-6">
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
          mealsPerCook={page.mealsPerCook}
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
          une nouvelle proposition tirée au hasard : tes favoris, tes produits à finir et ton
          objectif de protéines ont plus de chances, les plats des dernières semaines moins, et un
          plat jamais servi s&apos;y glisse. Rien n&apos;est enregistré avant que tu valides.
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
        submitLabel="Proposer un autre menu"
        lockedCount={lockedCount}
        mealsPerCook={page.mealsPerCook}
      />
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
