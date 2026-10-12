import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RECIPE_IMAGES, recipeImageSmall } from "@/lib/images";

describe("photos des recettes", () => {
  it("chaque photo déclarée existe en deux tailles dans public/", () => {
    const paths = Object.values(RECIPE_IMAGES);
    expect(paths.length).toBeGreaterThan(0);
    for (const src of paths) {
      expect(existsSync(join("public", src)), src).toBe(true);
      const small = recipeImageSmall(src);
      expect(small, src).not.toBeNull();
      expect(existsSync(join("public", small!)), small!).toBe(true);
    }
  });

  it("ne propose pas de variante pour une image étrangère", () => {
    expect(recipeImageSmall("/icon.svg")).toBeNull();
  });
});
