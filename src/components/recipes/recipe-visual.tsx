/**
 * Visuel d'une recette quand aucune photographie n'est disponible.
 *
 * Pas de photo inventée : une composition géométrique reprenant le langage du logo (le bol,
 * l'ingrédient rond, la feuille), dont la forme dit la famille du plat (pâtes, riz, soupe…)
 * et la couleur varie de façon stable d'une recette à l'autre. Dès qu'une vraie photo
 * existe (imageUrl), elle la remplace.
 */

export type DishFamily =
  "pates" | "riz" | "soupe" | "salade" | "dessert" | "poisson" | "viande" | "oeuf" | "legumes";

const FAMILY_WORDS: [DishFamily, RegExp][] = [
  ["dessert", /mousse|riz au lait|tarte aux|gâteau|crumble|compote/i],
  ["poisson", /saumon|cabillaud|thon|crevette|moule|poisson|colin|sardine/i],
  [
    "pates",
    /p[âa]tes|spaghetti|penne|farfalle|coquillette|tagliatelle|lasagne|macaroni|linguine|rigatoni|fusilli|gnocchi|one pot/i,
  ],
  ["riz", /riz|risotto|paella|quinoa|boulgour|semoule|taboul/i],
  ["oeuf", /œuf|oeuf|omelette|shakshuka|tortilla|quiche|crêpe/i],
  [
    "viande",
    /poulet|bœuf|boeuf|porc|veau|agneau|dinde|saucisse|merguez|jambon|lardon|chili|steak|boulette|filet mignon/i,
  ],
];

export function dishFamily(title: string, tags: readonly string[]): DishFamily {
  if (tags.includes("dessert")) return "dessert";
  if (tags.includes("soupe")) return "soupe";
  if (tags.includes("salade")) return "salade";
  for (const [family, re] of FAMILY_WORDS) if (re.test(title)) return family;
  return "legumes";
}

/** Fonds : couleurs de la marque, toujours avec un contraste correct pour les formes. */
const GROUNDS = [
  { bg: "#F7D7CB", bowl: "#0E3B2E", a: "#E76F51", b: "#8FA486", c: "#F4C145" },
  { bg: "#E5EBE1", bowl: "#0E3B2E", a: "#E76F51", b: "#F4C145", c: "#8FA486" },
  { bg: "#FCEFC7", bowl: "#0E3B2E", a: "#E76F51", b: "#8FA486", c: "#B0472C" },
  { bg: "#0E3B2E", bowl: "#FFF8ED", a: "#E76F51", b: "#F4C145", c: "#8FA486" },
  { bg: "#FBE3DA", bowl: "#0E3B2E", a: "#F4C145", b: "#8FA486", c: "#E76F51" },
] as const;

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function Garnish({ family, g }: { family: DishFamily; g: (typeof GROUNDS)[number] }) {
  switch (family) {
    case "pates":
      return (
        <g fill="none" stroke={g.c} strokeWidth="5" strokeLinecap="round">
          <path d="M58 70c8-10 16 10 24 0s16 10 24 0 16 10 24 0" />
          <path d="M66 58c8-10 16 10 24 0s16 10 24 0" stroke={g.a} />
          <path d="M62 82c8-8 14 8 22 0s14 8 22 0 14 8 22 0" stroke={g.b} />
        </g>
      );
    case "riz":
      return (
        <g>
          {[
            [70, 74],
            [84, 66],
            [98, 72],
            [112, 64],
            [126, 74],
            [92, 58],
            [106, 80],
            [78, 82],
            [120, 84],
          ].map(([x, y], i) => (
            <ellipse
              key={i}
              cx={x}
              cy={y}
              rx="6"
              ry="3.4"
              fill={g.c}
              transform={`rotate(${((i * 37) % 60) - 30} ${x} ${y})`}
            />
          ))}
          <circle cx="132" cy="54" r="10" fill={g.a} />
        </g>
      );
    case "soupe":
      return (
        <g>
          <ellipse cx="100" cy="88" rx="58" ry="10" fill={g.a} opacity="0.9" />
          <path d="M120 40c0-14 9-24 24-25-.6 15-9.6 24-24 25Z" fill={g.b} />
          <circle cx="76" cy="60" r="9" fill={g.c} />
        </g>
      );
    case "salade":
      return (
        <g>
          <path d="M60 86c0-22 14-36 36-38-1 23-14 37-36 38Z" fill={g.b} />
          <path d="M140 86c0-22-14-36-36-38 1 23 14 37 36 38Z" fill={g.c} />
          <circle cx="100" cy="66" r="11" fill={g.a} />
        </g>
      );
    case "dessert":
      return (
        <g>
          <path d="M70 84a30 30 0 0 1 60 0Z" fill={g.c} />
          <circle cx="100" cy="46" r="9" fill={g.a} />
        </g>
      );
    case "poisson":
      return (
        <g>
          <path d="M62 72c18-20 50-20 68 0-18 20-50 20-68 0Z" fill={g.b} />
          <path d="M130 72l14-12v24Z" fill={g.b} />
          <circle cx="80" cy="69" r="3.5" fill={g.bowl} />
          <circle cx="146" cy="44" r="8" fill={g.a} />
        </g>
      );
    case "viande":
      return (
        <g>
          <rect x="66" y="56" width="52" height="30" rx="15" fill={g.a} />
          <circle cx="132" cy="70" r="12" fill={g.c} />
          <path d="M120 46c0-11 7-19 19-20-.5 12-7.5 19.5-19 20Z" fill={g.b} />
        </g>
      );
    case "oeuf":
      return (
        <g>
          <path d="M66 80c0-18 14-30 34-30s34 12 34 30Z" fill="#FFF8ED" />
          <circle cx="100" cy="68" r="12" fill={g.c} />
          <circle cx="140" cy="48" r="7" fill={g.a} />
        </g>
      );
    default:
      return (
        <g>
          <circle cx="78" cy="68" r="14" fill={g.a} />
          <circle cx="112" cy="74" r="10" fill={g.c} />
          <path d="M118 62c0-16 10-27 26-28-.8 16.5-11 27.2-26 28Z" fill={g.b} />
        </g>
      );
  }
}

export function RecipeVisual({
  slug,
  title,
  tags,
  imageUrl,
  className = "",
}: {
  slug: string;
  title: string;
  tags: readonly string[];
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- source externe configurée par l'admin
      <img src={imageUrl} alt={title} className={`h-full w-full object-cover ${className}`} />
    );
  }
  const g = GROUNDS[hash(slug) % GROUNDS.length]!;
  const family = dishFamily(title, tags);
  return (
    <svg
      viewBox="0 0 200 140"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Visuel : ${title}`}
      className={`block h-full w-full ${className}`}
    >
      <rect width="200" height="140" fill={g.bg} />
      <Garnish family={family} g={g} />
      <path d="M36 90h128c0 24-28.6 44-64 44S36 114 36 90Z" fill={g.bowl} />
    </svg>
  );
}
