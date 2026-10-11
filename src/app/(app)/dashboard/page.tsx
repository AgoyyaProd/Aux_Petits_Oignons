import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { BrandBadge, DotShape, LeafShape } from "@/components/brand/shapes";
import {
  ArrowRightIcon,
  BasketIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { formatCents } from "@/domain/money";
import { expiryState } from "@/domain/pantry/priority";
import { formatLongDate, hourIn } from "@/lib/dates";
import { formatDay } from "@/lib/week";
import { getCurrentContext } from "@/server/modules/auth/session";
import { getPantry } from "@/server/modules/pantry/queries";
import { getPlannerPage, type PlannerEntryView } from "@/server/modules/planning/queries";
import { getRecipeCatalog } from "@/server/modules/recipes/queries";
import { getShoppingPage } from "@/server/modules/shopping/queries";

export const metadata: Metadata = { title: "Accueil" };
export const maxDuration = 30;

/**
 * Tableau de bord : ce qu'on mange aujourd'hui, ce qu'il faut finir, ce qu'il reste à
 * acheter. L'ordre suit la question du jour : « on mange quoi, et qu'est-ce que je fais
 * ensuite ? ».
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <Suspense fallback={<div className="bg-border/60 h-16 w-72 animate-pulse rounded-lg" />}>
        <Greeting />
      </Suspense>

      <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <Suspense fallback={<Block className="h-72" />}>
          <Today />
        </Suspense>
        <div className="flex flex-col gap-5">
          <Suspense fallback={<Block className="h-32" />}>
            <Shopping />
          </Suspense>
          <Suspense fallback={<Block className="h-32" />}>
            <Budget />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<Block className="h-40" />}>
        <Week />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.45fr] lg:gap-10">
        <Suspense fallback={<Block className="h-48" />}>
          <UseSoon />
        </Suspense>
        <Suspense fallback={<Block className="h-48" />}>
          <Suggestions />
        </Suspense>
      </div>
    </div>
  );
}

function Block({ className }: { className: string }) {
  return (
    <div aria-hidden="true" className={`bg-border/50 animate-pulse rounded-2xl ${className}`} />
  );
}

function SectionTitle({
  children,
  href,
  link,
}: {
  children: ReactNode;
  href?: string;
  link?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="type-section">{children}</h2>
      {href && link ? (
        <Link href={href} className="text-brand text-sm font-semibold hover:underline">
          {link}
        </Link>
      ) : null}
    </div>
  );
}

async function Greeting() {
  const { profile, household } = await getCurrentContext();
  const tz = household?.timezone ?? "Europe/Paris";
  const hour = hourIn(tz);
  const hello = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  return (
    <header className="bg-surface-muted relative grid gap-6 overflow-hidden rounded-3xl p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
      <LeafShape className="absolute -top-2 right-24 w-16 -rotate-12 opacity-90 max-sm:right-16 max-sm:w-12" />
      <DotShape className="absolute -top-6 -right-6 w-28 max-sm:w-20" />
      <div className="relative flex flex-col gap-2">
        <p className="text-muted text-sm font-medium">{formatLongDate(today)}</p>
        <h1 className="type-page text-forest dark:text-foreground">
          {hello}
          {profile.displayName ? ` ${profile.displayName}` : ""} !
        </h1>
        <p className="text-muted">Que cuisine-t-on aujourd&apos;hui ?</p>
        <form action="/recipes" role="search" className="relative mt-2 max-w-xl">
          <label htmlFor="dash-search" className="sr-only">
            Rechercher une recette
          </label>
          <SearchIcon
            size={20}
            className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
          />
          <input
            id="dash-search"
            name="q"
            type="search"
            placeholder="Rechercher une recette, un ingrédient…"
            className="bg-surface border-border focus-visible:border-forest min-h-12 w-full rounded-full border pr-4 pl-11 text-base outline-none"
          />
        </form>
        <ul className="mt-3 flex gap-4 overflow-x-auto pb-1" aria-label="Idées rapides">
          {QUICK.map((q) => (
            <li key={q.href} className="shrink-0">
              <Link
                href={q.href}
                className="flex w-20 flex-col items-center gap-1.5 text-center text-xs font-medium"
              >
                <span className={`flex size-14 items-center justify-center rounded-full ${q.bg}`}>
                  <BrandBadge variant={q.badge} />
                </span>
                {q.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative flex flex-wrap gap-2">
        <Link href="/pantry/new" className={buttonClasses("secondary")}>
          <PlusIcon size={18} />
          Ajouter au garde-manger
        </Link>
        <Link href="/planner" className={buttonClasses("primary")}>
          Mon menu
          <ArrowRightIcon size={18} />
        </Link>
      </div>
    </header>
  );
}

const QUICK = [
  { href: "/recipes?temps=30", label: "Rapide", badge: "bowl", bg: "bg-highlight-soft" },
  { href: "/recipes?regime=vegetarian", label: "Végétarien", badge: "leaf", bg: "bg-leaf-soft" },
  { href: "/recipes?budget=1", label: "Petit budget", badge: "dot", bg: "bg-accent-soft" },
  { href: "/recipes?stock=1", label: "Avec mon stock", badge: "mix", bg: "bg-surface" },
  { href: "/recipes?vite=1", label: "À finir", badge: "leaf", bg: "bg-accent-soft" },
] as const;

/** Repas d'aujourd'hui : le moment fort de l'écran, sur fond vert forêt. */
async function Today() {
  const page = await getPlannerPage({});
  if (!page) return null;
  const meals = page.entries.filter((e) => e.day === page.today);
  if (!page.plan || meals.length === 0) {
    const next = page.entries.find((e) => !e.cooked && e.day && e.day > page.today);
    return (
      <section
        aria-label="Aujourd'hui"
        className="bg-forest text-cream flex min-h-64 flex-col justify-between gap-6 rounded-2xl p-6 sm:p-8"
      >
        <div className="flex flex-col gap-3">
          <h2 className="type-page">
            {page.plan ? "Rien de prévu aujourd'hui" : "Ta semaine n'est pas encore prévue"}
          </h2>
          <p className="max-w-md text-[#d8e2da]">
            {page.plan
              ? next
                ? `Prochain repas : ${next.title}, ${formatDay(next.day!).toLowerCase()}.`
                : "Place un plat sur aujourd'hui depuis le menu de la semaine."
              : "Indique le nombre de repas, de personnes et ton budget : on te propose des plats qui utilisent d'abord ce que tu as."}
          </p>
        </div>
        <Link
          href="/planner"
          className={buttonClasses("secondary", "self-start border-transparent")}
        >
          {page.plan ? "Ouvrir le menu" : "Générer mon menu"}
        </Link>
      </section>
    );
  }
  const main = meals.find((m) => m.slot === "dinner" && !m.cooked) ?? meals[0]!;
  return (
    <section
      aria-label="Aujourd'hui"
      className="bg-forest text-cream grid overflow-hidden rounded-2xl sm:grid-cols-[1fr_0.85fr]"
    >
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <h2 className="text-ocre text-sm font-semibold">Aujourd&apos;hui</h2>
        <ul className="flex flex-col gap-5">
          {meals.map((m) => (
            <li key={m.position} className="flex flex-col gap-1.5">
              <span className="text-sm text-[#b9cbb1]">{m.slot === "lunch" ? "Midi" : "Soir"}</span>
              {m.slug ? (
                <Link
                  href={`/recipes/${m.slug}`}
                  className="font-display text-2xl leading-tight font-semibold hover:underline sm:text-[1.75rem]"
                >
                  {m.title}
                </Link>
              ) : (
                <span className="font-display text-2xl font-semibold">{m.title}</span>
              )}
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#d8e2da]">
                {m.totalMinutes !== null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon size={16} /> {m.totalMinutes} min
                  </span>
                ) : null}
                <span>
                  {m.servings} portion{m.servings > 1 ? "s" : ""}
                </span>
                {m.cooked ? <Badge tone="leaf">Cuisiné</Badge> : null}
              </span>
            </li>
          ))}
        </ul>
        {main.slug && !main.cooked ? (
          <Link
            href={`/recipes/${main.slug}`}
            className={buttonClasses("accent", "dark:text-forest mt-auto self-start")}
          >
            Cuisiner {meals.length > 1 ? "le plat du soir" : "ce plat"}
          </Link>
        ) : null}
      </div>
      <div className="hidden min-h-56 sm:block">
        <RecipeVisual slug={main.slug ?? main.title} title={main.title} tags={main.tags} />
      </div>
    </section>
  );
}

