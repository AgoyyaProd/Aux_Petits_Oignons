import { describe, expect, it } from "vitest";
import {
  addLeftover,
  ALL_PATTERN_SLOTS,
  autoPlace,
  batchGroups,
  cooksFor,
  fillOrder,
  isPlannedSlot,
  PATTERN_PRESETS,
  placeBatches,
  plannedSlots,
  toPattern,
  type PlanEntry,
} from "@/domain/planning";

const WEEK = "2026-10-12"; // lundi
const dinners = (mealsPerCook = 1) => toPattern(PATTERN_PRESETS.soir, mealsPerCook);

/** Lots à partir du lundi, puis un plat par lot. */
function batch(
  kept: PlanEntry[],
  recipes: string[],
  meals: number,
  people: number,
  from: string,
  pattern: ReturnType<typeof toPattern>,
) {
  return placeBatches(kept, recipes, batchGroups(kept, meals, WEEK, from, pattern), people);
}

describe("semaine type", () => {
  it("lit la semaine stockée et retombe sur midi et soir si elle est vide ou invalide", () => {
    expect(toPattern(["mon:dinner", "lessive"], 2)).toEqual({
      slots: new Set(["mon:dinner"]),
      mealsPerCook: 2,
    });
    expect(toPattern([], 9)).toEqual({ slots: new Set(ALL_PATTERN_SLOTS), mealsPerCook: 1 });
    expect(toPattern(null)).toEqual({ slots: new Set(ALL_PATTERN_SLOTS), mealsPerCook: 1 });
  });

  it("reconnaît les repas prévus d'une semaine datée", () => {
    const p = dinners();
    expect(isPlannedSlot({ day: "2026-10-13", slot: "dinner" }, WEEK, p)).toBe(true);
    expect(isPlannedSlot({ day: "2026-10-13", slot: "lunch" }, WEEK, p)).toBe(false);
    expect(isPlannedSlot({ day: "2026-10-20", slot: "dinner" }, WEEK, p)).toBe(false);
    expect(isPlannedSlot({ day: "2026-10-13", slot: "lunch" }, WEEK)).toBe(true);
    expect(plannedSlots(WEEK, p)).toHaveLength(7);
    expect(plannedSlots(WEEK, toPattern(PATTERN_PRESETS.semaine_soir))).toHaveLength(9);
  });

  it("ne remplit automatiquement que les repas prévus", () => {
    const order = fillOrder(WEEK, WEEK, dinners());
    expect(order.every((s) => s.slot === "dinner")).toBe(true);
    const placed = autoPlace(
      Array.from({ length: 9 }, (_, i): PlanEntry => ({
        recipeId: `r${i}`,
        servings: 2,
        locked: false,
      })),
      WEEK,
      WEEK,
      dinners(),
    );
    expect(placed.filter((e) => e.day)).toHaveLength(7);
    expect(placed.filter((e) => !e.day)).toHaveLength(2);
  });

  it("compte les cuissons nécessaires", () => {
    expect(cooksFor(7, 1)).toBe(7);
    expect(cooksFor(7, 2)).toBe(4);
    expect(cooksFor(6, 3)).toBe(2);
    expect(cooksFor(0, 2)).toBe(0);
  });
});

