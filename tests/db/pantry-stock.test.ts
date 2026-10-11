import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, PG, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;
let riz: string;
let lait: string;

interface StockResult {
  item_id: string;
  quantity_base: string | null;
  status: string;
  version: number;
  replayed: boolean;
}

beforeAll(async () => {
  alice = await createUser("alice-stock");
  bob = await createUser("bob-stock");
  const { rows } = await pool.query<{ slug: string; id: string }>(
    "select slug, id from public.ingredients where slug in ('riz', 'lait')",
  );
  riz = rows.find((r) => r.slug === "riz")!.id;
  lait = rows.find((r) => r.slug === "lait")!.id;
});

async function addItem(
  user: TestUser,
  opts: { quantity?: string | null; unit?: string; key?: string; ingredient?: string } = {},
): Promise<StockResult> {
  return asUser(
    user,
    async (db) =>
      (
        await db.query(
          `select public.pantry_add_item($1, $2, 'pantry', $3, $4, null, null, false, $5) as r`,
          [
            user.householdId,
            opts.ingredient ?? riz,
            opts.quantity === undefined ? "1000" : opts.quantity,
            opts.unit ?? "g",
            opts.key ?? randomUUID(),
          ],
        )
      ).rows[0].r,
    { commit: true },
  );
}

async function move(
  user: TestUser,
  itemId: string,
  kind: "consumption" | "loss" | "correction",
  quantity: string | null,
  version: number,
  key: string = randomUUID(),
  unit = "g",
): Promise<StockResult> {
  return asUser(
    user,
    async (db) =>
      (
        await db.query("select public.pantry_apply_movement($1, $2, $3, $4, $5, $6) as r", [
          itemId,
          kind,
          quantity,
          unit,
          version,
          key,
        ])
      ).rows[0].r,
    { commit: true },
  );
}

async function movementsOf(itemId: string) {
  const { rows } = await pool.query(
    "select kind, delta_base, quantity_after_base from public.stock_movements where pantry_item_id = $1 order by id",
    [itemId],
  );
  return rows;
}

async function itemRow(itemId: string) {
  const { rows } = await pool.query(
    "select quantity_base, status, version from public.pantry_items where id = $1",
    [itemId],
  );
  return rows[0];
}

describe("ajout d'un produit", () => {
  it("crée le produit et son mouvement initial dans la même opération", async () => {
    const r = await addItem(alice, { quantity: "300" });
    expect(r).toMatchObject({ quantity_base: 300, status: "active", version: 1, replayed: false });
    expect(await movementsOf(r.item_id)).toEqual([
      { kind: "initial", delta_base: "300.000", quantity_after_base: "300.000" },
    ]);
  });

  it("double clic (même clé) : un seul produit, résultat identique", async () => {
    const key = randomUUID();
    const first = await addItem(alice, { key });
    const second = await addItem(alice, { key });
    expect(second.item_id).toBe(first.item_id);
    expect(second.replayed).toBe(true);
    const { rows } = await pool.query(
      "select count(*)::int as n from public.stock_operations where idempotency_key = $1",
      [key],
    );
    expect(rows[0].n).toBe(1);
  });

  it("accepte une quantité inconnue (NULL), jamais une quantité nulle ou négative", async () => {
    const unknown = await addItem(alice, { quantity: null });
    expect((await itemRow(unknown.item_id)).quantity_base).toBeNull();
    for (const q of ["0", "-5"]) {
      const code = await expectPgError(addItem(alice, { quantity: q }));
      expect(code).toBe("AP422");
    }
  });

  it("refuse une unité inconnue", async () => {
    expect(await expectPgError(addItem(alice, { unit: "oz" }))).toBe("AP422");
  });

  it("la dimension du stock est celle de l'unité saisie", async () => {
    const r = await addItem(alice, { ingredient: lait, quantity: "1000", unit: "l" });
    const { rows } = await pool.query(
      "select dimension, display_unit from public.pantry_items where id = $1",
      [r.item_id],
    );
    expect(rows[0]).toEqual({ dimension: "volume", display_unit: "l" });
  });

  it("B ne peut pas ajouter dans le foyer de A", async () => {
    const code = await expectPgError(
      asUser(bob, (db) =>
        db.query(
          "select public.pantry_add_item($1, $2, 'pantry', 100, 'g', null, null, false, $3)",
          [alice.householdId, riz, randomUUID()],
        ),
      ),
    );
    expect(code).toBe("AP404");
  });
});

