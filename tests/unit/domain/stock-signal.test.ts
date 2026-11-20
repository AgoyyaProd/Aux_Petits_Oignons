import { describe, expect, it } from "vitest";
import {
  isFresh,
  quantityCoverage,
  stockQuantities,
  type StockLot,
} from "@/domain/pantry/stock-signal";
import { pantryScore, type PlanCandidate } from "@/domain/planning/generate";

const lot = (over: Partial<StockLot>): StockLot => ({
  ingredientId: "x",
  quantityBase: 100,
  dimension: "mass",
  location: "pantry",
  category: "legumes",
  ...over,
});

describe("frais du frigo", () => {
  it("un produit périssable rangé au frigo", () => {
    expect(isFresh(lot({ location: "fridge", category: "legumes" }))).toBe(true);
    expect(isFresh(lot({ location: "fridge", category: "oeufs_laitiers" }))).toBe(true);
  });
  it("ni le placard, ni le congélateur, ni un condiment au frigo", () => {
    expect(isFresh(lot({ location: "pantry", category: "legumes" }))).toBe(false);
    expect(isFresh(lot({ location: "freezer", category: "viandes" }))).toBe(false);
    expect(isFresh(lot({ location: "fridge", category: "condiments" }))).toBe(false);
  });
});

describe("couverture selon la quantité", () => {
  const parentOf = new Map([["penne", "pates"]]);
  const stock = stockQuantities(
    [
      lot({ ingredientId: "poulet", quantityBase: 140 }),
      lot({ ingredientId: "penne", quantityBase: 300 }),
      lot({ ingredientId: "carotte", quantityBase: 9, dimension: "count" }),
    ],
    parentOf,
  );
  const staple = new Set(["sel"]);

  it("assez en stock : couvert ; pas assez : à moitié ; absent : non", () => {
    expect(
      quantityCoverage(
        [
          { ingredientId: "poulet", quantityBase: 260, dimension: "mass" },
          { ingredientId: "carotte", quantityBase: 2, dimension: "count" },
          { ingredientId: "tofu", quantityBase: 200, dimension: "mass" },
          { ingredientId: "sel", quantityBase: null, dimension: null },
        ],
        stock,
        staple,
      ),
    ).toBe((0.5 + 1 + 0 + 1) / 4);
  });

  it("une variante en stock couvre le parent, quantités comprises", () => {
    expect(
      quantityCoverage(
        [{ ingredientId: "pates", quantityBase: 250, dimension: "mass" }],
        stock,
        staple,
      ),
    ).toBe(1);
    expect(
      quantityCoverage(
        [{ ingredientId: "pates", quantityBase: 500, dimension: "mass" }],
        stock,
        staple,
      ),
    ).toBe(0.5);
  });

  it("autre dimension : pas de conversion implicite, la présence suffit", () => {
    expect(
      quantityCoverage(
        [{ ingredientId: "carotte", quantityBase: 400, dimension: "mass" }],
        stock,
        staple,
      ),
    ).toBe(1);
  });

  it("un ingrédient sur deux lignes : quantités additionnées", () => {
    expect(
      quantityCoverage(
        [
          { ingredientId: "poulet", quantityBase: 100, dimension: "mass" },
          { ingredientId: "poulet", quantityBase: 100, dimension: "mass" },
        ],
        stock,
        staple,
      ),
    ).toBe(0.5);
  });
});

describe("poids du garde-manger", () => {
  const base: PlanCandidate = {
    id: "a",
    costPerServingMillicents: null,
    missingPrices: 0,
    priorityUses: 0,
    stockCoverage: 0,
    varietyKeys: [],
  };
  it("à finir > frais du frigo > placard", () => {
    const priority = pantryScore({ ...base, priorityUses: 1 });
    const fresh = pantryScore({ ...base, freshUses: 1 });
    expect(priority).toBeGreaterThan(fresh);
    // Deux produits du frigo pèsent plus qu'un plat entièrement couvert par le placard.
    expect(pantryScore({ ...base, freshUses: 2 })).toBeGreaterThan(
      pantryScore({ ...base, stockCoverage: 1 }),
    );
  });
});
