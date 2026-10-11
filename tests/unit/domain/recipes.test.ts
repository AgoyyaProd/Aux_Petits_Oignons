import { describe, expect, it } from "vitest";
import {
  checkCompatibility,
  matchesSearch,
  NO_CONSTRAINTS,
  normalizeText,
  stockCoverage,
  type HouseholdConstraints,
} from "@/domain/recipes/compatibility";

const quiche = {
  allergens: ["eggs", "gluten", "milk"],
  dietConflicts: ["no_pork", "pescetarian", "vegan", "vegetarian"],
  ingredientIds: ["pate", "lardon", "oeuf", "creme"],
};

const household = (over: Partial<Record<keyof HouseholdConstraints, string[]>>) => ({
  allergens: new Set(over.allergens ?? []),
  diets: new Set(over.diets ?? []),
  dislikedIngredientIds: new Set(over.dislikedIngredientIds ?? []),
});

describe("compatibilité recette / foyer", () => {
  it("sans contrainte, tout est compatible", () => {
    expect(checkCompatibility(quiche, NO_CONSTRAINTS)).toEqual({
      compatible: true,
      reasons: [],
      disliked: [],
    });
  });

  it("une allergie déclarée exclut la recette et donne la raison", () => {
    const result = checkCompatibility(quiche, household({ allergens: ["milk", "peanuts"] }));
    expect(result.compatible).toBe(false);
    expect(result.reasons).toEqual([{ kind: "allergen", codes: ["milk"] }]);
  });

  it("un régime incompatible exclut la recette", () => {
    const result = checkCompatibility(quiche, household({ diets: ["no_pork"] }));
    expect(result).toMatchObject({
      compatible: false,
      reasons: [{ kind: "diet", codes: ["no_pork"] }],
    });
  });

  it("cumule allergies et régimes", () => {
    const result = checkCompatibility(
      quiche,
      household({ allergens: ["gluten", "eggs"], diets: ["vegetarian"] }),
    );
    expect(result.reasons).toEqual([
      { kind: "allergen", codes: ["eggs", "gluten"] },
      { kind: "diet", codes: ["vegetarian"] },
    ]);
  });

  it("un simple dégoût signale sans exclure", () => {
    const result = checkCompatibility(quiche, household({ dislikedIngredientIds: ["lardon"] }));
    expect(result).toEqual({ compatible: true, reasons: [], disliked: ["lardon"] });
  });
});

describe("recherche", () => {
  const recipe = {
    title: "Poulet au curry et lait de coco",
    description: "Un curry doux",
    ingredientNames: ["Filet de poulet", "Riz", "Crème fraîche"],
  };

  it("normalise accents, casse et ponctuation", () => {
    expect(normalizeText("  Crème BRÛLÉE, œufs ! ")).toBe("creme brulee oeufs");
  });

  it.each([
    ["poulet", true],
    ["POUL riz", true],
    ["creme", true],
    ["curry coco", true],
    ["", true],
    ["boeuf", false],
    ["poulet boeuf", false],
    ["oulet", false],
  ])("« %s » -> %s", (query, expected) => {
    expect(matchesSearch(recipe, query)).toBe(expected);
  });
});

describe("couverture par le stock", () => {
  it("compte les ingrédients obligatoires présents, sans doublon", () => {
    expect(stockCoverage(["riz", "oeuf", "oeuf", "lait"], new Set(["riz", "lait", "sel"]))).toEqual(
      {
        inStock: 2,
        total: 3,
      },
    );
  });

  it("aucun ingrédient obligatoire : 0 / 0", () => {
    expect(stockCoverage([], new Set(["riz"]))).toEqual({ inStock: 0, total: 0 });
  });
});
