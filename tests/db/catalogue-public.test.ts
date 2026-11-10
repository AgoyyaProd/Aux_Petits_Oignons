import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

/** Catalogue public (0082) : un visiteur lit les recettes publiées et leur référentiel. */
describe("catalogue consultable sans compte", () => {
  let owner: TestUser;
  let draftId: string;
  let privateId: string;

  beforeAll(async () => {
    owner = await createUser("catalogue-public");
    const { rows } = await pool.query<{ id: string }>(
      `insert into public.recipes (slug, title, servings, prep_minutes, cook_minutes, status, household_id, source)
       values ('test-brouillon-public', 'Brouillon', 2, 5, 5, 'draft', null, 'curated'),
              ('test-recette-foyer', 'Recette du foyer', 2, 5, 5, 'published', $1, 'user')
       returning id`,
      [owner.householdId],
    );
    [draftId, privateId] = [rows[0]!.id, rows[1]!.id];
  });

  // Base de test partagée : les recettes de test ne doivent pas fausser les autres comptes.
  afterAll(async () => {
    await pool.query("delete from public.recipes where id = any($1)", [[draftId, privateId]]);
  });

  it("anon lit les recettes publiées du catalogue, leurs ingrédients et leurs étapes", async () => {
    const seen = await asUser(null, async (db) => {
      const recipes = await db.query<{ n: number }>(
        "select count(*)::int as n from public.recipes",
      );
      const lines = await db.query<{ n: number }>(
        "select count(*)::int as n from public.recipe_ingredients",
      );
      const steps = await db.query<{ n: number }>(
        "select count(*)::int as n from public.recipe_steps",
      );
      const allergens = await db.query<{ n: number }>(
        "select count(*)::int as n from public.recipe_allergens",
      );
      const prices = await db.query<{ n: number }>(
        "select count(*)::int as n from public.ingredient_price_sources",
      );
      return {
        recipes: recipes.rows[0]!.n,
        lines: lines.rows[0]!.n,
        steps: steps.rows[0]!.n,
        allergens: allergens.rows[0]!.n,
        prices: prices.rows[0]!.n,
      };
    });
    const { rows } = await pool.query<{ n: number }>(
      "select count(*)::int as n from public.recipes where household_id is null and status = 'published'",
    );
    expect(seen.recipes).toBe(rows[0]!.n);
    expect(seen.recipes).toBeGreaterThan(400);
    expect(seen.lines).toBeGreaterThan(0);
    expect(seen.steps).toBeGreaterThan(0);
    expect(seen.allergens).toBeGreaterThan(0);
    expect(seen.prices).toBeGreaterThan(0);
  });

  it("anon ne voit ni les brouillons ni les recettes d'un foyer", async () => {
    const ids = await asUser(null, async (db) =>
      (
        await db.query<{ id: string }>("select id from public.recipes where id = any($1)", [
          [draftId, privateId],
        ])
      ).rows.map((r) => r.id),
    );
    expect(ids).toEqual([]);
  });

  it("anon ne lit pas les colonnes réservées et n'écrit rien", async () => {
    const column = await asUser(null, (db) =>
      expectPgError(db.query("select validated_by from public.recipes limit 1")),
    );
    expect(column).toBe("42501");
    const write = await asUser(null, (db) =>
      expectPgError(db.query("update public.ingredients set name = 'piraté'")),
    );
    expect(write).toBe("42501");
    for (const table of ["receipt_prices", "household_prices", "pantry_items", "recipe_ratings"]) {
      const code = await asUser(null, (db) =>
        expectPgError(db.query(`select 1 from public.${table} limit 1`)),
      );
      expect(code, table).toBe("42501");
    }
  });
});
