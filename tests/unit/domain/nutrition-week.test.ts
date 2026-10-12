import { describe, expect, it } from "vitest";
import {
  balanceStatuses,
  computeRecipeNutrition,
  portionProfile,
  weekBalance,
  type Per100g,
  type ProfileLine,
  type WeekMeal,
} from "@/domain/nutrition";
import { quantity } from "@/domain/units";

const line = (slug: string, category: string, q: string, unit = "g"): ProfileLine => ({
  slug,
  category,
  optional: false,
  quantity: quantity(q, unit),
  conversions: { pieceWeightG: 45 },
});

const per = (kcal: number): Per100g => ({
  kcal,
  proteins: 10,
  carbs: 10,
  sugars: 1,
  fat: 5,
  saturatedFat: 1,
  fiber: 2,
  salt: 0.5,
});

describe("portionProfile", () => {
  it("compte viande rouge et charcuterie par portion, crues", () => {
    const p = portionProfile(
      [
        line("boeuf-bourguignon", "viandes", "1200"),
        line("lardon", "viandes", "150"),
        line("carotte", "legumes", "500"),
      ],
      6,
    );
    expect(p).toEqual({
      hasFish: false,
      hasLegumes: false,
      hasMeat: true,
      redMeatG: 200,
      charcuterieG: 25,
    });
  });

  it("convertit les pièces (jambon) et signale un poids inconnu", () => {
    expect(portionProfile([line("jambon", "viandes", "4", "piece")], 4).charcuterieG).toBe(45);
    const unknown: ProfileLine = { ...line("saucisse", "viandes", "4", "piece"), conversions: {} };
    expect(portionProfile([unknown], 4).charcuterieG).toBeNull();
  });

  it("ignore les ingrédients facultatifs", () => {
    const opt = { ...line("lardon", "viandes", "100"), optional: true };
    expect(portionProfile([opt], 2)).toMatchObject({ hasMeat: false, charcuterieG: 0 });
  });
});

describe("weekBalance", () => {
  const nutrition = (kcal: number) =>
    computeRecipeNutrition(
      [
        {
          name: "x",
          optional: false,
          quantity: quantity("100", "g"),
          conversions: {},
          per100g: per(kcal),
        },
      ],
      1,
    );
  const meal = (
    title: string,
    kcal: number | null,
    profile: Partial<WeekMeal["profile"]>,
  ): WeekMeal => ({
    title,
    nutrition: kcal === null ? null : nutrition(kcal),
    profile: {
      hasFish: false,
      hasLegumes: false,
      hasMeat: false,
      redMeatG: 0,
      charcuterieG: 0,
      ...profile,
    },
  });

  it("fait la moyenne par portion et compte les repères", () => {
    const b = weekBalance([
      meal("Saumon", 400, { hasFish: true }),
      meal("Dahl", 600, { hasLegumes: true }),
      meal("Bourguignon", null, { hasMeat: true, redMeatG: 200 }),
    ]);
    expect(b.meals).toBe(3);
    expect(b.measuredMeals).toBe(2);
    expect(b.averagePerPortion!.kcal.value).toBe(500);
    expect(b.unmeasured).toEqual(["Bourguignon"]);
    expect([b.fishMeals, b.legumeMeals, b.vegetarianMeals]).toEqual([1, 1, 1]);
    expect(b.redMeatG).toEqual({ value: 200, partial: false });
    expect(balanceStatuses(b)).toEqual({
      fish: "low",
      legumes: "low",
      redMeat: "ok",
      charcuterie: "ok",
    });
  });

  it("signale les dépassements et les poids inconnus", () => {
    const b = weekBalance([
      meal("A", 500, { hasMeat: true, redMeatG: 300, charcuterieG: null }),
      meal("B", 500, { hasMeat: true, redMeatG: 250, charcuterieG: 160 }),
    ]);
    expect(b.charcuterieG).toEqual({ value: 160, partial: true });
    expect(balanceStatuses(b)).toMatchObject({ redMeat: "high", charcuterie: "high" });
  });
});
