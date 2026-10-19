import { describe, expect, it } from "vitest";
import { expectPgError, pool } from "./helpers";

const resolve = async (label: string) =>
  (
    await pool.query(
      "select i.slug from public.ingredients i where i.id = public.resolve_ingredient($1)",
      [label],
    )
  ).rows[0]?.slug ?? null;

describe("variantes d'ingrédients", () => {
  it("chaque variante a son parent, de même dimension", async () => {
    const { rows } = await pool.query(
      `select c.slug, p.slug as parent from public.ingredients c join public.ingredients p on p.id = c.parent_id
       where c.slug in ('farfalle', 'riz-basmati', 'riz-arborio', 'pomme-de-terre-grenaille') order by 1`,
    );
    expect(rows).toEqual([
      { slug: "farfalle", parent: "pates" },
      { slug: "pomme-de-terre-grenaille", parent: "pomme-de-terre" },
      { slug: "riz-arborio", parent: "riz-rond" },
      { slug: "riz-basmati", parent: "riz" },
    ]);
  });

  it("les pâtes à lasagne sont un ingrédient à part, avec les allergènes des pâtes", async () => {
    const { rows } = await pool.query(
      `select i.parent_id, array(select a.allergen_code from public.ingredient_allergens a where a.ingredient_id = i.id order by 1) as allergenes,
              array(select a.allergen_code from public.ingredient_allergens a join public.ingredients p on p.id = a.ingredient_id where p.slug = 'pates' order by 1) as pates
       from public.ingredients i where i.slug = 'pates-lasagne'`,
    );
    expect(rows[0].parent_id).toBeNull();
    expect(rows[0].allergenes).toEqual(rows[0].pates);
  });

  it.each([
    ["farfalle", "farfalle"],
    ["Farfalles", "farfalle"],
    ["spaghetti", "spaghetti"],
    ["Riz basmati", "riz-basmati"],
    ["riz jasmin", "riz-jasmin"],
    ["Riz parfumé", "riz-jasmin"],
    ["Riz thaï", "riz-thai"],
    ["grenailles", "pomme-de-terre-grenaille"],
    ["lasagnes", "pates-lasagne"],
    ["oeufs frais", "oeuf"],
    ["oeuf", "oeuf"],
    ["pâtes", "pates"],
  ])("« %s » désigne %s", async (label, slug) => {
    expect(await resolve(label)).toBe(slug);
  });

  it("refuse une variante de variante et un parent de dimension différente", async () => {
    const nested = await expectPgError(
      pool.query(
        `insert into public.ingredients (slug, name, category, default_dimension, parent_id)
         select 'test-nested', 'Test', 'feculents', 'mass', id from public.ingredients where slug = 'farfalle'`,
      ),
    );
    expect(nested).toBe("AP422");
    const dimension = await expectPgError(
      pool.query(
        `insert into public.ingredients (slug, name, category, default_dimension, parent_id)
         select 'test-dim', 'Test dim', 'feculents', 'volume', id from public.ingredients where slug = 'pates'`,
      ),
    );
    expect(dimension).toBe("AP422");
  });
});
