import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

describe("pesto verde et pesto rosso", () => {
  it("sont deux ingrédients distincts, sans lien de variante", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.name, i.parent_id, i.default_dimension, n.ciqual_code,
         (select array_agg(a.allergen_code order by a.allergen_code)
            from public.ingredient_allergens a where a.ingredient_id = i.id) as allergens,
         (select array_agg(d.diet_code) from public.ingredient_diet_conflicts d
            where d.ingredient_id = i.id) as diets,
         s.kind, s.approximate
       from public.ingredients i
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       left join public.ingredient_price_sources s on s.ingredient_id = i.id
       where i.slug in ('pesto', 'pesto-rosso') order by i.slug`,
    );
    expect(rows).toEqual([
      {
        slug: "pesto",
        name: "Pesto verde",
        parent_id: null,
        default_dimension: "mass",
        ciqual_code: 11179,
        allergens: ["milk", "tree_nuts"],
        diets: ["vegan"],
        kind: "product",
        approximate: true,
      },
      {
        slug: "pesto-rosso",
        name: "Pesto rosso",
        parent_id: null,
        default_dimension: "mass",
        ciqual_code: 11210,
        allergens: ["milk", "tree_nuts"],
        diets: ["vegan"],
        kind: "none",
        approximate: false,
      },
    ]);
  });

  it("les noms courants mènent au bon pesto", async () => {
    const cases: [string, string][] = [
      ["Pesto", "pesto"],
      ["Pesto verde", "pesto"],
      ["pesto vert", "pesto"],
      ["Pesto alla genovese", "pesto"],
      ["Pesto rosso", "pesto-rosso"],
      ["pesto rouge", "pesto-rosso"],
      ["Pesto aux tomates séchées", "pesto-rosso"],
    ];
    for (const [alias, slug] of cases) {
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

  it("les recettes au basilic restent au pesto verde", async () => {
    const { rows } = await pool.query(
      `select count(*)::int n from public.recipe_ingredients ri
       join public.ingredients i on i.id = ri.ingredient_id where i.slug = 'pesto'`,
    );
    expect(rows[0].n).toBeGreaterThanOrEqual(6);
  });
});
