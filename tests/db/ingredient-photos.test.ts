import { describe, expect, it } from "vitest";
import { INGREDIENT_IMAGES } from "@/lib/images";
import { pool } from "./helpers";

describe("photos des aliments", () => {
  it("chaque photo porte le slug d'un ingrédient du référentiel", async () => {
    const slugs = Object.keys(INGREDIENT_IMAGES);
    const { rows } = await pool.query<{ slug: string }>(
      "select slug from public.ingredients where slug = any($1)",
      [slugs],
    );
    expect(rows.map((r) => r.slug).sort()).toEqual([...slugs].sort());
  });
});