async function Shopping() {
  const page = await getShoppingPage();
  if (!page || !page.plan || !("totals" in page)) {
    return (
      <Link
        href="/shopping"
        className="bg-surface border-border hover:border-border-strong flex items-center gap-4 rounded-2xl border p-5"
      >
        <span className="bg-highlight-soft text-warning flex size-11 shrink-0 items-center justify-center rounded-full">
          <BasketIcon size={22} />
        </span>
        <span className="flex flex-col">
          <span className="font-semibold">Liste de courses</span>
          <span className="text-muted text-sm">Elle se remplit dès que le menu est prêt.</span>
        </span>
      </Link>
    );
  }
  const { totals } = page;
  const done = Boolean(page.plan.shoppingDoneAt);
  const ratio = totals.lines ? totals.checked / totals.lines : 1;
  return (
    <Link
      href="/shopping"
      className="bg-accent-soft hover:bg-peach flex flex-col gap-3 rounded-2xl p-5 transition-colors"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold">
          <BasketIcon size={20} /> Courses
        </span>
        {done ? <Badge tone="leaf">Faites</Badge> : null}
      </span>
      {done ? (
        <span className="text-sm">Marque tes plats « Cuisiné » depuis leur recette.</span>
      ) : totals.lines === 0 ? (
        <span className="text-sm">Rien à acheter : tout est déjà chez toi.</span>
      ) : (
        <>
          <span className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold">
              {totals.lines - totals.checked}
            </span>
            <span className="text-sm">
              article{totals.lines - totals.checked > 1 ? "s" : ""} à acheter, environ{" "}
              {totals.unpriced ? "au moins " : ""}
              {formatCents(totals.knownCents)}
            </span>
          </span>
          <span
            role="img"
            aria-label={`${totals.checked} sur ${totals.lines} dans le panier`}
            className="bg-surface/70 h-2 overflow-hidden rounded-full"
          >
            <span
              className="bg-accent-strong block h-full rounded-full"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </span>
        </>
      )}
    </Link>
  );
}

