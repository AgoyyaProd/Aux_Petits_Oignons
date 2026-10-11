import { describe, expect, it } from "vitest";
import { DomainError, InvalidQuantityError } from "@/domain/errors";
import {
  aggregateRequirements,
  computeMealRequirements,
  computeShoppingList,
  purchaseQuantity,
  type IngredientInfo,
  type PlannedMealInput,
  type RecipeInput,
  type StockLot,
} from "@/domain/shopping";
import { quantity, type Quantity } from "@/domain/units";

// ---------------------------------------------------------------------------
// Jeu de données
// ---------------------------------------------------------------------------
const INGREDIENTS = new Map<string, IngredientInfo>(
  (
    [
      { id: "riz", name: "Riz", defaultDimension: "mass", conversions: { densityGPerMl: "0.85" } },
      { id: "oeuf", name: "Œuf", defaultDimension: "count", conversions: { pieceWeightG: 55 } },
      {
        id: "lait",
        name: "Lait",
        defaultDimension: "volume",
        conversions: { densityGPerMl: "1.03" },
      },
      { id: "sel", name: "Sel", defaultDimension: "mass", conversions: {} },
      { id: "basilic", name: "Basilic", defaultDimension: "mass", conversions: {} },
      { id: "poulet", name: "Poulet", defaultDimension: "mass", conversions: {} },
    ] satisfies IngredientInfo[]
  ).map((i) => [i.id, i]),
);

const recipe = (
  id: string,
  servings: number,
  lines: [string, Quantity, boolean?][],
): RecipeInput => ({
  id,
  servings,
  lines: lines.map(([ingredientId, q, optional]) => ({ ingredientId, quantity: q, optional })),
});

const RIZ_POULET = recipe("riz-poulet", 4, [
  ["riz", quantity(500, "g")],
  ["poulet", quantity(600, "g")],
  ["sel", quantity(5, "g"), true],
]);
const RIZ_AU_LAIT = recipe("riz-au-lait", 4, [
  ["riz", quantity(200, "g")],
  ["lait", quantity(1, "l")],
]);
const OMELETTE = recipe("omelette", 2, [
  ["oeuf", quantity(4, "piece")],
  ["lait", quantity(5, "cl")],
]);

let mealSeq = 0;
const meal = (
  r: RecipeInput,
  date: string,
  servings = r.servings,
  slot: PlannedMealInput["slot"] = "dinner",
): PlannedMealInput => ({
  id: `m${++mealSeq}-${r.id}`,
  date,
  slot,
  servings,
  recipe: r,
});

let lotSeq = 0;
const lot = (
  ingredientId: string,
  q: Quantity | null,
  extra: Partial<StockLot> = {},
): StockLot => ({
  id: `lot${String(++lotSeq).padStart(3, "0")}`,
  ingredientId,
  quantity: q,
  expiresOn: null,
  expiryKind: null,
  status: "active",
  ...extra,
});

const run = (meals: PlannedMealInput[], stock: StockLot[] = []) =>
  computeShoppingList({ meals, ingredients: INGREDIENTS, stock });

const lineOf = (result: ReturnType<typeof run>, ingredientId: string) => {
  const line = result.lines.find((l) => l.ingredientId === ingredientId);
  if (!line) throw new Error(`Pas de ligne pour ${ingredientId}`);
  return line;
};

