import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getRecipeCatalog, RECIPE_TAG_LABEL } from "@/server/modules/recipes/queries";

export const metadata: Metadata = { title: "Recettes" };

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
  return {
    q: one(sp.q).slice(0, 80),
    maxMinutes: Number.isInteger(minutes) && minutes > 0 ? minutes : undefined,
    tag: tag in RECIPE_TAG_LABEL ? tag : undefined,
    showExcluded: one(sp.exclues) === "1",
    favoritesOnly: one(sp.favoris) === "1",
  };
}

export default function RecipesPage({ searchParams }: PageProps<"/recipes">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Recettes</h1>
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

  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.maxMinutes) params.set("temps", String(filters.maxMinutes));
  if (filters.tag) params.set("type", filters.tag);
  const withExcluded = new URLSearchParams(params);
  withExcluded.set("exclues", "1");
  if (filters.favoritesOnly) params.set("favoris", "1");
  const toggleFavorites = new URLSearchParams(params);
  if (filters.favoritesOnly) toggleFavorites.delete("favoris");
  else toggleFavorites.set("favoris", "1");

  return (
    <div className="flex flex-col gap-5">
      {/* Formulaire GET : fonctionne sans JavaScript, l'URL garde les filtres. */}
      <form action="/recipes" className="flex flex-col gap-3" role="search">
        <label htmlFor="recipe-search" className="sr-only">
          Rechercher une recette ou un ingrédient
        </label>
        <input
          id="recipe-search"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Rechercher : poulet, lentilles, soupe…"
          className="bg-surface border-border focus-visible:ring-brand min-h-11 w-full rounded-xl border px-3 text-base outline-none focus-visible:ring-2"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <select
            name="temps"
            aria-label="Durée maximale"
            defaultValue={filters.maxMinutes ? String(filters.maxMinutes) : ""}
            className="bg-surface border-border min-h-11 w-full min-w-0 rounded-xl border px-3 text-base"
          >
            {TIME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            name="type"
            aria-label="Type de recette"
            defaultValue={filters.tag ?? ""}
            className="bg-surface border-border min-h-11 w-full min-w-0 rounded-xl border px-3 text-base"
          >
            <option value="">Tous les types</option>
            {TYPE_TAGS.map((t) => (
              <option key={t} value={t}>
                {RECIPE_TAG_LABEL[t]}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonClasses("primary", "col-span-2 sm:col-span-1")}>
            Filtrer
          </button>
        </div>
        {filters.favoritesOnly ? <input type="hidden" name="favoris" value="1" /> : null}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/recipes${toggleFavorites.size ? `?${toggleFavorites}` : ""}`}
          aria-pressed={filters.favoritesOnly}
          className={[
            "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-medium",
            filters.favoritesOnly
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border bg-surface hover:bg-brand-soft",
          ].join(" ")}
        >
          ♥ Favoris{catalog.favoriteCount ? ` (${catalog.favoriteCount})` : ""}
        </Link>
      </div>

      {catalog.hasConstraints && catalog.excludedCount > 0 && !filters.showExcluded ? (
        <Alert tone="info">
          {catalog.excludedCount} recette{catalog.excludedCount > 1 ? "s" : ""} masquée
          {catalog.excludedCount > 1 ? "s" : ""} selon tes préférences alimentaires.{" "}
          <Link href={`/recipes?${withExcluded}`} className="text-brand font-semibold underline">
            Voir pourquoi
          </Link>
        </Alert>
      ) : null}
      {catalog.pantryIsEmpty ? (
        <p className="text-muted text-sm">
          Astuce :{" "}
          <Link href="/pantry/new" className="text-brand font-semibold underline">
            renseigne ton garde-manger
          </Link>{" "}
          pour voir en premier les recettes que tu peux déjà faire.
        </p>
      ) : null}

      {catalog.cards.length === 0 ? (
        <div className="border-border bg-surface rounded-2xl border border-dashed p-6 text-center">
          <p className="font-semibold">
            {filters.favoritesOnly && catalog.favoriteCount === 0
              ? "Pas encore de favori : ouvre une recette et appuie sur « On aime »."
              : "Aucune recette ne correspond."}
          </p>
          <Link
            href="/recipes"
            className="text-brand mt-2 inline-block text-sm font-semibold underline"
          >
            Effacer les filtres
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {catalog.cards.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </ul>
      )}
    </div>
  );
}
