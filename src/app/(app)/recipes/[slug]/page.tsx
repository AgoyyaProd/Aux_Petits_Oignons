import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { CookButton } from "@/components/cooking/cook-button";
import { AddToMenuButton } from "@/components/recipes/add-to-menu-button";
import { CookMode } from "@/components/recipes/cook-mode";
import { RatingButtons } from "@/components/recipes/rating-buttons";
import { RecipeIngredients } from "@/components/recipes/recipe-ingredients";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon } from "@/components/ui/icons";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/domain/money";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { formatWeek } from "@/lib/week";
import { getCookStatus } from "@/server/modules/cooking/queries";
import { getRecipe, RECIPE_TAG_LABEL, type RecipeDetail } from "@/server/modules/recipes/queries";

export const metadata: Metadata = { title: "Recette" };

export default function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/recipes"
        className="text-brand inline-flex items-center gap-1 self-start text-sm font-semibold hover:underline"
      >
        <ChevronLeftIcon size={18} />
        Recettes
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
  const cook = await getCookStatus(recipe.id);

  return (
    <article className="flex flex-col gap-10">
      <header className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div className="aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-auto lg:min-h-80">
          <RecipeVisual slug={recipe.slug} title={recipe.title} tags={recipe.tags} />
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((t) => (
              <Badge key={t} tone="neutral">
                {RECIPE_TAG_LABEL[t] ?? t}
              </Badge>
            ))}
            {recipe.vegan ? (
              <Badge tone="leaf">Végétalien</Badge>
            ) : recipe.vegetarian ? (
              <Badge tone="leaf">Végétarien</Badge>
            ) : null}
          </div>
          <h1 className="type-page">{recipe.title}</h1>
          {recipe.description ? (
            <p className="text-muted text-lg leading-relaxed">{recipe.description}</p>
          ) : null}
          <dl className="border-border grid grid-cols-3 gap-3 border-y py-4">
            <Fact label="Préparation">{recipe.prepMinutes} min</Fact>
            <Fact label="Cuisson">
              {recipe.cookMinutes > 0 ? `${recipe.cookMinutes} min` : "aucune"}
            </Fact>
            <Fact label="Total">{total} min</Fact>
          </dl>
          {recipe.cost ? (
            <p className="text-sm">
              <span className="font-semibold">
                Coût estimé {recipe.cost.missingNames.length ? "minimum " : ""}:{" "}
                {formatCents(recipe.cost.cents)}
              </span>{" "}
              <span className="text-muted">
                pour {recipe.servings} parts, soit{" "}
                {formatCents(Math.round(recipe.cost.cents / recipe.servings))} la part.
                {recipe.cost.missingNames.length
                  ? ` Sans prix connu : ${recipe.cost.missingNames.join(", ")}.`
                  : ""}{" "}
                <Link href="/prices" className="underline">
                  Prix indicatifs
                </Link>
              </span>
            </p>
          ) : (
            <p className="text-muted text-sm">
              Aucun prix connu pour ces ingrédients : le coût n&apos;est pas estimé.
            </p>
          )}
          {!recipe.exclusionLabel ? (
            <div className="flex flex-wrap items-start gap-3">
              <AddToMenuButton recipeId={recipe.id} variant="primary" />
              <CookMode title={recipe.title} steps={recipe.steps} />
            </div>
          ) : null}
          <RatingButtons recipeId={recipe.id} rating={recipe.rating} />
          <History history={recipe.history} />
        </div>
      </header>

      {recipe.exclusionLabel ? (
        <Alert tone="error">
          Incompatible avec ton foyer : {recipe.exclusionLabel}. Cette recette n&apos;est proposée
          ni dans le catalogue ni dans les menus.
        </Alert>
      ) : null}
      {recipe.toRemoveNames.length > 0 ? (
        <Alert tone="info">
          Ingrédient facultatif que tu ne manges pas : {recipe.toRemoveNames.join(", ")}. La recette
          se fait sans.
        </Alert>
      ) : null}

      {cook?.kind === "ready" ? (
        <section aria-label="Plat du menu" className="flex flex-col gap-2">
          <p className="text-sm font-semibold">
            Ce plat est au menu de la semaine. Une fois préparé :
          </p>
          <div className="self-start">
            <CookButton
              week={cook.week}
              recipeId={recipe.id}
              servings={cook.servings}
              formKey={cook.formKey}
            />
          </div>
        </section>
      ) : cook?.kind === "cooked" ? (
        <Alert tone="success">
          Cuisiné le {formatDateTime(cook.cookedAt, "Europe/Paris")} : ingrédients retirés du
          garde-manger.
        </Alert>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="lg:sticky lg:top-8">
          <RecipeIngredients ingredients={recipe.ingredients} baseServings={recipe.servings} />
          <p className="text-muted mt-3 text-sm">
            Les ingrédients à acheter s&apos;ajoutent à ta liste de courses quand la recette est au
            menu.
          </p>
        </div>

        <section aria-labelledby="steps-title" className="flex flex-col gap-5">
          <h2 id="steps-title" className="type-section">
            Préparation
          </h2>
          <ol className="flex flex-col gap-6">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="font-display text-accent-strong w-8 shrink-0 text-3xl leading-none font-semibold"
                >
                  {i + 1}
                </span>
                <p className="pt-1 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="text-muted border-border border-t pt-5 text-sm">
        Allergènes :{" "}
        {recipe.allergenLabels.length
          ? recipe.allergenLabels.join(", ")
          : "aucun des 14 allergènes réglementaires"}
        . Déduits des ingrédients : vérifie toujours l&apos;étiquette des produits. Pas
        d&apos;informations nutritionnelles : nous n&apos;avons pas de données fiables pour les
        calculer.
      </footer>
    </article>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

function History({ history }: { history: RecipeDetail["history"] }) {
  if (history.cookedCount === 0 && history.plannedWeeks === 0) {
    return <p className="text-muted text-sm">Jamais encore au menu du foyer.</p>;
  }
  const parts: string[] = [];
  if (history.cookedCount > 0 && history.lastCookedAt) {
    parts.push(
      `Cuisiné ${history.cookedCount} fois, la dernière le ${formatShortDate(history.lastCookedAt.slice(0, 10))}`,
    );
  }
  if (history.lastPlannedWeek) {
    parts.push(`dernier menu : ${formatWeek(history.lastPlannedWeek).toLowerCase()}`);
  }
  return <p className="text-muted text-sm">{parts.join(", ")}.</p>;
}
