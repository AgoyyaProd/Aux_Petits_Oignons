/**
 * Logo « Aux Petits Oignons » : une feuille sauge (avec sa nervure), un rond ocre et un
 * demi-bol terracotta ; le nom sur trois lignes en vert forêt.
 * Composant vectoriel unique, à remplacer par le fichier définitif quand il existera :
 *  - <LogoMark /> : le symbole seul (icône d'appli, navigation mobile, favicon) ;
 *  - <Logo /> : symbole + nom (version principale) ;
 *  - tone="mono" : une seule couleur (currentColor) ; tone="inverse" : sur fond vert forêt.
 */

type Tone = "color" | "mono" | "inverse";

const COLORS: Record<Tone, { bowl: string; dot: string; leaf: string; vein: string }> = {
  color: { bowl: "#E76F51", dot: "#F4B942", leaf: "#8FA88A", vein: "#FBF7EF" },
  inverse: { bowl: "#E76F51", dot: "#F4B942", leaf: "#A9C0A4", vein: "#0E3B2E" },
  mono: { bowl: "currentColor", dot: "currentColor", leaf: "currentColor", vein: "transparent" },
};

/** Tracés partagés avec l'icône d'appli (public/icon.svg, icônes PNG). */
export const LOGO_PATHS = {
  leaf: "M22 25.5C10.5 25 4.5 16 6.5 4.5 18 6.5 24 14.5 22 25.5Z",
  vein: "M20.5 23C16 18 12 12.5 9 7.5",
  dot: { cx: 33.5, cy: 14, r: 8 },
  bowl: "M5 27h38c0 9.4-8.5 17-19 17S5 36.4 5 27Z",
} as const;

export function LogoMark({
  size = 32,
  tone = "color",
  className = "",
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  const c = COLORS[tone];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={LOGO_PATHS.leaf} fill={c.leaf} />
      <path
        d={LOGO_PATHS.vein}
        fill="none"
        stroke={c.vein}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle {...LOGO_PATHS.dot} fill={c.dot} />
      <path d={LOGO_PATHS.bowl} fill={c.bowl} />
    </svg>
  );
}

export function Logo({
  tone = "color",
  size = 40,
  className = "",
  stacked = true,
}: {
  tone?: Tone;
  size?: number;
  className?: string;
  /** Nom sur trois lignes (version principale) ou sur une ligne (en-têtes étroits). */
  stacked?: boolean;
}) {
  const text =
    tone === "inverse" ? "text-cream" : tone === "color" ? "text-forest dark:text-foreground" : "";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} tone={tone} />
      <span
        className={`font-display font-semibold tracking-tight ${text} ${stacked ? "flex flex-col leading-[0.92]" : "leading-none whitespace-nowrap"}`}
        style={{
          fontSize: stacked ? size * 0.36 : size * 0.5,
          fontVariationSettings: '"opsz" 36',
        }}
      >
        {stacked ? (
          <>
            <span>Aux</span>
            <span>Petits</span>
            <span>Oignons</span>
          </>
        ) : (
          "Aux Petits Oignons"
        )}
      </span>
    </span>
  );
}
