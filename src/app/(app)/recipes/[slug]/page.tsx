import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Tag } from "@/components/recipes/recipe-card";
import { RecipeIngredients } from "@/components/recipes/recipe-ingredients";
import { Alert } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/domain/money";
import { getRecipe, RECIPE_TAG_LABEL } from "@/server/modules/recipes/queries";

export const metadata: Metadata = { title: "Recette" };

export default function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/recipes" className="text-brand text-sm font-medium">
        ← Recettes
      </Link>
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <RecipeContent params={params} />
      </Suspense>
    </div>
  );
}

async function RecipeContent({ params }: Pick<PageProps<"/recipes/[slug]">, "params">) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) notFound();
  const recipe = await getRecipe(slug);
  if (!recipe) notFound();

  const total = recipe.prepMinutes + recipe.cookMinutes;

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{recipe.title}</h1>
        {recipe.description ? <p className="text-muted">{recipe.description}</p> : null}
        <dl className="text-muted flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div className="flex gap-1">
            <dt>Préparation</dt>
            <dd className="text-foreground font-medium">{recipe.prepMinutes} min</dd>
          </div>
          {recipe.cookMinutes > 0 ? (
            <div className="flex gap-1">
              <dt>Cuisson</dt>
              <dd className="text-foreground font-medium">{recipe.cookMinutes} min</dd>
            </div>
          ) : null}
          <div className="flex gap-1">
            <dt>Total</dt>
            <dd className="text-foreground font-medium">{total} min</dd>
          </div>
        </dl>
        {recipe.cost ? (
          <p className="text-sm">
            <span className="font-medium">
              Coût estimé : {recipe.cost.missingNames.length ? "≥ " : "≈ "}
              {formatCents(recipe.cost.cents)}
            </span>{" "}
            <span className="text-muted">
              pour {recipe.servings} portion{recipe.servings > 1 ? "s" : ""} (
              {formatCents(Math.round(recipe.cost.cents / recipe.servings))} par portion)
              {recipe.cost.missingNames.length
                ? ` · sans prix : ${recipe.cost.missingNames.join(", ")}`
                : ""}
              {" · "}
              <Link href="/prices" className="underline">
                prix indicatifs
              </Link>
            </span>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {recipe.vegan ? (
            <Tag tone="neutral">Végétalien</Tag>
          ) : recipe.vegetarian ? (
            <Tag tone="neutral">Végétarien</Tag>
          ) : null}
          {recipe.tags.map((t) => (
            <Tag key={t} tone="neutral">
              {RECIPE_TAG_LABEL[t] ?? t}
            </Tag>
          ))}
        </div>
      </header>

      {recipe.exclusionLabel ? (
        <Alert tone="error">
          Incompatible avec ton foyer — {recipe.exclusionLabel}. Cette recette n&apos;est pas
          proposée dans ton catalogue ni dans tes plannings.
        </Alert>
      ) : null}
      {recipe.toRemoveNames.length > 0 ? (
        <Alert tone="info">
          Ingrédient facultatif que tu ne manges pas : {recipe.toRemoveNames.join(", ")}. La recette
          se fait sans.
        </Alert>
      ) : null}

      <RecipeIngredients ingredients={recipe.ingredients} baseServings={recipe.servings} />

      <section aria-labelledby="steps-title" className="flex flex-col gap-3">
        <h2 id="steps-title" className="text-lg font-semibold">
          Préparation
        </h2>
        <ol className="flex flex-col gap-3">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden="true"
                className="bg-brand-soft text-brand flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              >
                {i + 1}
              </span>
              <p className="pt-0.5 text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="text-muted border-border border-t pt-4 text-xs">
        Allergènes :{" "}
        {recipe.allergenLabels.length
          ? recipe.allergenLabels.join(", ")
          : "aucun des 14 allergènes réglementaires"}
        . Informations déduites des ingrédients ; vérifie toujours l&apos;étiquette des produits.
      </footer>
    </article>
  );
}