// ---------------------------------------------------------------------------
// Scénarios obligatoires du cahier des charges
// ---------------------------------------------------------------------------
describe("scénarios du cahier des charges", () => {
  it("300 g de riz en stock pour un besoin de 500 g : 200 g à acheter", () => {
    const result = run([meal(RIZ_POULET, "2026-10-12")], [lot("riz", quantity(300, "g"))]);
    const riz = lineOf(result, "riz");
    expect(riz.needed).toEqual(quantity(500, "g"));
    expect(riz.fromStock).toEqual(quantity(300, "g"));
    expect(riz.toBuy).toEqual(quantity(200, "g"));
  });

  it("stock supérieur au besoin : aucun achat", () => {
    const result = run([meal(RIZ_POULET, "2026-10-12")], [lot("riz", quantity(2, "kg"))]);
    expect(lineOf(result, "riz").toBuy).toEqual(quantity(0, "g"));
  });

  it("plusieurs recettes utilisant le même ingrédient : besoins cumulés avant soustraction", () => {
    const result = run(
      [meal(RIZ_POULET, "2026-10-12"), meal(RIZ_AU_LAIT, "2026-10-13")],
      [lot("riz", quantity(600, "g"))],
    );
    const riz = lineOf(result, "riz");
    expect(riz.needed).toEqual(quantity(700, "g"));
    expect(riz.toBuy).toEqual(quantity(100, "g"));
    expect(riz.mealIds).toHaveLength(2);
    // Une seule ligne de riz, pas une par recette.
    expect(result.lines.filter((l) => l.ingredientId === "riz")).toHaveLength(1);
  });

  it("modification des portions : besoins recalculés", () => {
    const pour4 = lineOf(run([meal(RIZ_POULET, "2026-10-12", 4)]), "riz");
    const pour6 = lineOf(run([meal(RIZ_POULET, "2026-10-12", 6)]), "riz");
    const pour1 = lineOf(run([meal(RIZ_POULET, "2026-10-12", 1)]), "riz");
    expect(pour4.needed).toEqual(quantity(500, "g"));
    expect(pour6.needed).toEqual(quantity(750, "g"));
    expect(pour1.needed).toEqual(quantity(125, "g"));
  });

  it("remplacement d'une recette : liste actualisée", () => {
    const avant = run([meal(RIZ_POULET, "2026-10-12")]);
    const apres = run([meal(OMELETTE, "2026-10-12")]);
    expect(avant.lines.map((l) => l.ingredientId).sort()).toEqual(["poulet", "riz"]);
    expect(apres.lines.map((l) => l.ingredientId).sort()).toEqual(["lait", "oeuf"]);
  });

  it("unité incompatible : aucune conversion silencieuse", () => {
    // Le stock de sel est en pièces (sachets) ; la recette en grammes ; aucun poids connu.
    const salt = recipe("sale", 1, [["sel", quantity(10, "g")]]);
    const result = run([meal(salt, "2026-10-12")], [lot("sel", quantity(2, "piece"))]);
    expect(lineOf(result, "sel").toBuy).toEqual(quantity(10, "g"));
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ kind: "incompatible_stock", ingredientId: "sel" }),
    );
  });
});

