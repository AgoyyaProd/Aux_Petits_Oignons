import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, PG, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;
let admin: TestUser;

beforeAll(async () => {
  alice = await createUser("alice-prix");
  bob = await createUser("bob-prix");
  admin = await createUser("admin-prix");
  await pool.query("insert into public.app_admins (user_id) values ($1)", [admin.id]);
});

const ingredientId = async (slug: string) =>
  (await pool.query("select id from public.ingredients where slug = $1", [slug])).rows[0]
    .id as string;

describe("correspondances Open Prices", () => {
  it("chaque ingrédient du référentiel a une correspondance", async () => {
    const { rows } = await pool.query(
      `select count(*)::int as sans from public.ingredients i
       where not exists (select 1 from public.ingredient_price_sources s where s.ingredient_id = i.id)`,
    );
    expect(rows[0].sans).toBe(0);
  });

  it("l'eau est gratuite par définition, aucun autre prix n'est préchargé", async () => {
    const { rows } = await pool.query(
      `select i.slug, r.source, r.cents_per_ref from public.reference_prices r
       join public.ingredients i on i.id = r.ingredient_id`,
    );
    expect(rows).toEqual([{ slug: "eau", source: "free", cents_per_ref: 0 }]);
  });

  it("un prix Open Prices sans échantillon ni période est refusé", async () => {
    const code = await expectPgError(
      pool.query(
        `insert into public.reference_prices (ingredient_id, source, dimension, cents_per_ref, sample_size)
         values ($1, 'open_prices', 'mass', 300, 0)`,
        [await ingredientId("riz")],
      ),
    );
    expect(code).toBe("23514");
  });
});

describe("prix de référence : lecture pour tous, écriture admin", () => {
  const write = (user: TestUser, id: string) =>
    asUser(user, (db) =>
      db.query(
        `insert into public.reference_prices
           (ingredient_id, source, dimension, cents_per_ref, sample_size, observed_from, observed_to)
         values ($1, 'open_prices', 'mass', 300, 12, '2026-05-01', '2026-10-01')`,
        [id],
      ),
    );

  it("un utilisateur ordinaire ne peut pas écrire un prix de référence", async () => {
    const code = await expectPgError(write(alice, await ingredientId("riz")));
    expect(code).toBe(PG.insufficientPrivilege);
  });

  it("un administrateur peut écrire, tout le monde peut lire", async () => {
    const id = await ingredientId("pates");
    const { rowCount } = await write(admin, id);
    expect(rowCount).toBe(1);
    const seen = await asUser(
      bob,
      async (db) => (await db.query("select 1 from public.reference_prices")).rowCount,
    );
    expect(seen).toBeGreaterThanOrEqual(1);
  });

  it("seul un administrateur modifie les correspondances", async () => {
    const updated = await asUser(
      alice,
      async (db) =>
        (await db.query("update public.ingredient_price_sources set approximate = true")).rowCount,
    );
    expect(updated).toBe(0);
  });
});

describe("prix du foyer", () => {
  const upsert = (user: TestUser, householdId: string, slug: string, cents: number) =>
    asUser(
      user,
      async (db) =>
        db.query(
          `insert into public.household_prices (household_id, ingredient_id, dimension, cents_per_ref, store_label)
           select $1, id, 'mass', $3, 'Leclerc' from public.ingredients where slug = $2
           on conflict (household_id, ingredient_id) do update set cents_per_ref = excluded.cents_per_ref`,
          [householdId, slug, cents],
        ),
      { commit: true },
    );

  it("un membre enregistre et met à jour son prix, sans doublon", async () => {
    await upsert(alice, alice.householdId, "beurre", 1150);
    await upsert(alice, alice.householdId, "beurre", 1199);
    const { rows } = await pool.query(
      "select cents_per_ref, created_by from public.household_prices where household_id = $1",
      [alice.householdId],
    );
    expect(rows).toEqual([{ cents_per_ref: 1199, created_by: alice.id }]);
  });

  it("un autre foyer ne voit ni ne modifie ces prix", async () => {
    const code = await expectPgError(upsert(bob, alice.householdId, "lait", 100));
    expect(code).toBe(PG.insufficientPrivilege);
    const seen = await asUser(
      bob,
      async (db) =>
        (
          await db.query("select 1 from public.household_prices where household_id = $1", [
            alice.householdId,
          ])
        ).rowCount,
    );
    expect(seen).toBe(0);
  });

  it("un lien source doit être en https", async () => {
    const code = await expectPgError(
      pool.query(
        `update public.household_prices set source_url = 'javascript:alert(1)' where household_id = $1`,
        [alice.householdId],
      ),
    );
    expect(code).toBe("23514");
  });
});

describe("magasin de référence", () => {
  it("le propriétaire le choisit, un autre foyer non", async () => {
    const own = await asUser(
      alice,
      async (db) =>
        (
          await db.query("update public.households set reference_store = 'Leclerc' where id = $1", [
            alice.householdId,
          ])
        ).rowCount,
    );
    expect(own).toBe(1);
    const other = await asUser(
      bob,
      async (db) =>
        (
          await db.query("update public.households set reference_store = 'X' where id = $1", [
            alice.householdId,
          ])
        ).rowCount,
    );
    expect(other).toBe(0);
  });
});
