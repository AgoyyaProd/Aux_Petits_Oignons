import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let carla: TestUser;
let dan: TestUser;
let recipeId: string;
let lotId: string;

beforeAll(async () => {
  carla = await createUser("carla-hors-menu");
  dan = await createUser("dan-hors-menu");
  recipeId = (await pool.query("select id from public.recipes where slug = 'ratatouille'")).rows[0]
    .id;
  const rizId = (await pool.query("select id from public.ingredients where slug = 'riz'")).rows[0]
    .id;
  const r = await asUser(
    carla,
    async (db) =>
      (
        await db.query(
          "select public.pantry_add_item($1, $2, 'pantry', 1, 'kg', null, null, false, $3) as r",
          [carla.householdId, rizId, randomUUID()],
        )
      ).rows[0].r,
    { commit: true },
  );
  lotId = r.item_id;
});

const cook = (
  user: TestUser,
  consumptions: unknown[],
  { key = randomUUID(), servings = 3, household = carla.householdId } = {},
) =>
  asUser(
    user,
    async (db) =>
      (
        await db.query("select public.recipe_cook_off_menu($1, $2, $3, $4, '[]', $5) as r", [
          household,
          recipeId,
          servings,
          JSON.stringify(consumptions),
          key,
        ])
      ).rows[0].r,
    { commit: true },
  );

const lot = async () =>
  (
    await pool.query(
      "select quantity_base, version, status from public.pantry_items where id = $1",
      [lotId],
    )
  ).rows[0];

describe("cuisiner une recette hors menu", () => {
  it("retire du stock sans menu ni courses ; rejouer ne retire rien de plus", async () => {
    const key = randomUUID();
    const take = [{ item_id: lotId, quantity_base: "250", expected_version: 1 }];
    const first = await cook(carla, take, { key });
    const replay = await cook(carla, take, { key });
    expect(first).toMatchObject({ consumed: 1, replayed: false });
    expect(replay).toMatchObject({ consumed: 1, replayed: true, cooking_id: first.cooking_id });
    expect(await lot()).toMatchObject({ quantity_base: "750.000", version: 2, status: "active" });

    const { rows } = await pool.query(
      `select m.kind, m.delta_base, m.note from public.stock_movements m
       where m.pantry_item_id = $1 and m.kind = 'cooking'`,
      [lotId],
    );
    expect(rows).toEqual([
      { kind: "cooking", delta_base: "-250.000", note: "Plat cuisiné hors menu" },
    ]);
    const journal = await pool.query(
      "select plan_id, servings from public.meal_cookings where id = $1",
      [first.cooking_id],
    );
    expect(journal.rows).toEqual([{ plan_id: null, servings: 3 }]);
  });

  it("peut se refaire : chaque cuisson est une opération distincte", async () => {
    await cook(carla, [{ item_id: lotId, quantity_base: "100", expected_version: 2 }]);
    expect(await lot()).toMatchObject({ quantity_base: "650.000", version: 3 });
  });

  it("une version périmée est refusée sans rien retirer", async () => {
    const code = await expectPgError(
      cook(carla, [{ item_id: lotId, quantity_base: "100", expected_version: 1 }]),
    );
    expect(code).toBe("AP409");
    expect(await lot()).toMatchObject({ quantity_base: "650.000", version: 3 });
  });

  it("refuse un nombre de portions hors limites", async () => {
    expect(await expectPgError(cook(carla, [], { servings: 0 }))).toBe("AP422");
    expect(await expectPgError(cook(carla, [], { servings: 41 }))).toBe("AP422");
  });

  it("un autre foyer ne peut ni cuisiner pour lui ni toucher à son stock", async () => {
    expect(await expectPgError(cook(dan, []))).toBe("AP404");
    expect(
      await expectPgError(
        cook(dan, [{ item_id: lotId, quantity_base: "1", expected_version: 3 }], {
          household: dan.householdId,
        }),
      ),
    ).toBe("AP404");
    expect(await lot()).toMatchObject({ quantity_base: "650.000", version: 3 });
  });

  it("le journal reste lisible par le seul foyer", async () => {
    const seen = await asUser(
      dan,
      async (db) => (await db.query("select 1 from public.meal_cookings")).rowCount,
    );
    expect(seen).toBe(0);
  });
});
