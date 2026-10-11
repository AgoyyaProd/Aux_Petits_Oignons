import { describe, expect, it } from "vitest";
import {
  costMillicents,
  estimateRecipeCost,
  millicentsToCents,
  normalizeObservation,
  parsePieceCount,
  robustMedian,
  type CostLine,
} from "@/domain/pricing";
import { quantity } from "@/domain/units";

const none = {};

describe("normalisation d'un relevé Open Prices", () => {
  it("produit brut au kilo -> prix au kilo", () => {
    expect(
      normalizeObservation({ type: "CATEGORY", price: 2.29, pricePer: "KILOGRAM" }, "mass", none),
    ).toEqual({ centsPerRef: 229 });
  });

  it("prix au kilo -> prix à la pièce par le poids unitaire de l'ingrédient", () => {
    // Carotte : 125 g la pièce, 2,40 €/kg -> 0,30 € la pièce.
    expect(
      normalizeObservation({ type: "CATEGORY", price: "2.40", pricePer: "KILOGRAM" }, "count", {
        pieceWeightG: 125,
      }),
    ).toEqual({ centsPerRef: 30 });
  });

  it("prix à la pièce sans poids unitaire connu : rejeté, jamais deviné", () => {
    expect(
      normalizeObservation({ type: "CATEGORY", price: 0.59, pricePer: "UNIT" }, "mass", none),
    ).toEqual({ rejected: "unconvertible" });
  });

  it("produit emballé : prix du paquet ramené au kilo", () => {
    expect(
      normalizeObservation(
        { type: "PRODUCT", price: 1.73, productQuantity: 500, productQuantityUnit: "g" },
        "mass",
        none,
      ),
    ).toEqual({ centsPerRef: 346 });
  });

  it("huile : prix au litre, puis au kilo seulement avec la densité", () => {
    const oil = {
      type: "PRODUCT" as const,
      price: 3.95,
      productQuantity: 250,
      productQuantityUnit: "ml",
    };
    expect(normalizeObservation(oil, "volume", none)).toEqual({ centsPerRef: 1580 });
    expect(normalizeObservation(oil, "mass", { densityGPerMl: "0.92" })).toEqual({
      centsPerRef: 1717,
    });
    expect(normalizeObservation(oil, "mass", none)).toEqual({ rejected: "unconvertible" });
  });

  it("accepte les centilitres et kilogrammes", () => {
    expect(
      normalizeObservation(
        { type: "PRODUCT", price: 2, productQuantity: 25, productQuantityUnit: "cl" },
        "volume",
        none,
      ),
    ).toEqual({ centsPerRef: 800 });
    expect(
      normalizeObservation(
        { type: "PRODUCT", price: 5, productQuantity: 2, productQuantityUnit: "kg" },
        "mass",
        none,
      ),
    ).toEqual({ centsPerRef: 250 });
  });

  it("œufs : le nombre de pièces est lu dans le nom", () => {
    expect(
      normalizeObservation(
        { type: "PRODUCT", price: 2.79, productName: "6 œufs AviBresse Label Rouge" },
        "count",
        none,
      ),
    ).toEqual({ centsPerRef: 47 });
  });

  it("rejette promotions, prix invalides et contenances inconnues", () => {
    const base = { type: "PRODUCT" as const, productQuantity: 500, productQuantityUnit: "g" };
    expect(normalizeObservation({ ...base, price: 1, discounted: true }, "mass", none)).toEqual({
      rejected: "discounted",
    });
    expect(normalizeObservation({ ...base, price: 0 }, "mass", none)).toEqual({
      rejected: "invalid_price",
    });
    expect(normalizeObservation({ ...base, price: "abc" }, "mass", none)).toEqual({
      rejected: "invalid_price",
    });
    expect(
      normalizeObservation({ type: "PRODUCT", price: 1, productName: "Riz" }, "mass", none),
    ).toEqual({ rejected: "unknown_quantity" });
    expect(
      normalizeObservation({ ...base, price: 1, productQuantityUnit: "sachets" }, "mass", none),
    ).toEqual({ rejected: "unknown_quantity" });
  });
});

describe("nombre de pièces dans un nom", () => {
  it.each([
    ["6 œufs frais", 6],
    ["Œufs (6 UFS TE SOL G)", 6],
    ["10 Œufs frais de poules élevées au sol calibre gros", 10],
    ["Oeufs Plein air - Boîte de 6", 6],
    ["Carrefour Oeufs Medium 12 Pièces", 12],
    ["Lait demi-écrémé 1L", null],
    ["Œufs frais", null],
    ["150 œufs", null],
  ])("%s -> %s", (name, expected) => {
    expect(parsePieceCount(name)).toBe(expected);
  });
});

describe("médiane robuste", () => {
  it("écarte les valeurs aberrantes", () => {
    expect(robustMedian([100, 110, 120, 1000])).toEqual({ value: 110, kept: 3 });
    expect(robustMedian([10, 100, 110, 120])).toEqual({ value: 110, kept: 3 });
  });

  it("aucun relevé : aucun prix", () => {
    expect(robustMedian([])).toBeNull();
    expect(robustMedian([0, -3])).toBeNull();
  });

  it("nombre pair de valeurs : moyenne des deux centrales", () => {
    expect(robustMedian([100, 101])).toEqual({ value: 101, kept: 2 });
  });
});

describe("coût d'une recette", () => {
  it("coût exact d'une quantité, arrondi seulement à la fin", () => {
    const cost = costMillicents(
      quantity("375", "g"),
      { dimension: "mass", centsPerRef: 346 },
      none,
    );
    expect(cost).toBe(129_750);
    expect(millicentsToCents(cost ?? 0)).toBe(130);
  });

  it("convertit la quantité vers la dimension du prix si l'ingrédient le permet", () => {
    // 3 gousses d'ail de 5 g à 8 €/kg = 0,12 €.
    expect(
      costMillicents(
        quantity("3", "piece"),
        { dimension: "mass", centsPerRef: 800 },
        {
          pieceWeightG: 5,
        },
      ),
    ).toBe(12_000);
    expect(
      costMillicents(quantity("3", "piece"), { dimension: "mass", centsPerRef: 800 }, none),
    ).toBeNull();
  });

  it("ajuste aux portions, ignore les facultatifs, liste ce qui manque", () => {
    const lines: CostLine[] = [
      { ingredientId: "pates", quantity: quantity("250", "g"), optional: false, conversions: none },
      {
        ingredientId: "parmesan",
        quantity: quantity("40", "g"),
        optional: false,
        conversions: none,
      },
      { ingredientId: "persil", quantity: quantity("5", "g"), optional: true, conversions: none },
      { ingredientId: "ail", quantity: quantity("2", "piece"), optional: false, conversions: none },
    ];
    const prices: Record<string, { dimension: "mass"; centsPerRef: number }> = {
      pates: { dimension: "mass", centsPerRef: 300 },
      ail: { dimension: "mass", centsPerRef: 800 },
      persil: { dimension: "mass", centsPerRef: 5000 },
    };
    const estimate = estimateRecipeCost(lines, 4, 2, (id) => prices[id] ?? null);
    // 500 g de pâtes à 3 €/kg = 1,50 € ; parmesan sans prix ; ail sans poids unitaire.
    expect(estimate).toEqual({
      millicents: 150_000,
      missing: [
        { ingredientId: "parmesan", reason: "no_price" },
        { ingredientId: "ail", reason: "unconvertible" },
      ],
      pricedLines: 1,
      requiredLines: 3,
    });
  });
});
