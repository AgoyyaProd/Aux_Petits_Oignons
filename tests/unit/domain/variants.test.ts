import { describe, expect, it } from "vitest";
import { remapVariantLots, splitVariantLots, withParents } from "@/domain/shopping";
import { quantity } from "@/domain/units";

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

describe("réservation partielle d'une variante (liste de courses)", () => {
  const creme = new Map([
    ["creme-liquide", "creme"],
    ["creme-fraiche", "creme"],
  ]);
  const lot = (id: string, ingredientId: string, ml: number | null, extra = {}) => ({
    id,
    ingredientId,
    quantity: ml === null ? null : quantity(ml, "ml"),
    expiresOn: null as string | null,
    ...extra,
  });

  it("garde le besoin de la variante, le reste du lot sert au parent", () => {
    const out = splitVariantLots(
      [lot("1", "creme-liquide", 1000)],
      creme,
      new Set(["creme", "creme-liquide"]),
      new Map([["creme-liquide", [quantity(200, "ml")]]]),
    );
    expect(out).toEqual([lot("1", "creme-liquide", 200), lot("1", "creme", 800)]);
  });

  it("réserve d'abord le lot entamé, puis le plus proche de sa date", () => {
    const out = splitVariantLots(
      [
        lot("a", "creme-liquide", 200, { expiresOn: "2026-11-20" }),
        lot("b", "creme-liquide", 200, { expiresOn: "2026-11-12" }),
        lot("c", "creme-liquide", 200, { opened: true, expiresOn: "2026-11-30" }),
      ],
      creme,
      new Set(["creme", "creme-liquide"]),
      new Map([["creme-liquide", [quantity(300, "ml")]]]),
    );
    expect(out.map((l) => [l.id, l.ingredientId, l.quantity?.milli])).toEqual([
      ["c", "creme-liquide", 200_000],
      ["b", "creme-liquide", 100_000],
      ["b", "creme", 100_000],
      ["a", "creme", 200_000],
    ]);
  });

  it("sans conversion : lot de quantité inconnue ou d'une autre dimension, réservé en entier", () => {
    const required = new Set(["creme", "creme-liquide"]);
    const demand = new Map([["creme-liquide", [quantity(200, "ml")]]]);
    const unknown = lot("1", "creme-liquide", null);
    expect(splitVariantLots([unknown], creme, required, demand)).toEqual([unknown]);
    const grams = { ...lot("2", "creme-liquide", null), quantity: quantity(500, "g") };
    expect(splitVariantLots([grams], creme, required, demand)).toEqual([grams]);
  });

  it("variante non demandée : tout le lot sert au parent ; parent non demandé : rien ne change", () => {
    const l = lot("1", "creme-fraiche", 200);
    expect(splitVariantLots([l], creme, new Set(["creme"]), new Map())).toEqual([
      { ...l, ingredientId: "creme" },
    ]);
    expect(splitVariantLots([l], creme, new Set(["creme-fraiche"]), new Map())).toEqual([l]);
  });
});
