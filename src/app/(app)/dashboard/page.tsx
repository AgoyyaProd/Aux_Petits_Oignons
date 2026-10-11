import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";
import { formatCents } from "@/domain/money";
import { expiryState } from "@/domain/pantry/priority";
import { formatSlot, formatWeek } from "@/lib/week";
import { getCurrentContext } from "@/server/modules/auth/session";
import { getPantry } from "@/server/modules/pantry/queries";
import { getPlannerPage } from "@/server/modules/planning/queries";
import { getShoppingPage } from "@/server/modules/shopping/queries";

export const metadata: Metadata = { title: "Accueil" };
export const maxDuration = 30;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<GreetingSkeleton />}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <UseSoon />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <WeekMenu />
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <Shopping />
      </Suspense>
      <nav aria-label="Raccourcis" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Shortcut href="/pantry/new">+ Ajouter au garde-manger</Shortcut>
        <Shortcut href="/pantry/placard">Mon placard</Shortcut>
        <Shortcut href="/recipes">Recettes</Shortcut>
        <Shortcut href="/prices">Prix</Shortcut>
      </nav>
    </div>
  );
}

function Shortcut({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClasses("secondary", "min-h-12 px-3 text-center")}>
      {children}
    </Link>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {action ? (
          <Link href={action.href} className="text-brand shrink-0 text-sm font-medium">
            {action.label} →
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Lit la session : vérifie l'utilisateur et redirige vers /login s'il n'est pas connecté. */
async function Greeting() {
  const { profile, household } = await getCurrentContext();
  const people = household?.people_count ?? 0;
  return (
    <section className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight">
        Bonjour {profile.displayName ?? "et bienvenue"}
      </h1>
      <p className="text-muted text-sm">
        {household
          ? `${household.name} · ${people} personne${people > 1 ? "s" : ""}`
          : "Aucun foyer actif."}
      </p>
    </section>
  );
}

function expiryLabel(
  item: {
    expiresOn: string | null;
    expiryKind: "use_by" | "best_before" | null;
    openedAt: string | null;
  },
  today: string,
): string {
  const state = expiryState(item, today);
  if (state.kind === "expired") return `${state.label} dépassée`;
  if (state.kind === "soon") {
    return state.days === 0 ? `${state.label} aujourd'hui` : `${state.label} dans ${state.days} j`;
  }
  return item.openedAt ? "entamé" : "";
}

async function UseSoon() {
  const pantry = await getPantry();
  if (!pantry) return null;
  if (pantry.items.length === 0) {
    return (
      <Card title="Ton garde-manger est vide">
        <p className="text-muted text-sm">
          Ajoute ce que tu as au frigo et dans les placards : les menus utiliseront d&apos;abord ces
          produits, et la liste de courses ne contiendra que ce qui manque.
        </p>
        <Link href="/pantry/new" className={buttonClasses("primary")}>
          Ajouter des produits
        </Link>
      </Card>
    );
  }
  const urgent = pantry.items.filter((i) => i.priority);
  return (
    <Card title="À consommer vite" action={{ href: "/pantry", label: "Garde-manger" }}>
      {urgent.length === 0 ? (
        <p className="text-success text-sm">
          Rien d&apos;urgent : aucune DLC proche, rien d&apos;entamé.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5 text-sm">
          {urgent.slice(0, 5).map((item) => {
            const label = expiryLabel(item, pantry.today);
            return (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="font-medium">{item.ingredientName}</span>
                <span
                  className={
                    label.includes("dépassée") ? "text-danger shrink-0" : "text-muted shrink-0"
                  }
                >
                  {label}
                </span>
              </li>
            );
          })}
          {urgent.length > 5 ? (
            <li className="text-muted text-xs">et {urgent.length - 5} autre(s)…</li>
          ) : null}
        </ul>
      )}
    </Card>
  );
}

async function WeekMenu() {
  const page = await getPlannerPage({});
  if (!page) return null;
  if (!page.plan) {
    return (
      <Card title={formatWeek(page.weekStart)}>
        <p className="text-muted text-sm">
          Pas encore de menu : indique le nombre de repas, de personnes et ton budget, on te propose
          des plats.
        </p>
        <Link href="/planner" className={buttonClasses("primary")}>
          Préparer le menu
        </Link>
      </Card>
    );
  }
  const cooked = page.entries.filter((e) => e.cooked).length;
  // Entrées déjà triées par jour : les prochains plats à cuisiner, à partir d'aujourd'hui.
  const next = page.entries
    .filter((e) => !e.cooked && e.slug && (!e.day || e.day >= page.today))
    .slice(0, 3);
  const budget = page.plan.budgetCents;
  const { cents, entriesWithMissing } = page.totals;
  return (
    <Card title={formatWeek(page.weekStart)} action={{ href: "/planner", label: "Menu" }}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">
          {page.entries.length} plat{page.entries.length > 1 ? "s" : ""} · {cooked} cuisiné
          {cooked > 1 ? "s" : ""}
        </span>
        <span className="font-semibold tabular-nums">
          {entriesWithMissing ? "≥ " : "≈ "}
          {formatCents(cents)}
          {budget !== null ? (
            <span className={cents > budget ? "text-danger" : "text-muted"}>
              {" "}
              / {formatCents(budget)}
            </span>
          ) : null}
        </span>
      </div>
      {next.length ? (
        <ul className="flex flex-col gap-1 text-sm">
          {next.map((e) => (
            <li key={e.position}>
              <Link href={`/recipes/${e.slug}`} className="hover:underline">
                {e.title}
              </Link>{" "}
              <span className="text-muted text-xs">
                · {e.day && e.slot ? `${formatSlot(e.day, e.slot)} · ` : ""}
                {e.servings} portion{e.servings > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-success text-sm">
          {cooked === page.entries.length
            ? "Tous les plats de la semaine sont cuisinés."
            : "Plus rien de prévu d'ici dimanche."}
        </p>
      )}
    </Card>
  );
}

async function Shopping() {
  const page = await getShoppingPage();
  if (!page || !page.plan || !("totals" in page)) return null;
  const { totals } = page;
  return (
    <Card title="Courses" action={{ href: "/shopping", label: "Liste" }}>
      {page.plan.shoppingDoneAt ? (
        <p className="text-success text-sm">
          Courses faites ✓ Marque tes plats « Cuisiné » depuis leur fiche recette.
        </p>
      ) : totals.lines === 0 ? (
        <p className="text-success text-sm">Rien à acheter : tout est déjà chez toi.</p>
      ) : (
        <p className="text-sm">
          {totals.lines} article{totals.lines > 1 ? "s" : ""} à acheter
          {totals.checked ? ` (${totals.checked} déjà dans le panier)` : ""} ·{" "}
          <span className="font-semibold">
            {totals.unpriced ? "≥ " : "≈ "}
            {formatCents(totals.knownCents)}
          </span>
        </p>
      )}
    </Card>
  );
}

function GreetingSkeleton() {
  return (
    <section aria-hidden="true" className="flex flex-col gap-2">
      <div className="bg-border h-8 w-48 animate-pulse rounded-lg" />
      <div className="bg-border h-4 w-32 animate-pulse rounded" />
    </section>
  );
}

function CardSkeleton() {
  return <div aria-hidden="true" className="bg-border h-28 animate-pulse rounded-2xl" />;
}
