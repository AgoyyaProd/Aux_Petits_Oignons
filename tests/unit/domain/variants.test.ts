import { describe, expect, it } from "vitest";
import { remapVariantLots, withParents } from "@/domain/shopping";

const parentOf = new Map([
  ["farfalle", "pates"],
  ["spaghetti", "pates"],
  ["basmati", "riz"],
]);

describe("variantes d'ingrédients", () => {
  it("le stock d'une variante couvre un besoin du parent", () => {
    const lots = [
      { id: "1", ingredientId: "farfalle" },
      { id: "2", ingredientId: "basmati" },
    ];
    expect(remapVariantLots(lots, parentOf, new Set(["pates"]))).toEqual([
      { id: "1", ingredientId: "pates" },
      { id: "2", ingredientId: "basmati" },
    ]);
  });

  it("une variante demandée explicitement reste réservée à ce besoin", () => {
    const lots = [{ id: "1", ingredientId: "spaghetti" }];
    expect(remapVariantLots(lots, parentOf, new Set(["pates", "spaghetti"]))).toEqual(lots);
  });

  it("un besoin d'une variante n'est pas couvert par le parent générique", () => {
    const lots = [{ id: "1", ingredientId: "pates" }];
    expect(remapVariantLots(lots, parentOf, new Set(["spaghetti"]))).toEqual(lots);
  });

  it("présence : une variante en stock rend le parent présent", () => {
    expect([...withParents(["farfalle", "oeuf"], parentOf)].sort()).toEqual([
      "farfalle",
      "oeuf",
      "pates",
    ]);
  });
});
