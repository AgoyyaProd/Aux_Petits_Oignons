import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

describe("pain bretzel, blanc de dinde et roquette", () => {
  it("existent avec nutrition, allergènes, régimes et prix manuel", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.default_dimension, n.ciqual_code, s.kind,
         coalesce((select array_agg(a.allergen_code) from public.ingredient_allergens a
            where a.ingredient_id = i.id), '{}') as allergens,
         coalesce((select array_agg(d.diet_code order by d.diet_code) from public.ingredient_diet_conflicts d
            where d.ingredient_id = i.id), '{}') as diets
       from public.ingredients i
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       left join public.ingredient_price_sources s on s.ingredient_id = i.id
       where i.slug in ('pain-bretzel', 'blanc-dinde', 'roquette') order by i.slug`,
    );
    expect(rows).toEqual([
      {
        slug: "blanc-dinde",
        default_dimension: "mass",
        ciqual_code: 28964,
        kind: "none",
        allergens: [],
        diets: ["pescetarian", "vegan", "vegetarian"],
      },
      {
        slug: "pain-bretzel",
        default_dimension: "mass",
        ciqual_code: 7263,
        kind: "none",
        allergens: ["gluten"],
        diets: [],
      },
      {
        slug: "roquette",
        default_dimension: "mass",
        ciqual_code: 20217,
        kind: "none",
        allergens: [],
        diets: [],
      },
    ]);
  });

  it("les noms des produits mènent au bon ingrédient", async () => {
    for (const [alias, slug] of [
      ["Pain bretzel", "pain-bretzel"],
      ["Bretzels", "pain-bretzel"],
      ["Blanc de dinde", "blanc-dinde"],
      ["Tranches de dinde", "blanc-dinde"],
      ["Roquette", "roquette"],
    ]) {
      const { rows } = await pool.query(
        `select i.slug from public.ingredient_aliases a
         join public.ingredients i on i.id = a.ingredient_id
         where a.alias_normalized = public.normalize_alias($1)`,
        [alias],
      );
      expect(
        rows.map((r) => r.slug),
        alias,
      ).toEqual([slug]);
    }
  });
});
