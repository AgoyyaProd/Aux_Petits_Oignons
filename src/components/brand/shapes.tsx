import { useId } from "react";
import { LOGO_MARK_PATHS, MarkGradients, type MarkPiece } from "./logo";

/**
 * Formes de la marque, tirées du logo officiel : feuille verte, rond jaune-orangé, tranche
 * rouge. Toujours décoratives (aria-hidden).
 *  - <BrandElement /> : la forme texturée d'origine (grain), en image WebP, pour les grands
 *    décors (accueil, connexion, bienvenue, pages vides…) ;
 *  - <LeafShape />, <DotShape />, <SliceShape /> et <BrandBadge /> : versions vectorielles
 *    légères (dégradés), pour les petites tailles.
 */

/** Cadre de chaque forme dans le repère du logo (2095,9 × 709,5). */
const BOX: Record<MarkPiece, { x: number; y: number; w: number; h: number }> = {
  leaf: { x: -2, y: 62, w: 425, h: 293 },
  dot: { x: 474, y: 12, w: 278, h: 278 },
  slice: { x: 158, y: 354, w: 637, h: 334 },
};

const viewBox = (k: MarkPiece) => `${BOX[k].x} ${BOX[k].y} ${BOX[k].w} ${BOX[k].h}`;

function useGradientId() {
  return `s${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function Shape({ piece, className }: { piece: MarkPiece; className: string }) {
  const id = useGradientId();
  return (
    <svg viewBox={viewBox(piece)} aria-hidden="true" focusable="false" className={className}>
      <MarkGradients id={id} />
      <path d={LOGO_MARK_PATHS[piece]} fill={`url(#${id}-${piece})`} />
    </svg>
  );
}

export const LeafShape = ({ className = "" }) => <Shape piece="leaf" className={className} />;
export const DotShape = ({ className = "" }) => <Shape piece="dot" className={className} />;
export const SliceShape = ({ className = "" }) => <Shape piece="slice" className={className} />;

/** Une forme placée dans la pastille (48 × 48) : position et largeur en unités de pastille. */
function Place({
  id,
  piece,
  x,
  y,
  w,
}: {
  id: string;
  piece: MarkPiece;
  x: number;
  y: number;
  w: number;
}) {
  const h = (w * BOX[piece].h) / BOX[piece].w;
  return (
    <svg x={x} y={y} width={w} height={h} viewBox={viewBox(piece)}>
      <path d={LOGO_MARK_PATHS[piece]} fill={`url(#${id}-${piece})`} />
    </svg>
  );
}

/** Pastille à motif de marque, pour les bénéfices et les catégories. */
export function BrandBadge({ variant }: { variant: "leaf" | "slice" | "dot" | "mix" }) {
  const id = useGradientId();
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="size-12 shrink-0">
      <MarkGradients id={id} />
      {variant === "leaf" ? (
        <>
          <Place id={id} piece="leaf" x={2} y={8} w={36} />
          <Place id={id} piece="dot" x={31} y={28} w={14} />
        </>
      ) : variant === "slice" ? (
        <>
          <Place id={id} piece="dot" x={16} y={4} w={17} />
          <Place id={id} piece="slice" x={3} y={24} w={42} />
        </>
      ) : variant === "dot" ? (
        <>
          <Place id={id} piece="dot" x={9} y={6} w={30} />
          <Place id={id} piece="leaf" x={27} y={30} w={19} />
        </>
      ) : (
        <>
          <Place id={id} piece="leaf" x={2} y={6} w={24} />
          <Place id={id} piece="dot" x={28} y={3} w={16} />
          <Place id={id} piece="slice" x={8} y={24} w={38} />
        </>
      )}
    </svg>
  );
}

/** Formes texturées d'origine (WebP, 800 px et 400 px de large). */
const ELEMENTS = {
  leaf: { ratio: 1880 / 1285 },
  slice: { ratio: 1904 / 993 },
  dot: { ratio: 1 },
} as const;

export type BrandElementName = keyof typeof ELEMENTS;

/**
 * Forme texturée du logo, en décor. La largeur se règle par className (w-24, w-40…) ;
 * `sizes` aide le navigateur à choisir la bonne image (400 ou 800 px).
 */
export function BrandElement({
  name,
  className = "",
  sizes = "160px",
  priority = false,
}: {
  name: BrandElementName;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const { ratio } = ELEMENTS[name];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- décor statique déjà optimisé (WebP)
    <img
      src={`/brand/elements/${name}.webp`}
      srcSet={`/brand/elements/${name}-400.webp 400w, /brand/elements/${name}.webp 800w`}
      sizes={sizes}
      width={800}
      height={Math.round(800 / ratio)}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`pointer-events-none h-auto select-none ${className}`}
    />
  );
}

/**
 * Le symbole du logo recomposé avec les trois formes texturées (grain d'origine), pour les
 * grands formats. Les positions reprennent celles du logo (cadre 793 × 671).
 */
export function TexturedMark({
  className = "",
  sizes = "240px",
}: {
  className?: string;
  sizes?: string;
}) {
  return (
    <div aria-hidden="true" className={className}>
      <div className="relative aspect-[793/671]">
        <BrandElement
          name="slice"
          sizes={sizes}
          className="absolute top-[51%] left-[20.2%] w-[79.8%]"
        />
        <BrandElement name="leaf" sizes={sizes} className="absolute top-[7.4%] left-0 w-[53.3%]" />
        <BrandElement name="dot" sizes={sizes} className="absolute top-0 left-[60%] w-[34.6%]" />
      </div>
    </div>
  );
}
