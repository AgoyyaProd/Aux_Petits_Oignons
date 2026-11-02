import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

const SLUGS = ["miso", "nouilles-oeufs", "nuoc-mam", "pak-choi", "pousse-soja", "sauce-huitre"];

describe("épicerie asiatique", () => {
  it("six produits avec nutrition, prix manuel, allergènes et régimes", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.default_dimension, i.density_g_per_ml, n.ciqual_code, s.kind,
         coalesce((select array_agg(a.allergen_code order by a.allergen_code)
            from public.ingredient_allergens a where a.ingredient_id = i.id), '{}') as allergens,
         coalesce((select array_agg(d.diet_code order by d.diet_code)
            from public.ingredient_diet_conflicts d where d.ingredient_id = i.id), '{}') as diets
       from public.ingredients i
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       left join public.ingredient_price_sources s on s.ingredient_id = i.id
       where i.slug = any($1) order by i.slug`,
      [SLUGS],
    );
    expect(rows).toEqual([
      {
        slug: "miso",
        default_dimension: "mass",
        density_g_per_ml: null,
        ciqual_code: 20916,
        kind: "none",
        allergens: ["soy"],
        diets: [],
      },
      {
        slug: "nouilles-oeufs",
        default_dimension: "mass",
        density_g_per_ml: null,
        ciqual_code: 9863,
        kind: "none",
        allergens: ["eggs", "gluten"],
        diets: ["vegan"],
      },
      {
        slug: "nuoc-mam",
        default_dimension: "volume",
        density_g_per_ml: "1.217",
        ciqual_code: 11194,
        kind: "none",
        allergens: ["fish"],
        diets: ["vegan", "vegetarian"],
      },
      {
        slug: "pak-choi",
        default_dimension: "mass",
        density_g_per_ml: null,
        ciqual_code: 20340,
        kind: "none",
        allergens: [],
        diets: [],
      },
      {
        slug: "pousse-soja",
        default_dimension: "mass",
        density_g_per_ml: null,
        ciqual_code: 20183,
        kind: "none",
        allergens: [],
        diets: [],
      },
      {
        slug: "sauce-huitre",
        default_dimension: "volume",
        density_g_per_ml: "1.217",
        ciqual_code: 11223,
        kind: "none",
        allergens: ["gluten", "molluscs"],
        diets: ["vegan", "vegetarian"],
      },
    ]);
  });

  it("les noms des produits mènent au bon ingrédient", async () => {
    const cases: [string, string][] = [
      ["Sauce d'huître", "sauce-huitre"],
      ["Nuoc mâm", "nuoc-mam"],
      ["Sauce de poisson", "nuoc-mam"],
      ["Pâte de miso", "miso"],
      ["Nouilles chinoises aux œufs", "nouilles-oeufs"],
      ["Bok choy", "pak-choi"],
      ["Germes de soja", "pousse-soja"],
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

  it("les plats à la sauce d'huître ou au nuoc-mâm ne sont pas végétariens", async () => {
    const { rows } = await pool.query(
      `select distinct r.slug from public.recipes r
       join public.recipe_ingredients ri on ri.recipe_id = r.id
       join public.ingredients i on i.id = ri.ingredient_id
       where i.slug in ('sauce-huitre', 'nuoc-mam') and not ri.is_optional
         and not exists (select 1 from public.recipe_diet_conflicts d
                         where d.recipe_id = r.id and d.diet_code = 'vegetarian')`,
    );
    expect(rows).toEqual([]);
  });
});
