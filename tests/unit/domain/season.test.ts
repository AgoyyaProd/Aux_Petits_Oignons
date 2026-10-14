import { describe, expect, it } from "vitest";
import catalog from "../../fixtures/catalog-steps.json";
import { candidateSeasonScore, generatePlan, type PlanCandidate } from "@/domain/planning";
import {
  ingredientSeason,
  monthOf,
  outOfSeasonIngredients,
  recipeSeason,
  SEASON_MONTHS,
} from "@/domain/recipes/season";

type Recipe = { slug: string; ingredients: { id: string; name: string; optional: boolean }[] };
const recipes = catalog as Recipe[];
const of = (slug: string) =>
  recipes
    .find((r) => r.slug === slug)!
    .ingredients.map((i) => ({ slug: i.id, optional: i.optional, name: i.name }));

describe("calendrier de saison", () => {
  it("ne contient que des mois valides", () => {
    for (const months of Object.values(SEASON_MONTHS)) {
      for (const m of months) expect(m >= 1 && m <= 12).toBe(true);
    }
  });

  it("tomate en été, pas en hiver ; carotte neutre toute l'année", () => {
    expect(ingredientSeason("tomate", 7)).toBe("in");
    expect(ingredientSeason("tomate", 1)).toBe("out");
    expect(ingredientSeason("carotte", 1)).toBeNull();
  });

  it("donne le statut d'une recette du catalogue selon le mois", () => {
    expect(recipeSeason(of("ratatouille"), 8)).toBe("in");
    expect(recipeSeason(of("ratatouille"), 1)).toBe("out");
    expect(recipeSeason(of("soupe-potiron"), 10)).toBe("in");
    expect(recipeSeason(of("pates-thon-tomate"), 1)).toBeNull();
    expect(outOfSeasonIngredients(of("ratatouille"), 1).map((i) => i.name)).toEqual(
      expect.arrayContaining(["Aubergine", "Courgette", "Tomate"]),
    );
  });

  it("ignore les ingrédients facultatifs", () => {
    expect(recipeSeason([{ slug: "tomate", optional: true }], 1)).toBeNull();
  });

  it("lit le mois d'une date ISO", () => {
    expect(monthOf("2026-10-12")).toBe(10);
  });

  it("couvre une bonne partie du catalogue en octobre", () => {
    const counts = { in: 0, out: 0, neutral: 0 };
    for (const r of recipes) {
      const s = recipeSeason(of(r.slug), 10);
      counts[s ?? "neutral"] += 1;
    }
    expect(counts.in).toBeGreaterThan(20);
    expect(counts.out).toBeGreaterThan(5);
  });
});

describe("générateur et saison", () => {
  const base = (id: string, slugs: string[]): PlanCandidate => ({
    id,
    costPerServingMillicents: 100_000,
    missingPrices: 0,
    priorityUses: 0,
    stockCoverage: 0,
    varietyKeys: [id],
    ingredientSlugs: slugs,
  });

  it("favorise nettement un plat de saison face à un plat hors saison", () => {
    const summer = base("a-ete", ["tomate", "courgette"]);
    const winter = base("b-hiver", ["poireau", "chou-vert"]);
    expect(candidateSeasonScore(summer, 1)).toBeLessThan(0);
    expect(candidateSeasonScore(winter, 1)).toBeGreaterThan(0);
    expect(candidateSeasonScore(summer, undefined)).toBe(0);
    // Tirage pondéré : sur 200 graines, le plat de saison sort très majoritairement.
    const share = (month: number, id: string) => {
      let hits = 0;
      for (let seed = 0; seed < 200; seed += 1) {
        const got = generatePlan([summer, winter], {
          mealCount: 1,
          people: 2,
          budgetCents: null,
          locked: [],
          month,
          seed,
        }).entries[0]!.recipeId;
        if (got === id) hits += 1;
      }
      return hits / 200;
    };
    expect(share(1, "b-hiver")).toBeGreaterThan(0.8);
    expect(share(7, "a-ete")).toBeGreaterThan(0.8);
  });
});
