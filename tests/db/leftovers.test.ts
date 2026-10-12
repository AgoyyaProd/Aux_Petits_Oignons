import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let lea: TestUser;
const WEEK = "2026-10-12";
let recipeId: string;

beforeAll(async () => {
  lea = await createUser("lea-restes");
  recipeId = (await pool.query("select id from public.recipes where slug = 'ratatouille'")).rows[0]
    .id;
});

const save = (entries: unknown[], version: number | null) =>
  asUser(
    lea,
    async (db) =>
      (
        await db.query("select * from public.meal_plan_save($1, $2, 2, 2, null, 0, $3, $4, $5)", [
          lea.householdId,
          WEEK,
          JSON.stringify(entries),
          version,
          randomUUID(),
        ])
      ).rows[0],
    { commit: true },
  );

describe("restes (cuisiner double)", () => {
  it("refuse un reste sans plat cuisiné de la même recette", async () => {
    expect(
      await expectPgError(save([{ recipe_id: recipeId, servings: 2, leftover: true }], null)),
    ).toBe("AP422");
  });

  it("refuse une valeur de reste qui n'est pas un booléen", async () => {
    expect(
      await expectPgError(save([{ recipe_id: recipeId, servings: 2, leftover: "oui" }], null)),
    ).toBe("AP422");
  });

  it("enregistre le plat doublé et son reste", async () => {
    const row = await save(
      [
        { recipe_id: recipeId, servings: 4, locked: true, planned_on: WEEK, slot: "dinner" },
        {
          recipe_id: recipeId,
          servings: 2,
          locked: true,
          leftover: true,
          planned_on: "2026-10-13",
          slot: "lunch",
        },
      ],
      null,
    );
    expect(row.plan_version).toBe(1);
    const { rows } = await pool.query(
      `select servings, leftover from public.meal_plan_entries
       where household_id = $1 order by position`,
      [lea.householdId],
    );
    expect(rows).toEqual([
      { servings: 4, leftover: false },
      { servings: 2, leftover: true },
    ]);
  });

  it("le reste ne se cuisine pas : un seul « cuisiné » possible pour la recette", async () => {
    await asUser(
      lea,
      (db) =>
        db.query("select public.shopping_finish($1, $2, '[]', $3)", [
          lea.householdId,
          WEEK,
          randomUUID(),
        ]),
      { commit: true },
    );
    const cook = () =>
      asUser(
        lea,
        (db) =>
          db.query("select public.meal_cook($1, $2, $3, 4, '[]', '[]', $4)", [
            lea.householdId,
            WEEK,
            recipeId,
            randomUUID(),
          ]),
        { commit: true },
      );
    await cook();
    expect(await expectPgError(cook())).toBe("AP409");
  });
});
