import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

/** 0093 : variantes dont le stock compte pour une recette qui demande le parent. */
describe("variantes du stock", () => {
  it("oignon rouge, haricots verts et épinards surgelés, pâtes complètes", async () => {
    const { rows } = await pool.query(
      `select c.slug, p.slug as parent from public.ingredients c
       join public.ingredients p on p.id = c.parent_id
       where c.slug in ('oignon-rouge', 'haricot-vert-surgele', 'epinard-galets', 'pates-completes')
       order by c.slug`,
    );
    expect(rows.map((r) => [r.slug, r.parent])).toEqual([
      ["epinard-galets", "epinard"],
      ["haricot-vert-surgele", "haricot-vert"],
      ["oignon-rouge", "oignon"],
      ["pates-completes", "pates"],
    ]);
  });
});

/** 0094 : jus d'agrume tiré du fruit en stock, au rendement déclaré et sourcé. */
describe("jus d'agrumes", () => {
  it("citron → jus de citron (47 ml), citron vert → jus de citron vert (43 ml)", async () => {
    const { rows } = await pool.query(
      `select p.slug as product, s.slug as source, j.ml_per_piece::text as ml, j.source_note
       from public.ingredient_juice_sources j
       join public.ingredients p on p.id = j.product_id
       join public.ingredients s on s.id = j.source_id order by p.slug`,
    );
    expect(rows.map((r) => [r.product, r.source, r.ml])).toEqual([
      ["jus-citron", "citron", "47.0"],
      ["jus-citron-vert", "citron-vert", "43.0"],
    ]);
    for (const r of rows) expect(r.source_note).toMatch(/USDA/);
  });

  it("lecture seule pour les visiteurs et les comptes", async () => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("set local role anon");
      expect(
        (await client.query("select count(*)::int as n from public.ingredient_juice_sources"))
          .rows[0].n,
      ).toBe(2);
      await expect(
        client.query("delete from public.ingredient_juice_sources"),
      ).rejects.toMatchObject({ code: "42501" });
    } finally {
      await client.query("rollback");
      client.release();
    }
  });
});

/** 0095 : céréales et pâtes torti. */
describe("céréales et torti", () => {
  it("nouveaux produits, allergènes, variante et alias", async () => {
    const { rows } = await pool.query(
      `select i.slug, p.slug as parent, n.ciqual_code,
         array(select a.allergen_code from public.ingredient_allergens a
               where a.ingredient_id = i.id) as allergens
       from public.ingredients i
       left join public.ingredients p on p.id = i.parent_id
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug in ('melange-cereales', 'ble-precuit', 'sarrasin', 'pates-torti')
       order by i.slug`,
    );
    expect(rows).toEqual([
      { slug: "ble-precuit", parent: null, ciqual_code: 9080, allergens: ["gluten"] },
      { slug: "melange-cereales", parent: null, ciqual_code: null, allergens: ["gluten"] },
      { slug: "pates-torti", parent: "pates", ciqual_code: 9810, allergens: ["gluten"] },
      { slug: "sarrasin", parent: null, ciqual_code: 9380, allergens: [] },
    ]);
    const alias = await pool.query(
      `select i.slug from public.ingredient_aliases a join public.ingredients i on i.id = a.ingredient_id
       where a.alias_normalized = public.normalize_alias('Tortis')`,
    );
    expect(alias.rows[0]?.slug).toBe("pates-torti");
  });
});

/** 0096 : farines T00 et multi-céréales. */
describe("farines T00 et multi-céréales", () => {
  it("la T00 est une variante de la farine, la multi-céréales non", async () => {
    const { rows } = await pool.query(
      `select i.slug, p.slug as parent, n.ciqual_code,
         array(select a.allergen_code from public.ingredient_allergens a
               where a.ingredient_id = i.id) as allergens
       from public.ingredients i
       left join public.ingredients p on p.id = i.parent_id
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug in ('farine-t00', 'farine-multicereales') order by i.slug`,
    );
    expect(rows).toEqual([
      { slug: "farine-multicereales", parent: null, ciqual_code: null, allergens: ["gluten"] },
      { slug: "farine-t00", parent: "farine", ciqual_code: 9440, allergens: ["gluten"] },
    ]);
  });
});

/** 0097 : farine de gruau et graines de chia. */
describe("farine de gruau et chia", () => {
  it("gruau variante de la farine, chia avec sa nutrition", async () => {
    const { rows } = await pool.query(
      `select i.slug, p.slug as parent, n.ciqual_code
       from public.ingredients i
       left join public.ingredients p on p.id = i.parent_id
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug in ('farine-gruau', 'graine-chia') order by i.slug`,
    );
    expect(rows).toEqual([
      { slug: "farine-gruau", parent: "farine", ciqual_code: 9440 },
      { slug: "graine-chia", parent: null, ciqual_code: 15047 },
    ]);
  });
});

/** 0098 : feuilles de riz, comptées à la feuille. */
describe("feuilles de riz", () => {
  it("à la pièce, trouvées par « papier de riz »", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.default_dimension, i.piece_weight_g::float as g from public.ingredient_aliases a
       join public.ingredients i on i.id = a.ingredient_id
       where a.alias_normalized = public.normalize_alias('Papier de riz')`,
    );
    expect(rows).toEqual([{ slug: "feuille-riz", default_dimension: "count", g: 10 }]);
  });
});
