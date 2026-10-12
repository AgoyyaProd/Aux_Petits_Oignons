import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckIcon, SearchIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/domain/money";
import {
  getRecipeCatalog,
  RECIPE_TAG_LABEL,
  SMALL_BUDGET_CENTS,
} from "@/server/modules/recipes/queries";

export const metadata: Metadata = { title: "Recettes" };
export const maxDuration = 30;

const TIME_OPTIONS = [
  { value: "", label: "Toutes durées" },
  { value: "20", label: "20 min max" },
  { value: "30", label: "30 min max" },
  { value: "45", label: "45 min max" },
  { value: "60", label: "1 h max" },
];
const TYPE_TAGS = ["plat", "soupe", "salade", "dessert", "petit-dejeuner"] as const;

type Search = Awaited<PageProps<"/recipes">["searchParams"]>;

function readParams(sp: Search) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const minutes = Number(one(sp.temps));
  const tag = one(sp.type);
  const diet = one(sp.regime);
  return {
    q: one(sp.q).slice(0, 80),
    maxMinutes: Number.isInteger(minutes) && minutes > 0 ? minutes : undefined,
    tag: tag in RECIPE_TAG_LABEL ? tag : undefined,
    showExcluded: one(sp.exclues) === "1",
    favoritesOnly: one(sp.favoris) === "1",
    withStock: one(sp.stock) === "1",
    useSoon: one(sp.vite) === "1",
    smallBudget: one(sp.budget) === "1",
    inSeason: one(sp.saison) === "1",
    diet: diet === "vegetarian" || diet === "vegan" ? diet : undefined,
  } as const;
}
type Filters = ReturnType<typeof readParams>;

function toParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.maxMinutes) p.set("temps", String(f.maxMinutes));
  if (f.tag) p.set("type", f.tag);
  if (f.favoritesOnly) p.set("favoris", "1");
  if (f.withStock) p.set("stock", "1");
  if (f.useSoon) p.set("vite", "1");
  if (f.smallBudget) p.set("budget", "1");
  if (f.inSeason) p.set("saison", "1");
  if (f.diet) p.set("regime", f.diet);
  if (f.showExcluded) p.set("exclues", "1");
  return p;
}

function href(f: Filters) {
  const p = toParams(f);
  return `/recipes${p.size ? `?${p}` : ""}`;
}

