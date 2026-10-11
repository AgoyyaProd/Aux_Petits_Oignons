import { describe, expect, it } from "vitest";
import { searchIngredients, type IngredientChoice } from "@/lib/ingredient-search";

const choices: IngredientChoice[] = [
  { name: "Œuf", aliases: ["oeuf", "oeufs", "oeufs frais"] },
  { name: "Pâtes", aliases: ["pates", "pate"] },
  { name: "Farfalle", aliases: ["farfalle", "farfalles", "papillons"] },
  { name: "Pomme de terre", aliases: ["pomme de terre", "pdt", "patate"] },
  { name: "Pomme de terre grenaille", aliases: ["grenaille", "grenailles"] },
  { name: "Pomme", aliases: ["pomme", "pommes"] },
];

describe("recherche d'ingrédient", () => {
  it.each([
    ["oeuf", ["Œuf"]],
    ["OEUFS", ["Œuf"]],
    ["œuf", ["Œuf"]],
    ["farf", ["Farfalle"]],
    ["papillons", ["Farfalle"]],
    ["pdt", ["Pomme de terre"]],
    ["grenaille", ["Pomme de terre grenaille"]],
    ["pates", ["Pâtes"]],
  ])("« %s »", (query, expected) => {
    expect(searchIngredients(choices, query)).toEqual(expected);
  });

  it("met d'abord le nom exact, puis ceux qui commencent par la saisie", () => {
    expect(searchIngredients(choices, "pomme")).toEqual([
      "Pomme",
      "Pomme de terre",
      "Pomme de terre grenaille",
    ]);
  });

  it("rien pour une saisie vide", () => {
    expect(searchIngredients(choices, "  ")).toEqual([]);
  });
});
