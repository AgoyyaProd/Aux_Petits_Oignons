import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let dan: TestUser;
let eve: TestUser;
let recipeId: string;

beforeAll(async () => {
  dan = await createUser("dan-avis");
  eve = await createUser("eve-avis");
  const { rows } = await pool.query("select id from public.recipes where slug = 'ratatouille'");
  recipeId = rows[0].id;
});

const upsert = (user: TestUser, householdId: string, rating: number) =>
  asUser(
    user,
    (db) =>
      db.query(
        `insert into public.recipe_ratings (household_id, recipe_id, rating) values ($1, $2, $3)
         on conflict (household_id, recipe_id) do update
           set household_id = excluded.household_id, recipe_id = excluded.recipe_id,
               rating = excluded.rating`,
        [householdId, recipeId, rating],
      ),
    { commit: true },
  );

describe("avis du foyer sur les recettes", () => {
  it("un membre note une recette ; l'auteur est posé par la base", async () => {
    await upsert(dan, dan.householdId, 1);
    await upsert(dan, dan.householdId, -1);
    const { rows } = await pool.query(
      "select rating, rated_by from public.recipe_ratings where household_id = $1",
      [dan.householdId],
    );
    expect(rows).toEqual([{ rating: -1, rated_by: dan.id }]);
  });

  it("refuse une note autre que 1 ou -1", async () => {
    expect(await expectPgError(upsert(dan, dan.householdId, 5))).toBe("23514");
  });

  it("un autre foyer ne voit ni ne modifie ces avis", async () => {
    const seen = await asUser(eve, (db) =>
      db.query("select * from public.recipe_ratings where household_id = $1", [dan.householdId]),
    );
    expect(seen.rows).toHaveLength(0);
    expect(await expectPgError(upsert(eve, dan.householdId, 1))).toBe("42501");
    const deleted = await asUser(
      eve,
      (db) =>
        db.query("delete from public.recipe_ratings where household_id = $1", [dan.householdId]),
      { commit: true },
    );
    expect(deleted.rowCount).toBe(0);
  });

  it("retirer son avis supprime la ligne", async () => {
    await asUser(
      dan,
      (db) =>
        db.query("delete from public.recipe_ratings where household_id = $1 and recipe_id = $2", [
          dan.householdId,
          recipeId,
        ]),
      { commit: true },
    );
    const { rowCount } = await pool.query(
      "select 1 from public.recipe_ratings where household_id = $1",
      [dan.householdId],
    );
    expect(rowCount).toBe(0);
  });

  it("anon n'a aucun accès", async () => {
    expect(
      await expectPgError(asUser(null, (db) => db.query("select * from public.recipe_ratings"))),
    ).toBe("42501");
  });
});
