import { describe, expect, it } from "vitest";
import {
  autoPlace,
  compareBySlot,
  fillOrder,
  mealDateFor,
  parseSlotKey,
  weekSlots,
} from "@/domain/planning";

const WEEK = "2026-10-12"; // lundi
const e = (id: string, day: string | null = null, slot: "lunch" | "dinner" | null = null) => ({
  recipeId: id,
  servings: 2,
  locked: false,
  day,
  slot,
});

describe("cases de la semaine", () => {
  it("14 cases, du lundi midi au dimanche soir", () => {
    const slots = weekSlots(WEEK);
    expect(slots).toHaveLength(14);
    expect(slots[0]).toEqual({ day: "2026-10-12", slot: "lunch" });
    expect(slots[13]).toEqual({ day: "2026-10-18", slot: "dinner" });
  });

  it("lit une case seulement si elle est dans la semaine", () => {
    expect(parseSlotKey("2026-10-14:dinner", WEEK)).toEqual({ day: "2026-10-14", slot: "dinner" });
    expect(parseSlotKey("2026-10-19:dinner", WEEK)).toBeNull();
    expect(parseSlotKey("2026-10-14:brunch", WEEK)).toBeNull();
  });

  it("remplit d'abord les soirs à venir, puis les midis, puis les jours passés", () => {
    const order = fillOrder(WEEK, "2026-10-17");
    expect(order.slice(0, 4)).toEqual([
      { day: "2026-10-17", slot: "dinner" },
      { day: "2026-10-18", slot: "dinner" },
      { day: "2026-10-17", slot: "lunch" },
      { day: "2026-10-18", slot: "lunch" },
    ]);
    expect(order[4]).toEqual({ day: "2026-10-12", slot: "dinner" });
    expect(order).toHaveLength(14);
  });
});

describe("placement automatique", () => {
  it("place les plats sans jour sans toucher aux autres", () => {
    const out = autoPlace([e("a", "2026-10-12", "dinner"), e("b"), e("c")], WEEK, WEEK);
    expect(out.map((x) => [x.recipeId, x.day, x.slot])).toEqual([
      ["a", "2026-10-12", "dinner"],
      ["b", "2026-10-13", "dinner"],
      ["c", "2026-10-14", "dinner"],
    ]);
  });

  it("considère comme non placé un jour hors de la semaine", () => {
    const [x] = autoPlace([e("a", "2026-10-25", "dinner")], WEEK, WEEK);
    expect(x).toMatchObject({ day: "2026-10-12", slot: "dinner" });
  });

  it("laisse sans jour au-delà de 14 plats", () => {
    const out = autoPlace(
      Array.from({ length: 16 }, (_, i) => e(`r${i}`)),
      WEEK,
      WEEK,
    );
    expect(out.filter((x) => x.day).length).toBe(14);
    expect(out.at(-1)).toMatchObject({ day: null, slot: null });
  });

  it("trie par jour, midi avant soir, non placés à la fin", () => {
    const sorted = [e("x"), e("b", "2026-10-13", "dinner"), e("a", "2026-10-13", "lunch")].sort(
      compareBySlot,
    );
    expect(sorted.map((x) => x.recipeId)).toEqual(["a", "b", "x"]);
  });
});

describe("date retenue pour la DLC", () => {
  it("prend le jour du plat", () => {
    expect(mealDateFor("2026-10-16", WEEK, "2026-10-13")).toBe("2026-10-16");
  });
  it("un plat passé non cuisiné compte pour aujourd'hui", () => {
    expect(mealDateFor("2026-10-12", WEEK, "2026-10-14")).toBe("2026-10-14");
  });
  it("sans jour : aujourd'hui, ramené dans la semaine", () => {
    expect(mealDateFor(null, WEEK, "2026-10-14")).toBe("2026-10-14");
    expect(mealDateFor(null, WEEK, "2026-10-01")).toBe(WEEK);
    expect(mealDateFor(null, WEEK, "2026-10-30")).toBe("2026-10-18");
  });
  it("semaine passée : le jour du plat est gardé", () => {
    expect(mealDateFor("2026-10-13", WEEK, "2026-10-30")).toBe("2026-10-13");
  });
});
