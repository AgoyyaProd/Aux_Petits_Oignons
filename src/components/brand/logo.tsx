/**
 * Logo « Aux Petits Oignons » : une feuille, un cercle (l'ingrédient) et un demi-bol.
 * Composant vectoriel unique, à remplacer par le logo définitif quand il existera :
 *  - <LogoMark /> : le symbole seul (icône d'appli, navigation mobile, favicon) ;
 *  - <Logo /> : symbole + nom (version principale) ;
 *  - tone="mono" : une seule couleur (currentColor), pour les fonds foncés ou l'impression.
 */

type Tone = "color" | "mono" | "inverse";

const COLORS: Record<Tone, { bowl: string; dot: string; leaf: string }> = {
  // Le bol suit le thème : vert forêt en clair, crème en sombre (variable CSS).
  color: { bowl: "var(--logo-bowl)", dot: "#E76F51", leaf: "#8FA486" },
  // Sur fond vert forêt : bol crème, cercle terracotta, feuille sauge claire.
  inverse: { bowl: "#FFF8ED", dot: "#E76F51", leaf: "#B9CBB1" },
  mono: { bowl: "currentColor", dot: "currentColor", leaf: "currentColor" },
};

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
      {/* Feuille */}
      <path d="M25 25c0-10.5 6.6-17.6 17-18.5C41.6 17 35 24 25 25Z" fill={c.leaf} />
      {/* Ingrédient */}
      <circle cx="15.5" cy="18.5" r="6.5" fill={c.dot} />
      {/* Demi-bol */}
      <path d="M4 27h40c0 11-9 19-20 19S4 38 4 27Z" fill={c.bowl} />
    </svg>
  );
}

export function Logo({
  tone = "color",
  size = 32,
  className = "",
}: {
  tone?: Tone;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} tone={tone} />
      <span
        className={`font-display leading-none font-semibold tracking-tight whitespace-nowrap ${tone === "inverse" ? "text-cream" : tone === "color" ? "text-forest dark:text-foreground" : ""}`}
        style={{ fontSize: size * 0.62, fontVariationSettings: '"opsz" 48' }}
      >
        Aux Petits Oignons
      </span>
    </span>
  );
}
