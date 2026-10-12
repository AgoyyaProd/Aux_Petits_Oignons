import { describe, expect, it } from "vitest";
import {
  addLeftover,
  nextFreeSlotAfter,
  normalizeLeftovers,
  removeEntryWithLeftovers,
  type PlanEntry,
} from "@/domain/planning";

const WEEK = "2026-10-12";
const e = (recipeId: string, day: string | null, slot: "lunch" | "dinner" | null): PlanEntry => ({
  recipeId,
  servings: 4,
  locked: false,
  day,
  slot,
});

describe("cuisiner double", () => {
  it("double le plat cuisiné et place le reste au repas libre suivant", () => {
    const entries = [e("chili", "2026-10-12", "dinner"), e("dahl", "2026-10-13", "lunch")];
    const out = addLeftover(entries, 0, 4, WEEK);
    expect(out[0]).toMatchObject({ recipeId: "chili", servings: 8, locked: true });
    expect(out[2]).toEqual({
      recipeId: "chili",
      servings: 4,
      locked: true,
      leftover: true,
      day: "2026-10-13",
      slot: "dinner",
    });
  });

  it("laisse le reste sans jour si la semaine est pleine après le plat, ou si le plat n'est pas placé", () => {
    expect(
      nextFreeSlotAfter([e("a", "2026-10-18", "dinner")], WEEK, {
        day: "2026-10-18",
        slot: "dinner",
      }),
    ).toBeNull();
    const out = addLeftover([e("a", null, null)], 0, 2, WEEK);
    expect(out[1]).toMatchObject({ leftover: true, day: null, slot: null });
  });

  it("refuse les restes d'un reste", () => {
    const out = addLeftover([e("a", "2026-10-12", "dinner")], 0, 2, WEEK);
    expect(() => addLeftover(out, 1, 2, WEEK)).toThrow();
  });
});

describe("retrait et cohérence", () => {
  it("retirer un reste rend ses portions au plat cuisiné", () => {
    const out = addLeftover([e("a", "2026-10-12", "dinner")], 0, 4, WEEK);
    const back = removeEntryWithLeftovers(out, 1);
    expect(back).toHaveLength(1);
    expect(back[0]!.servings).toBe(4);
  });

  it("retirer le plat cuisiné transforme son reste en plat normal (courses comptées)", () => {
    const out = addLeftover([e("a", "2026-10-12", "dinner")], 0, 4, WEEK);
    const left = removeEntryWithLeftovers(out, 0);
    expect(left).toEqual([expect.objectContaining({ recipeId: "a", leftover: false })]);
    expect(normalizeLeftovers(left)).toEqual(left);
  });
});

describe("ordre des restes", () => {
  it("un reste placé avant son plat cuisiné passe au repas libre suivant", () => {
    const entries: PlanEntry[] = [
      e("a", "2026-10-14", "dinner"),
      { ...e("a", "2026-10-13", "dinner"), leftover: true },
    ];
    expect(normalizeLeftovers(entries, WEEK)[1]).toMatchObject({
      day: "2026-10-15",
      slot: "lunch",
    });
  });
});
