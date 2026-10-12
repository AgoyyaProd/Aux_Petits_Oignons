import { describe, expect, it } from "vitest";
import { AISLES, orderedAisles } from "@/lib/categories";

describe("orderedAisles", () => {
  it("garde l'ordre par défaut sans choix", () => {
    expect(orderedAisles(null)).toBe(AISLES);
    expect(orderedAisles([])).toBe(AISLES);
  });

  it("applique l'ordre du foyer et complète avec le reste", () => {
    const out = orderedAisles(["oeufs_laitiers", "inconnu", "fruits", "fruits"]).map(
      (a) => a.category,
    );
    expect(out.slice(0, 3)).toEqual(["oeufs_laitiers", "fruits", "legumes"]);
    expect(out).toHaveLength(AISLES.length);
    expect(new Set(out).size).toBe(AISLES.length);
  });
});