// ---------------------------------------------------------------------------
// Règles de stock
// ---------------------------------------------------------------------------
describe("stock utilisable", () => {
  it("une quantité inconnue n'est jamais comptée comme disponible", () => {
    const result = run([meal(RIZ_POULET, "2026-10-12")], [lot("riz", null)]);
    expect(lineOf(result, "riz").toBuy).toEqual(quantity(500, "g"));
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ kind: "unknown_quantity_stock", ingredientId: "riz" }),
    );
  });

  it("les lots épuisés ou jetés sont ignorés", () => {
    const result = run(
      [meal(RIZ_POULET, "2026-10-12")],
      [
        lot("riz", quantity(500, "g"), { status: "depleted" }),
        lot("riz", quantity(500, "g"), { status: "discarded" }),
      ],
    );
    expect(lineOf(result, "riz").toBuy).toEqual(quantity(500, "g"));
  });

  it("un lot dont la DLC tombe avant le repas n'est pas compté pour ce repas", () => {
    const result = run(
      [meal(RIZ_AU_LAIT, "2026-10-12"), meal(RIZ_AU_LAIT, "2026-10-16")],
      [lot("lait", quantity(2, "l"), { expiresOn: "2026-10-14", expiryKind: "use_by" })],
    );
    const lait = lineOf(result, "lait");
    // 1 l couvert le 12 ; le litre restant périme le 14, il ne couvre pas le repas du 16.
    expect(lait.needed).toEqual(quantity(2, "l"));
    expect(lait.toBuy).toEqual(quantity(1, "l"));
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ kind: "use_by_before_meal", ingredientId: "lait" }),
    );
  });

  it("le jour même de la DLC, le lot reste utilisable", () => {
    const result = run(
      [meal(RIZ_AU_LAIT, "2026-10-14")],
      [lot("lait", quantity(1, "l"), { expiresOn: "2026-10-14", expiryKind: "use_by" })],
    );
    expect(lineOf(result, "lait").toBuy).toEqual(quantity(0, "ml"));
  });

  it("une DDM dépassée reste utilisable mais est signalée", () => {
    const result = run(
      [meal(RIZ_POULET, "2026-10-12")],
      [lot("riz", quantity(1, "kg"), { expiresOn: "2026-09-01", expiryKind: "best_before" })],
    );
    expect(lineOf(result, "riz").toBuy).toEqual(quantity(0, "g"));
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ kind: "best_before_passed", ingredientId: "riz" }),
    );
  });

  it("FEFO : le lot qui périme le plus tôt est consommé en premier", () => {
    // Deux lots de lait ; le plus proche de sa DLC doit servir le premier repas,
    // sinon il périmerait avant le second et créerait un faux manque.
    const result = run(
      [meal(RIZ_AU_LAIT, "2026-10-12"), meal(RIZ_AU_LAIT, "2026-10-20")],
      [
        lot("lait", quantity(1, "l"), { expiresOn: "2026-10-30", expiryKind: "use_by" }),
        lot("lait", quantity(1, "l"), { expiresOn: "2026-10-13", expiryKind: "use_by" }),
      ],
    );
    expect(lineOf(result, "lait").toBuy).toEqual(quantity(0, "ml"));
    expect(result.warnings).toEqual([]);
  });

  it("le stock consommé par un repas n'est pas recompté pour le suivant", () => {
    const result = run(
      [meal(OMELETTE, "2026-10-12"), meal(OMELETTE, "2026-10-13")],
      [lot("oeuf", quantity(6, "piece"))],
    );
    // 8 œufs nécessaires, 6 en stock : 2 à acheter, pas 0 ni 4.
    expect(lineOf(result, "oeuf").toBuy).toEqual(quantity(2, "piece"));
  });

  it("le stock exprimé dans une autre unité est converti quand l'ingrédient le permet", () => {
    // Stock d'œufs saisi en grammes (330 g = 6 œufs de 55 g).
    const result = run([meal(OMELETTE, "2026-10-12")], [lot("oeuf", quantity(330, "g"))]);
    expect(lineOf(result, "oeuf").toBuy).toEqual(quantity(0, "piece"));
  });

  it("le stock d'un ingrédient non planifié n'apparaît pas dans la liste", () => {
    const result = run([meal(OMELETTE, "2026-10-12")], [lot("riz", quantity(1, "kg"))]);
    expect(result.lines.find((l) => l.ingredientId === "riz")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Besoins
// ---------------------------------------------------------------------------
describe("calcul des besoins", () => {
  it("ignore les ingrédients facultatifs", () => {
    const reqs = computeMealRequirements([meal(RIZ_POULET, "2026-10-12")], INGREDIENTS);
    expect(reqs.map((r) => r.ingredientId).sort()).toEqual(["poulet", "riz"]);
  });

  it("ignore les repas déjà cuisinés ou annulés", () => {
    const cooked = { ...meal(RIZ_POULET, "2026-10-12"), status: "cooked" as const };
    const skipped = { ...meal(RIZ_POULET, "2026-10-13"), status: "skipped" as const };
    expect(run([cooked, skipped]).lines).toEqual([]);
  });

  it("normalise vers la dimension par défaut avant de cumuler", () => {
    // 5 cl de lait (omelette) + 1 l (riz au lait) = 1 050 ml, une seule ligne.
    const totals = aggregateRequirements(
      computeMealRequirements(
        [meal(OMELETTE, "2026-10-12"), meal(RIZ_AU_LAIT, "2026-10-12", 4, "lunch")],
        INGREDIENTS,
      ),
    );
    expect(totals.find((t) => t.ingredientId === "lait")?.quantity).toEqual(quantity(1050, "ml"));
  });

  it("garde une ligne séparée quand la conversion vers la dimension par défaut est impossible", () => {
    const pesto = recipe("pesto", 2, [
      ["basilic", quantity(50, "g")],
      ["basilic", quantity(1, "piece")], // un bouquet, sans poids connu
    ]);
    const result = run([meal(pesto, "2026-10-12")]);
    const basilic = result.lines.filter((l) => l.ingredientId === "basilic");
    expect(basilic.map((l) => l.dimension).sort()).toEqual(["count", "mass"]);
  });

  it("trie les besoins dans l'ordre chronologique (date puis créneau)", () => {
    const reqs = computeMealRequirements(
      [
        meal(OMELETTE, "2026-10-13", 2, "lunch"),
        meal(OMELETTE, "2026-10-12", 2, "dinner"),
        meal(OMELETTE, "2026-10-12", 2, "lunch"),
      ],
      INGREDIENTS,
    );
    expect([...new Set(reqs.map((r) => `${r.date}/${r.slot}`))]).toEqual([
      "2026-10-12/lunch",
      "2026-10-12/dinner",
      "2026-10-13/lunch",
    ]);
  });

  it("refuse des portions invalides", () => {
    expect(() => run([meal(RIZ_POULET, "2026-10-12", 0)])).toThrow(InvalidQuantityError);
    expect(() => run([meal(RIZ_POULET, "2026-10-12", 1.5)])).toThrow(InvalidQuantityError);
  });

  it("refuse un ingrédient absent du référentiel", () => {
    const bad = recipe("bad", 1, [["licorne", quantity(1, "g")]]);
    expect(() => run([meal(bad, "2026-10-12")])).toThrow(DomainError);
  });

  it("refuse une date mal formée", () => {
    expect(() => run([meal(RIZ_POULET, "12/10/2026")])).toThrow(DomainError);
  });

  it("est déterministe : même entrée, même sortie", () => {
    const meals = [meal(RIZ_POULET, "2026-10-12"), meal(OMELETTE, "2026-10-13")];
    const stock = [lot("riz", quantity(300, "g")), lot("oeuf", quantity(2, "piece"))];
    expect(run(meals, stock)).toEqual(run(meals, stock));
  });
});

describe("placard et arrondi d'achat", () => {
  it("un ingrédient coché dans le placard n'est jamais à acheter, mais reste listé", () => {
    const { lines } = computeShoppingList({
      meals: [meal(RIZ_POULET, "2026-10-12", 4)],
      ingredients: INGREDIENTS,
      stock: [],
      cupboard: new Set(["riz"]),
    });
    const riz = lines.find((l) => l.ingredientId === "riz")!;
    expect(riz).toMatchObject({ inCupboard: true });
    expect(riz.toBuy.milli).toBe(0);
    expect(lines.find((l) => l.ingredientId === "poulet")!.toBuy.milli).toBe(600_000);
  });

  it("les pièces s'achètent à l'unité supérieure, jamais en dessous du besoin", () => {
    expect(purchaseQuantity(quantity("1.5", "piece")).milli).toBe(2_000);
    expect(purchaseQuantity(quantity("2", "piece")).milli).toBe(2_000);
    expect(purchaseQuantity(quantity("0.001", "piece")).milli).toBe(1_000);
    expect(purchaseQuantity(quantity("375", "g")).milli).toBe(375_000);
  });
});
