import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;

beforeAll(async () => {
  alice = await createUser("alice-proteines");
  bob = await createUser("bob-proteines");
});

const setTarget = (user: TestUser, grams: number | null) =>
  asUser(user, (db) =>
    db.query("select public.set_protein_target($1, $2::smallint)", [alice.householdId, grams]),
  );

describe("objectif de protéines du foyer", () => {
  it("un membre l'enregistre, le modifie et le retire", async () => {
    await setTarget(alice, 30);
    const read = async () =>
      (
        await pool.query(
          "select protein_target_g from public.household_food_profile where household_id = $1",
          [alice.householdId],
        )
      ).rows[0]?.protein_target_g ?? null;
    // asUser annule la transaction par défaut : on vérifie dans une transaction validée.
    await asUser(
      alice,
      (db) => db.query("select public.set_protein_target($1, 35::smallint)", [alice.householdId]),
      { commit: true },
    );
    expect(await read()).toBe(35);
    await asUser(
      alice,
      (db) => db.query("select public.set_protein_target($1, null)", [alice.householdId]),
      { commit: true },
    );
    expect(await read()).toBeNull();
  });

  it("refuse une valeur hors bornes et un autre foyer", async () => {
    expect(await expectPgError(setTarget(alice, 200))).toBe("AP422");
    expect(await expectPgError(setTarget(bob, 30))).toBe("42501");
  });
});

describe("plats écartés avec « Changer »", () => {
  it("lus et ajoutés par les membres du foyer seulement", async () => {
    const recipe = (await pool.query("select id from public.recipes limit 1")).rows[0].id;
    await asUser(
      alice,
      (db) =>
        db.query("insert into public.recipe_skips (household_id, recipe_id) values ($1, $2)", [
          alice.householdId,
          recipe,
        ]),
      { commit: true },
    );
    const seen = await asUser(bob, (db) =>
      db.query("select 1 from public.recipe_skips where household_id = $1", [alice.householdId]),
    );
    expect(seen.rowCount).toBe(0);
    expect(
      await expectPgError(
        asUser(bob, (db) =>
          db.query("insert into public.recipe_skips (household_id, recipe_id) values ($1, $2)", [
            alice.householdId,
            recipe,
          ]),
        ),
      ),
    ).toBe("42501");
  });
});
