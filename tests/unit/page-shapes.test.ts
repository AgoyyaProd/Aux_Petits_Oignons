import { describe, expect, it } from "vitest";
import { presetFor } from "@/components/brand/page-shapes";

describe("décor de fond par rubrique", () => {
  it("choisit la composition de la rubrique, la fiche recette a la sienne", () => {
    expect(presetFor("/dashboard")).toBe("dashboard");
    expect(presetFor("/recipes")).toBe("recipes");
    expect(presetFor("/recipes/pad-thai-crevettes")).toBe("recipe");
    expect(presetFor("/planner")).toBe("planner");
    expect(presetFor("/pantry/new")).toBe("pantry");
    expect(presetFor("/invitation/abc")).toBe("default");
    expect(presetFor(null)).toBe("default");
  });
});
