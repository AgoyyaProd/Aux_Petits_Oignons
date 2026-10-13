import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { ImageSlot } from "@/components/ui/image-slot";
import { ingredientImage } from "@/lib/images";
import { AddExtraButton } from "@/components/shopping/add-extra-button";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { ChevronLeftIcon, ClockIcon, PlusIcon } from "@/components/ui/icons";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/domain/money";
import { REF_LABEL } from "@/domain/pricing/unit-price";
import { categoryLabel } from "@/lib/categories";
import { formatShortDate } from "@/lib/dates";
import { formatStockQuantity } from "@/lib/format-quantity";
import { getIngredientPage } from "@/server/modules/ingredients/queries";
import { LOCATION_LABEL } from "@/server/modules/pantry/schema";

export const metadata: Metadata = { title: "Ingrédient" };

export default function IngredientRoute({ params }: PageProps<"/ingredients/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-sm">
        <Link href="/recipes" className="hover:text-foreground">
          Recettes
        </Link>
        <ChevronLeftIcon size={14} className="rotate-180" />
        <span>Ingrédient</span>
      </nav>
      <Suspense fallback={<PageSkeleton rows={3} />}>
        <IngredientContent params={params} />
      </Suspense>
    </div>
  );
}

async function IngredientContent({ params }: Pick<PageProps<"/ingredients/[id]">, "params">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const page = await getIngredientPage(id);
  if (!page) notFound();
  const { ingredient, price, stock, recipes } = page;

  return (
    <article className="flex flex-col gap-10">
      <header className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-12">
        <div className="aspect-[4/3] overflow-hidden rounded-3xl">
          {ingredientImage(ingredient.slug) ? (
            <ImageSlot
              src={ingredientImage(ingredient.slug)}
              alt={ingredient.name}
              sizes="(min-width: 1024px) 40vw, 100vw"
              priority
            />
          ) : (
            <RecipeVisual slug={ingredient.id} title={ingredient.name} tags={["salade"]} />
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="neutral">{categoryLabel(ingredient.category)}</Badge>
            {ingredient.is_staple ? <Badge tone="leaf">Produit du placard</Badge> : null}
          </div>
          <h1 className="type-page">{ingredient.name}</h1>
          {price && price.source !== "free" ? (
            <div className="flex flex-col gap-1">
              <p className="font-display text-3xl font-semibold">
                ≈ {formatCents(price.unit.centsPerRef)} / {REF_LABEL[price.unit.dimension]}
              </p>
              <p className="text-muted text-sm">
                {price.source === "household"
                  ? `Ton prix${price.storeLabel ? ` (${price.storeLabel})` : ""}.`
                  : `Prix indicatif : médiane de ${price.sampleSize} relevé${price.sampleSize > 1 ? "s" : ""} Open Prices en France${price.observedTo ? `, le plus récent le ${formatShortDate(price.observedTo)}` : ""}${price.approximate ? ", catégorie approchante" : ""}.`}
              </p>
            </div>
          ) : price?.source === "free" ? (
            <p className="text-muted">Gratuit (eau du robinet).</p>
          ) : (
            <p className="text-muted">
              Pas de prix connu.{" "}
              <Link href="/prices" className="text-accent-strong font-semibold underline">
                Ajouter mon prix
              </Link>
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <AddExtraButton ingredientId={ingredient.id} label={ingredient.name} />
            <Link href="/pantry/new" className={buttonClasses("secondary")}>
              <PlusIcon size={18} />
              Ajouter au garde-manger
            </Link>
          </div>
        </div>
      </header>

      <section aria-labelledby="stock" className="flex flex-col gap-3">
        <h2 id="stock" className="type-section">
          Chez toi
        </h2>
        {stock.length === 0 ? (
          <p className="text-muted">
            {ingredient.is_staple
              ? "Pas dans ton garde-manger. Si tu en as toujours, coche-le dans ton placard."
              : "Pas dans ton garde-manger."}
          </p>
        ) : (
          <ul className="border-border bg-surface divide-border divide-y rounded-2xl border">
            {stock.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <span className="font-medium">
                  {formatStockQuantity(
                    s.quantity_base === null ? null : String(s.quantity_base),
                    s.dimension,
                    s.display_unit,
                  )}
                </span>
                <span className="text-muted text-sm">
                  {LOCATION_LABEL[s.location]}
                  {s.expires_on
                    ? `, ${s.expiry_kind === "best_before" ? "DDM" : "DLC"} ${formatShortDate(s.expires_on)}`
                    : ""}
                  {s.opened_at ? ", entamé" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recettes" className="flex flex-col gap-4">
        <h2 id="recettes" className="type-section">
          Recettes associées
        </h2>
        {recipes.length === 0 ? (
          <p className="text-muted">
            Aucune recette compatible avec ton foyer n&apos;utilise cet ingrédient.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recipes.map((r) => (
              <li key={r.id}>
                <Link href={`/recipes/${r.slug}`} className="group flex flex-col gap-2">
                  <span className="aspect-[4/3] overflow-hidden rounded-xl">
                    <RecipeVisual slug={r.slug} title={r.title} tags={r.tags} />
                  </span>
                  <span className="font-semibold group-hover:underline">{r.title}</span>
                  <span className="text-muted inline-flex items-center gap-1.5 text-sm">
                    <ClockIcon size={15} /> {r.totalMinutes} min
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-muted text-sm">
        La saison de l&apos;ingrédient n&apos;est pas indiquée : nous n&apos;avons pas encore de
        données fiables.
      </p>
    </article>
  );
}
