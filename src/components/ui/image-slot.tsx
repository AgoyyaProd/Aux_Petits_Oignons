/**
 * Emplacement d'image : affiche la photo si elle existe, sinon un fond neutre (crème ou
 * sauge) avec une petite icône. Il remplit son conteneur : c'est le parent qui fixe le
 * ratio (aspect-[4/3], size-24…), de sorte que la mise en page ne bouge pas quand la photo
 * arrive.
 */
export function ImageSlot({
  src,
  alt,
  tone = "cream",
  className = "",
  iconSize = 28,
}: {
  src?: string | null;
  /** Texte alternatif de la photo ; l'emplacement vide, lui, est décoratif. */
  alt: string;
  tone?: "cream" | "sage";
  className?: string;
  iconSize?: number;
}) {
  // Le parent fixe la taille, OU la classe elle-même (aspect-*, size-*, h-*) : dans ce cas on
  // ne force pas la hauteur à 100 %, sinon le ratio est écrasé dans une grille étirée.
  const fill = /(^|\s)size-/.test(className)
    ? ""
    : /(^|\s)(aspect-|h-)/.test(className)
      ? "w-full"
      : "h-full w-full";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- chemins locaux, dimensions fixées par le parent
      <img src={src} alt={alt} className={`block object-cover ${fill} ${className}`} />
    );
  }
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
