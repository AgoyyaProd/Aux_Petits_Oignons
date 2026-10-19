import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

const FLOURS = [
  "farine",
  "farine-pain",
  "farine-bise",
  "farine-semi-complete",
  "farine-complete",
  "farine-levure",
  "farine-seigle",
  "farine-epeautre",
  "farine-orge",
  "farine-sarrasin",
  "farine-mais",
  "farine-riz",
  "farine-millet",
  "farine-pois-chiche",
  "farine-chataigne",
  "farine-soja",
];
const GLUTEN = new Set([
  "farine",
  "farine-pain",
  "farine-bise",
  "farine-semi-complete",
  "farine-complete",
  "farine-levure",
  "farine-seigle",
  "farine-epeautre",
  "farine-orge",
]);

describe("farines", () => {
  it("chaque farine est un ingrédient distinct, en masse, avec nutrition et source de prix", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.parent_id, i.default_dimension, i.category, n.ciqual_code, s.kind,
         coalesce((select array_agg(a.allergen_code order by a.allergen_code)
            from public.ingredient_allergens a where a.ingredient_id = i.id), '{}') as allergens
       from public.ingredients i
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       left join public.ingredient_price_sources s on s.ingredient_id = i.id
       where i.slug = any($1)`,
      [FLOURS],
    );
    expect(rows.map((r) => r.slug).sort()).toEqual([...FLOURS].sort());
    for (const r of rows) {
      expect(r.parent_id, r.slug).toBeNull();
      expect(r.default_dimension, r.slug).toBe("mass");
      expect(r.category, r.slug).toBe("feculents");
      expect(r.ciqual_code, r.slug).not.toBeNull();
      expect(r.kind, r.slug).not.toBeNull();
      if (GLUTEN.has(r.slug)) expect(r.allergens, r.slug).toEqual(["gluten"]);
      else if (r.slug === "farine-soja") expect(r.allergens).toEqual(["soy"]);
      else expect(r.allergens, r.slug).toEqual([]);
    }
  });

  it("les noms des paquets mènent à la bonne farine", async () => {
    const cases: [string, string][] = [
      ["Farine", "farine"],
      ["Farine de blé T55", "farine"],
      ["Farine T45", "farine"],
      ["Farine à pain", "farine-pain"],
      ["Farine de pain", "farine-pain"],
      ["Farine T65", "farine-pain"],
      ["Farine complète", "farine-complete"],
      ["Farine de seigle", "farine-seigle"],
      ["Farine d'épeautre", "farine-epeautre"],
      ["Farine de blé noir", "farine-sarrasin"],
      ["Farine de pois chiches", "farine-pois-chiche"],
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

  it("les recettes existantes gardent la farine de blé", async () => {
    const { rows } = await pool.query(
      `select i.slug, count(*)::int n from public.recipe_ingredients ri
       join public.ingredients i on i.id = ri.ingredient_id
       where i.slug like 'farine%' group by i.slug`,
    );
    expect(rows).toEqual([{ slug: "farine", n: expect.any(Number) }]);
  });
});
