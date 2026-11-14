import { useId } from "react";

/**
 * Logo officiel « Marmy » (source : public/brand/marmy.svg ; version texturée d'origine
 * dans design/brand/marmy-texture.svg) : une feuille verte, un rond jaune-orangé et une
 * tranche rouge, puis le nom « Marmy » d'une seule couleur.
 *  - <LogoMark /> : le symbole seul (icône d'appli, accueil, décor) ;
 *  - <Logo /> : symbole + nom (version principale) ;
 *  - tone="mono" : une seule couleur (currentColor) ; tone="inverse" : sur fond vert foncé.
 * Le grain des fichiers d'origine est remplacé par des dégradés lisses : invisible à la taille
 * d'un en-tête, il pèserait plusieurs centaines de Ko sur chaque page. Les grandes formes
 * décoratives texturées sont dans <BrandElement /> (images WebP).
 * Le nom suit la couleur du texte (currentColor) pour rester lisible en thème sombre.
 */

export type Tone = "color" | "mono" | "inverse";

/** Couleurs du fichier source : teinte de base et teinte du dégradé, par forme. */
export const COLORS = {
  leaf: { base: "#507A46", deep: "#295120" },
  dot: { base: "#EEB653", deep: "#FF9D00" },
  slice: { base: "#ED6135", deep: "#EF491D" },
  ink: "#142F26",
} as const;

/** Tracés du symbole (repère du fichier source, 2964,1 × 958,4). */
export const LOGO_MARK_PATHS = {
  leaf: "M294.62,208.74c137.55,82.52,161.77,226.72,164.67,246.06-18.43,6.54-157.08,53.05-294.64-29.48C27.13,342.8,2.91,198.62,0,179.27c18.43-6.54,157.06-53.06,294.62,29.47Z",
  dot: "M519.94,253.19a149.44,149.44 0 1 0 298.88,0a149.44,149.44 0 1 0 -298.88,0Z",
  slice:
    "M569.02,830.21c186.85-33.66,316.61-205.63,293.47-386.32-.99-7.7-7.33-13.32-14.14-12.63-96.87,9.87-173.97,26-226.76,39-125.4,30.87-189.98,62.88-318.65,80.25-52.89,7.14-97.95,9.29-130.42,9.79-8.05.12-13.59,8.65-11.33,17.47,44.45,173.57,223.66,285.63,407.83,252.45Z",
} as const;

export type MarkPiece = keyof typeof LOGO_MARK_PATHS;

/** Dégradés (repère du fichier source) reproduisant le sens du grain d'origine. */
export function MarkGradients({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient
        id={`${id}-leaf`}
        gradientUnits="userSpaceOnUse"
        x1="65.5"
        y1="165"
        x2="393"
        y2="471"
      >
        <stop offset="0" stopColor={COLORS.leaf.base} />
        <stop offset="0.35" stopColor={COLORS.leaf.base} />
        <stop offset="1" stopColor={COLORS.leaf.deep} />
      </linearGradient>
      <radialGradient
        id={`${id}-dot`}
        gradientUnits="userSpaceOnUse"
        cx="729.5"
        cy="173.8"
        r="327.6"
      >
        <stop offset="0" stopColor={COLORS.dot.base} />
        <stop offset="0.3" stopColor={COLORS.dot.base} />
        <stop offset="0.85" stopColor={COLORS.dot.deep} />
      </radialGradient>
      <linearGradient
        id={`${id}-slice`}
        gradientUnits="userSpaceOnUse"
        x1="349.4"
        y1="484.9"
        x2="706.2"
        y2="842.1"
      >
        <stop offset="0" stopColor={COLORS.slice.base} />
        <stop offset="0.45" stopColor={COLORS.slice.base} />
        <stop offset="1" stopColor={COLORS.slice.deep} />
      </linearGradient>
    </defs>
  );
}

function MarkPaths({ tone, id }: { tone: Tone; id: string }) {
  const fill = (k: MarkPiece) => (tone === "mono" ? "currentColor" : `url(#${id}-${k})`);
  return (
    <>
      {tone === "mono" ? null : <MarkGradients id={id} />}
      <path d={LOGO_MARK_PATHS.slice} fill={fill("slice")} />
      <path d={LOGO_MARK_PATHS.leaf} fill={fill("leaf")} />
      <path d={LOGO_MARK_PATHS.dot} fill={fill("dot")} />
    </>
  );
}

