import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, type TestUser } from "./helpers";

let owner: TestUser;
let householdId: string;

beforeAll(async () => {
  owner = await createUser("rayons-proprio");
  householdId = owner.householdId;
});

describe("ordre des rayons du foyer", () => {
  it("le propriétaire enregistre un ordre valide", async () => {
    const { rowCount } = await asUser(owner, (db) =>
      db.query("update public.households set aisle_order = $1 where id = $2", [
        ["oeufs_laitiers", "fruits", "legumes"],
        householdId,
      ]),
    );
    expect(rowCount).toBe(1);
  });

  it("refuse une catégorie inconnue ou un doublon", async () => {
    expect(
      await expectPgError(
        asUser(owner, (db) =>
          db.query("update public.households set aisle_order = $1 where id = $2", [
            ["fruits", "lessive"],
            householdId,
          ]),
        ),
      ),
    ).toBe("23514");
    expect(
      await expectPgError(
        asUser(owner, (db) =>
          db.query("update public.households set aisle_order = $1 where id = $2", [
            ["fruits", "fruits"],
            householdId,
          ]),
        ),
      ),
    ).toBe("23514");
  });
});