export default function RecipesPage({ searchParams }: PageProps<"/recipes">) {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Nos recettes"
        description="Des plats du quotidien, filtrés selon tes préférences. Celles qui utilisent ce que tu as passent en premier."
      />
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({ searchParams }: Pick<PageProps<"/recipes">, "searchParams">) {
  const filters = readParams(await searchParams);
  const catalog = await getRecipeCatalog(filters);
  if (!catalog) return <p className="text-muted">Aucun foyer actif.</p>;

  const chips: { label: string; active: boolean; next: Filters }[] = [
    {
      label: "De saison",
      active: filters.inSeason,
      next: { ...filters, inSeason: !filters.inSeason },
    },
    {
      label: "Rapide (30 min)",
      active: filters.maxMinutes === 30,
      next: { ...filters, maxMinutes: filters.maxMinutes === 30 ? undefined : 30 },
    },
    {
      label: catalog.favoriteCount ? `Favoris (${catalog.favoriteCount})` : "Favoris",
      active: filters.favoritesOnly,
      next: { ...filters, favoritesOnly: !filters.favoritesOnly },
    },
    {
      label: "Avec mes ingrédients",
      active: filters.withStock,
      next: { ...filters, withStock: !filters.withStock },
    },
    {
      label: "À consommer rapidement",
      active: filters.useSoon,
      next: { ...filters, useSoon: !filters.useSoon },
    },
    {
      label: "Végétarien",
      active: filters.diet === "vegetarian",
      next: { ...filters, diet: filters.diet === "vegetarian" ? undefined : "vegetarian" },
    },
    {
      label: "Végétalien",
      active: filters.diet === "vegan",
      next: { ...filters, diet: filters.diet === "vegan" ? undefined : "vegan" },
    },
    {
      label: `Petit budget (≤ ${formatCents(SMALL_BUDGET_CENTS)})`,
      active: filters.smallBudget,
      next: { ...filters, smallBudget: !filters.smallBudget },
    },
  ];
  const anyFilter = toParams(filters).size > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Formulaire GET : fonctionne sans JavaScript, l'URL garde les filtres. */}
      <form action="/recipes" className="flex flex-col gap-3" role="search">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 md:grid-cols-[minmax(0,1fr)_11rem_11rem_auto]">
          <label className="relative block max-md:order-1">
            <span className="sr-only">Rechercher une recette ou un ingrédient</span>
            <SearchIcon
              size={20}
              className="text-muted pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
            />
            <input
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Poulet, lentilles, soupe…"
              className="bg-surface border-border hover:border-border-strong focus-visible:border-brand focus-visible:ring-brand/25 min-h-12 w-full rounded-full border pr-4 pl-11 text-base outline-none focus-visible:ring-2"
            />
          </label>
          <div className="col-span-2 grid grid-cols-2 gap-3 max-md:order-3 md:contents">
            <FilterSelect name="type" label="Type de plat" defaultValue={filters.tag ?? ""}>
              <option value="">Tous les plats</option>
              {TYPE_TAGS.map((t) => (
                <option key={t} value={t}>
                  {RECIPE_TAG_LABEL[t]}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              name="temps"
              label="Durée maximale"
              defaultValue={filters.maxMinutes ? String(filters.maxMinutes) : ""}
            >
              {TIME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FilterSelect>
          </div>
          <button
            type="submit"
            aria-label="Rechercher"
            className={buttonClasses("primary", "min-h-12 max-md:order-2 max-md:w-12 max-md:px-0")}
          >
            <SearchIcon size={20} className="md:hidden" />
            <span className="max-md:hidden">Rechercher</span>
          </button>
        </div>
        {/* Les filtres rapides restent appliqués lors d'une nouvelle recherche. */}
        {filters.favoritesOnly ? <input type="hidden" name="favoris" value="1" /> : null}
        {filters.withStock ? <input type="hidden" name="stock" value="1" /> : null}
        {filters.useSoon ? <input type="hidden" name="vite" value="1" /> : null}
        {filters.smallBudget ? <input type="hidden" name="budget" value="1" /> : null}
        {filters.inSeason ? <input type="hidden" name="saison" value="1" /> : null}
        {filters.diet ? <input type="hidden" name="regime" value={filters.diet} /> : null}
      </form>

      <nav aria-label="Filtres rapides">
        <ul className="chip-scroll">
          {chips.map((chip) => (
            <li key={chip.label} className="shrink-0">
              <Link
                href={href(chip.next)}
                aria-pressed={chip.active}
                scroll={false}
                className={[
                  "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                  chip.active
                    ? "border-forest bg-forest text-cream dark:border-brand dark:bg-brand dark:text-brand-foreground"
                    : "border-border bg-surface hover:border-border-strong",
                ].join(" ")}
              >
                {chip.active ? <CheckIcon size={16} /> : null}
                {chip.label}
              </Link>
            </li>
          ))}
          {anyFilter ? (
            <li className="shrink-0">
              <Link href="/recipes" className={buttonClasses("text", "min-h-10 px-2")}>
                Tout effacer
              </Link>
            </li>
          ) : null}
        </ul>
      </nav>

      {catalog.hasConstraints && catalog.excludedCount > 0 && !filters.showExcluded ? (
        <Alert tone="info">
          {catalog.excludedCount} recette{catalog.excludedCount > 1 ? "s" : ""} masquée
          {catalog.excludedCount > 1 ? "s" : ""} selon tes allergies, ton régime, ton matériel et
          tes aliments évités.{" "}
          <Link
            href={href({ ...filters, showExcluded: true })}
            className="text-brand font-semibold underline"
          >
            Voir pourquoi
          </Link>
        </Alert>
      ) : null}

      <p className="border-border border-b pb-3 text-sm" aria-live="polite">
        <span className="font-semibold">{catalog.cards.length}</span>
        <span className="text-muted">
          {" "}
          recette{catalog.cards.length > 1 ? "s" : ""}
          {anyFilter ? " correspondent à ta recherche" : ""}
        </span>
      </p>

      {catalog.cards.length === 0 ? (
        <EmptyState
          title={
            filters.favoritesOnly && catalog.favoriteCount === 0
              ? "Pas encore de favori"
              : "Aucune recette ne correspond"
          }
          action={
            <Link href="/recipes" className={buttonClasses("secondary")}>
              Effacer les filtres
            </Link>
          }
        >
          {filters.favoritesOnly && catalog.favoriteCount === 0
            ? "Touche le cœur d'une recette pour l'enregistrer : les favoris reviennent plus souvent dans les menus."
            : filters.withStock && catalog.pantryIsEmpty
              ? "Ton garde-manger est vide : ajoute ce que tu as pour trouver les recettes réalisables."
              : "Essaie un autre mot ou retire un filtre."}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {catalog.cards.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Liste déroulante des filtres (chevron commun : voir globals.css). */
function FilterSelect({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="bg-surface border-border hover:border-border-strong min-h-12 w-full truncate rounded-full border pl-4 text-base"
      >
        {children}
      </select>
    </label>
  );
}
