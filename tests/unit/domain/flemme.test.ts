import { describe, expect, it } from "vitest";
import {
  batchGroups,
  generatePlan,
  lazyGroupMask,
  PATTERN_PRESETS,
  toPattern,
  type BatchGroup,
  type PlanCandidate,
} from "@/domain/planning";

const WEEK = "2026-10-12"; // lundi

function candidate(id: string, lazy = false): PlanCandidate {
  return {
    id,
    costPerServingMillicents: 200_000,
    missingPrices: 0,
    priorityUses: 0,
    stockCoverage: 0,
    varietyKeys: [],
    lazy,
  };
}

describe("soirs flemme : choix des lots", () => {
  it("sans soir flemme, aucun lot", () => {
    const groups = batchGroups([], 7, WEEK, WEEK, toPattern(PATTERN_PRESETS.soir, 1));
    expect(lazyGroupMask(groups, 0)).toEqual(groups.map(() => false));
  });

  it("répartit les soirs flemme sur les soirs de semaine", () => {
    const groups = batchGroups([], 7, WEEK, WEEK, toPattern(PATTERN_PRESETS.soir, 1));
    const mask = lazyGroupMask(groups, 2);
    const days = groups.filter((_, i) => mask[i]).map((g) => g[0]?.day);
    expect(days).toHaveLength(2);
    // Deux soirs de semaine (lundi 12 → vendredi 16), pas collés.
    for (const d of days) expect(d! <= "2026-10-16").toBe(true);
    expect(days[0]).not.toBe(days[1]);
  });

  it("préfère un soir à un midi, et ne dépasse jamais le nombre de lots", () => {
    const groups: BatchGroup[] = [
      [{ day: "2026-10-12", slot: "lunch" }],
      [{ day: "2026-10-12", slot: "dinner" }],
      [null],
    ];
    expect(lazyGroupMask(groups, 1)).toEqual([false, true, false]);
    expect(lazyGroupMask(groups, 5).filter(Boolean)).toHaveLength(3);
  });

  it("le samedi soir passe après les soirs de semaine", () => {
    const groups: BatchGroup[] = [
      [{ day: "2026-10-17", slot: "dinner" }],
      [{ day: "2026-10-14", slot: "dinner" }],
    ];
    expect(lazyGroupMask(groups, 1)).toEqual([false, true]);
  });
});

describe("soirs flemme : générateur", () => {
  const pool = [
    candidate("a"),
    candidate("b"),
    candidate("c"),
    candidate("d"),
    candidate("z-flemme-1", true),
    candidate("z-flemme-2", true),
  ];
  const base = { mealCount: 4, people: 2, budgetCents: null, locked: [] };

  it("les repas flemme reçoivent une recette de la flemme, quelle que soit la graine", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const plan = generatePlan(pool, { ...base, seed, lazySlots: [false, true, false, true] });
      const ids = plan.entries.map((e) => e.recipeId);
      expect(ids[1]!.startsWith("z-flemme")).toBe(true);
      expect(ids[3]!.startsWith("z-flemme")).toBe(true);
    }
  });

  it("sans recette flemme disponible, le repas se remplit quand même", () => {
    const plan = generatePlan(pool.slice(0, 4), { ...base, seed: 3, lazySlots: [true, true] });
    expect(plan.entries).toHaveLength(4);
    expect(plan.status).toBe("ok");
  });
});
