import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { INGREDIENT_IMAGES, RECIPE_IMAGES, recipeImageSmall } from "@/lib/images";

const file = (src: string) => join("public", src.split("?")[0]!);

describe("photos des recettes", () => {
  it("chaque photo déclarée existe en deux tailles dans public/", () => {
    const paths = [...Object.values(RECIPE_IMAGES), ...Object.values(INGREDIENT_IMAGES)];
    expect(Object.keys(RECIPE_IMAGES).length).toBeGreaterThan(0);
    expect(Object.keys(INGREDIENT_IMAGES).length).toBeGreaterThan(0);
    for (const src of paths) {
      expect(existsSync(file(src)), src).toBe(true);
      const small = recipeImageSmall(src);
      expect(small, src).not.toBeNull();
      expect(existsSync(file(small!)), small!).toBe(true);
    }
  });

  it("la version de l'adresse suit le contenu : une photo remplacée change d'adresse", () => {
    for (const src of [...Object.values(RECIPE_IMAGES), ...Object.values(INGREDIENT_IMAGES)]) {
      const version = src.split("?v=")[1];
      const small = recipeImageSmall(src)!;
      expect(small.endsWith(`?v=${version}`), small).toBe(true);
      const digest = createHash("sha1")
        .update(Buffer.concat([readFileSync(file(src)), readFileSync(file(small))]))
        .digest("hex")
        .slice(0, 8);
      expect(version, `${src} : relancer scripts/photo-index.py`).toBe(digest);
    }
  });

  it("ne propose pas de variante pour une image étrangère", () => {
    expect(recipeImageSmall("/icon.svg")).toBeNull();
  });
});
