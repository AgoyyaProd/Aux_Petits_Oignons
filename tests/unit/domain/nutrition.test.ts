import { describe, expect, it } from "vitest";
import {
  computeRecipeNutrition,
  referenceShare,
  roundNutrient,
  type NutritionLine,
  type Per100g,
} from "@/domain/nutrition";
import { quantity } from "@/domain/units";

const per = (kcal: number | null, extra: Partial<Per100g> = {}): Per100g => ({
  kcal,
  proteins: 10,
  carbs: 20,
  sugars: 5,
  fat: 3,
  saturatedFat: 1,
  fiber: 2,
  salt: 0.5,
  ...extra,
});

const line = (over: Partial<NutritionLine>): NutritionLine => ({
  name: "Riz",
  optional: false,
  quantity: quantity("100", "g"),
  conversions: {},
  per100g: per(350),
  ...over,
});

describe("computeRecipeNutrition", () => {
  it("additionne au prorata des grammes et divise par le nombre de portions", () => {
    const n = computeRecipeNutrition(
      [line({ quantity: quantity("300", "g") }), line({ name: "Beurre", per100g: per(750) })],
      2,
    )!;
    expect(n.perServing.kcal).toEqual({ value: (1050 + 750) / 2, partial: false });
    expect(n.perServing.proteins.value).toBeCloseTo(20);
    expect(n.countedLines).toBe(2);
    expect(n.skipped).toEqual([]);
    expect(n.reliable).toBe(true);
  });

  it("convertit volume et pièces avec les conversions de l'ingrédient", () => {
    const n = computeRecipeNutrition(
      [
        line({
          name: "Huile",
          quantity: quantity("2", "tbsp"),
          conversions: { densityGPerMl: "0.92" },
          per100g: per(900),
        }),
        line({
          name: "Œuf",
          quantity: quantity("2", "piece"),
          conversions: { pieceWeightG: "55" },
          per100g: per(140),
        }),
      ],
      1,
    )!;
    // 30 ml × 0,92 = 27,6 g d'huile ; 110 g d'œuf.
    expect(n.perServing.kcal.value).toBeCloseTo(27.6 * 9 + 110 * 1.4);
  });

  it("ne compte ni les facultatifs, ni les ingrédients sans correspondance ou sans conversion", () => {
    const n = computeRecipeNutrition(
      [
        line({}),
        line({ name: "Sel", optional: true, quantity: null }),
        line({ name: "Pâte de curry", per100g: null }),
        line({ name: "Lait", quantity: quantity("20", "cl"), conversions: {} }),
      ],
      1,
    )!;
    expect(n.perServing.kcal.value).toBe(350);
    expect(n.skipped).toEqual([
      { name: "Pâte de curry", reason: "no_match" },
      { name: "Lait", reason: "no_conversion" },
    ]);
  });

  it("n'est plus fiable si les ingrédients non comptés pèsent trop ou ont un poids inconnu", () => {
    const base = line({ quantity: quantity("400", "g") });
    // 100 g non comptés sur 500 g : 20 %, encore fiable.
    expect(
      computeRecipeNutrition([base, line({ name: "Pâte de curry", per100g: null })], 1)!.reliable,
    ).toBe(true);
    // Moules pesées avec la coquille : 2 kg non comptés.
    expect(
      computeRecipeNutrition(
        [base, line({ name: "Moules", per100g: null, quantity: quantity("2", "kg") })],
        1,
      )!.reliable,
    ).toBe(false);
    expect(
      computeRecipeNutrition(
        [base, line({ name: "Lait", quantity: quantity("20", "cl"), conversions: {} })],
        1,
      )!.reliable,
    ).toBe(false);
  });

  it("une valeur non mesurée rend le total partiel, jamais devinée", () => {
    const n = computeRecipeNutrition([line({}), line({ name: "Ricotta", per100g: per(null) })], 1)!;
    expect(n.perServing.kcal).toEqual({ value: 350, partial: true });
    expect(n.perServing.proteins).toEqual({ value: 20, partial: false });
  });

  it("rien de calculable : null", () => {
    expect(computeRecipeNutrition([line({ per100g: null })], 2)).toBeNull();
    expect(computeRecipeNutrition([line({})], 0)).toBeNull();
  });
});

describe("arrondis et apports de référence", () => {
  it("arrondit comme une étiquette", () => {
    expect(roundNutrient("kcal", 512.6)).toBe(513);
    expect(roundNutrient("proteins", 23.4)).toBe(23);
    expect(roundNutrient("fiber", 4.26)).toBe(4.3);
    expect(roundNutrient("salt", 0.456)).toBe(0.46);
    expect(roundNutrient("salt", 1.24)).toBe(1.2);
  });

  it("calcule la part des apports de référence (UE 1169/2011)", () => {
    expect(referenceShare("kcal", 500)).toBe(25);
    expect(referenceShare("salt", 1.5)).toBe(25);
    expect(referenceShare("fiber", 8)).toBeNull();
  });
});
