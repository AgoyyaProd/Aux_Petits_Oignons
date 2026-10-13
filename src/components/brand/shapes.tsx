import { COLORS, LOGO_MARK_PATHS } from "./logo";

/**
 * Formes de la marque, découpées dans le logo officiel (feuille sauge, rond ocre, demi-bol
 * terracotta) : décor autour des visuels et pastilles. Toujours décoratives (aria-hidden).
 * Chaque viewBox cadre la forme au plus près (repère du logo, 192 × 203).
 */

const BOX = {
  leaf: { x: 1, y: 0, w: 107, h: 100 },
  dot: { x: 118, y: 8, w: 75, h: 75 },
  bowl: { x: 15, y: 108, w: 185, h: 95 },
} as const;
type Piece = keyof typeof BOX;

const viewBox = (k: Piece) => `${BOX[k].x} ${BOX[k].y} ${BOX[k].w} ${BOX[k].h}`;

function Shape({ piece, className, color }: { piece: Piece; className: string; color: string }) {
  return (
    <svg viewBox={viewBox(piece)} aria-hidden="true" focusable="false" className={className}>
      <path d={LOGO_MARK_PATHS[piece]} fill={color} />
    </svg>
  );
}

export function LeafShape({ className = "", color = COLORS.color.leaf }) {
  return <Shape piece="leaf" className={className} color={color} />;
}

export function DotShape({ className = "", color = COLORS.color.dot }) {
  return <Shape piece="dot" className={className} color={color} />;
}

export function BowlShape({ className = "", color = COLORS.color.bowl }) {
  return <Shape piece="bowl" className={className} color={color} />;
}

/** Une forme placée dans la pastille (48 × 48) : position et taille en unités de pastille. */
function Place({ piece, x, y, w }: { piece: Piece; x: number; y: number; w: number }) {
  const h = (w * BOX[piece].h) / BOX[piece].w;
  return (
    <svg x={x} y={y} width={w} height={h} viewBox={viewBox(piece)}>
      <path d={LOGO_MARK_PATHS[piece]} fill={COLORS.color[piece]} />
    </svg>
  );
}

/** Pastille à motif de marque, pour les bénéfices et les catégories. */
export function BrandBadge({ variant }: { variant: "leaf" | "bowl" | "dot" | "mix" }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="size-12 shrink-0">
      {variant === "leaf" ? (
        <>
          <Place piece="leaf" x={3} y={6} w={32} />
          <Place piece="dot" x={31} y={29} w={14} />
        </>
      ) : variant === "bowl" ? (
        <>
          <Place piece="dot" x={16} y={4} w={17} />
          <Place piece="bowl" x={3} y={23} w={42} />
        </>
      ) : variant === "dot" ? (
        <>
          <Place piece="leaf" x={6} y={4} w={22} />
          <Place piece="bowl" x={3} y={25} w={42} />
        </>
      ) : (
        <>
          <Place piece="leaf" x={3} y={3} w={23} />
          <Place piece="dot" x={28} y={4} w={16} />
          <Place piece="bowl" x={6} y={25} w={39} />
        </>
      )}
    </svg>
  );
}
