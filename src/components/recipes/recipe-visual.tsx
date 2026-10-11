import { ImageSlot } from "@/components/ui/image-slot";
import { recipeImage } from "@/lib/images";

/**
 * Visuel d'une recette : la photo déclarée dans lib/images (ou passée en imageUrl), sinon
 * un emplacement neutre. Le fond alterne crème et sauge de façon stable d'une recette à
 * l'autre pour que les grilles restent lisibles sans photos.
 */
export function RecipeVisual({
  slug,
  title,
  imageUrl,
  className = "",
  iconSize,
}: {
  slug: string;
  title: string;
  /** Conservé pour compatibilité : les étiquettes ne changent plus le visuel. */
  tags?: readonly string[];
  imageUrl?: string | null;
  className?: string;
  iconSize?: number;
}) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return (
    <ImageSlot
      src={imageUrl ?? recipeImage(slug)}
      alt={title}
      tone={h % 3 === 0 ? "sage" : "cream"}
      className={className}
      iconSize={iconSize}
    />
  );
}
