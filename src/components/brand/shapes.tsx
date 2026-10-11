/**
 * Formes de la marque (feuille, rond, demi-bol), utilisées en décor autour des visuels et
 * dans les pastilles. Toujours décoratives : aria-hidden.
 */

export function LeafShape({
  className = "",
  color = "#8FA88A",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 40 48" aria-hidden="true" className={className}>
      <path d="M33 46C12 45 1 30 4 3c22 3 33 19 29 43Z" fill={color} />
      <path
        d="M30 42C22 31 15 19 9 8"
        fill="none"
        stroke="#FFF8EF"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function DotShape({
  className = "",
  color = "#F4C145",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <circle cx="20" cy="20" r="20" fill={color} />
    </svg>
  );
}

export function BowlShape({
  className = "",
  color = "#E76F51",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 80 40" aria-hidden="true" className={className}>
      <path d="M0 0h80c0 22-17.9 40-40 40S0 22 0 0Z" fill={color} />
    </svg>
  );
}

/** Pastille ronde à motif de marque, pour les bénéfices et les catégories. */
export function BrandBadge({ variant }: { variant: "leaf" | "bowl" | "dot" | "mix" }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-12 shrink-0">
      {variant === "leaf" ? (
        <>
          <path d="M26 40C12 39 6 28 8 10c15 2 22 13 18 30Z" fill="#8FA88A" />
          <path
            d="M24 37C19 29 15 21 11 14"
            fill="none"
            stroke="#FFF8EF"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx="35" cy="34" r="6" fill="#F4C145" />
        </>
      ) : variant === "bowl" ? (
        <>
          <circle cx="24" cy="14" r="8" fill="#F4C145" />
          <path d="M6 24h36c0 10-8 18-18 18S6 34 6 24Z" fill="#E76F51" />
        </>
      ) : variant === "dot" ? (
        <>
          <path d="M22 26C12 25 7 17 9 7c10 2 15 9 13 19Z" fill="#8FA88A" />
          <path d="M6 28h36c0 9-8 16-18 16S6 37 6 28Z" fill="#E76F51" />
        </>
      ) : (
        <>
          <path d="M20 24C11 23 7 16 8 7c9 2 14 8 12 17Z" fill="#8FA88A" />
          <circle cx="32" cy="13" r="7" fill="#F4C145" />
          <path d="M6 27h36c0 9-8 16-18 16S6 36 6 27Z" fill="#0E3B2E" />
        </>
      )}
    </svg>
  );
}