/** Tracés du nom « Marmy » (une couleur). */
const WORDMARK: readonly string[] = [
  "M1512.55,303.85v351.74h-70.55v-228.78l-94.23,228.78h-53.42l-94.74-228.78v228.78h-70.55v-351.74h80.12l111.87,261.54,111.87-261.54h79.62Z",
  "M1580.83,439.91c11.25-21.83,26.54-38.63,45.86-50.39,19.32-11.76,40.9-17.64,64.75-17.64,20.83,0,39.05,4.2,54.68,12.6,15.62,8.4,28.13,18.98,37.54,31.75v-39.81h71.05v279.18h-71.05v-40.82c-9.07,13.1-21.59,23.94-37.54,32.5-15.96,8.57-34.35,12.85-55.18,12.85-23.52,0-44.94-6.05-64.25-18.14-19.32-12.09-34.61-29.14-45.86-51.15-11.26-22-16.88-47.28-16.88-75.84s5.62-53.24,16.88-75.09ZM1773.58,471.91c-6.72-12.26-15.79-21.67-27.21-28.22-11.43-6.55-23.68-9.83-36.79-9.83s-25.2,3.2-36.28,9.57c-11.09,6.39-20.08,15.71-26.96,27.97-6.89,12.27-10.33,26.79-10.33,43.59s3.44,31.5,10.33,44.09c6.88,12.6,15.95,22.26,27.21,28.98,11.25,6.72,23.26,10.08,36.03,10.08s25.36-3.28,36.79-9.83c11.42-6.55,20.49-15.95,27.21-28.22,6.72-12.26,10.08-26.96,10.08-44.09s-3.36-31.83-10.08-44.09Z",
  "M2029.83,384.98c14.61-8.39,31.32-12.6,50.14-12.6v74.08h-18.65c-22.17,0-38.89,5.21-50.14,15.62-11.26,10.42-16.88,28.56-16.88,54.42v139.08h-70.55v-279.18h70.55v43.34c9.07-14.78,20.91-26.37,35.53-34.77Z",
  "M2556.93,403.88c20.99,21,31.5,50.31,31.5,87.94v163.78h-70.55v-154.2c0-21.83-5.54-38.55-16.63-50.14-11.09-11.59-26.2-17.39-45.35-17.39s-34.35,5.79-45.61,17.39c-11.26,11.59-16.88,28.31-16.88,50.14v154.2h-70.55v-154.2c0-21.83-5.54-38.55-16.63-50.14-11.09-11.59-26.2-17.39-45.35-17.39s-34.86,5.79-46.11,17.39c-11.26,11.59-16.88,28.31-16.88,50.14v154.2h-70.55v-279.18h70.55v33.76c9.07-11.76,20.74-20.99,35.02-27.72,14.28-6.72,29.98-10.08,47.12-10.08,21.83,0,41.32,4.62,58.46,13.86,17.13,9.24,30.4,22.42,39.81,39.56,9.07-16.13,22.25-29.05,39.56-38.8,17.3-9.74,36.03-14.61,56.19-14.61,34.27,0,61.9,10.5,82.9,31.5Z",
  "M2922.52,376.42l-172.85,411.21h-75.09l60.47-139.08-111.87-272.12h79.12l72.06,195.02,73.07-195.02h75.08Z",
];

/** Cadre du symbole seul (un peu de marge autour des formes). */
const MARK_BOX = { x: -8, y: 96, w: 882, h: 748 };

export function LogoMark({
  size = 32,
  tone = "color",
  className = "",
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg
      height={size}
      width={Math.round((size * MARK_BOX.w) / MARK_BOX.h)}
      viewBox={`${MARK_BOX.x} ${MARK_BOX.y} ${MARK_BOX.w} ${MARK_BOX.h}`}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <MarkPaths tone={tone} id={`m${id}`} />
    </svg>
  );
}

/** Symbole + nom ; `size` est la hauteur du logo en pixels. */
export function Logo({
  tone = "color",
  size = 40,
  className = "",
}: {
  tone?: Tone;
  size?: number;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const text =
    tone === "inverse" ? "text-cream" : tone === "color" ? "text-forest dark:text-foreground" : "";
  return (
    <svg
      role="img"
      aria-label="Marmy"
      viewBox="0 0 2964.1 958.43"
      height={size}
      width={Math.round((size * 2964.1) / 958.43)}
      className={`${text} ${className}`}
    >
      <MarkPaths tone={tone} id={`l${id}`} />
      <g fill="currentColor">
        {WORDMARK.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
