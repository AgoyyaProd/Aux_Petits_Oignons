import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ACTIONS_ROW, Responsive } from "@/components/ui/page-header";
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
import { formatShoppingQuantity } from "@/lib/format-quantity";
import { ImageSlot } from "@/components/ui/image-slot";
import { ingredientImage } from "@/lib/images";
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

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<Block className="h-80" />}>
          <Today />
        </Suspense>
        <Suspense fallback={<Block className="h-80" />}>
          <Shopping />
        </Suspense>
        <Suspense fallback={<Block className="h-80" />}>
          <UseSoon />
        </Suspense>
      </div>

      <Suspense fallback={<Block className="h-40" />}>
        <Week />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-10">
        <Suspense fallback={<Block className="h-40" />}>
          <Budget />
        </Suspense>
        <Suspense fallback={<Block className="h-48" />}>
          <Suggestions />
        </Suspense>
      </div>
    </div>
  );
}

/** Carte du tableau de bord : titre en serif, lien « Voir » en haut à droite. */
function Card({
  title,
  href,
  link,
  children,
  id,
}: {
  title: string;
  href: string;
  link: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className="bg-surface border-border flex flex-col gap-4 rounded-2xl border p-5 shadow-sm"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="type-section text-[1.1875rem]">
          {title}
        </h2>
        <Link href={href} className="text-brand shrink-0 text-sm font-semibold hover:underline">
          {link}
        </Link>
      </div>
      {children}
    </section>
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
  const tz = household?.timezone ?? "Europe/Paris";
  const hour = hourIn(tz);
  const hello = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="text-muted text-sm font-medium first-letter:uppercase">
            {formatLongDate(today)}
          </p>
          <h1 className="type-page text-forest dark:text-foreground">
            {hello}
            {profile.displayName ? ` ${profile.displayName}` : ""} !
          </h1>
          <p className="text-muted">Que cuisine-t-on aujourd&apos;hui ?</p>
        </div>
        <div className={ACTIONS_ROW}>
          <Link href="/pantry/new" className={buttonClasses("secondary")}>
            <PlusIcon size={18} />
            <Responsive short="Garde-manger" long="Ajouter au garde-manger" />
          </Link>
          <Link href="/planner" className={buttonClasses("primary")}>
            Mon menu
            <ArrowRightIcon size={18} />
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <form action="/recipes" role="search" className="relative w-full lg:max-w-md">
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
        <ul className="chip-scroll" aria-label="Idées rapides">
          {QUICK.map((q) => (
            <li key={q.href} className="shrink-0">
              <Link
                href={q.href}
                className="border-border bg-surface hover:border-border-strong inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm font-medium whitespace-nowrap"
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

/** Menu du jour : les repas placés aujourd'hui, avec le visuel du plat principal. */
async function Today() {
  const page = await getPlannerPage({});
  if (!page) return null;
  const meals = page.entries.filter((e) => e.day === page.today);
  if (!page.plan || meals.length === 0) {
    const next = page.entries.find((e) => !e.cooked && e.day && e.day > page.today);
    return (
      <Card id="jour" title="Menu du jour" href="/planner" link="Voir">
        <ImageSlot alt="" className="aspect-[16/9] rounded-xl" tone="sage" />
        <p className="font-semibold">
          {page.plan ? "Rien de prévu aujourd'hui" : "Ta semaine n'est pas encore prévue"}
        </p>
        <p className="text-muted text-sm leading-relaxed">
          {page.plan
            ? next
              ? `Prochain repas : ${next.title}, ${formatDay(next.day!).toLowerCase()}.`
              : "Place un plat sur aujourd'hui depuis le menu de la semaine."
            : "Indique le nombre de repas, de personnes et ton budget : on te propose des plats qui utilisent d'abord ce que tu as."}
        </p>
        <Link href="/planner" className={buttonClasses("primary", "mt-auto self-start")}>
          {page.plan ? "Ouvrir le menu" : "Générer mon menu"}
        </Link>
      </Card>
    );
  }
  const main = meals.find((m) => m.slot === "dinner" && !m.cooked) ?? meals[0]!;
  return (
    <Card id="jour" title="Menu du jour" href="/planner" link="Voir">
      <RecipeVisual
        slug={main.slug ?? main.title}
        title={main.title}
        className="aspect-[16/9] rounded-xl"
      />
      <ul className="flex flex-col gap-3">
        {meals.map((m) => (
          <li key={m.position} className="flex flex-col gap-0.5">
            <span className="text-accent-strong text-xs font-semibold tracking-wide uppercase">
              {m.slot === "lunch" ? "Déjeuner" : "Dîner"}
            </span>
            {m.slug ? (
              <Link href={`/recipes/${m.slug}`} className="type-card hover:underline">
                {m.title}
              </Link>
            ) : (
              <span className="type-card">{m.title}</span>
            )}
            <span className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {m.totalMinutes !== null ? (
                <span className="inline-flex items-center gap-1">
                  <ClockIcon size={15} /> {m.totalMinutes} min
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
          className={buttonClasses("primary", "mt-auto self-start")}
        >
          Cuisiner {meals.length > 1 ? "le plat du soir" : "ce plat"}
        </Link>
      ) : null}
    </Card>
  );
}

async function Shopping() {
  const page = await getShoppingPage();
  if (!page || !page.plan || !("totals" in page)) {
    return (
      <Card id="liste" title="Ma liste de courses" href="/shopping" link="Voir">
        <span className="bg-highlight-soft text-warning flex size-11 items-center justify-center rounded-full">
          <BasketIcon size={22} />
        </span>
        <p className="text-muted text-sm">Elle se remplit dès que le menu est prêt.</p>
      </Card>
    );
  }
  const { totals } = page;
  const done = Boolean(page.plan.shoppingDoneAt);
  const ratio = totals.lines ? totals.checked / totals.lines : 1;
  const remaining = page.aisles
    .flatMap((a) => a.lines)
    .filter((l) => !l.checked)
    .slice(0, 5);
  return (
    <Card id="liste" title="Ma liste de courses" href="/shopping" link="Voir">
      {done ? (
        <>
          <Badge tone="leaf">Courses faites</Badge>
          <p className="text-sm">Marque tes plats « Cuisiné » depuis leur recette.</p>
        </>
      ) : totals.lines === 0 ? (
        <p className="text-sm">Rien à acheter : tout est déjà chez toi.</p>
      ) : (
        <>
          <span className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold">
              {totals.lines - totals.checked}
            </span>
            <span className="text-muted text-sm">
              article{totals.lines - totals.checked > 1 ? "s" : ""} à acheter
            </span>
          </span>
          {remaining.length ? (
            <ul className="divide-border flex flex-col divide-y text-sm">
              {remaining.map((l) => (
                <li
                  key={`${l.ingredientId}|${l.dimension}`}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="truncate">{l.name}</span>
                  <span className="text-muted shrink-0">{formatShoppingQuantity(l.toBuy)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-auto flex flex-col gap-2">
            <span className="flex items-center justify-between text-sm">
              <span className="text-muted">Total estimé</span>
              <span className="font-semibold">
                {totals.unpriced ? "≥ " : "≈ "}
                {formatCents(totals.knownCents)}
              </span>
            </span>
            <span
              role="img"
              aria-label={`${totals.checked} sur ${totals.lines} dans le panier`}
              className="bg-surface-muted h-2 overflow-hidden rounded-full"
            >
              <span
                className="bg-accent-strong block h-full rounded-full"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </span>
          </div>
        </>
      )}
    </Card>
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
        <WalletIcon size={20} /> Mon budget de la semaine
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
      <SectionTitle href="/planner" link="Voir">
        <span id="semaine">Ma semaine en un coup d&apos;œil</span>
      </SectionTitle>
      <div className="snap-x overflow-x-auto pb-1">
        <ol className="grid w-max grid-cols-[repeat(7,8.75rem)] gap-3 lg:w-auto lg:grid-cols-7">
          {days.map((day) => {
            const meals = page.entries.filter((e) => e.day === day);
            const isToday = day === page.today;
            return (
              <li
                key={day}
                className={[
                  "bg-surface flex snap-start flex-col gap-2.5 rounded-xl border p-2.5",
                  isToday ? "border-accent ring-accent/30 ring-2" : "border-border",
                  day < page.today && !isToday ? "opacity-70" : "",
                ].join(" ")}
              >
                <span className="flex items-baseline justify-between px-0.5 text-sm font-semibold">
                  <span>{formatDay(day).replace(/ .*/, "").slice(0, 3)}</span>
                  <span className={isToday ? "text-accent-strong" : "text-muted"}>
                    {day.slice(8).replace(/^0/, "")}
                  </span>
                </span>
                {meals.length ? (
                  meals.map((m) => <WeekMeal key={m.position} meal={m} />)
                ) : (
                  <span className="bg-surface-muted text-muted grid aspect-[4/3] place-items-center rounded-lg text-xs">
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

function WeekMeal({ meal }: { meal: PlannerEntryView }) {
  const body = (
    <>
      <RecipeVisual
        slug={meal.slug ?? meal.title}
        title={meal.title}
        className="aspect-[4/3] rounded-lg"
        iconSize={18}
      />
      <span className="text-muted text-[0.6875rem] font-medium">
        {meal.slot === "lunch" ? "Déjeuner" : "Dîner"}
      </span>
      <span
        className={`line-clamp-2 text-[0.8125rem] leading-snug font-semibold ${meal.cooked ? "line-through opacity-60" : ""}`}
      >
        {meal.title}
      </span>
    </>
  );
  return meal.slug ? (
    <Link href={`/recipes/${meal.slug}`} className="flex flex-col gap-1 hover:underline">
      {body}
    </Link>
  ) : (
    <span className="flex flex-col gap-1">{body}</span>
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
    <Card id="vite" title="Produits à consommer" href="/pantry" link="Voir">
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
        <ul className="divide-border flex flex-col divide-y">
          {urgent.slice(0, 5).map((item) => {
            const b = expiryBadge(item, pantry.today);
            return (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <ImageSlot
                  src={ingredientImage(item.ingredientId)}
                  alt=""
                  className="size-10 shrink-0 rounded-lg"
                  iconSize={16}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {item.ingredientName}
                </span>
                <Badge tone={b.tone}>{b.label}</Badge>
              </li>
            );
          })}
          {urgent.length > 5 ? (
            <li className="text-muted py-2.5 text-sm">
              et {urgent.length - 5} autre{urgent.length - 5 > 1 ? "s" : ""}
            </li>
          ) : null}
        </ul>
      )}
    </Card>
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
