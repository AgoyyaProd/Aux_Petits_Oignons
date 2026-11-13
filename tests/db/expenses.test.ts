import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

/** Dépenses réelles du foyer (0084). */
let ana: TestUser;
let bob: TestUser;
const WEEK = "2026-11-09";

beforeAll(async () => {
  ana = await createUser("ana-depenses");
  bob = await createUser("bob-depenses");
});

const insert = (user: TestUser, householdId: string, values: Record<string, unknown> = {}) => {
  const row = {
    household_id: householdId,
    idempotency_key: crypto.randomUUID(),
    week_start: WEEK,
    spent_on: "2026-11-10",
    amount_cents: 4000,
    source: "manuel",
    ...values,
  };
  const cols = Object.keys(row);
  return asUser(
    user,
    (db) =>
      db.query<{ id: string }>(
        `insert into public.household_expenses (${cols.join(", ")})
         values (${cols.map((_, i) => `$${i + 1}`).join(", ")}) returning id`,
        Object.values(row),
      ),
    { commit: true },
  );
};

describe("dépenses réelles", () => {
  it("un membre enregistre une dépense, rattachée à lui", async () => {
    const r = await insert(ana, ana.householdId, {
      store_label: "Leclerc",
      non_food_cents: 350,
      estimated_store_cents: 3300,
      estimated_meals_cents: 2489,
      source: "courses",
    });
    const { rows } = await pool.query(
      "select amount_cents, non_food_cents, created_by from public.household_expenses where id = $1",
      [r.rows[0]!.id],
    );
    expect(rows[0]).toMatchObject({ amount_cents: 4000, non_food_cents: 350, created_by: ana.id });
  });

  it("une même clé n'enregistre qu'une dépense", async () => {
    const key = crypto.randomUUID();
    await insert(ana, ana.householdId, { idempotency_key: key });
    expect(await expectPgError(insert(ana, ana.householdId, { idempotency_key: key }))).toBe(
      "23505",
    );
  });

  it("refuse les montants incohérents", async () => {
    for (const bad of [
      { amount_cents: 0 },
      { non_food_cents: 5000 },
      { estimated_meals_cents: 100 },
      { estimated_store_cents: 100, estimated_meals_cents: 200 },
      { week_start: "2026-11-10" },
      { spent_on: "2025-01-01" },
      { source: "ia" },
    ]) {
      expect(await expectPgError(insert(ana, ana.householdId, bad))).toBe("23514");
    }
  });

  it("un membre corrige le montant, pas l'estimation figée ni le foyer", async () => {
    const r = await insert(ana, ana.householdId, { estimated_store_cents: 3000 });
    const id = r.rows[0]!.id;
    await asUser(
      ana,
      (db) =>
        db.query("update public.household_expenses set amount_cents = 4200 where id = $1", [id]),
      { commit: true },
    );
    const { rows } = await pool.query(
      "select amount_cents from public.household_expenses where id = $1",
      [id],
    );
    expect(rows[0]!.amount_cents).toBe(4200);
    for (const sql of [
      "update public.household_expenses set estimated_store_cents = 1 where id = $1",
      "update public.household_expenses set household_id = gen_random_uuid() where id = $1",
    ]) {
      expect(await asUser(ana, (db) => expectPgError(db.query(sql, [id])))).toBe("42501");
    }
  });

  it("un autre foyer ne voit, ne modifie ni ne supprime rien", async () => {
    const r = await insert(ana, ana.householdId);
    const id = r.rows[0]!.id;
    const seen = await asUser(bob, async (db) => {
      const s = await db.query("select 1 from public.household_expenses where id = $1", [id]);
      const u = await db.query(
        "update public.household_expenses set amount_cents = 1 where id = $1",
        [id],
      );
      const d = await db.query("delete from public.household_expenses where id = $1", [id]);
      return [s.rowCount, u.rowCount, d.rowCount];
    });
    expect(seen).toEqual([0, 0, 0]);
    expect(await expectPgError(insert(bob, ana.householdId))).toBe("42501");
  });

  it("un membre supprime une dépense ; un visiteur n'a aucun accès", async () => {
    const r = await insert(ana, ana.householdId);
    const id = r.rows[0]!.id;
    const n = await asUser(
      ana,
      async (db) =>
        (await db.query("delete from public.household_expenses where id = $1", [id])).rowCount,
      { commit: true },
    );
    expect(n).toBe(1);
    expect(
      await asUser(null, (db) =>
        expectPgError(db.query("select 1 from public.household_expenses")),
      ),
    ).toBe("42501");
  });
});
