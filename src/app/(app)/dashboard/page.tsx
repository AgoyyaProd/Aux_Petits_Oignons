import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import type { BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import {
  ArrowRightIcon,
  BasketIcon,
  ClockIcon,
  SearchIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { formatCents } from "@/domain/money";
import { expiryState } from "@/domain/pantry/priority";
import { formatLongDate, hourIn } from "@/lib/dates";
import { ImageSlot } from "@/components/ui/image-slot";
import { ingredientImage } from "@/lib/images";
import { addDays, formatDay, mondayOf } from "@/lib/week";
import { getCurrentContext } from "@/server/modules/auth/session";
import { getPantry } from "@/server/modules/pantry/queries";
import { getPlannerPage, type PlannerEntryView } from "@/server/modules/planning/queries";
import { getRecipeCatalog } from "@/server/modules/recipes/queries";
import { getShoppingPage } from "@/server/modules/shopping/queries";

export const metadata: Metadata = { title: "Accueil" };
export const maxDuration = 30;

/**
 * Tableau de bord (piste « Marché ») : un en-tête vert, le plat du jour en grand, trois
 * tuiles colorées (à finir, courses, budget), puis la semaine et les idées. L'ordre suit la
 * question du jour : « on mange quoi, et qu'est-ce que je fais ensuite ? ».
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 lg:gap-10">
      <Suspense fallback={<Block className="h-56 rounded-3xl" />}>
        <Greeting />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-6">
        <Suspense fallback={<Block className="h-96" />}>
          <Today />
        </Suspense>
        <div className="grid grid-cols-2 content-start gap-3 lg:grid-cols-1 lg:gap-4">
          <Suspense fallback={<Block className="h-40" />}>
            <FinishTile />
          </Suspense>
          <Suspense fallback={<Block className="h-40" />}>
            <ShoppingTile />
          </Suspense>
          <div className="col-span-2 lg:col-span-1">
            <Suspense fallback={<Block className="h-28" />}>
              <BudgetTile />
            </Suspense>
          </div>
        </div>
      </div>

      <Suspense fallback={<Block className="h-40" />}>
        <Week />
      </Suspense>

      <Suspense fallback={<Block className="h-48" />}>
        <Suggestions />
      </Suspense>
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
        <Link
          href={href}
          className="text-brand shrink-0 text-sm font-semibold whitespace-nowrap hover:underline"
        >
          {link}
        </Link>
      ) : null}
    </div>
  );
}

async function Greeting() {
  const { profile, household } = await getCurrentContext();
  // Première connexion : le questionnaire de bienvenue avant tout le reste.
  if (!profile.onboardedAt) redirect("/bienvenue");
  const tz = household?.timezone ?? "Europe/Paris";
  const hour = hourIn(tz);
  const hello = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  return (
    <header className="bg-forest text-cream relative -mx-4 -mt-6 flex flex-col gap-5 overflow-hidden rounded-b-[1.75rem] px-5 pt-2 pb-6 sm:-mx-6 sm:px-8 lg:mx-0 lg:mt-0 lg:rounded-3xl lg:px-10 lg:py-9">
      <span
        aria-hidden="true"
        className="bg-highlight absolute top-4 -right-12 size-28 rounded-full lg:-top-10 lg:-right-10 lg:size-44"
      />
      <span
        aria-hidden="true"
        className="bg-accent absolute right-28 -bottom-14 hidden h-24 w-48 rounded-t-full lg:block"
      />
      <div className="relative flex flex-col gap-1">
        <p className="text-sm font-medium text-[#a9cfb2] first-letter:uppercase">
          {formatLongDate(today)}
        </p>
        <h1 className="type-page text-cream">
          {hello}
          {profile.displayName ? ` ${profile.displayName}` : ""} !
        </h1>
      </div>
      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center">
        <form action="/recipes" role="search" className="relative w-full lg:max-w-md">
          <label htmlFor="dash-search" className="sr-only">
            Rechercher une recette
          </label>
          <SearchIcon
            size={20}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#645c51]"
          />
          <input
            id="dash-search"
            name="q"
            type="search"
            placeholder="Une recette, un ingrédient…"
            className="bg-cream min-h-12 w-full rounded-full border-0 pr-4 pl-11 text-base text-[#13261f] outline-none placeholder:text-[#645c51] focus-visible:ring-2 focus-visible:ring-[#ff9d00]"
          />
        </form>
        <ul className="chip-scroll max-lg:hidden" aria-label="Idées rapides">
          {QUICK.map((q) => (
            <li key={q.href} className="shrink-0">
              <Link
                href={q.href}
                className="text-cream inline-flex min-h-10 items-center rounded-full bg-white/12 px-3.5 text-sm font-medium whitespace-nowrap hover:bg-white/20"
              >
                {q.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}

const QUICK = [
  { href: "/recipes?temps=30", label: "Rapide" },
  { href: "/recipes?regime=vegetarian", label: "Végétarien" },
  { href: "/recipes?budget=1", label: "Petit budget" },
  { href: "/recipes?stock=1", label: "Avec mon stock" },
  { href: "/recipes?vite=1", label: "À finir" },
] as const;

/** Le plat du jour en grand : photo, titre et « Cuisiner ». Les autres repas du jour dessous. */
async function Today() {
  const page = await getPlannerPage({});
  if (!page) return null;
  const meals = page.entries.filter((e) => e.day === page.today);
  if (!page.plan || meals.length === 0) {
    const next = page.entries.find((e) => !e.cooked && e.day && e.day > page.today);
    return (
      <section
        aria-labelledby="jour"
        className="bg-surface flex flex-col overflow-hidden rounded-3xl shadow-[var(--shadow-md)]"
      >
        <ImageSlot alt="" seed="menu-du-jour" className="aspect-[16/9]" />
        <div className="flex flex-col gap-3 p-5 lg:p-6">
          <h2 id="jour" className="type-section">
            {page.plan ? "Rien de prévu aujourd'hui" : "Ta semaine n'est pas encore prévue"}
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            {page.plan
              ? next
                ? `Prochain repas : ${next.title}, ${formatDay(next.day!).toLowerCase()}.`
                : "Place un plat sur aujourd'hui depuis le menu de la semaine."
              : "Indique le nombre de repas, de personnes et ton budget : on te propose des plats qui utilisent d'abord ce que tu as."}
          </p>
          <Link href="/planner" className={buttonClasses("primary", "self-start")}>
            {page.plan ? "Ouvrir le menu" : "Générer mon menu"}
          </Link>
        </div>
      </section>
    );
  }
  const main = meals.find((m) => m.slot === "dinner" && !m.cooked) ?? meals[0]!;
  const others = meals.filter((m) => m !== main);
  const card = (
    <>
      <span className="relative block">
        <RecipeVisual
          slug={main.slug ?? main.title}
          title={main.title}
          className="h-44 lg:aspect-[2/1] lg:h-auto"
          priority
        />
        {main.totalMinutes !== null ? (
          <span className="bg-surface text-accent-strong absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase">
            {main.totalMinutes} min
          </span>
        ) : null}
      </span>
      <span className="flex flex-col gap-1.5 p-4 lg:p-6">
        <span className="type-section text-[1.3125rem] leading-tight lg:text-[1.875rem]">
          {main.title}
        </span>
        <span className="text-muted text-sm">
          {main.cooked ? "Déjà cuisiné" : `${main.servings} portion${main.servings > 1 ? "s" : ""}`}
          {others.length
            ? ` · ${others[0]!.slot === "lunch" ? "ce midi" : "ce soir"} : ${others[0]!.title}`
            : ""}
        </span>
      </span>
    </>
  );
  return (
    <section aria-labelledby="jour" className="flex flex-col gap-3">
      <h2 id="jour" className="type-section">
        {main.slot === "dinner" ? "Ce soir" : "Ce midi"}
      </h2>
      {main.slug ? (
        <Link
          href={`/recipes/${main.slug}`}
          className="bg-surface flex flex-col overflow-hidden rounded-3xl shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5"
        >
          {card}
        </Link>
      ) : (
        <div className="bg-surface flex flex-col overflow-hidden rounded-3xl shadow-[var(--shadow-md)]">
          {card}
        </div>
      )}
    </section>
  );
}

async function ShoppingTile() {
  const page = await getShoppingPage();
  const totals = page && page.plan && "totals" in page ? page.totals : null;
  const done = Boolean(totals && page?.plan?.shoppingDoneAt);
  const left = totals ? totals.lines - totals.checked : 0;
  return (
    <Link
      href="/shopping"
      className="bg-leaf flex min-h-40 flex-col gap-2 rounded-3xl p-4 text-white transition-transform hover:-translate-y-0.5 lg:p-5"
    >
      <BasketIcon size={30} />
      <span className="text-[0.9375rem] leading-tight font-bold">
        {!totals
          ? "Ta liste arrive avec le menu"
          : done
            ? "Courses faites"
            : left === 0
              ? "Rien à acheter"
              : `${left} article${left > 1 ? "s" : ""} à acheter`}
      </span>
      <span className="mt-auto text-sm text-white/85">
        {totals && !done && left > 0
          ? `${totals.unpriced ? "≥ " : "≈ "}${formatCents(totals.storeCents)} en magasin`
          : "Ma liste de courses"}
      </span>
    </Link>
  );
}

/** Bandeau budget : coût estimé du menu face au budget de la semaine. */
async function BudgetTile() {
  const page = await getPlannerPage({});
  if (!page?.plan) return null;
  const budget = page.plan.budgetCents;
  const { cents, entriesWithMissing } = page.totals;
  const over = budget !== null && cents > budget;
  return (
    <Link
      href="/budget"
      className="bg-brand-soft flex flex-col gap-2.5 rounded-3xl p-4 transition-transform hover:-translate-y-0.5 lg:p-5"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <WalletIcon size={18} /> Budget de la semaine
        </span>
        {budget !== null ? (
          <span className={`text-sm font-semibold ${over ? "text-danger" : "text-success"}`}>
            {over ? `+${formatCents(cents - budget)}` : `${formatCents(budget - cents)} de marge`}
          </span>
        ) : null}
      </span>
      <span className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-semibold">
          {entriesWithMissing ? "≥ " : "≈ "}
          {formatCents(cents)}
        </span>
        {budget !== null ? (
          <span className="text-muted text-sm">sur {formatCents(budget)}</span>
        ) : null}
      </span>
      {budget !== null ? (
        <span className="bg-surface h-2 overflow-hidden rounded-full">
          <span
            className={`block h-full rounded-full ${over ? "bg-danger" : "bg-brand"}`}
            style={{ width: `${Math.min(100, Math.round((cents / Math.max(budget, 1)) * 100))}%` }}
          />
        </span>
      ) : null}
    </Link>
  );
}

/** La suite : les prochains plats prévus (hors restes), en vignettes. */
async function Week() {
  const page = await getPlannerPage({});
  if (!page) return null;
  const later = (entries: PlannerEntryView[]) =>
    entries
      .filter((e) => !e.cooked && !e.leftover && e.day !== null && e.day > page.today)
      .sort((a, b) => a.day!.localeCompare(b.day!) || (a.slot === "lunch" ? -1 : 1));
  let upcoming = later(page.entries);
  // Fin de semaine : on enchaîne sur le menu de la semaine suivante, s'il existe.
  if (upcoming.length < 3) {
    const next = await getPlannerPage({ week: addDays(mondayOf(page.today), 7) });
    if (next?.plan) upcoming = [...upcoming, ...later(next.entries)];
  }
  upcoming = upcoming.slice(0, 6);
  if (upcoming.length === 0) return null;
  return (
    <section aria-labelledby="semaine" className="flex flex-col gap-3">
      <SectionTitle href="/planner" link="Mon menu">
        <span id="semaine">La suite de la semaine</span>
      </SectionTitle>
      <ol className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
        {upcoming.map((m) => (
          <li key={m.position} className="w-[8.25rem] shrink-0 snap-start lg:w-auto">
            <WeekMeal meal={m} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function WeekMeal({ meal }: { meal: PlannerEntryView }) {
  const body = (
    <>
      <RecipeVisual
        slug={meal.slug ?? meal.title}
        title={meal.title}
        className="h-24 rounded-2xl lg:h-28"
      />
      <span className="text-accent-strong text-xs font-bold uppercase">
        {formatDay(meal.day!).replace(/ .*/, "").slice(0, 3)}
        {meal.slot === "lunch" ? " · midi" : ""}
      </span>
      <span className="line-clamp-2 text-[0.8125rem] leading-snug font-semibold">{meal.title}</span>
    </>
  );
  return meal.slug ? (
    <Link href={`/recipes/${meal.slug}`} className="flex flex-col gap-1.5 hover:underline">
      {body}
    </Link>
  ) : (
    <span className="flex flex-col gap-1.5">{body}</span>
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

/** Tuile ocre : les produits entamés ou à date proche ; mène aux recettes qui les utilisent. */
async function FinishTile() {
  const pantry = await getPantry();
  if (!pantry) return null;
  const urgent = pantry.items
    .filter((i) => i.priority)
    .sort((a, b) => (a.expiresOn ?? "9999").localeCompare(b.expiresOn ?? "9999"));
  if (urgent.length === 0) {
    return (
      <Link
        href="/pantry"
        className="bg-highlight-soft flex min-h-40 flex-col gap-2 rounded-3xl p-4 transition-transform hover:-translate-y-0.5 lg:p-5"
      >
        <span className="font-display text-3xl leading-none font-semibold">0</span>
        <span className="text-[0.9375rem] leading-tight font-bold">produit à finir</span>
        <span className="text-muted mt-auto text-sm">
          {pantry.items.length ? "Rien d'urgent au garde-manger" : "Garde-manger vide"}
        </span>
      </Link>
    );
  }
  const first = expiryBadge(urgent[0]!, pantry.today);
  return (
    <Link
      href="/recipes?vite=1"
      aria-label={`${urgent.length} produit${urgent.length > 1 ? "s" : ""} à finir : voir les recettes qui les utilisent`}
      className="bg-highlight flex min-h-40 flex-col gap-2 rounded-3xl p-4 text-[#13261f] transition-transform hover:-translate-y-0.5 lg:p-5"
    >
      <span className="font-display text-3xl leading-none font-semibold">{urgent.length}</span>
      <span className="text-[0.9375rem] leading-tight font-bold">
        produit{urgent.length > 1 ? "s" : ""} à finir
      </span>
      <span className="line-clamp-2 text-sm leading-snug">
        {urgent
          .slice(0, 2)
          .map((i) => i.ingredientName)
          .join(", ")}
        {urgent.length > 2 ? "…" : ""} · {first.label.toLowerCase()}
      </span>
      <span className="mt-auto flex items-center justify-between gap-2">
        <span className="flex">
          {urgent.slice(0, 3).map((item, i) => (
            <ImageSlot
              key={item.id}
              src={ingredientImage(item.ingredientSlug)}
              alt=""
              seed={item.ingredientSlug ?? item.ingredientName}
              className={`size-9 rounded-full border-2 border-[#ff9d00] ${i ? "-ml-2.5" : ""}`}
            />
          ))}
        </span>
        <ArrowRightIcon size={18} />
      </span>
    </Link>
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
      <SectionTitle href="/recipes" link="Voir tout">
        <span id="idees">Avec ce que tu as</span>
      </SectionTitle>
      {picks.length === 0 ? (
        <p className="text-muted text-sm leading-relaxed">
          Aucune recette n&apos;utilise encore la moitié de ton stock. Plus ton garde-manger est
          complet, plus les idées sont justes.
        </p>
      ) : (
        <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0">
          {picks.map((r) => (
            <li key={r.id} className="w-[12rem] shrink-0 snap-start lg:w-auto">
              <Link href={`/recipes/${r.slug}`} className="group flex flex-col gap-2">
                <span className="aspect-[4/3] overflow-hidden rounded-2xl">
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
