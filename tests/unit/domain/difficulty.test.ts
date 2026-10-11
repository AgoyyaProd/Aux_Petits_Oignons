import { describe, expect, it } from "vitest";
import { recipeDifficulty } from "@/domain/recipes/difficulty";

describe("difficulté calculée", () => {
  it("facile : préparation courte, peu d'étapes", () => {
    expect(recipeDifficulty({ prepMinutes: 5, cookMinutes: 12, steps: 3 })).toBe("facile");
    expect(recipeDifficulty({ prepMinutes: 15, cookMinutes: 30, steps: 4 })).toBe("facile");
  });
  it("élaborée : longue préparation, beaucoup d'étapes ou très long", () => {
    expect(recipeDifficulty({ prepMinutes: 30, cookMinutes: 45, steps: 5 })).toBe("elaboree");
    expect(recipeDifficulty({ prepMinutes: 10, cookMinutes: 20, steps: 7 })).toBe("elaboree");
    expect(recipeDifficulty({ prepMinutes: 20, cookMinutes: 180, steps: 5 })).toBe("elaboree");
  });
  it("moyenne sinon", () => {
    expect(recipeDifficulty({ prepMinutes: 20, cookMinutes: 25, steps: 4 })).toBe("moyenne");
    expect(recipeDifficulty({ prepMinutes: 10, cookMinutes: 40, steps: 4 })).toBe("moyenne");
  });
});
