import { describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool } from "./helpers";

describe("sauce teriyaki et tomates séchées", () => {
  it("existent avec leurs noms, allergènes, prix et nutrition", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.default_dimension, i.density_g_per_ml, n.ciqual_code, s.kind,
         coalesce((select array_agg(a.allergen_code order by a.allergen_code)
            from public.ingredient_allergens a where a.ingredient_id = i.id), '{}') as allergens
       from public.ingredients i
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       left join public.ingredient_price_sources s on s.ingredient_id = i.id
       where i.slug in ('sauce-teriyaki', 'tomate-sechee') order by i.slug`,
    );
    expect(rows).toEqual([
      {
        slug: "sauce-teriyaki",
        default_dimension: "volume",
        density_g_per_ml: "1.217",
        ciqual_code: 11301,
        kind: "none",
        allergens: ["gluten", "soy"],
      },
      {
        slug: "tomate-sechee",
        default_dimension: "mass",
        density_g_per_ml: null,
        ciqual_code: null,
        kind: "none",
        allergens: [],
      },
    ]);
  });

  it("les noms des produits mènent au bon ingrédient", async () => {
    for (const [alias, slug] of [
      ["Sauce teriyaki", "sauce-teriyaki"],
      ["Teriyaki", "sauce-teriyaki"],
      ["Tomates séchées", "tomate-sechee"],
      ["Tomates séchées à l'huile", "tomate-sechee"],
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

describe("formats standards des produits", () => {
  it("26 produits, dont le lait de coco en boîte de 40 cl à finir en 3 jours", async () => {
    const { rows } = await pool.query(
      `select i.slug, p.quantity_base, p.label, p.opened_keep_days
       from public.ingredient_packages p join public.ingredients i on i.id = p.ingredient_id`,
    );
    expect(rows).toHaveLength(26);
    expect(rows.find((r) => r.slug === "lait-coco")).toEqual({
      slug: "lait-coco",
      quantity_base: "400.000",
      label: "boîte de 40 cl",
      opened_keep_days: 3,
    });
    // Herbes fraîches : sans format ni durée.
    expect(rows.find((r) => r.slug === "persil")).toMatchObject({
      quantity_base: null,
      label: null,
      opened_keep_days: null,
    });
  });

  it("chaque format est exprimé dans l'unité de l'ingrédient (pas de conversion)", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.default_dimension from public.ingredient_packages p
       join public.ingredients i on i.id = p.ingredient_id where p.quantity_base is not null`,
    );
    const expected: Record<string, string> = {
      "lait-coco": "volume",
      "creme-liquide": "volume",
      lait: "volume",
      mozzarella: "count",
      jambon: "count",
    };
    for (const r of rows) {
      if (expected[r.slug]) expect(r.default_dimension, r.slug).toBe(expected[r.slug]);
    }
  });

  it("une taille sans libellé (ou l'inverse) est refusée", async () => {
    const code = await expectPgError(
      pool.query(
        `insert into public.ingredient_packages (ingredient_id, quantity_base, label, source)
         select id, 100, null, 'test' from public.ingredients where slug = 'sel'`,
      ),
    );
    expect(code).toBe("23514");
  });

  it("lisible par un utilisateur connecté, jamais modifiable par lui", async () => {
    const eve = await createUser("eve-formats");
    const seen = await asUser(
      eve,
      async (db) => (await db.query("select 1 from public.ingredient_packages")).rowCount,
    );
    expect(seen).toBe(26);
    const code = await expectPgError(
      asUser(eve, (db) => db.query("update public.ingredient_packages set opened_keep_days = 30")),
    );
    expect(code).toBe("42501");
  });
});