describe("consommation, perte et correction", () => {
  it("consommation partielle puis totale : quantité et statut à jour, historique complet", async () => {
    const item = await addItem(alice, { quantity: "500" });
    const a = await move(alice, item.item_id, "consumption", "200", 1);
    expect(a).toMatchObject({ quantity_base: 300, status: "active", version: 2 });
    const b = await move(alice, item.item_id, "consumption", "300", 2);
    expect(b).toMatchObject({ quantity_base: 0, status: "depleted", version: 3 });
    expect(await movementsOf(item.item_id)).toEqual([
      { kind: "initial", delta_base: "500.000", quantity_after_base: "500.000" },
      { kind: "consumption", delta_base: "-200.000", quantity_after_base: "300.000" },
      { kind: "consumption", delta_base: "-300.000", quantity_after_base: "0.000" },
    ]);
  });

  it("double clic sur une consommation : décrémenté une seule fois", async () => {
    const item = await addItem(alice, { quantity: "500" });
    const key = randomUUID();
    const first = await move(alice, item.item_id, "consumption", "100", 1, key);
    // Le second envoi porte la même version attendue (1), désormais périmée :
    // il doit pourtant réussir en rejouant le résultat, sans nouveau mouvement.
    const second = await move(alice, item.item_id, "consumption", "100", 1, key);
    expect(second).toEqual({ ...first, replayed: true });
    expect((await itemRow(item.item_id)).quantity_base).toBe("400.000");
    expect(await movementsOf(item.item_id)).toHaveLength(2);
  });

  it("envois concurrents avec la même clé : un seul mouvement", async () => {
    const item = await addItem(alice, { quantity: "500" });
    const key = randomUUID();
    const results = await Promise.all(
      [1, 2, 3].map(() => move(alice, item.item_id, "consumption", "50", 1, key)),
    );
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    expect((await itemRow(item.item_id)).quantity_base).toBe("450.000");
  });

  it("modification concurrente depuis un autre appareil : conflit détecté, rien écrasé", async () => {
    const item = await addItem(alice, { quantity: "500" });
    await move(alice, item.item_id, "consumption", "100", 1);
    // Un second appareil affichait encore la version 1.
    const code = await expectPgError(move(alice, item.item_id, "correction", "999", 1));
    expect(code).toBe("AP409");
    expect(await itemRow(item.item_id)).toEqual({
      quantity_base: "400.000",
      status: "active",
      version: 2,
    });
  });

  it("refuse une consommation supérieure au stock, sans rien écrire (clé réutilisable)", async () => {
    const item = await addItem(alice, { quantity: "100" });
    const key = randomUUID();
    expect(await expectPgError(move(alice, item.item_id, "consumption", "150", 1, key))).toBe(
      "AP422",
    );
    expect(await movementsOf(item.item_id)).toHaveLength(1);
    // L'échec n'a pas consommé la clé : un nouvel essai valide avec la même clé fonctionne.
    const retry = await move(alice, item.item_id, "consumption", "100", 1, key);
    expect(retry).toMatchObject({ quantity_base: 0, status: "depleted", replayed: false });
  });

  it("quantité inconnue : consommation refusée, correction acceptée (delta inconnu)", async () => {
    const item = await addItem(alice, { quantity: null });
    expect(await expectPgError(move(alice, item.item_id, "consumption", "10", 1))).toBe("AP422");
    const fixed = await move(alice, item.item_id, "correction", "250", 1);
    expect(fixed).toMatchObject({ quantity_base: 250, status: "active", version: 2 });
    expect((await movementsOf(item.item_id)).at(-1)).toEqual({
      kind: "correction",
      delta_base: null,
      quantity_after_base: "250.000",
    });
  });

  it("perte totale : produit jeté, même si sa quantité est inconnue", async () => {
    const item = await addItem(alice, { quantity: null });
    const r = await move(alice, item.item_id, "loss", null, 1);
    expect(r).toMatchObject({ quantity_base: 0, status: "discarded" });
    expect(await expectPgError(move(alice, item.item_id, "consumption", "1", 2))).toBe("AP409");
  });

  it("une correction réactive un produit épuisé", async () => {
    const item = await addItem(alice, { quantity: "100" });
    await move(alice, item.item_id, "consumption", "100", 1);
    const r = await move(alice, item.item_id, "correction", "40", 2);
    expect(r).toMatchObject({ quantity_base: 40, status: "active" });
  });

  it("une clé déjà utilisée pour une autre action ou un autre produit est refusée", async () => {
    const a = await addItem(alice, { quantity: "100" });
    const b = await addItem(alice, { quantity: "100" });
    const key = randomUUID();
    await move(alice, a.item_id, "consumption", "10", 1, key);
    expect(await expectPgError(move(alice, a.item_id, "loss", "10", 2, key))).toBe("AP409");
    expect(await expectPgError(move(alice, b.item_id, "consumption", "10", 1, key))).toBe("AP409");
  });

  it("convertit la quantité saisie dans une autre unité de même dimension", async () => {
    const item = await addItem(alice, { quantity: "1,5".replace(",", "."), unit: "kg" });
    expect((await itemRow(item.item_id)).quantity_base).toBe("1500.000");
    const r = await move(alice, item.item_id, "consumption", "250", 1, randomUUID(), "g");
    expect(r).toMatchObject({ quantity_base: 1250 });
    const c = await move(alice, item.item_id, "correction", "0.5", 2, randomUUID(), "kg");
    expect(c).toMatchObject({ quantity_base: 500 });
  });

  it("refuse une unité d'une autre dimension que le produit (pas de conversion silencieuse)", async () => {
    const item = await addItem(alice, { quantity: "500", unit: "g" });
    const code = await expectPgError(
      move(alice, item.item_id, "consumption", "1", 1, randomUUID(), "l"),
    );
    expect(code).toBe("AP422");
    expect((await itemRow(item.item_id)).quantity_base).toBe("500.000");
  });

  it("B ne peut ni modifier ni voir le stock de A", async () => {
    const item = await addItem(alice, { quantity: "100" });
    expect(await expectPgError(move(bob, item.item_id, "consumption", "10", 1))).toBe("AP404");
    const seen = await asUser(bob, async (db) => ({
      items: (await db.query("select 1 from public.pantry_items where id = $1", [item.item_id]))
        .rowCount,
      moves: (
        await db.query("select 1 from public.stock_movements where pantry_item_id = $1", [
          item.item_id,
        ])
      ).rowCount,
    }));
    expect(seen).toEqual({ items: 0, moves: 0 });
  });
});

