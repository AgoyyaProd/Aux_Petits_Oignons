import { describe, expect, it } from "vitest";
import { planCooking, type CookLot } from "@/domain/cooking";
import type { IngredientInfo } from "@/domain/shopping";
import { quantity } from "@/domain/units";

const INGREDIENTS = new Map<string, IngredientInfo>(
  (
    [
      { id: "riz", name: "Riz", defaultDimension: "mass", conversions: {} },
      { id: "oeuf", name: "Œuf", defaultDimension: "count", conversions: { pieceWeightG: 55 } },
      {
        id: "lait",
        name: "Lait",
        defaultDimension: "volume",
        conversions: { densityGPerMl: "1.03" },
      },
      { id: "cumin", name: "Cumin", defaultDimension: "mass", conversions: {} },
    ] satisfies IngredientInfo[]
  ).map((i) => [i.id, i]),
);

const lot = (
  id: string,
  ingredientId: string,
  q: ReturnType<typeof quantity> | null,
  extra: Partial<CookLot> = {},
): CookLot => ({
  id,
  ingredientId,
  quantity: q,
  expiresOn: null,
  expiryKind: null,
  opened: false,
  version: 1,
  ...extra,
});

const base = {
  servings: 4,
  baseServings: 2,
  ingredients: INGREDIENTS,
  cupboard: new Set<string>(),
  today: "2026-10-12",
};

describe("décompte d'un plat cuisiné", () => {
  it("ajuste aux portions et consomme en FEFO (entamé, puis date la plus proche)", () => {
    const plan = planCooking({
      ...base,
      lines: [{ ingredientId: "riz", quantity: quantity("150", "g") }],
      lots: [
        lot("a", "riz", quantity("500", "g"), {
          expiresOn: "2026-12-01",
          expiryKind: "best_before",
        }),
        lot("b", "riz", quantity("100", "g"), { opened: true }),
        lot("c", "riz", quantity("1", "kg"), {
          expiresOn: "2026-11-01",
          expiryKind: "best_before",
        }),
      ],
    });
    // 300 g : 100 g du lot entamé, puis 200 g du lot qui périme le plus tôt.
    expect(plan.consumptions.map((c) => [c.lotId, c.quantity.milli])).toEqual([
      ["b", 100_000],
      ["c", 200_000],
    ]);
    expect(plan.missing).toEqual([]);
  });

  it("ne touche ni une DLC dépassée ni une quantité inconnue ; signale le manque", () => {
    const plan = planCooking({
      ...base,
      lines: [{ ingredientId: "riz", quantity: quantity("150", "g") }],
      lots: [
        lot("perime", "riz", quantity("1", "kg"), {
          expiresOn: "2026-10-10",
          expiryKind: "use_by",
        }),
        lot("inconnu", "riz", null),
        lot("ok", "riz", quantity("100", "g")),
      ],
    });
    expect(plan.consumptions.map((c) => c.lotId)).toEqual(["ok"]);
    expect(plan.missing).toEqual([{ ingredientId: "riz", quantity: quantity("200", "g") }]);
  });

  it("convertit seulement par les données de l'ingrédient (œufs en grammes -> pièces)", () => {
    const plan = planCooking({
      ...base,
      servings: 2,
      lines: [{ ingredientId: "oeuf", quantity: quantity("2", "piece") }],
      lots: [lot("boite", "oeuf", quantity("330", "g"))],
    });
    // 2 œufs de 55 g = 110 g retirés du lot exprimé en grammes.
    expect(plan.consumptions).toEqual([
      { lotId: "boite", version: 1, quantity: quantity("110", "g") },
    ]);
  });

  it("le placard n'est jamais décompté ; les facultatifs non plus", () => {
    const plan = planCooking({
      ...base,
      cupboard: new Set(["cumin"]),
      lines: [
        { ingredientId: "cumin", quantity: quantity("5", "g") },
        { ingredientId: "lait", quantity: quantity("10", "cl"), optional: true },
      ],
      lots: [lot("l", "lait", quantity("1", "l"))],
    });
    expect(plan).toEqual({ consumptions: [], missing: [], fromCupboard: ["cumin"] });
  });

  it("un même lot sert plusieurs lignes sans jamais dépasser son stock", () => {
    const plan = planCooking({
      ...base,
      servings: 2,
      lines: [
        { ingredientId: "lait", quantity: quantity("300", "ml") },
        { ingredientId: "lait", quantity: quantity("300", "ml") },
      ],
      lots: [lot("l", "lait", quantity("500", "ml"))],
    });
    expect(plan.consumptions).toEqual([
      { lotId: "l", version: 1, quantity: quantity("500", "ml") },
    ]);
    expect(plan.missing).toEqual([{ ingredientId: "lait", quantity: quantity("100", "ml") }]);
  });
});
