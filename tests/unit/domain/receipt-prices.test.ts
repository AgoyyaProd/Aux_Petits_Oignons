import { describe, expect, it } from "vitest";
import { receiptUnitPrice } from "@/domain/pricing";

const none = {};

describe("prix d'un relevé de ticket de caisse", () => {
  it("paquet en grammes -> prix au kilo", () => {
    // Filet de poulet 720 g à 9,53 € -> 13,24 €/kg.
    expect(receiptUnitPrice({ cents: 953, packQuantity: 720, packUnit: "g" }, "mass", none)).toBe(
      1324,
    );
  });

  it("contenance en kilos, centilitres et litres", () => {
    expect(receiptUnitPrice({ cents: 299, packQuantity: 2, packUnit: "kg" }, "mass", none)).toBe(
      150,
    );
    // Crème 20 cl à 0,65 € -> 3,25 €/L.
    expect(receiptUnitPrice({ cents: 65, packQuantity: 20, packUnit: "cl" }, "volume", none)).toBe(
      325,
    );
    expect(
      receiptUnitPrice({ cents: 747, packQuantity: 0.75, packUnit: "l" }, "volume", none),
    ).toBe(996);
  });

  it("pièces -> prix à la pièce", () => {
    // 10 œufs à 3,41 € -> 0,34 € l'œuf.
    expect(
      receiptUnitPrice({ cents: 341, packQuantity: 10, packUnit: "piece" }, "count", none),
    ).toBe(34);
  });

  it("convertit uniquement par le poids unitaire ou la densité de l'ingrédient", () => {
    // Carottes 1 kg à 1,33 €, 125 g la carotte -> 0,17 € la pièce.
    expect(
      receiptUnitPrice({ cents: 133, packQuantity: 1, packUnit: "kg" }, "count", {
        pieceWeightG: 125,
      }),
    ).toBe(17);
    // Sans poids unitaire : pas de prix plutôt qu'un prix deviné.
    expect(receiptUnitPrice({ cents: 133, packQuantity: 1, packUnit: "kg" }, "count", none)).toBe(
      null,
    );
    expect(receiptUnitPrice({ cents: 65, packQuantity: 20, packUnit: "cl" }, "mass", none)).toBe(
      null,
    );
  });

  it("refuse un prix ou une contenance invalide", () => {
    expect(receiptUnitPrice({ cents: 0, packQuantity: 1, packUnit: "kg" }, "mass", none)).toBe(
      null,
    );
    expect(receiptUnitPrice({ cents: 100, packQuantity: 0, packUnit: "g" }, "mass", none)).toBe(
      null,
    );
    expect(
      receiptUnitPrice({ cents: 100, packQuantity: -2, packUnit: "piece" }, "count", none),
    ).toBe(null);
  });
});