async function Budget() {
  const page = await getPlannerPage({});
  if (!page?.plan) return null;
  const budget = page.plan.budgetCents;
  const { cents, entriesWithMissing } = page.totals;
  const over = budget !== null && cents > budget;
  return (
    <Link
      href="/budget"
      className="bg-surface border-border hover:border-border-strong flex flex-col gap-3 rounded-2xl border p-5"
    >
      <span className="flex items-center gap-2 font-semibold">
        <WalletIcon size={20} /> Budget de la semaine
      </span>
      <span className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-semibold">
          {entriesWithMissing ? "≥ " : "≈ "}
          {formatCents(cents)}
        </span>
        {budget !== null ? (
          <span className="text-muted text-sm">sur {formatCents(budget)} prévus</span>
        ) : null}
      </span>
      {budget !== null ? (
        <>
          <span className="bg-surface-muted h-2 overflow-hidden rounded-full">
            <span
              className={`block h-full rounded-full ${over ? "bg-danger" : "bg-brand"}`}
              style={{
                width: `${Math.min(100, Math.round((cents / Math.max(budget, 1)) * 100))}%`,
              }}
            />
          </span>
          <span className={`text-sm font-medium ${over ? "text-danger" : "text-success"}`}>
            {over
              ? `${formatCents(cents - budget)} au-dessus du budget`
              : `${formatCents(budget - cents)} de marge`}
          </span>
        </>
      ) : (
        <span className="text-muted text-sm">Coût estimé du menu, sans budget fixé.</span>
      )}
    </Link>
  );
}

