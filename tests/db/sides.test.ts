import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

/** « À côté » : recettes ajoutées en plus des repas de la semaine (0086). */
let lea: TestUser;
let max: TestUser;
let briocheId: string;
let lotId: string;
const WEEK = "2026-11-16";

beforeAll(async () => {
  lea = await createUser("lea-a-cote");
  max = await createUser("max-a-cote");
  briocheId = (await pool.query("select id from public.recipes where slug = 'brioche-maison'"))
    .rows[0].id;
  const farineId = (
    await pool.query(
      `select ri.ingredient_id from public.recipe_ingredients ri
       join public.ingredients i on i.id = ri.ingredient_id
       where ri.recipe_id = $1 and ri.dimension = 'mass' order by ri.quantity_base desc limit 1`,
      [briocheId],
    )
  ).rows[0].ingredient_id;
  const r = await asUser(
    lea,
    async (db) =>
      (
        await db.query(
          "select public.pantry_add_item($1, $2, 'pantry', 1, 'kg', null, null, false, $3) as r",
          [lea.householdId, farineId, randomUUID()],
        )
      ).rows[0].r,
    { commit: true },
  );
  lotId = r.item_id;
});

const add = (user: TestUser, values: Record<string, unknown> = {}) => {
  const row = {
    household_id: lea.householdId,
    week_start: WEEK,
    recipe_id: briocheId,
    servings: 8,
    idempotency_key: randomUUID(),
    ...values,
  };
  const cols = Object.keys(row);
  return asUser(
    user,
    async (db) =>
      (
        await db.query<{ id: string }>(
          `insert into public.meal_plan_sides (${cols.join(", ")})
           values (${cols.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
          Object.values(row),
        )
      ).rows[0]!.id,
    { commit: true },
  );
};

const cook = (
  user: TestUser,
  sideId: string,
  consumptions: unknown[],
  { key = randomUUID(), household = lea.householdId } = {},
) =>
  asUser(
    user,
    async (db) =>
      (
        await db.query("select public.meal_side_cook($1, $2, $3, '[]', $4) as r", [
          household,
          sideId,
          JSON.stringify(consumptions),
          key,
        ])
      ).rows[0].r,
    { commit: true },
  );

const side = async (id: string) =>
  (await pool.query("select servings, cooking_id from public.meal_plan_sides where id = $1", [id]))
    .rows[0];

describe("à côté de la semaine", () => {
  it("un membre ajoute une recette à une semaine, même sans menu", async () => {
    const id = await add(lea);
    expect(await side(id)).toEqual({ servings: 8, cooking_id: null });
  });

  it("une même clé n'ajoute qu'une fois", async () => {
    const key = randomUUID();
    await add(lea, { idempotency_key: key });
    expect(await expectPgError(add(lea, { idempotency_key: key }))).toBe("23505");
  });

  it("refuse une semaine qui ne commence pas un lundi et des parts hors limites", async () => {
    expect(await expectPgError(add(lea, { week_start: "2026-11-17" }))).toBe("23514");
    expect(await expectPgError(add(lea, { servings: 0 }))).toBe("23514");
    expect(await expectPgError(add(lea, { servings: 41 }))).toBe("23514");
  });

  it("un autre foyer ne peut ni ajouter chez lui, ni voir, ni modifier ses lignes", async () => {
    expect(await expectPgError(add(max))).toBe("42501");
    const id = await add(lea);
    const seen = await asUser(
      max,
      async (db) => (await db.query("select 1 from public.meal_plan_sides")).rowCount,
    );
    expect(seen).toBe(0);
    await asUser(
      max,
      (db) => db.query("update public.meal_plan_sides set servings = 2 where id = $1", [id]),
      { commit: true },
    );
    await asUser(max, (db) => db.query("delete from public.meal_plan_sides where id = $1", [id]), {
      commit: true,
    });
    expect(await side(id)).toEqual({ servings: 8, cooking_id: null });
  });

  it("seul le nombre de parts se corrige", async () => {
    const id = await add(lea);
    await asUser(
      lea,
      (db) => db.query("update public.meal_plan_sides set servings = 4 where id = $1", [id]),
      { commit: true },
    );
    expect((await side(id)).servings).toBe(4);
    expect(
      await expectPgError(
        asUser(lea, (db) =>
          db.query("update public.meal_plan_sides set week_start = '2026-11-23' where id = $1", [
            id,
          ]),
        ),
      ),
    ).toBe("42501");
  });

  it("cuisiner retire du stock et note la cuisson ; rejouer ne retire rien de plus", async () => {
    const id = await add(lea);
    const key = randomUUID();
    const take = [{ item_id: lotId, quantity_base: "500", expected_version: 1 }];
    const first = await cook(lea, id, take, { key });
    const replay = await cook(lea, id, take, { key });
    expect(first).toMatchObject({ consumed: 1, replayed: false });
    expect(replay).toMatchObject({ consumed: 1, replayed: true, cooking_id: first.cooking_id });
    expect(await side(id)).toEqual({ servings: 8, cooking_id: first.cooking_id });
    const lot = await pool.query(
      "select quantity_base, version from public.pantry_items where id = $1",
      [lotId],
    );
    expect(lot.rows[0]).toEqual({ quantity_base: "500.000", version: 2 });

    // Déjà cuisinée : une nouvelle cuisson est refusée et ne retire rien.
    expect(
      await expectPgError(
        cook(lea, id, [{ item_id: lotId, quantity_base: "100", expected_version: 2 }]),
      ),
    ).toBe("AP409");
    const after = await pool.query("select version from public.pantry_items where id = $1", [
      lotId,
    ]);
    expect(after.rows[0].version).toBe(2);

    // Ni modifiable une fois cuisinée, mais supprimable sans toucher au journal.
    await asUser(
      lea,
      (db) => db.query("update public.meal_plan_sides set servings = 2 where id = $1", [id]),
      { commit: true },
    );
    expect((await side(id)).servings).toBe(8);
    await asUser(lea, (db) => db.query("delete from public.meal_plan_sides where id = $1", [id]), {
      commit: true,
    });
    const journal = await pool.query("select 1 from public.meal_cookings where id = $1", [
      first.cooking_id,
    ]);
    expect(journal.rowCount).toBe(1);
  });

  it("un autre foyer ne peut pas cuisiner la ligne", async () => {
    const id = await add(lea);
    expect(await expectPgError(cook(max, id, []))).toBe("AP404");
    expect(await expectPgError(cook(max, id, [], { household: max.householdId }))).toBe("AP404");
    expect((await side(id)).cooking_id).toBeNull();
  });
});
