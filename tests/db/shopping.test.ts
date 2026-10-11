import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, PG, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;
const ids: Record<string, string> = {};

beforeAll(async () => {
  alice = await createUser("alice-courses");
  bob = await createUser("bob-courses");
  const { rows } = await pool.query(
    "select slug, id from public.ingredients where slug in ('riz', 'lait', 'oignon')",
  );
  for (const r of rows) ids[r.slug] = r.id;
});

const putAway = (user: TestUser, householdId: string, items: unknown[], key = randomUUID()) =>
  asUser(
    user,
    async (db) =>
      (
        await db.query("select public.shopping_put_away($1, $2, $3) as r", [
          householdId,
          JSON.stringify(items),
          key,
        ])
      ).rows[0].r,
    { commit: true },
  );

const countItems = async (householdId: string) =>
  (
    await pool.query(
      `select count(*)::int as items,
              (select count(*)::int from public.stock_movements m where m.household_id = $1 and m.kind = 'purchase') as achats
       from public.pantry_items where household_id = $1`,
      [householdId],
    )
  ).rows[0];

describe("rangement des courses", () => {
  const items = () => [
    {
      ingredient_id: ids.riz,
      quantity: "1",
      unit: "kg",
      location: "pantry",
      expires_on: null,
      expiry_kind: null,
    },
    {
      ingredient_id: ids.lait,
      quantity: "1.5",
      unit: "l",
      location: "fridge",
      expires_on: "2026-10-30",
      expiry_kind: "use_by",
    },
    {
      ingredient_id: ids.oignon,
      quantity: "3",
      unit: "piece",
      location: "pantry",
      expires_on: null,
      expiry_kind: null,
    },
  ];

  it("range tout en une opération, avec un mouvement « purchase » par produit", async () => {
    const result = await putAway(alice, alice.householdId, items());
    expect(result).toMatchObject({ count: 3, replayed: false });
    expect(await countItems(alice.householdId)).toEqual({ items: 3, achats: 3 });
    const { rows } = await pool.query(
      "select quantity_base, dimension from public.pantry_items where household_id = $1 and ingredient_id = $2",
      [alice.householdId, ids.lait],
    );
    expect(rows[0]).toEqual({ quantity_base: "1500.000", dimension: "volume" });
  });

  it("rejouer la même clé (double clic, réseau) n'ajoute rien", async () => {
    const key = randomUUID();
    const first = await putAway(alice, alice.householdId, items(), key);
    const replay = await putAway(alice, alice.householdId, items(), key);
    expect(replay).toMatchObject({ count: 3, replayed: true, item_ids: first.item_ids });
    expect(await countItems(alice.householdId)).toEqual({ items: 6, achats: 6 });
  });

  it("une ligne invalide annule tout le rangement (atomique)", async () => {
    const bad = [
      ...items(),
      { ingredient_id: ids.riz, quantity: "-1", unit: "kg", location: "pantry" },
    ];
    expect(await expectPgError(putAway(alice, alice.householdId, bad))).toBe("AP422");
    const wrongUnit = [{ ...items()[0], unit: "boisseau" }];
    expect(await expectPgError(putAway(alice, alice.householdId, wrongUnit))).toBe("AP422");
    expect(await countItems(alice.householdId)).toEqual({ items: 6, achats: 6 });
  });

  it("impossible de ranger dans le garde-manger d'un autre foyer", async () => {
    expect(await expectPgError(putAway(bob, alice.householdId, items()))).toBe("AP404");
  });
});

describe("coches du panier", () => {
  const check = (user: TestUser, householdId: string) =>
    asUser(
      user,
      (db) =>
        db.query(
          `insert into public.shopping_checks (household_id, week_start, ingredient_id, dimension)
           values ($1, '2026-10-12', $2, 'mass') on conflict do nothing`,
          [householdId, ids.riz],
        ),
      { commit: true },
    );

  it("partagées dans le foyer, invisibles et non modifiables par un autre", async () => {
    await check(alice, alice.householdId);
    await check(alice, alice.householdId);
    expect(await expectPgError(check(bob, alice.householdId))).toBe(PG.insufficientPrivilege);
    const seen = await asUser(
      bob,
      async (db) =>
        (
          await db.query("select 1 from public.shopping_checks where household_id = $1", [
            alice.householdId,
          ])
        ).rowCount,
    );
    expect(seen).toBe(0);
    const { rows } = await pool.query(
      "select count(*)::int as n from public.shopping_checks where household_id = $1",
      [alice.householdId],
    );
    expect(rows[0].n).toBe(1);
  });
});
