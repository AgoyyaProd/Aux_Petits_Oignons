import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

describe("riz thaï et riz jasmin", () => {
  it("sont deux variantes distinctes du riz, avec nutrition et source de prix", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.name, p.slug as parent, n.ciqual_code, s.kind, s.tags, s.approximate
       from public.ingredients i
       join public.ingredients p on p.id = i.parent_id
       join public.ingredient_nutrition n on n.ingredient_id = i.id
       join public.ingredient_price_sources s on s.ingredient_id = i.id
       where i.slug in ('riz-thai', 'riz-jasmin') order by i.slug`,
    );
    expect(rows).toEqual([
      {
        slug: "riz-jasmin",
        name: "Riz parfumé au jasmin",
        parent: "riz",
        ciqual_code: 9119,
        kind: "product",
        tags: ["en:jasmine-rice"],
        approximate: false,
      },
      {
        slug: "riz-thai",
        name: "Riz thaï",
        parent: "riz",
        ciqual_code: 9119,
        kind: "product",
        tags: ["en:long-grain-rices", "en:white-rices"],
        approximate: true,
      },
    ]);
  });

  it("les recettes au riz thaï le gardent", async () => {
    const { rows } = await pool.query(
      `select count(*)::int n from public.recipe_ingredients ri
       join public.ingredients i on i.id = ri.ingredient_id where i.slug = 'riz-thai'`,
    );
    expect(rows[0].n).toBeGreaterThanOrEqual(9);
  });
});