describe("cuisine par lots (placeBatches)", () => {
  it("le soir seulement, 2 repas par cuisson : cuisiné un soir, reste le soir suivant", () => {
    const out = batch([], ["a", "b", "c", "d"], 7, 2, WEEK, dinners(2));
    expect(out).toEqual([
      { recipeId: "a", servings: 4, locked: false, day: "2026-10-12", slot: "dinner" },
      {
        recipeId: "a",
        servings: 2,
        locked: false,
        leftover: true,
        day: "2026-10-13",
        slot: "dinner",
      },
      { recipeId: "b", servings: 4, locked: false, day: "2026-10-14", slot: "dinner" },
      {
        recipeId: "b",
        servings: 2,
        locked: false,
        leftover: true,
        day: "2026-10-15",
        slot: "dinner",
      },
      { recipeId: "c", servings: 4, locked: false, day: "2026-10-16", slot: "dinner" },
      {
        recipeId: "c",
        servings: 2,
        locked: false,
        leftover: true,
        day: "2026-10-17",
        slot: "dinner",
      },
      // Dernier plat : un seul repas restant, cuisiné pour ce repas uniquement.
      { recipeId: "d", servings: 2, locked: false, day: "2026-10-18", slot: "dinner" },
    ]);
  });

  it("midi et soir, 2 repas par cuisson : le reste va au repas prévu suivant", () => {
    const out = batch([], ["a", "b"], 4, 3, WEEK, toPattern(ALL_PATTERN_SLOTS, 2));
    // Repas retenus : les 4 premiers soirs ; regroupés chronologiquement par deux.
    expect(out.map((e) => [e.recipeId, e.leftover ?? false, e.day, e.slot])).toEqual([
      ["a", false, "2026-10-12", "dinner"],
      ["a", true, "2026-10-13", "dinner"],
      ["b", false, "2026-10-14", "dinner"],
      ["b", true, "2026-10-15", "dinner"],
    ]);
  });

  it("respecte les plats gardés et ne remplit que les repas libres", () => {
    const kept: PlanEntry[] = [
      { recipeId: "k", servings: 2, locked: true, day: "2026-10-13", slot: "dinner" },
    ];
    const out = batch(kept, ["a", "b"], 3, 2, WEEK, dinners(2));
    expect(out[0]).toEqual(kept[0]);
    expect(out.slice(1).map((e) => [e.recipeId, e.leftover ?? false, e.day])).toEqual([
      ["a", false, "2026-10-12"],
      ["a", true, "2026-10-14"],
      ["b", false, "2026-10-15"],
    ]);
  });

  it("commence aujourd'hui ; un lot ne déborde jamais sur les jours passés", () => {
    const groups = batchGroups([], 4, WEEK, "2026-10-16", dinners(2));
    expect(groups.map((g) => g.map((s) => s?.day))).toEqual([
      ["2026-10-16", "2026-10-17"],
      ["2026-10-18"],
      // Plus de soir à venir : on reprend au début de la semaine, dans un nouveau lot.
      ["2026-10-12"],
    ]);
    const out = placeBatches([], ["a", "b", "c"], groups, 2);
    expect(out.map((e) => [e.recipeId, e.leftover ?? false, e.day])).toEqual([
      ["a", false, "2026-10-16"],
      ["a", true, "2026-10-17"],
      ["b", false, "2026-10-18"],
      ["c", false, "2026-10-12"],
    ]);
  });

  it("laisse sans jour ce qui ne tient pas dans la semaine", () => {
    const p = toPattern(["mon:dinner", "tue:dinner", "wed:dinner"], 2);
    const out = batch([], ["a", "b"], 4, 2, WEEK, p);
    expect(out.map((e) => e.day ?? null)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14", null]);
    expect(out[3]).toMatchObject({ recipeId: "b", leftover: true });
  });

  it("une cuisson par repas : un plat par repas prévu, sans reste", () => {
    const out = batch([], ["a", "b", "c"], 3, 2, WEEK, dinners(1));
    expect(out.every((e) => !e.leftover && e.servings === 2)).toBe(true);
    expect(out.map((e) => e.day)).toEqual(["2026-10-12", "2026-10-13", "2026-10-14"]);
  });
});

describe("restes et semaine type", () => {
  it("« Cuisiner double » saute les repas non prévus", () => {
    const entries: PlanEntry[] = [
      { recipeId: "chili", servings: 2, locked: false, day: "2026-10-12", slot: "dinner" },
    ];
    const out = addLeftover(entries, 0, 2, WEEK, dinners());
    // Sans semaine type, le reste irait au mardi midi.
    expect(out[1]).toMatchObject({ leftover: true, day: "2026-10-13", slot: "dinner" });
  });
});