/** La semaine en un coup d'œil : une colonne par jour, défilement horizontal sur téléphone. */
async function Week() {
  const page = await getPlannerPage({});
  if (!page?.plan) return null;
  const days = [...new Set(page.slots.map((s) => s.day))];
  return (
    <section aria-labelledby="semaine" className="flex flex-col gap-4">
      <SectionTitle href="/planner" link="Tout le menu">
        <span id="semaine">Cette semaine</span>
      </SectionTitle>
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <ol className="grid min-w-[760px] grid-cols-7 gap-2">
          {days.map((day) => {
            const meals = page.entries.filter((e) => e.day === day);
            const isToday = day === page.today;
            return (
              <li
                key={day}
                className={[
                  "flex min-h-32 flex-col gap-2 rounded-xl p-3",
                  isToday ? "bg-brand text-brand-foreground" : "bg-surface border-border border",
                  day < page.today && !isToday ? "opacity-70" : "",
                ].join(" ")}
              >
                <span className="text-sm font-semibold">
                  {formatDay(day).replace(/ .*/, "").slice(0, 3)}{" "}
                  <span className="font-display text-xl">{day.slice(8).replace(/^0/, "")}</span>
                </span>
                {meals.length ? (
                  meals.map((m) => <WeekMeal key={m.position} meal={m} inverted={isToday} />)
                ) : (
                  <span
                    className={`text-xs ${isToday ? "text-brand-foreground/75" : "text-muted"}`}
                  >
                    Rien de prévu
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function WeekMeal({ meal, inverted }: { meal: PlannerEntryView; inverted: boolean }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className={`text-[0.6875rem] ${inverted ? "text-brand-foreground/75" : "text-muted"}`}>
        {meal.slot === "lunch" ? "Midi" : "Soir"}
      </span>
      <span
        className={`text-[0.8125rem] leading-snug font-semibold ${meal.cooked ? "line-through opacity-60" : ""}`}
      >
        {meal.title}
      </span>
    </span>
  );
}

function expiryBadge(
  item: {
    expiresOn: string | null;
    expiryKind: "use_by" | "best_before" | null;
    openedAt: string | null;
  },
  today: string,
): { label: string; tone: BadgeTone } {
  const state = expiryState(item, today);
  if (state.kind === "expired") return { label: `${state.label} dépassée`, tone: "danger" };
  if (state.kind === "soon") {
    return {
      label:
        state.days === 0 ? `${state.label} aujourd'hui` : `${state.label} dans ${state.days} j`,
      tone: state.days <= 1 ? "urgent" : "soon",
    };
  }
  return { label: "Entamé", tone: "soon" };
}

async function UseSoon() {
  const pantry = await getPantry();
  if (!pantry) return null;
  const urgent = pantry.items.filter((i) => i.priority);
  return (
    <section aria-labelledby="vite" className="flex flex-col gap-4">
      <SectionTitle href="/pantry" link="Garde-manger">
        <span id="vite">À consommer vite</span>
      </SectionTitle>
      {pantry.items.length === 0 ? (
        <p className="text-muted text-sm leading-relaxed">
          Ton garde-manger est vide. Ajoute ce que tu as : les menus utiliseront d&apos;abord ces
          produits.{" "}
          <Link href="/pantry/new" className="text-brand font-semibold underline">
            Ajouter des produits
          </Link>
        </p>
      ) : urgent.length === 0 ? (
        <p className="text-success text-sm font-medium">
          Rien d&apos;urgent : aucune date limite proche, rien d&apos;entamé.
        </p>
      ) : (
        <ul className="divide-border border-border bg-surface divide-y rounded-2xl border">
          {urgent.slice(0, 6).map((item) => {
            const b = expiryBadge(item, pantry.today);
            return (
              <li
                key={item.id}
                className="flex min-h-13 items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="font-medium">{item.ingredientName}</span>
                <Badge tone={b.tone}>{b.label}</Badge>
              </li>
            );
          })}
          {urgent.length > 6 ? (
            <li className="text-muted px-4 py-2.5 text-sm">
              et {urgent.length - 6} autre{urgent.length - 6 > 1 ? "s" : ""}
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}

/** Recettes réalisables avec le stock : les mieux couvertes, hors plats « pas pour nous ». */
async function Suggestions() {
  const catalog = await getRecipeCatalog({});
  if (!catalog) return null;
  const picks = catalog.cards
    .filter((c) => c.compatibility.compatible && c.rating !== -1 && c.coverage.total > 0)
    .filter((c) => !c.tags.includes("dessert"))
    .filter((c) => c.coverage.inStock / c.coverage.total >= 0.5)
    .slice(0, 3);
  return (
    <section aria-labelledby="idees" className="flex flex-col gap-4">
      <SectionTitle href="/recipes" link="Toutes les recettes">
        <span id="idees">Avec ce que tu as</span>
      </SectionTitle>
      {picks.length === 0 ? (
        <p className="text-muted text-sm leading-relaxed">
          Aucune recette n&apos;utilise encore la moitié de ton stock. Plus ton garde-manger est
          complet, plus les idées sont justes.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-3">
          {picks.map((r) => (
            <li key={r.id}>
              <Link href={`/recipes/${r.slug}`} className="group flex flex-col gap-2.5">
                <span className="aspect-[4/3] overflow-hidden rounded-xl">
                  <RecipeVisual slug={r.slug} title={r.title} tags={r.tags} />
                </span>
                <span className="type-card group-hover:underline">{r.title}</span>
                <span className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon size={15} /> {r.totalMinutes} min
                  </span>
                  <span>
                    {r.coverage.inStock}/{r.coverage.total} ingrédients chez toi
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
