import { randomUUID } from "node:crypto";
import { NutritionPanel } from "@/components/recipes/nutrition-panel";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CookButton, CookOffMenuButton } from "@/components/cooking/cook-button";
import { AddToMenuButton } from "@/components/recipes/add-to-menu-button";
import { CookMode } from "@/components/recipes/cook-mode";
import { KitchenProvider } from "@/components/recipes/kitchen";
import { RatingButtons } from "@/components/recipes/rating-buttons";
import { RecipeBody } from "@/components/recipes/recipe-body";
import { FavoriteButton } from "@/components/recipes/favorite-button";
import { RecipeFacts } from "@/components/recipes/recipe-facts";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, FridgeIcon, LeafIcon } from "@/components/ui/icons";
import { DIFFICULTY_RULE } from "@/domain/recipes/difficulty";
import { isInCurrentPlan } from "@/server/modules/planning/queries";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { formatWeek } from "@/lib/week";
import { getCookStatus } from "@/server/modules/cooking/queries";
import { getRecipe, RECIPE_TAG_LABEL, type RecipeDetail } from "@/server/modules/recipes/queries";

export const metadata: Metadata = { title: "Recette" };

export default function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  return (
    <div className="flex flex-col gap-6">
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

  const [cook, inMenu] = await Promise.all([getCookStatus(recipe.id), isInCurrentPlan(recipe.id)]);

  return (
    <KitchenProvider baseServings={recipe.servings}>
      <article className="flex flex-col gap-10 lg:gap-14">
        <nav aria-label="Fil d'Ariane" className="text-muted -mb-4 text-sm lg:-mb-6">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/dashboard" className="hover:text-foreground">
                Accueil
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronLeftIcon size={14} className="rotate-180" />
            </li>
            <li>
              <Link href="/recipes" className="hover:text-foreground">
                Recettes
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronLeftIcon size={14} className="rotate-180" />
            </li>
            <li
              aria-current="page"
              className="text-foreground max-w-[16rem] truncate font-medium lg:max-w-md"
            >
              {recipe.title}
            </li>
          </ol>
        </nav>
        <header className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-stretch lg:gap-16">
          <RecipeVisual
            slug={recipe.slug}
            title={recipe.title}
            className="aspect-[4/3] rounded-3xl lg:aspect-auto lg:h-full lg:min-h-[26rem]"
            iconSize={40}
            sizes="(min-width: 1024px) 55vw, 100vw"
            priority
          />
          <div className="flex flex-col gap-6">
            <h1 className="type-page">{recipe.title}</h1>
            <div className="flex flex-wrap gap-1.5">
              {recipe.season === "in" ? (
                <Badge tone="leaf">
                  <LeafIcon size={12} /> De saison
                </Badge>
              ) : null}
              {recipe.vegan ? (
                <Badge tone="leaf">Végétalien</Badge>
              ) : recipe.vegetarian ? (
                <Badge tone="leaf">Végétarien</Badge>
              ) : null}
              {recipe.tags.map((t) => (
                <Badge key={t} tone="neutral">
                  {RECIPE_TAG_LABEL[t] ?? t}
                </Badge>
              ))}
            </div>
            {recipe.description ? (
              <p className="text-muted text-lg leading-relaxed">{recipe.description}</p>
            ) : null}
            {recipe.season === "out" && recipe.outOfSeasonNames.length ? (
              <p className="text-muted text-sm">
                Hors saison en ce moment : {recipe.outOfSeasonNames.join(", ").toLowerCase()}. Ces
                produits sont plus chers et moins savoureux qu&apos;en pleine saison.
              </p>
            ) : null}
            <RecipeFacts
              prepMinutes={recipe.prepMinutes}
              restMinutes={recipe.restMinutes}
              cookMinutes={recipe.cookMinutes}
              servings={recipe.servings}
              stepCount={recipe.steps.length}
              difficulty={recipe.difficulty}
              cost={recipe.cost}
              kcal={recipe.nutrition?.reliable ? recipe.nutrition.perServing.kcal : null}
              equipmentLabels={recipe.equipmentLabels}
              allergenLabels={recipe.allergenLabels}
            />
            {!recipe.exclusionLabel ? (
              <div className="flex flex-wrap items-start gap-3">
                <AddToMenuButton recipeId={recipe.id} variant="primary" />
                <FavoriteButton
                  recipeId={recipe.id}
                  title={recipe.title}
                  favorite={recipe.rating === 1}
                  bordered
                />
                <CookMode
                  title={recipe.title}
                  steps={recipe.steps}
                  ingredients={recipe.ingredients}
                  stepDetails={recipe.stepDetails}
                />
              </div>
            ) : null}
            <details className="text-sm">
              <summary className="text-muted cursor-pointer">Avis et historique</summary>
              <div className="mt-3 flex flex-col gap-2">
                <RatingButtons recipeId={recipe.id} rating={recipe.rating} />
                <History history={recipe.history} />
              </div>
            </details>
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
            Ingrédient facultatif que tu ne manges pas : {recipe.toRemoveNames.join(", ")}. La
            recette se fait sans.
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
        ) : (
          <section aria-label="Plat cuisiné hors menu" className="flex flex-col gap-2">
            {cook?.kind === "cooked" ? (
              <Alert tone="success">
                Cuisiné le {formatDateTime(cook.cookedAt, "Europe/Paris")} : ingrédients retirés du
                garde-manger.
              </Alert>
            ) : null}
            <div className="self-start">
              <CookOffMenuButton
                recipeId={recipe.id}
                defaultServings={recipe.servings}
                formKey={randomUUID()}
              />
            </div>
          </section>
        )}

        <RecipeBody
          recipeId={recipe.id}
          ingredients={recipe.ingredients}
          steps={recipe.steps}
          stepDetails={recipe.stepDetails}
          baseServings={recipe.servings}
          inMenu={inMenu}
        />

        <NutritionPanel nutrition={recipe.nutrition} />

        {recipe.storageNote ? (
          <section
            aria-labelledby="conservation"
            className="bg-leaf-soft flex gap-4 rounded-2xl p-5 sm:p-6"
          >
            <span
              aria-hidden="true"
              className="bg-surface text-forest dark:text-brand flex size-11 shrink-0 items-center justify-center rounded-full"
            >
              <FridgeIcon size={22} />
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 id="conservation" className="type-section text-[1.1875rem]">
                Conservation
              </h2>
              <p className="leading-relaxed">{recipe.storageNote}</p>
            </div>
          </section>
        ) : null}

        <footer className="text-muted border-border border-t pt-5 text-sm leading-relaxed">
          Allergènes déduits des ingrédients : vérifie toujours l&apos;étiquette des produits.
          Difficulté : {DIFFICULTY_RULE.charAt(0).toLowerCase() + DIFFICULTY_RULE.slice(1)}
        </footer>
      </article>
    </KitchenProvider>
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
