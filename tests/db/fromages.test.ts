import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

const CHEESES = [
  "beaufort",
  "brie",
  "burrata",
  "camembert",
  "cantal",
  "fourme-ambert",
  "gorgonzola",
  "gouda",
  "gruyere",
  "maroilles",
  "mascarpone",
  "mimolette",
  "mont-d-or",
  "morbier",
  "munster",
  "pecorino",
  "raclette",
  "reblochon",
  "roquefort",
  "saint-nectaire",
  "tomme-savoie",
];

describe("fromages", () => {
  it("21 fromages en masse, avec nutrition Ciqual, lait, non végétaliens, prix manuel", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.category, i.default_dimension, n.ciqual_code, s.kind,
         coalesce((select array_agg(a.allergen_code) from public.ingredient_allergens a
            where a.ingredient_id = i.id), '{}') as allergens,
         coalesce((select array_agg(d.diet_code) from public.ingredient_diet_conflicts d
            where d.ingredient_id = i.id), '{}') as diets
       from public.ingredients i
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       left join public.ingredient_price_sources s on s.ingredient_id = i.id
       where i.slug = any($1) order by i.slug`,
      [CHEESES],
    );
    expect(rows.map((r) => r.slug)).toEqual(CHEESES);
    for (const r of rows) {
      expect(r.category, r.slug).toBe("fromages");
      expect(r.default_dimension, r.slug).toBe("mass");
      expect(r.ciqual_code, r.slug).not.toBeNull();
      expect(r.kind, r.slug).toBe("none");
      expect(r.allergens, r.slug).toEqual(["milk"]);
      expect(r.diets, r.slug).toEqual(["vegan"]);
    }
  });

  it("les noms des fromages mènent au bon ingrédient", async () => {
    const cases: [string, string][] = [
      ["Gruyère", "gruyere"],
      ["Gruyère râpé", "emmental"],
      ["Fromage à raclette", "raclette"],
      ["Vacherin Mont d'Or", "mont-d-or"],
      ["Fourme d'Ambert", "fourme-ambert"],
      ["St Nectaire", "saint-nectaire"],
      ["Tomme de Savoie", "tomme-savoie"],
      ["Brie de Meaux", "brie"],
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
});
