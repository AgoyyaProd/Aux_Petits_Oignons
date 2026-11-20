import { describe, expect, it } from "vitest";
import { planCooking, type CookLot } from "@/domain/cooking";
import { juiceStockLots, quantityCoverage, stockQuantities } from "@/domain/pantry/stock-signal";
import {
  juiceFromPieces,
  juiceLots,
  piecesFromJuice,
  tenthsOf,
  type IngredientInfo,
  type JuiceSource,
} from "@/domain/shopping";
import { quantity } from "@/domain/units";

const CITRON: JuiceSource = { productId: "jus", sourceId: "citron", tenthsMlPerPiece: 470 };

const lot = (id: string, ingredientId: string, q: ReturnType<typeof quantity>): CookLot => ({
  id,
  ingredientId,
  quantity: q,
  expiresOn: null,
  expiryKind: null,
  opened: false,
  version: 3,
});

describe("rendement en jus", () => {
  it("47 ml par citron, conversion exacte dans les deux sens", () => {
    expect(tenthsOf("47.0")).toBe(470);
    expect(juiceFromPieces(quantity("2", "piece"), 470)).toEqual(quantity("94", "ml"));
    expect(piecesFromJuice(quantity("30", "ml"), 470)).toEqual(quantity("0.638", "piece"));
    expect(piecesFromJuice(quantity("94", "ml"), 470)).toEqual(quantity("2", "piece"));
  });
});

describe("citrons en stock pour un besoin de jus", () => {
  const lots = [lot("l1", "citron", quantity("2", "piece"))];

  it("la recette demande le jus seulement : les citrons comptent comme jus", () => {
    const out = juiceLots(lots, [CITRON], new Set(["jus"]));
    expect(out[0]).toMatchObject({ ingredientId: "jus", quantity: quantity("94", "ml") });
    expect(out[0]!.juiceOf).toBe(CITRON);
  });

  it("la recette demande aussi le citron (zeste, quartiers) : les citrons lui restent", () => {
    const out = juiceLots(lots, [CITRON], new Set(["jus", "citron"]));
    expect(out[0]).toMatchObject({ ingredientId: "citron", quantity: quantity("2", "piece") });
  });

  it("la recette ne demande que le citron : rien ne change", () => {
    expect(juiceLots(lots, [CITRON], new Set(["citron"]))[0]!.ingredientId).toBe("citron");
  });

  it("en cuisinant, le jus pris se décompte en citrons", () => {
    const info = new Map<string, IngredientInfo>([
      ["jus", { id: "jus", name: "Jus de citron", defaultDimension: "volume", conversions: {} }],
    ]);
    const juiced = juiceLots(lots, [CITRON], new Set(["jus"]));
    const plan = planCooking({
      lines: [{ ingredientId: "jus", quantity: quantity("30", "ml") }],
      servings: 2,
      baseServings: 2,
      ingredients: info,
      lots: juiced,
      cupboard: new Set(),
      today: "2026-11-20",
    });
    expect(plan.missing).toEqual([]);
    expect(plan.consumptions).toHaveLength(1);
    const c = plan.consumptions[0]!;
    expect(c.lotId).toBe("l1");
    expect(piecesFromJuice(c.quantity, CITRON.tenthsMlPerPiece)).toEqual(
      quantity("0.638", "piece"),
    );
  });
});

describe("classement des plats", () => {
  it("des citrons au frigo couvrent le jus demandé", () => {
    const lots = [
      {
        ingredientId: "citron",
        quantityBase: 1,
        dimension: "count" as const,
        location: "fridge" as const,
        category: "fruits",
      },
    ];
    const stock = stockQuantities([...lots, ...juiceStockLots(lots, [CITRON])], new Map());
    const need = (ml: number) => [
      { ingredientId: "jus", quantityBase: ml, dimension: "volume" as const },
    ];
    expect(quantityCoverage(need(30), stock, new Set())).toBe(1);
    expect(quantityCoverage(need(60), stock, new Set())).toBe(0.5);
  });
});
