import Link from "next/link";
import type { RecipeCard as RecipeCardData } from "@/server/modules/recipes/queries";

export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  const { coverage, compatibility } = recipe;
  const ratio = coverage.total ? coverage.inStock / coverage.total : 0;

  return (
    <li>
      <Link
        href={`/recipes/${recipe.slug}`}
        className={[
          "border-border bg-surface hover:border-brand flex h-full flex-col gap-2 rounded-2xl border p-4 transition",
          compatibility.compatible ? "" : "opacity-70",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold">{recipe.title}</h3>
          <span className="text-muted shrink-0 text-xs tabular-nums">
            {recipe.totalMinutes} min
          </span>
        </div>
        {recipe.description ? (
          <p className="text-muted line-clamp-2 text-sm">{recipe.description}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {recipe.exclusionLabel ? (
            <Tag tone="danger">{recipe.exclusionLabel}</Tag>
          ) : (
            <Tag tone={ratio >= 0.5 ? "brand" : "neutral"}>
              {coverage.inStock}/{coverage.total} en stock
            </Tag>
          )}
          {recipe.vegan ? (
            <Tag tone="neutral">Végétalien</Tag>
          ) : recipe.vegetarian ? (
            <Tag tone="neutral">Végétarien</Tag>
          ) : null}
          {compatibility.toRemove.length > 0 ? (
            <Tag tone="warning">Un ingrédient à retirer</Tag>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

export function Tag({
  tone,
  children,
}: {
  tone: "brand" | "neutral" | "danger" | "warning";
  children: React.ReactNode;
}) {
  const styles = {
    brand: "bg-brand-soft text-brand",
    neutral: "bg-background text-muted border border-border",
    danger: "bg-danger-soft text-danger",
    warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>
      {children}
    </span>
  );
}
