import Link from "next/link";
import { AddToMenuButton } from "@/components/recipes/add-to-menu-button";
import { FavoriteButton } from "@/components/recipes/favorite-button";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, UsersIcon } from "@/components/ui/icons";
import { formatCents } from "@/domain/money";
import type { RecipeCard as RecipeCardData } from "@/server/modules/recipes/queries";

/**
 * Carte de recette : visuel, nom, durée, portions, coût par portion, et ce qui compte pour
 * le foyer (ingrédients en stock, produit à finir). Le titre est le lien principal ; le cœur
 * et « Ajouter au menu » restent des boutons séparés (pas d'interactif imbriqué).
 */
export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  const { coverage, compatibility } = recipe;
  const ratio = coverage.total ? coverage.inStock / coverage.total : 0;
  const dimmed = !compatibility.compatible || recipe.rating === -1;

  return (
    <li className={`relative flex flex-col gap-3 ${dimmed ? "opacity-70" : ""}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
        <RecipeVisual slug={recipe.slug} title={recipe.title} tags={recipe.tags} />
        <div className="absolute top-2.5 right-2.5 z-10">
          <FavoriteButton
            recipeId={recipe.id}
            title={recipe.title}
            favorite={recipe.rating === 1}
          />
        </div>
        {recipe.usesPriority ? (
          <span className="absolute bottom-2.5 left-2.5">
            <Badge tone="urgent">Finit un produit à consommer</Badge>
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <h3 className="type-card">
          <Link
            href={`/recipes/${recipe.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {recipe.title}
          </Link>
        </h3>
        <p className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1">
            <ClockIcon size={15} /> {recipe.totalMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <UsersIcon size={15} /> {recipe.servings} parts
          </span>
          {recipe.costPerServingCents !== null ? (
            <span>
              {recipe.costIsMinimum ? "≥ " : "≈ "}
              {formatCents(recipe.costPerServingCents)} la part
            </span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {recipe.exclusionLabel ? (
            <Badge tone="danger">{recipe.exclusionLabel}</Badge>
          ) : coverage.total > 0 ? (
            <Badge tone={ratio >= 0.5 ? "leaf" : "neutral"}>
              {coverage.inStock}/{coverage.total} chez toi
            </Badge>
          ) : null}
          {recipe.vegan ? (
            <Badge tone="neutral">Végétalien</Badge>
          ) : recipe.vegetarian ? (
            <Badge tone="neutral">Végétarien</Badge>
          ) : null}
          {recipe.rating === -1 ? <Badge tone="neutral">Pas pour nous</Badge> : null}
          {compatibility.toRemove.length > 0 ? (
            <Badge tone="soon">Un ingrédient à retirer</Badge>
          ) : null}
        </div>
      </div>
      {compatibility.compatible ? (
        <div className="relative z-10">
          <AddToMenuButton recipeId={recipe.id} compact />
        </div>
      ) : null}
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
