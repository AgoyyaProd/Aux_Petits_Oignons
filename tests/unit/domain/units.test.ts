import { describe, expect, it } from "vitest";
import { IncompatibleUnitError, InvalidQuantityError, UnknownUnitError } from "@/domain/errors";
import {
  add,
  convert,
  formatQuantity,
  fromBase,
  parseAmount,
  quantity,
  scale,
  subtractFloorZero,
  toBaseString,
  tryConvert,
} from "@/domain/units";

describe("parseAmount (saisie exacte, sans flottant)", () => {
  it.each([
    ["2", 2000],
    ["1,5", 1500],
    ["1.5", 1500],
    [" 0,25 ", 250],
    ["0.001", 1],
    [0.1, 100],
    [3, 3000],
  ])("« %s » -> %d millièmes", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(["", "-1", "abc", "1,2345", "1e3", "1,5 kg", "NaN", Number.NaN, -2, 1e-7])(
    "refuse « %s »",
    (input) => {
      expect(() => parseAmount(input)).toThrow(InvalidQuantityError);
    },
  );
});

describe("quantity et unités", () => {
  it("convertit vers l'unité de base avec des facteurs exacts", () => {
    expect(quantity("1,5", "kg")).toEqual({ milli: 1_500_000, dimension: "mass" });
    expect(quantity("2", "tbsp")).toEqual({ milli: 30_000, dimension: "volume" });
    expect(quantity("33", "cl")).toEqual({ milli: 330_000, dimension: "volume" });
  });

  it("refuse une unité inconnue", () => {
    expect(() => quantity(1, "oz")).toThrow(UnknownUnitError);
  });

  it("0,1 + 0,2 vaut exactement 0,3", () => {
    expect(add(quantity("0,1", "g"), quantity("0,2", "g"))).toEqual(quantity("0,3", "g"));
  });

  it("refuse d'additionner des dimensions différentes", () => {
    expect(() => add(quantity(1, "g"), quantity(1, "ml"))).toThrow(IncompatibleUnitError);
  });

  it("soustraction plancher à zéro", () => {
    expect(subtractFloorZero(quantity(500, "g"), quantity(300, "g"))).toEqual(quantity(200, "g"));
    expect(subtractFloorZero(quantity(300, "g"), quantity(500, "g"))).toEqual(quantity(0, "g"));
  });

  it("met à l'échelle des portions avec un arrondi au millième", () => {
    expect(scale(quantity(500, "g"), 6, 4)).toEqual(quantity(750, "g"));
    // 100 g pour 3 personnes, ramené à 1 : 33,333 g
    expect(scale(quantity(100, "g"), 1, 3)).toEqual(quantity("33,333", "g"));
    expect(scale(quantity(2, "piece"), 1, 3)).toEqual(quantity("0,667", "piece"));
  });

  it("met à l'échelle de grandes quantités sans perte de précision", () => {
    expect(scale(quantity(999_999, "kg"), 30, 30)).toEqual(quantity(999_999, "kg"));
  });

  it("lit et écrit le format numeric de la base", () => {
    expect(fromBase("1500.000", "mass")).toEqual(quantity("1,5", "kg"));
    expect(toBaseString(quantity("0,25", "l"))).toBe("250.000");
    expect(toBaseString(quantity("0,001", "g"))).toBe("0.001");
  });

  it("formate pour l'affichage", () => {
    expect(formatQuantity(quantity(1500, "g"))).toBe("1,5 kg");
    expect(formatQuantity(quantity(250, "ml"))).toBe("250 ml");
    expect(formatQuantity(quantity(3, "piece"))).toBe("3");
  });
});

describe("conversions propres à l'ingrédient", () => {
  const oil = { densityGPerMl: "0.920" };
  const egg = { pieceWeightG: 55 };
  const rice = { densityGPerMl: "0.850", pieceWeightG: null };

  it("convertit volume <-> masse avec la densité de l'ingrédient", () => {
    expect(convert(quantity(100, "ml"), "mass", oil)).toEqual(quantity(92, "g"));
    expect(convert(quantity(92, "g"), "volume", oil)).toEqual(quantity(100, "ml"));
  });

  it("convertit pièces <-> masse avec le poids unitaire", () => {
    expect(convert(quantity(2, "piece"), "mass", egg)).toEqual(quantity(110, "g"));
    expect(convert(quantity(110, "g"), "count", egg)).toEqual(quantity(2, "piece"));
  });

  it("ne convertit jamais sans facteur connu (pas de conversion silencieuse)", () => {
    expect(tryConvert(quantity(100, "g"), "volume", {})).toBeNull();
    expect(tryConvert(quantity(1, "piece"), "volume", egg)).toBeNull();
    expect(() => convert(quantity(1, "piece"), "mass", rice, "Riz")).toThrow(IncompatibleUnitError);
  });

  it("une quantité déjà dans la bonne dimension est rendue telle quelle", () => {
    const q = quantity(300, "g");
    expect(convert(q, "mass", {})).toBe(q);
  });

  it("chaîne les conversions pièce -> masse -> volume quand les deux facteurs existent", () => {
    const lemonJuice = { pieceWeightG: 100, densityGPerMl: 1 };
    expect(convert(quantity(1, "piece"), "volume", lemonJuice)).toEqual(quantity(100, "ml"));
  });
});
