/**
 * Référencement : textes du site, adresses absolues, données structurées (schema.org) et
 * nettoyage des adresses envoyées aux statistiques. Fonctions pures, testées.
 */

export const SITE = {
  name: "Marmy",
  tagline: "La cuisine du quotidien, bien pensée.",
  description:
    "Marmy réunit tes recettes, ton garde-manger, tes menus de la semaine, ta liste de courses et ton budget. Plus de 500 recettes du quotidien, chiffrées et détaillées, gratuites.",
  locale: "fr_FR",
} as const;

/** Bloc Open Graph commun : à reprendre dans chaque page qui le précise (pas de fusion). */
export const OPEN_GRAPH_BASE = {
  type: "website" as const,
  locale: SITE.locale,
  siteName: SITE.name,
};

/** Adresse absolue à partir d'un chemin du site. */
export function absoluteUrl(base: string, path: string): string {
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
}

/** Durée ISO 8601 (« PT1H5M ») pour schema.org ; null si nulle. */
export function isoDuration(minutes: number): string | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}`;
}

/** Description courte pour les moteurs (≤ 160 caractères, coupée sur un mot). */
export function metaDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 30)).replace(/[\s,;:.]+$/, "")}…`;
}

export interface RecipeForSchema {
  slug: string;
  title: string;
  description: string | null;
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  restMinutes: number;
  tags: readonly string[];
  tagLabels: Readonly<Record<string, string>>;
  ingredients: readonly string[];
  steps: readonly string[];
  vegetarian: boolean;
  vegan: boolean;
  /** Valeurs par portion, seulement quand l'estimation est fiable. */
  nutrition: { kcal: number; proteinsG: number; carbsG: number; fatG: number } | null;
  /** Photo (adresse absolue) ou null. */
  image: string | null;
}

const CATEGORY_TAGS = ["plat", "soupe", "salade", "dessert", "petit-dejeuner"];

/** Données structurées Recipe (résultats enrichis des moteurs de recherche). */
export function recipeJsonLd(r: RecipeForSchema, url: string) {
  const total = r.prepMinutes + r.cookMinutes + r.restMinutes;
  const category = r.tags.find((t) => CATEGORY_TAGS.includes(t));
  const diets = [
    ...(r.vegan ? ["https://schema.org/VeganDiet"] : []),
    ...(r.vegetarian ? ["https://schema.org/VegetarianDiet"] : []),
  ];
  return strip({
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: r.title,
    description: r.description ?? undefined,
    image: r.image ? [r.image] : undefined,
    url,
    inLanguage: "fr-FR",
    author: { "@type": "Organization", name: SITE.name },
    recipeYield: `${r.servings} portion${r.servings > 1 ? "s" : ""}`,
    prepTime: isoDuration(r.prepMinutes) ?? undefined,
    cookTime: isoDuration(r.cookMinutes) ?? undefined,
    totalTime: isoDuration(total) ?? undefined,
    recipeCategory: category ? r.tagLabels[category] : undefined,
    keywords: r.tags.map((t) => r.tagLabels[t] ?? t).join(", ") || undefined,
    suitableForDiet: diets.length ? diets : undefined,
    recipeIngredient: r.ingredients,
    recipeInstructions: r.steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text,
    })),
    nutrition: r.nutrition
      ? {
          "@type": "NutritionInformation",
          servingSize: "1 portion",
          calories: `${Math.round(r.nutrition.kcal)} kcal`,
          proteinContent: `${Math.round(r.nutrition.proteinsG)} g`,
          carbohydrateContent: `${Math.round(r.nutrition.carbsG)} g`,
          fatContent: `${Math.round(r.nutrition.fatG)} g`,
        }
      : undefined,
  });
}

/** Site et marque, pour la page d'accueil (recherche dans le catalogue depuis Google). */
export function siteJsonLd(base: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": absoluteUrl(base, "/#site"),
        name: SITE.name,
        url: absoluteUrl(base, "/"),
        inLanguage: "fr-FR",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl(base, "/recipes")}?q={q}` },
          "query-input": "required name=q",
        },
      },
      {
        "@type": "Organization",
        "@id": absoluteUrl(base, "/#marque"),
        name: SITE.name,
        url: absoluteUrl(base, "/"),
        logo: absoluteUrl(base, "/icons/icon-512.png"),
      },
    ],
  };
}

/** JSON dans un <script> : « < » échappé pour qu'aucun texte ne ferme la balise. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Adresse envoyée aux statistiques : sans paramètres (codes de connexion, recherche) et
 * sans jeton d'invitation ni identifiant dans le chemin.
 */
export function analyticsUrl(raw: string): string {
  const url = new URL(raw);
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname
    .replace(/^\/invitation\/[^/]+/, "/invitation/[jeton]")
    .replace(/^\/ingredients\/[^/]+/, "/ingredients/[id]")
    .replace(/^\/auth\/.*/, "/auth/[route]");
  return url.toString();
}

function strip<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}
