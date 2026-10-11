import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PantryItemCard } from "@/components/pantry/pantry-item-card";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FridgeIcon, JarIcon, PlusIcon, SearchIcon, SnowIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { categoryLabel } from "@/lib/categories";
import { matchesSearch } from "@/domain/recipes/compatibility";
import { getPantry, type PantryItemView } from "@/server/modules/pantry/queries";
import { LOCATION_LABEL, LOCATIONS, type Location } from "@/server/modules/pantry/schema";

export const metadata: Metadata = { title: "Garde-manger" };

const LOCATION_ICON = { fridge: FridgeIcon, freezer: SnowIcon, pantry: JarIcon } as const;
const SORTS = [
  { value: "date", label: "Date limite" },
  { value: "nom", label: "Nom" },
  { value: "categorie", label: "Catégorie" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

export default function PantryPage({ searchParams }: PageProps<"/pantry">) {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Garde-manger"
        description="Ce que tu as au réfrigérateur, au congélateur et dans les placards. Les produits à utiliser vite passent en premier dans les menus."
        actions={
          <>
            <Link href="/pantry/placard" className={buttonClasses("secondary")}>
              Épices et placard
            </Link>
            <Link href="/pantry/history" className={buttonClasses("ghost")}>
              Historique
            </Link>
            <Link href="/pantry/new" className={buttonClasses("primary")}>
              <PlusIcon size={18} />
              Ajouter
            </Link>
          </>
        }
      />
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <PantryContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

async function PantryContent({ searchParams }: Pick<PageProps<"/pantry">, "searchParams">) {
  const sp = await searchParams;
  const pantry = await getPantry();
  if (!pantry) return <p className="text-muted">Aucun foyer actif.</p>;
  const { items, today } = pantry;

  if (items.length === 0) {
    return (
      <EmptyState
        title="Ton garde-manger est vide"
        action={
          <Link href="/pantry/new" className={buttonClasses("primary")}>
            Ajouter un premier produit
          </Link>
        }
      >
        Ajoute ce que tu as au réfrigérateur, au congélateur et dans les placards : les repas
        proposés utiliseront ces produits en priorité, et la liste de courses ne contiendra que ce
        qui manque.
      </EmptyState>
    );
  }

  const where = (LOCATIONS as readonly string[]).includes(one(sp.lieu))
    ? (one(sp.lieu) as Location)
    : null;
  const q = one(sp.q).slice(0, 60);
  const sort: Sort = SORTS.some((s) => s.value === one(sp.tri)) ? (one(sp.tri) as Sort) : "date";

  const filtered = items
    .filter((i) => !where || i.location === where)
    .filter(
      (i) =>
        !q || matchesSearch({ title: i.ingredientName, description: null, ingredientNames: [] }, q),
    );
  const sorted = [...filtered];
  if (sort === "nom") sorted.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName, "fr"));
  if (sort === "categorie") {
    sorted.sort(
      (a, b) =>
        categoryLabel(a.category).localeCompare(categoryLabel(b.category), "fr") ||
        a.ingredientName.localeCompare(b.ingredientName, "fr"),
    );
  }
  const priority = items.filter((i) => i.priority && (!where || i.location === where));
  const counts = Object.fromEntries(
    LOCATIONS.map((l) => [l, items.filter((i) => i.location === l).length]),
  ) as Record<Location, number>;

  const link = (next: { lieu?: string | null; tri?: string }) => {
    const p = new URLSearchParams();
    const lieu = next.lieu === undefined ? where : next.lieu;
    if (lieu) p.set("lieu", lieu);
    if (q) p.set("q", q);
    const tri = next.tri ?? sort;
    if (tri !== "date") p.set("tri", tri);
    return `/pantry${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Emplacements" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex gap-2">
          <li>
            <Tab href={link({ lieu: null })} active={!where}>
              Tout <span className="opacity-70">{items.length}</span>
            </Tab>
          </li>
          {LOCATIONS.map((l) => {
            const Icon = LOCATION_ICON[l];
            return (
              <li key={l}>
                <Tab href={link({ lieu: l })} active={where === l}>
                  <Icon size={18} />
                  {LOCATION_LABEL[l]} <span className="opacity-70">{counts[l]}</span>
                </Tab>
              </li>
            );
          })}
        </ul>
      </nav>

      {priority.length > 0 ? (
        <section
          aria-labelledby="priorite"
          className="bg-accent-soft flex flex-col gap-3 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="priorite" className="type-section">
              À utiliser rapidement
            </h2>
            <Link
              href="/recipes?vite=1"
              className="text-accent-strong text-sm font-semibold hover:underline"
            >
              Recettes qui les utilisent
            </Link>
          </div>
          <p className="text-sm">
            {priority
              .slice(0, 8)
              .map((i) => i.ingredientName)
              .join(", ")}
            {priority.length > 8 ? ` et ${priority.length - 8} autre(s)` : ""}. Date limite dans 3
            jours ou moins, ou produit entamé.
          </p>
        </section>
      ) : null}

      <form
        action="/pantry"
        role="search"
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
      >
        {where ? <input type="hidden" name="lieu" value={where} /> : null}
        <label className="relative block">
          <span className="sr-only">Rechercher un produit</span>
          <SearchIcon
            size={20}
            className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
          />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Rechercher un produit"
            className="bg-surface border-border focus-visible:border-brand focus-visible:ring-brand/25 min-h-12 w-full rounded-full border pr-4 pl-11 text-base outline-none focus-visible:ring-2"
          />
        </label>
        <select
          name="tri"
          aria-label="Trier par"
          defaultValue={sort}
          className="bg-surface border-border min-h-12 rounded-full border px-4 text-base"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              Trier : {s.label.toLowerCase()}
            </option>
          ))}
        </select>
        <button type="submit" className={buttonClasses("secondary", "min-h-12")}>
          Appliquer
        </button>
      </form>

      {sorted.length === 0 ? (
        <EmptyState title="Aucun produit trouvé">
          {q ? `Rien ne correspond à « ${q} ».` : "Cet emplacement est vide."}
        </EmptyState>
      ) : (
        <ItemList items={sorted} today={today} groupByLocation={!where && sort === "date"} />
      )}
    </div>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      scroll={false}
      className={[
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-surface hover:border-border-strong",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function ItemList({
  items,
  today,
  groupByLocation,
}: {
  items: PantryItemView[];
  today: string;
  groupByLocation: boolean;
}) {
  if (!groupByLocation) {
    return (
      <ul className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        {items.map((item) => (
          // Clé d'idempotence générée côté serveur pour la prochaine action sur ce produit.
          <PantryItemCard key={item.id} item={item} today={today} initialKey={randomUUID()} />
        ))}
      </ul>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      {LOCATIONS.map((location) => {
        const here = items.filter((i) => i.location === location);
        if (here.length === 0) return null;
        const Icon = LOCATION_ICON[location];
        return (
          <section
            key={location}
            aria-label={LOCATION_LABEL[location]}
            className="flex flex-col gap-3"
          >
            <h2 className="type-section flex items-center gap-2">
              <Icon size={22} />
              {LOCATION_LABEL[location]}
              <span className="text-muted font-sans text-sm font-medium">{here.length}</span>
            </h2>
            <ul className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
              {here.map((item) => (
                <PantryItemCard key={item.id} item={item} today={today} initialKey={randomUUID()} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
