import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let zoe: TestUser;

beforeAll(async () => {
  zoe = await createUser("zoe-nutrition");
});

describe("valeurs nutritionnelles (Ciqual)", () => {
  it("relie tous les ingrédients sauf ceux sans correspondance honnête", async () => {
    const { rows } = await pool.query<{ slug: string }>(
      `select i.slug from public.ingredients i
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where n.ingredient_id is null order by 1`,
    );
    expect(rows.map((r) => r.slug)).toEqual(["ciboulette", "moule", "pate-curry", "poulet-entier"]);
  });

  it("garde les valeurs Ciqual sans les deviner", async () => {
    const { rows } = await pool.query(
      `select i.slug, n.ciqual_code, n.kcal::float as kcal, n.salt_g::float as salt
       from public.ingredient_nutrition n join public.ingredients i on i.id = n.ingredient_id
       where i.slug in ('riz', 'ricotta', 'sel') order by 1`,
    );
    expect(rows).toEqual([
      { slug: "ricotta", ciqual_code: 19585, kcal: null, salt: 0.27 },
      { slug: "riz", ciqual_code: 9100, kcal: 350, salt: 0.008 },
      { slug: "sel", ciqual_code: 11017, kcal: 0, salt: 97.8 },
    ]);
  });

  it("lecture seule pour les utilisateurs connectés", async () => {
    const { rows } = await asUser(zoe, (db) =>
      db.query("select count(*)::int as n from public.ingredient_nutrition"),
    );
    expect(rows[0].n).toBeGreaterThan(150);
    expect(
      await expectPgError(
        asUser(zoe, (db) => db.query("update public.ingredient_nutrition set kcal = 0")),
      ),
    ).toBe("42501");
  });
});
