import { describe, expect, it } from "vitest";
import { recipeDifficulty } from "@/domain/recipes/difficulty";

describe("difficulté calculée", () => {
  it("facile : préparation courte et peu d'étapes détaillées", () => {
    // Bol de yaourt, coquillettes au jambon : 5 min de préparation, 6 à 7 étapes.
    expect(recipeDifficulty({ prepMinutes: 5, cookMinutes: 0, steps: 6 })).toBe("facile");
    expect(recipeDifficulty({ prepMinutes: 5, cookMinutes: 12, steps: 7 })).toBe("facile");
    expect(recipeDifficulty({ prepMinutes: 15, cookMinutes: 30, steps: 8 })).toBe("facile");
  });
  it("élaborée : longue préparation ou beaucoup d'étapes", () => {
    expect(recipeDifficulty({ prepMinutes: 40, cookMinutes: 45, steps: 9 })).toBe("elaboree");
    expect(recipeDifficulty({ prepMinutes: 30, cookMinutes: 120, steps: 14 })).toBe("elaboree");
    expect(recipeDifficulty({ prepMinutes: 150, cookMinutes: 35, steps: 12 })).toBe("elaboree");
  });
  it("une longue cuisson seule ne rend pas une recette élaborée", () => {
    // Pot-au-feu : 30 min de préparation, 3 h 30 de mijotage.
    expect(recipeDifficulty({ prepMinutes: 30, cookMinutes: 210, steps: 9 })).toBe("moyenne");
  });
  it("moyenne sinon", () => {
    expect(recipeDifficulty({ prepMinutes: 20, cookMinutes: 25, steps: 9 })).toBe("moyenne");
    expect(recipeDifficulty({ prepMinutes: 10, cookMinutes: 40, steps: 8 })).toBe("moyenne");
  });
});
