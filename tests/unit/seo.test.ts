import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  analyticsUrl,
  isoDuration,
  jsonLdScript,
  metaDescription,
  recipeJsonLd,
} from "@/lib/seo";

describe("référencement", () => {
  it("durées ISO 8601", () => {
    expect(isoDuration(35)).toBe("PT35M");
    expect(isoDuration(65)).toBe("PT1H5M");
    expect(isoDuration(120)).toBe("PT2H");
    expect(isoDuration(0)).toBeNull();
  });

  it("adresses absolues", () => {
    expect(absoluteUrl("https://marmy.fr", "/recipes/dahl")).toBe("https://marmy.fr/recipes/dahl");
    expect(absoluteUrl("https://marmy.fr/", "/")).toBe("https://marmy.fr/");
  });

  it("description coupée sur un mot, sans dépasser", () => {
    const d = metaDescription("mot ".repeat(80));
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith("…")).toBe(true);
    expect(metaDescription("  court\n texte ")).toBe("court texte");
  });

  it("données structurées d'une recette", () => {
    const ld = recipeJsonLd(
      {
        slug: "dahl",
        title: "Dahl de lentilles corail",
        description: null,
        servings: 4,
        prepMinutes: 10,
        cookMinutes: 25,
        restMinutes: 0,
        tags: ["plat", "economique"],
        tagLabels: { plat: "Plat", economique: "Économique" },
        ingredients: ["250 g Lentilles corail"],
        steps: ["Rincer.", "Cuire."],
        vegetarian: true,
        vegan: true,
        nutrition: { kcal: 412.4, proteinsG: 18.6, carbsG: 50, fatG: 12 },
        image: "https://marmy.fr/images/recettes/dahl.webp",
      },
      "https://marmy.fr/recipes/dahl",
    );
    expect(ld).toMatchObject({
      "@type": "Recipe",
      recipeYield: "4 portions",
      prepTime: "PT10M",
      cookTime: "PT25M",
      totalTime: "PT35M",
      recipeCategory: "Plat",
      keywords: "Plat, Économique",
      nutrition: { calories: "412 kcal", proteinContent: "19 g" },
    });
    expect(ld).not.toHaveProperty("description");
    expect(ld.recipeInstructions).toEqual([
      { "@type": "HowToStep", position: 1, text: "Rincer." },
      { "@type": "HowToStep", position: 2, text: "Cuire." },
    ]);
  });

  it("le JSON injecté ne peut pas fermer la balise script", () => {
    expect(jsonLdScript({ t: "</script><b>" })).not.toContain("</script>");
  });

  it("les statistiques ne reçoivent ni jeton, ni code, ni recherche", () => {
    expect(analyticsUrl("https://marmy.fr/invitation/abc123?x=1")).toBe(
      "https://marmy.fr/invitation/[jeton]",
    );
    expect(analyticsUrl("https://marmy.fr/auth/callback?code=secret")).toBe(
      "https://marmy.fr/auth/[route]",
    );
    expect(analyticsUrl("https://marmy.fr/recipes?q=poulet#top")).toBe("https://marmy.fr/recipes");
    expect(analyticsUrl("https://marmy.fr/ingredients/9f1e")).toBe(
      "https://marmy.fr/ingredients/[id]",
    );
  });
});
