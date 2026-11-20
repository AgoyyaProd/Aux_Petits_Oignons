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