describe("intégrité du registre", () => {
  it("aucune écriture directe sur le stock côté client", async () => {
    const item = await addItem(alice, { quantity: "100" });
    for (const sql of [
      ["update public.pantry_items set quantity_base = 9999 where id = $1", [item.item_id]],
      ["delete from public.pantry_items where id = $1", [item.item_id]],
      ["delete from public.stock_movements where pantry_item_id = $1", [item.item_id]],
    ] as const) {
      const code = await expectPgError(asUser(alice, (db) => db.query(sql[0], [...sql[1]])));
      expect(code, sql[0]).toBe(PG.insufficientPrivilege);
    }
  });

  it("le registre est immuable, même pour le rôle propriétaire de la base", async () => {
    const item = await addItem(alice, { quantity: "100" });
    const code = await expectPgError(
      pool.query("update public.stock_movements set delta_base = 0 where pantry_item_id = $1", [
        item.item_id,
      ]),
    );
    expect(code).toBe(PG.insufficientPrivilege);
  });

  it("un produit avec historique ne peut pas être supprimé isolément", async () => {
    const item = await addItem(alice, { quantity: "100" });
    const code = await expectPgError(
      pool.query("delete from public.pantry_items where id = $1", [item.item_id]),
    );
    expect(code).toBe("23503"); // foreign_key_violation
  });

  it("la suppression d'un foyer emporte son stock et son registre", async () => {
    const carol = await createUser("carol-stock");
    await addItem(carol, { quantity: "100" });
    await pool.query("delete from public.households where id = $1", [carol.householdId]);
    const { rows } = await pool.query(
      "select (select count(*)::int from public.pantry_items where household_id = $1) as items, (select count(*)::int from public.stock_movements where household_id = $1) as moves",
      [carol.householdId],
    );
    expect(rows[0]).toEqual({ items: 0, moves: 0 });
  });

  it("le cache de quantité est toujours égal au dernier mouvement", async () => {
    const { rows } = await pool.query(
      `select i.id from public.pantry_items i
       join lateral (select m.quantity_after_base from public.stock_movements m
                     where m.pantry_item_id = i.id order by m.id desc limit 1) last on true
       where i.quantity_base is distinct from last.quantity_after_base`,
    );
    expect(rows).toEqual([]);
  });
});

describe("détails du produit", () => {
  const update = (user: TestUser, itemId: string, version: number, opened: boolean) =>
    asUser(
      user,
      async (db) =>
        (
          await db.query(
            "select public.pantry_update_details($1, $2, 'fridge', '2026-10-20', 'use_by', $3) as r",
            [itemId, version, opened],
          )
        ).rows[0].r,
      { commit: true },
    );

  it("modifie emplacement et date sans créer de mouvement", async () => {
    const item = await addItem(alice, { quantity: "100" });
    const r = await update(alice, item.item_id, 1, true);
    expect(r).toMatchObject({ version: 2, changed: true });
    expect(await movementsOf(item.item_id)).toHaveLength(1);
  });

  it("double envoi identique : succès sans conflit", async () => {
    const item = await addItem(alice, { quantity: "100" });
    await update(alice, item.item_id, 1, false);
    const again = await update(alice, item.item_id, 1, false);
    expect(again).toMatchObject({ version: 2, changed: false });
  });

  it("refuse une date limite sans type", async () => {
    const item = await addItem(alice, { quantity: "100" });
    const code = await expectPgError(
      asUser(alice, (db) =>
        db.query(
          "select public.pantry_update_details($1, 1, 'fridge', '2026-10-20', null, false)",
          [item.item_id],
        ),
      ),
    );
    expect(code).toBe("AP422");
  });
});
