import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, PG, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;

beforeAll(async () => {
  alice = await createUser("alice-placard");
  bob = await createUser("bob-placard");
});

const tick = (user: TestUser, householdId: string, slug: string) =>
  asUser(
    user,
    (db) =>
      db.query(
        `insert into public.household_staples (household_id, ingredient_id)
         select $1, id from public.ingredients where slug = $2
         on conflict do nothing`,
        [householdId, slug],
      ),
    { commit: true },
  );

const staplesOf = async (householdId: string) =>
  (
    await pool.query(
      `select i.slug from public.household_staples s join public.ingredients i on i.id = s.ingredient_id
       where s.household_id = $1 order by 1`,
      [householdId],
    )
  ).rows.map((r) => r.slug);

describe("placard du foyer", () => {
  it("les épices, condiments et produits de base sont cochables, pas les produits frais", async () => {
    const { rows } = await pool.query(
      `select slug from public.ingredients where is_staple and slug in
         ('cumin', 'ciboulette', 'sel', 'huile-olive', 'moutarde', 'beurre', 'creme-fraiche', 'pates')
       order by 1`,
    );
    expect(rows.map((r) => r.slug)).toEqual([
      "ciboulette",
      "cumin",
      "huile-olive",
      "moutarde",
      "sel",
    ]);
  });

  it("un membre coche ses épices ; cocher deux fois ne crée pas de doublon", async () => {
    await tick(alice, alice.householdId, "cumin");
    await tick(alice, alice.householdId, "cumin");
    await tick(alice, alice.householdId, "ciboulette");
    expect(await staplesOf(alice.householdId)).toEqual(["ciboulette", "cumin"]);
  });

  it("un produit à quantité (beurre) est refusé", async () => {
    const code = await expectPgError(tick(alice, alice.householdId, "beurre"));
    expect(code).toBe("AP422");
  });

  it("un autre foyer ne voit ni ne modifie le placard", async () => {
    const code = await expectPgError(tick(bob, alice.householdId, "thym"));
    expect(code).toBe(PG.insufficientPrivilege);
    const removed = await asUser(
      bob,
      async (db) =>
        (
          await db.query("delete from public.household_staples where household_id = $1", [
            alice.householdId,
          ])
        ).rowCount,
      { commit: true },
    );
    expect(removed).toBe(0);
    expect(await staplesOf(alice.householdId)).toEqual(["ciboulette", "cumin"]);
  });
});
