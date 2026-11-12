import { recipeImageSmall } from "@/lib/images";

/**
 * Emplacement d'image : affiche la photo si elle existe, sinon une vignette illustrée aux
 * couleurs du site (formes du logo, fond tiré du nom : stable d'une page à l'autre), ou à
 * défaut un fond neutre avec une petite icône. Il remplit son conteneur : c'est le parent qui fixe le
 * ratio (aspect-[4/3], size-24…), de sorte que la mise en page ne bouge pas quand la photo
 * arrive.
 */
export function ImageSlot({
  src,
  alt,
  tone = "cream",
  className = "",
  iconSize = 28,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  seed,
}: {
  src?: string | null;
  /** Texte alternatif de la photo ; l'emplacement vide, lui, est décoratif. */
  alt: string;
  tone?: "cream" | "sage";
  className?: string;
  iconSize?: number;
  /** Largeur affichée, pour que le navigateur choisisse la bonne taille de photo. */
  sizes?: string;
  /** Photo visible dès l'arrivée sur la page (ex. fiche recette) : pas de chargement différé. */
  priority?: boolean;
  /** Sans photo : vignette illustrée, composition et couleurs tirées de ce texte (le slug). */
  seed?: string;
}) {
  // Le parent fixe la taille, OU la classe elle-même (aspect-*, size-*, h-*) : dans ce cas on
  // ne force pas la hauteur à 100 %, sinon le ratio est écrasé dans une grille étirée.
  const fill = /(^|\s)size-/.test(className)
    ? ""
    : /(^|\s)(aspect-|h-)/.test(className)
      ? "w-full"
      : "h-full w-full";
  if (src) {
    const small = recipeImageSmall(src);
    return (
      // eslint-disable-next-line @next/next/no-img-element -- chemins locaux, dimensions fixées par le parent
      <img
        src={src}
        srcSet={small ? `${small} 600w, ${src} 1200w` : undefined}
        sizes={small ? sizes : undefined}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`block object-cover ${fill} ${className}`}
      />
    );
  }
  if (seed) return <Illustration seed={seed} className={`${fill} ${className}`} />;
  return (
    <span
      aria-hidden="true"
      className={[
        `flex shrink-0 items-center justify-center ${fill}`,
        tone === "sage" ? "bg-leaf-soft text-sage" : "bg-surface-muted text-border-strong",
        className,
      ].join(" ")}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
        <circle cx="9" cy="10" r="1.75" />
        <path d="m20.5 16-5-5-8.5 8.5" />
      </svg>
    </span>
  );
}

/** Fonds clairs du site (adaptés au thème sombre par leurs variables). */
const GROUNDS = ["bg-accent-soft", "bg-highlight-soft", "bg-leaf-soft", "bg-brand-soft"] as const;

/**
 * Formes du logo : rond ocre, demi-disque terracotta, feuille sauge. Dessinées sur 400 × 300,
 * affichées dans un cadre de 520 × 390 : elles laissent de l'air autour.
 */
const COMPOSITIONS = [
  <>
    <circle cx="300" cy="92" r="72" fill="var(--highlight)" />
    <path d="M150 178a95 95 0 0 0 190 0z" fill="var(--accent)" />
    <path d="M70 128c26-58 112-70 134-36-24 52-104 70-134 36z" fill="var(--leaf)" />
  </>,
  <>
    <circle cx="320" cy="250" r="118" fill="var(--highlight)" />
    <path d="M40 92c30-62 128-74 152-36-28 56-118 76-152 36z" fill="var(--leaf)" />
    <circle cx="120" cy="226" r="36" fill="var(--accent)" />
  </>,
  <>
    <path d="M40 0a110 110 0 0 0 220 0z" fill="var(--accent)" />
    <circle cx="120" cy="220" r="62" fill="var(--highlight)" />
    <path d="M232 214c30-70 136-82 160-40-30 62-126 84-160 40z" fill="var(--leaf)" />
  </>,
] as const;

function hashOf(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Vignette illustrée d'un plat ou d'un aliment sans photo : jamais un carré gris. Purement
 * décorative (le nom est toujours écrit à côté) : masquée aux lecteurs d'écran.
 */
function Illustration({ seed, className }: { seed: string; className: string }) {
  const h = hashOf(seed);
  const ground = GROUNDS[h % GROUNDS.length];
  const shapes = COMPOSITIONS[Math.floor(h / GROUNDS.length) % COMPOSITIONS.length];
  return (
    <span
      aria-hidden="true"
      className={`relative block shrink-0 overflow-hidden ${ground} ${className}`}
    >
      <svg
        viewBox="-60 -45 520 390"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {shapes}
      </svg>
    </span>
  );
}
