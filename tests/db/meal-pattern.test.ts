import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, type TestUser } from "./helpers";

let owner: TestUser;
let other: TestUser;
let householdId: string;

beforeAll(async () => {
  owner = await createUser("semaine-proprio");
  other = await createUser("semaine-autre");
  householdId = owner.householdId;
});

const update = (user: TestUser, slots: unknown, perCook: number) =>
  asUser(user, (db) =>
    db.query("update public.households set meal_slots = $1, meals_per_cook = $2 where id = $3", [
      slots,
      perCook,
      householdId,
    ]),
  );

describe("semaine type du foyer", () => {
  it("par défaut : midi et soir tous les jours, un repas par cuisson", async () => {
    const { rows } = await asUser(owner, (db) =>
      db.query("select meal_slots, meals_per_cook from public.households where id = $1", [
        householdId,
      ]),
    );
    expect(rows[0].meal_slots).toHaveLength(14);
    expect(rows[0].meals_per_cook).toBe(1);
  });

  it("le propriétaire enregistre « le soir seulement, 2 repas par cuisson »", async () => {
    const { rowCount } = await update(owner, ["mon:dinner", "tue:dinner", "sun:dinner"], 2);
    expect(rowCount).toBe(1);
  });

  it("refuse une semaine vide, un repas inconnu, un doublon ou plus de 3 repas par cuisson", async () => {
    expect(await expectPgError(update(owner, [], 1))).toBe("23514");
    expect(await expectPgError(update(owner, ["mon:brunch"], 1))).toBe("23514");
    expect(await expectPgError(update(owner, ["mon:dinner", "mon:dinner"], 1))).toBe("23514");
    expect(await expectPgError(update(owner, ["mon:dinner"], 4))).toBe("23514");
    expect(await expectPgError(update(owner, ["mon:dinner"], 0))).toBe("23514");
  });

  it("un autre foyer ne peut pas la modifier", async () => {
    const { rowCount } = await update(other, ["mon:lunch"], 1);
    expect(rowCount).toBe(0);
  });
});
