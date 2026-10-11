import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { CookButton } from "@/components/cooking/cook-button";
import { AddToMenuButton } from "@/components/recipes/add-to-menu-button";
import { CookMode } from "@/components/recipes/cook-mode";
import { RatingButtons } from "@/components/recipes/rating-buttons";
import { RecipeBody } from "@/components/recipes/recipe-body";
import { FavoriteButton } from "@/components/recipes/favorite-button";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, ClockIcon, GaugeIcon, UsersIcon } from "@/components/ui/icons";
import { DIFFICULTY_LABEL, DIFFICULTY_RULE } from "@/domain/recipes/difficulty";
import { isInCurrentPlan } from "@/server/modules/planning/queries";
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
      <nav aria-label="Fil d'Ariane" className="text-muted flex items-center gap-1.5 text-sm">
        <Link href="/dashboard" className="hover:text-foreground">
          Accueil
        </Link>
        <ChevronLeftIcon size={14} className="rotate-180" />
        <Link href="/recipes" className="hover:text-foreground">
          Recettes
        </Link>
      </nav>
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
  const [cook, inMenu] = await Promise.all([getCookStatus(recipe.id), isInCurrentPlan(recipe.id)]);

  return (
    <article className="flex flex-col gap-10">
      <header className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-12">
        <div className="aspect-[4/3] overflow-hidden rounded-3xl">
          <RecipeVisual slug={recipe.slug} title={recipe.title} tags={recipe.tags} />
        </div>
        <div className="flex flex-col gap-5 lg:py-2">
          <h1 className="type-page">{recipe.title}</h1>
          <div className="flex flex-wrap gap-1.5">
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
          <ul className="text-muted flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li className="inline-flex items-center gap-1.5">
              <ClockIcon size={18} />
              {total} min
              <span className="sr-only">
                (préparation {recipe.prepMinutes} min, cuisson {recipe.cookMinutes} min)
              </span>
            </li>
            <li className="inline-flex items-center gap-1.5" title={DIFFICULTY_RULE}>
              <GaugeIcon size={18} />
              {DIFFICULTY_LABEL[recipe.difficulty]}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <UsersIcon size={18} />
              {recipe.servings} personnes
            </li>
          </ul>
          <p className="text-muted text-sm">
            Préparation {recipe.prepMinutes} min
            {recipe.cookMinutes > 0 ? `, cuisson ${recipe.cookMinutes} min` : ", sans cuisson"}.
            {recipe.cost
              ? ` Coût estimé ${recipe.cost.missingNames.length ? "minimum " : ""}${formatCents(recipe.cost.cents)}, soit ${formatCents(Math.round(recipe.cost.cents / recipe.servings))} la part${recipe.cost.missingNames.length ? ` (sans prix : ${recipe.cost.missingNames.join(", ")})` : ""}.`
              : " Coût non estimé : aucun prix connu."}
          </p>
          {!recipe.exclusionLabel ? (
            <div className="flex flex-wrap items-start gap-3">
              <AddToMenuButton recipeId={recipe.id} variant="primary" />
              <FavoriteButton
                recipeId={recipe.id}
                title={recipe.title}
                favorite={recipe.rating === 1}
                bordered
              />
              <CookMode title={recipe.title} steps={recipe.steps} />
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

      <RecipeBody
        recipeId={recipe.id}
        ingredients={recipe.ingredients}
        steps={recipe.steps}
        baseServings={recipe.servings}
        inMenu={inMenu}
      />

      <footer className="text-muted border-border border-t pt-5 text-sm leading-relaxed">
        Allergènes :{" "}
        {recipe.allergenLabels.length
          ? recipe.allergenLabels.join(", ")
          : "aucun des 14 allergènes réglementaires"}
        . Déduits des ingrédients : vérifie toujours l&apos;étiquette des produits. Difficulté :{" "}
        {DIFFICULTY_RULE.charAt(0).toLowerCase() + DIFFICULTY_RULE.slice(1)} Pas de valeurs
        nutritionnelles : nous n&apos;avons pas de données fiables pour les calculer.
      </footer>
    </article>
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
