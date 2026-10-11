import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let carol: TestUser;
let ratatouille: string;
const WEEK = "2026-10-19"; // un lundi

beforeAll(async () => {
  carol = await createUser("carol-jours");
  const { rows } = await pool.query("select id from public.recipes where slug = 'ratatouille'");
  ratatouille = rows[0].id;
});

type Entry = { recipe_id: string; servings: number; planned_on?: string; slot?: string };

const save = (entries: Entry[], expectedVersion: number | null) =>
  asUser(
    carol,
    async (db) =>
      (
        await db.query("select * from public.meal_plan_save($1, $2, 2, 1, null, 0, $3, $4, $5)", [
          carol.householdId,
          WEEK,
          JSON.stringify(entries),
          expectedVersion,
          randomUUID(),
        ])
      ).rows[0] as { plan_id: string; plan_version: number },
    { commit: true },
  );

describe("plats placés jour par jour", () => {
  let version = 0;

  it("enregistre le jour et le repas de chaque plat", async () => {
    const { plan_id, plan_version } = await save(
      [
        { recipe_id: ratatouille, servings: 2, planned_on: "2026-10-21", slot: "dinner" },
        { recipe_id: ratatouille, servings: 2 },
      ],
      null,
    );
    version = plan_version;
    const { rows } = await pool.query(
      "select position, to_char(planned_on, 'YYYY-MM-DD') as day, meal_slot from public.meal_plan_entries where plan_id = $1 order by position",
      [plan_id],
    );
    expect(rows).toEqual([
      { position: 1, day: "2026-10-21", meal_slot: "dinner" },
      { position: 2, day: null, meal_slot: null },
    ]);
  });

  it("refuse un jour hors de la semaine du menu", async () => {
    const code = await expectPgError(
      save(
        [{ recipe_id: ratatouille, servings: 2, planned_on: "2026-10-26", slot: "lunch" }],
        version,
      ),
    );
    expect(code).toBe("AP422");
  });

  it("refuse un repas inconnu ou un jour sans repas", async () => {
    for (const entry of [
      { recipe_id: ratatouille, servings: 2, planned_on: "2026-10-20", slot: "brunch" },
      { recipe_id: ratatouille, servings: 2, planned_on: "2026-10-20" },
      { recipe_id: ratatouille, servings: 2, slot: "lunch" },
      { recipe_id: ratatouille, servings: 2, planned_on: "20/10/2026", slot: "lunch" },
    ]) {
      expect(await expectPgError(save([entry], version))).toBe("AP422");
    }
  });

  it("la contrainte de table exige jour et repas ensemble", async () => {
    const code = await expectPgError(
      pool.query(
        "update public.meal_plan_entries set meal_slot = null where planned_on is not null",
      ),
    );
    expect(code).toBe("23514");
  });
});
