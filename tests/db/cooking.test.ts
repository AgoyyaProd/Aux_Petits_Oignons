import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;
const WEEK = "2026-10-12";
let recipeId: string;
let rizId: string;
let lotId: string;

beforeAll(async () => {
  alice = await createUser("alice-cuisine");
  bob = await createUser("bob-cuisine");
  recipeId = (await pool.query("select id from public.recipes where slug = 'ratatouille'")).rows[0]
    .id;
  rizId = (await pool.query("select id from public.ingredients where slug = 'riz'")).rows[0].id;
  await asUser(
    alice,
    (db) =>
      db.query("select * from public.meal_plan_save($1, $2, 2, 1, null, 0, $3, null, $4)", [
        alice.householdId,
        WEEK,
        JSON.stringify([{ recipe_id: recipeId, servings: 2 }]),
        randomUUID(),
      ]),
    { commit: true },
  );
  const r = await asUser(
    alice,
    async (db) =>
      (
        await db.query(
          "select public.pantry_add_item($1, $2, 'pantry', 1, 'kg', null, null, false, $3) as r",
          [alice.householdId, rizId, randomUUID()],
        )
      ).rows[0].r,
    { commit: true },
  );
  lotId = r.item_id;
});

const cook = (user: TestUser, consumptions: unknown[], key = randomUUID()) =>
  asUser(
    user,
    async (db) =>
      (
        await db.query("select public.meal_cook($1, $2, $3, 2, $4, '[]', $5) as r", [
          alice.householdId,
          WEEK,
          recipeId,
          JSON.stringify(consumptions),
          key,
        ])
      ).rows[0].r,
    { commit: true },
  );

const finish = (user: TestUser, items: unknown[] = []) =>
  asUser(
    user,
    async (db) =>
      (
        await db.query("select public.shopping_finish($1, $2, $3, $4) as r", [
          alice.householdId,
          WEEK,
          JSON.stringify(items),
          randomUUID(),
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

describe("finir les courses puis cuisiner", () => {
  it("impossible de cuisiner avant d'avoir fini les courses", async () => {
    const code = await expectPgError(
      cook(alice, [{ item_id: lotId, quantity_base: "100", expected_version: 1 }]),
    );
    expect(code).toBe("AP409");
    expect(await lot()).toMatchObject({ quantity_base: "1000.000", version: 1 });
  });

  it("finir les courses marque la semaine, et peut ranger des achats en même temps", async () => {
    const r = await finish(alice, [
      {
        ingredient_id: rizId,
        quantity: "500",
        unit: "g",
        location: "pantry",
        expires_on: null,
        expiry_kind: null,
      },
    ]);
    expect(r.shopping_done_at).toBeTruthy();
    expect(r.put_away).toMatchObject({ count: 1 });
    const again = await finish(alice);
    expect(again.shopping_done_at).toBe(r.shopping_done_at);
  });

  it("un autre foyer ne peut pas finir les courses à sa place", async () => {
    expect(await expectPgError(finish(bob))).toBe("AP404");
  });

  it("une version périmée est refusée sans rien retirer", async () => {
    const code = await expectPgError(
      cook(alice, [{ item_id: lotId, quantity_base: "100", expected_version: 7 }]),
    );
    expect(code).toBe("AP409");
    expect(await lot()).toMatchObject({ quantity_base: "1000.000", version: 1 });
  });

  it("cuisiner retire du stock (mouvement « cooking ») ; rejouer ne retire rien de plus", async () => {
    const key = randomUUID();
    const first = await cook(
      alice,
      [{ item_id: lotId, quantity_base: "300", expected_version: 1 }],
      key,
    );
    const replay = await cook(
      alice,
      [{ item_id: lotId, quantity_base: "300", expected_version: 1 }],
      key,
    );
    expect(first).toMatchObject({ consumed: 1, replayed: false });
    expect(replay).toMatchObject({ consumed: 1, replayed: true, cooking_id: first.cooking_id });
    expect(await lot()).toMatchObject({ quantity_base: "700.000", version: 2, status: "active" });
    const { rows } = await pool.query(
      "select delta_base, quantity_after_base from public.stock_movements where pantry_item_id = $1 and kind = 'cooking'",
      [lotId],
    );
    expect(rows).toEqual([{ delta_base: "-300.000", quantity_after_base: "700.000" }]);
  });

  it("un plat prévu une fois ne peut pas être cuisiné deux fois", async () => {
    const code = await expectPgError(cook(alice, []));
    expect(code).toBe("AP409");
  });

  it("le journal des plats cuisinés n'est lisible que par le foyer", async () => {
    const seen = await asUser(
      bob,
      async (db) => (await db.query("select 1 from public.meal_cookings")).rowCount,
    );
    expect(seen).toBe(0);
    const mine = await asUser(
      alice,
      async (db) => (await db.query("select 1 from public.meal_cookings")).rowCount,
    );
    expect(mine).toBe(1);
  });
});
