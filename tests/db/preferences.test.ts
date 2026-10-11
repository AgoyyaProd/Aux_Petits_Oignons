import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, PG, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;

beforeAll(async () => {
  alice = await createUser("alice-prefs");
  bob = await createUser("bob-prefs");
});

const save = (user: TestUser, householdId: string, diets: string[], allergens: string[]) =>
  asUser(
    user,
    (db) =>
      db.query("select public.set_household_preferences($1, $2, $3)", [
        householdId,
        diets,
        allergens,
      ]),
    { commit: true },
  );

const prefsOf = async (householdId: string) => {
  const { rows } = await pool.query(
    `select
       (select coalesce(array_agg(diet_code order by diet_code), '{}') from public.household_diets where household_id = $1) as diets,
       (select coalesce(array_agg(allergen_code order by allergen_code), '{}') from public.household_exclusions where household_id = $1 and allergen_code is not null) as allergens`,
    [householdId],
  );
  return rows[0];
};

describe("préférences du foyer", () => {
  it("enregistre puis remplace l'ensemble des régimes et allergies", async () => {
    await save(alice, alice.householdId, ["vegetarian"], ["peanuts", "milk"]);
    expect(await prefsOf(alice.householdId)).toEqual({
      diets: ["vegetarian"],
      allergens: ["milk", "peanuts"],
    });
    await save(alice, alice.householdId, [], ["gluten", "gluten"]);
    expect(await prefsOf(alice.householdId)).toEqual({ diets: [], allergens: ["gluten"] });
  });

  it("refuse un code inconnu sans rien modifier (transaction annulée)", async () => {
    await save(alice, alice.householdId, ["vegan"], ["soy"]);
    const code = await expectPgError(save(alice, alice.householdId, ["vegan"], ["licorne"]));
    expect(code).toBe("23503");
    expect(await prefsOf(alice.householdId)).toEqual({ diets: ["vegan"], allergens: ["soy"] });
  });

  it("B ne peut ni lire ni modifier les préférences de A", async () => {
    await save(alice, alice.householdId, ["vegan"], ["soy"]);
    const code = await expectPgError(save(bob, alice.householdId, [], []));
    expect(code).toBe(PG.insufficientPrivilege);
    const seen = await asUser(bob, async (db) => ({
      diets: (
        await db.query("select 1 from public.household_diets where household_id = $1", [
          alice.householdId,
        ])
      ).rowCount,
      exclusions: (
        await db.query("select 1 from public.household_exclusions where household_id = $1", [
          alice.householdId,
        ])
      ).rowCount,
    }));
    expect(seen).toEqual({ diets: 0, exclusions: 0 });
  });

  it("un allergène ne peut pas être enregistré comme simple dégoût", async () => {
    const code = await expectPgError(
      pool.query(
        "insert into public.household_exclusions (household_id, allergen_code, is_allergy) values ($1, 'eggs', false)",
        [alice.householdId],
      ),
    );
    expect(code).toBe("23514");
  });

  it("un dégoût porte sur un ingrédient précis", async () => {
    await asUser(
      alice,
      (db) =>
        db.query(
          "insert into public.household_exclusions (household_id, ingredient_id, is_allergy) select $1, id, false from public.ingredients where slug = 'fenouil'",
          [alice.householdId],
        ),
      { commit: true },
    );
    const { rows } = await pool.query(
      "select count(*)::int as n from public.household_exclusions where household_id = $1 and ingredient_id is not null",
      [alice.householdId],
    );
    expect(rows[0].n).toBe(1);
  });
});
