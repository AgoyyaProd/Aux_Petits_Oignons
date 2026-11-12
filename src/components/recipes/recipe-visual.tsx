import { ImageSlot } from "@/components/ui/image-slot";
import { recipeImage } from "@/lib/images";

/**
 * Visuel d'une recette : la photo déclarée dans lib/images (ou passée en imageUrl), sinon
 * une vignette illustrée tirée du slug (stable d'une page à l'autre).
 */
export function RecipeVisual({
  slug,
  title,
  imageUrl,
  className = "",
  iconSize,
  sizes,
  priority,
}: {
  slug: string;
  title: string;
  /** Conservé pour compatibilité : les étiquettes ne changent plus le visuel. */
  tags?: readonly string[];
  imageUrl?: string | null;
  className?: string;
  iconSize?: number;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <ImageSlot
      src={imageUrl ?? recipeImage(slug)}
      alt={title}
      seed={slug}
      className={className}
      iconSize={iconSize}
      sizes={sizes}
      priority={priority}
    />
  );
}
