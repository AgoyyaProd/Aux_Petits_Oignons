import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PantryItemCard } from "@/components/pantry/pantry-item-card";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowRightIcon,
  FridgeIcon,
  JarIcon,
  PlusIcon,
  SearchIcon,
  SnowIcon,
} from "@/components/ui/icons";
import { Responsive } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { categoryLabel } from "@/lib/categories";
import { matchesSearch } from "@/domain/recipes/compatibility";
import { getPantry, type PantryItemView } from "@/server/modules/pantry/queries";
import { LOCATION_LABEL, LOCATIONS, type Location } from "@/server/modules/pantry/schema";

export const metadata: Metadata = { title: "Garde-manger" };

const LOCATION_ICON = { fridge: FridgeIcon, freezer: SnowIcon, pantry: JarIcon } as const;
/** Libellés courts des onglets sur téléphone (quatre onglets sur une ligne). */
const SHORT_LOCATION: Record<Location, string> = {
  fridge: "Frigo",
  freezer: "Congélo",
  pantry: "Placard",
};
const SORTS = [
  { value: "date", label: "Date limite" },
  { value: "nom", label: "Nom" },
  { value: "categorie", label: "Catégorie" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

export default function PantryPage({ searchParams }: PageProps<"/pantry">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-7">
          <div className="bg-forest h-52 animate-pulse rounded-3xl" />
          <PageSkeleton rows={4} />
        </div>
      }
    >
      <PantryContent searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * En-tête vert (piste « Marché ») : titre, actions, et une tuile par emplacement avec son
 * nombre de produits. La tuile active est claire.
 */
function PantryHeader({
  counts,
  total,
  where,
  link,
}: {
  counts: Record<Location, number>;
  total: number;
  where: Location | null;
  link: (next: { lieu?: string | null }) => string;
}) {
  const tiles: { key: Location | null; label: string; n: number }[] = [
    { key: null, label: "Tout", n: total },
    ...LOCATIONS.map((l) => ({ key: l, label: SHORT_LOCATION[l], n: counts[l] })),
  ];
  return (
    <header className="bg-forest text-cream relative flex flex-col gap-5 overflow-hidden rounded-3xl px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <span
        aria-hidden="true"
        className="bg-leaf absolute -top-12 -right-8 hidden h-28 w-56 rotate-[-18deg] rounded-[100%_0] opacity-90 sm:block"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="type-page text-cream">Mon garde-manger</h1>
          <p className="max-w-xl text-sm text-[#cfe0d4]">
            Frigo, congélateur et placards. Les produits à utiliser vite passent en premier dans les
            menus.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/pantry/placard"
            className="text-cream inline-flex min-h-11 items-center rounded-full bg-white/12 px-4 text-sm font-semibold hover:bg-white/20"
          >
            <Responsive short="Épices" long="Épices et placard" />
          </Link>
          <Link
            href="/pantry/history"
            className="text-cream inline-flex min-h-11 items-center rounded-full bg-white/12 px-4 text-sm font-semibold hover:bg-white/20"
          >
            Historique
          </Link>
          <Link href="/pantry/new" className={buttonClasses("primary")}>
            <PlusIcon size={18} />
            Ajouter
          </Link>
        </div>
      </div>
      <nav aria-label="Emplacements" className="relative">
        <ul className="grid grid-cols-4 gap-2 lg:max-w-2xl lg:gap-3">
          {tiles.map((tile) => {
            const active = where === tile.key;
            return (
              <li key={tile.label}>
                <Link
                  href={link({ lieu: tile.key })}
                  aria-current={active ? "page" : undefined}
                  scroll={false}
                  className={[
                    "flex min-h-[4.25rem] flex-col justify-center rounded-2xl px-3 transition-colors",
                    active ? "bg-cream text-[#13261f]" : "text-cream bg-white/10 hover:bg-white/16",
                  ].join(" ")}
                >
                  <span className="font-display text-2xl leading-none font-semibold">{tile.n}</span>
                  <span className="mt-1 text-xs font-semibold">{tile.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
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
  const where = (LOCATIONS as readonly string[]).includes(one(sp.lieu))
    ? (one(sp.lieu) as Location)
    : null;
  const q = one(sp.q).slice(0, 60);
  const sort: Sort = SORTS.some((s) => s.value === one(sp.tri)) ? (one(sp.tri) as Sort) : "date";
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
  const header = <PantryHeader counts={counts} total={items.length} where={where} link={link} />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-7">
        {header}
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
      </div>
    );
  }

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

  return (
    <div className="flex flex-col gap-6">
      {header}

      {priority.length > 0 ? (
        <Link
          href="/recipes?vite=1"
          className="bg-highlight flex items-center gap-3 rounded-2xl px-4 py-3 text-[#13261f] transition-transform hover:-translate-y-0.5"
        >
          <span className="font-display shrink-0 text-3xl leading-none font-semibold">
            {priority.length}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[0.9375rem] font-bold">
              {priority.length > 1 ? "Produits à finir en premier" : "Produit à finir en premier"}
            </span>
            <span className="truncate text-sm">
              {priority
                .slice(0, 4)
                .map((i) => i.ingredientName)
                .join(", ")}
              {priority.length > 4 ? "…" : ""} · voir les recettes
            </span>
          </span>
          <ArrowRightIcon size={18} className="shrink-0" />
        </Link>
      ) : null}

      <form
        action="/pantry"
        role="search"
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
      >
        {where ? <input type="hidden" name="lieu" value={where} /> : null}
        <label className="relative col-span-2 block sm:col-span-1">
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
          className="bg-surface border-border min-h-12 w-full min-w-0 rounded-full border px-4 text-base"
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

/** En-tête de colonnes du tableau (ordinateur uniquement). */
function TableHead() {
  return (
    <div
      aria-hidden="true"
      className="border-border text-muted bg-surface-muted hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_2.75rem] gap-4 border-b px-4 py-2.5 text-xs font-semibold tracking-wide uppercase lg:grid"
    >
      <span>Produit</span>
      <span>Quantité</span>
      <span>Date limite</span>
      <span>Emplacement</span>
      <span />
    </div>
  );
}

function Rows({ items, today }: { items: PantryItemView[]; today: string }) {
  return (
    <div className="border-border bg-surface overflow-hidden rounded-2xl border">
      <TableHead />
      <ul className="divide-border flex flex-col divide-y">
        {items.map((item) => (
          // Clé d'idempotence générée côté serveur pour la prochaine action sur ce produit.
          <PantryItemCard key={item.id} item={item} today={today} initialKey={randomUUID()} />
        ))}
      </ul>
    </div>
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
  if (!groupByLocation) return <Rows items={items} today={today} />;
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
            <Rows items={here} today={today} />
          </section>
        );
      })}
    </div>
  );
}
