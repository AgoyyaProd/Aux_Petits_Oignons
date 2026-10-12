import Link from "next/link";
import { AddToMenuButton } from "@/components/recipes/add-to-menu-button";
import { FavoriteButton } from "@/components/recipes/favorite-button";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, GaugeIcon, LeafIcon } from "@/components/ui/icons";
import { formatCents } from "@/domain/money";
import { DIFFICULTY_LABEL, DIFFICULTY_RULE } from "@/domain/recipes/difficulty";
import type { RecipeCard as RecipeCardData } from "@/server/modules/recipes/queries";

/**
 * Carte de recette : grande carte (visuel en haut) sur tablette et ordinateur, ligne
 * compacte (vignette à gauche) sur téléphone. Le titre est le lien principal ; le cœur et
 * l'ajout au menu restent des boutons séparés (pas d'interactif imbriqué).
 */
export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  const { coverage, compatibility } = recipe;
  const ratio = coverage.total ? coverage.inStock / coverage.total : 0;
  const dimmed = !compatibility.compatible || recipe.rating === -1;

  return (
    <li
      className={`bg-surface border-border relative flex gap-3 overflow-hidden rounded-2xl border p-2.5 sm:flex-col sm:gap-0 sm:p-0 ${dimmed ? "opacity-70" : ""}`}
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl sm:aspect-[4/3] sm:size-auto sm:rounded-none">
        <RecipeVisual slug={recipe.slug} title={recipe.title} tags={recipe.tags} />
        <div className="absolute top-2.5 right-2.5 z-10 hidden sm:block">
          <FavoriteButton
            recipeId={recipe.id}
            title={recipe.title}
            favorite={recipe.rating === 1}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="leading-snug font-semibold">
            <Link
              href={`/recipes/${recipe.slug}`}
              className="after:absolute after:inset-0 after:content-[''] hover:underline"
            >
              {recipe.title}
            </Link>
          </h3>
          <div className="relative z-10 -mt-1 -mr-1 sm:hidden">
            <FavoriteButton
              recipeId={recipe.id}
              title={recipe.title}
              favorite={recipe.rating === 1}
            />
          </div>
        </div>
        <p className="text-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon size={16} /> {recipe.totalMinutes} min
          </span>
          <span className="inline-flex items-center gap-1.5" title={DIFFICULTY_RULE}>
            <GaugeIcon size={16} /> {DIFFICULTY_LABEL[recipe.difficulty]}
          </span>
          {recipe.costPerServingCents !== null ? (
            <span className="max-sm:hidden">
              {recipe.costIsMinimum ? "≥ " : "≈ "}
              {formatCents(recipe.costPerServingCents)} la part
            </span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 sm:mt-auto sm:pt-2">
          {recipe.exclusionLabel ? (
            <Badge tone="danger">{recipe.exclusionLabel}</Badge>
          ) : coverage.total > 0 && ratio > 0 ? (
            <Badge tone={ratio >= 0.5 ? "leaf" : "neutral"}>
              {coverage.inStock}/{coverage.total} chez toi
            </Badge>
          ) : null}
          {recipe.usesPriority ? <Badge tone="urgent">Finit un produit</Badge> : null}
          {recipe.season === "in" ? (
            <Badge tone="leaf">
              <LeafIcon size={12} /> De saison
            </Badge>
          ) : null}
          {recipe.vegan ? (
            <Badge tone="neutral">Végétalien</Badge>
          ) : recipe.vegetarian ? (
            <Badge tone="neutral">Végétarien</Badge>
          ) : null}
          {recipe.rating === -1 ? <Badge tone="neutral">Pas pour nous</Badge> : null}
          {compatibility.compatible ? (
            <span className="ml-auto max-sm:hidden">
              <AddToMenuButton recipeId={recipe.id} iconOnly />
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/** Conservé pour les écrans qui affichent une étiquette simple. */
export function Tag({
  tone,
  children,
}: {
  tone: "brand" | "neutral" | "danger" | "warning";
  children: React.ReactNode;
}) {
  const map = { brand: "leaf", neutral: "neutral", danger: "danger", warning: "soon" } as const;
  return <Badge tone={map[tone]}>{children}</Badge>;
}
