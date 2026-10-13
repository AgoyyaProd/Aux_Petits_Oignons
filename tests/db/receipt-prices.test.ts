import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let alice: TestUser;
let admin: TestUser;

beforeAll(async () => {
  alice = await createUser("alice-tickets");
  admin = await createUser("admin-tickets");
  await pool.query("insert into public.app_admins (user_id) values ($1)", [admin.id]);
});

const insertLine = (user: TestUser, label: string) =>
  asUser(user, (db) =>
    db.query(
      `insert into public.receipt_prices
         (ingredient_id, store_label, purchased_on, receipt_label, pack_quantity, pack_unit, cents)
       select id, 'Magasin test', '2026-10-01', $1, 500, 'g', 199
       from public.ingredients where slug = 'riz'`,
      [label],
    ),
  );

describe("relevés de tickets de caisse", () => {
  it("le premier lot est chargé, sans donnée personnelle", async () => {
    const { rows } = await pool.query(
      `select count(*)::int n, count(distinct store_label)::int stores from public.receipt_prices`,
    );
    expect(rows[0]).toEqual({ n: 26, stores: 3 });
    const columns = await pool.query(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'receipt_prices' order by ordinal_position`,
    );
    expect(columns.rows.map((c) => c.column_name)).toEqual([
      "id",
      "ingredient_id",
      "store_label",
      "purchased_on",
      "receipt_label",
      "pack_quantity",
      "pack_unit",
      "cents",
      "created_at",
    ]);
  });

  it("chaque ligne a la contenance imprimée, dans une unité compatible avec l'ingrédient", async () => {
    // Masse <-> pièce ou volume seulement si l'ingrédient a un poids unitaire ou une densité.
    const { rows } = await pool.query(
      `select i.slug, r.pack_unit from public.receipt_prices r join public.ingredients i on i.id = r.ingredient_id
       where not (
         (r.pack_unit in ('g', 'kg') and (i.default_dimension = 'mass'
            or (i.default_dimension = 'count' and i.piece_weight_g is not null)
            or (i.default_dimension = 'volume' and i.density_g_per_ml is not null)))
         or (r.pack_unit in ('ml', 'cl', 'l') and (i.default_dimension = 'volume'
            or (i.default_dimension = 'mass' and i.density_g_per_ml is not null)))
         or (r.pack_unit = 'piece' and (i.default_dimension = 'count'
            or (i.default_dimension = 'mass' and i.piece_weight_g is not null))))`,
    );
    expect(rows).toEqual([]);
  });

  it("lecture pour tous, ajout réservé aux administrateurs", async () => {
    const read = await asUser(alice, (db) =>
      db.query("select count(*)::int n from public.receipt_prices"),
    );
    expect(read.rows[0].n).toBeGreaterThan(0);
    expect(await expectPgError(insertLine(alice, "RIZ TEST 500G"))).toBe("42501");
    const ok = await insertLine(admin, "RIZ TEST 500G");
    expect(ok.rowCount).toBe(1);
  });

  it("un relevé ne se modifie pas et ne se supprime pas, même par le service", async () => {
    expect(
      await expectPgError(pool.query("update public.receipt_prices set cents = 1 where id = 1")),
    ).toBe("AP403");
    expect(await expectPgError(pool.query("delete from public.receipt_prices where id = 1"))).toBe(
      "AP403",
    );
  });

  it("la source « receipts » est acceptée pour un prix indicatif", async () => {
    const { rows } = await pool.query(
      `select pg_get_constraintdef(oid) def from pg_constraint where conname = 'reference_prices_source_check'`,
    );
    expect(rows[0].def).toContain("receipts");
  });
});
