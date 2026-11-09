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

  it("crème liquide et crème épaisse : variantes de « crème », pour tous les plats salés", async () => {
    const { rows } = await pool.query(
      `select c.slug, p.slug as parent from public.ingredients c
       join public.ingredients p on p.id = c.parent_id
       where p.slug = 'creme' order by 1`,
    );
    expect(rows).toEqual([
      { slug: "creme-fraiche", parent: "creme" },
      { slug: "creme-liquide", parent: "creme" },
    ]);
    const lines = await pool.query(
      `select i.slug, 'dessert' = any(r.tags) as dessert, count(*)::int as n
       from public.recipe_ingredients ri
       join public.recipes r on r.id = ri.recipe_id
       join public.ingredients i on i.id = ri.ingredient_id
       where i.slug like 'creme%' and i.slug <> 'creme-chocolat'
       group by 1, 2 order by 1, 2`,
    );
    for (const l of lines.rows) {
      if (l.slug === "creme") expect(l.dessert, "crème commune hors desserts").toBe(false);
      else expect(l.dessert, `${l.slug} gardée seulement pour les desserts`).toBe(true);
    }
    expect(lines.rows.some((l) => l.slug === "creme")).toBe(true);
  });

  it("la crème commune a les allergènes, régimes, nutrition, prix et format des crèmes", async () => {
    const { rows } = await pool.query(
      `select i.default_dimension, i.density_g_per_ml, n.ciqual_code, s.approximate, rp.cents_per_ref,
         p.quantity_base, p.opened_keep_days,
         array(select a.allergen_code from public.ingredient_allergens a where a.ingredient_id = i.id) as allergens,
         array(select d.diet_code from public.ingredient_diet_conflicts d where d.ingredient_id = i.id order by 1) as diets
       from public.ingredients i
       join public.ingredient_nutrition n on n.ingredient_id = i.id
       join public.ingredient_price_sources s on s.ingredient_id = i.id
       left join public.reference_prices rp on rp.ingredient_id = i.id
       join public.ingredient_packages p on p.ingredient_id = i.id
       where i.slug = 'creme'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      default_dimension: "volume",
      ciqual_code: 19417,
      approximate: true,
      quantity_base: "200.000",
      opened_keep_days: 3,
      allergens: ["milk"],
    });
    expect(rows[0].diets).toContain("vegan");
  });
});
