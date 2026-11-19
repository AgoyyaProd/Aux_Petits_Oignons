import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

/**
 * Revue de sécurité du 19/11 (0092) :
 * - l'auteur d'une ligne (created_by, checked_by) est toujours l'utilisateur connecté :
 *   un membre ne peut pas attribuer un ajout à quelqu'un d'autre ;
 * - la liste « manquants » d'un plat cuisiné est bornée (pas de stockage illimité).
 */
let lea: TestUser;
let max: TestUser;
let ingredientId: string;
let recipeId: string;

beforeAll(async () => {
  lea = await createUser("lea-auteur");
  max = await createUser("max-auteur");
  ingredientId = (await pool.query("select id from public.ingredients where slug = 'farine'"))
    .rows[0].id;
  recipeId = (await pool.query("select id from public.recipes where slug = 'brioche-maison'"))
    .rows[0].id;
});

const insertAs = (user: TestUser, table: string, row: Record<string, unknown>) => {
  const cols = Object.keys(row);
  return asUser(user, (db) =>
    db.query(
      `insert into public.${table} (${cols.join(", ")})
       values (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
      Object.values(row),
    ),
  );
};

describe("auteur des lignes", () => {
  it("un membre ne peut pas se faire passer pour un autre utilisateur", async () => {
    const h = () => lea.householdId;
    const cases: [string, Record<string, unknown>][] = [
      [
        "shopping_extras",
        { household_id: h(), week_start: "2026-11-16", label: "Pain", created_by: max.id },
      ],
      [
        "shopping_checks",
        {
          household_id: h(),
          week_start: "2026-11-16",
          ingredient_id: ingredientId,
          dimension: "mass",
          checked_by: max.id,
        },
      ],
      ["household_staples", { household_id: h(), ingredient_id: ingredientId, created_by: max.id }],
      [
        "household_prices",
        {
          household_id: h(),
          ingredient_id: ingredientId,
          dimension: "mass",
          cents_per_ref: 150,
          created_by: max.id,
        },
      ],
      [
        "household_expenses",
        { household_id: h(), amount_cents: 1000, spent_on: "2026-11-16", created_by: max.id },
      ],
      [
        "meal_plan_sides",
        {
          household_id: h(),
          week_start: "2026-11-16",
          recipe_id: recipeId,
          servings: 2,
          idempotency_key: randomUUID(),
          created_by: max.id,
        },
      ],
    ];
    for (const [table, row] of cases) {
      expect(await expectPgError(insertAs(lea, table, row)), table).toBe("42501");
    }
  });

  it("sans auteur précisé, c'est l'utilisateur connecté", async () => {
    const by = await asUser(lea, async (db) => {
      await db.query(
        `insert into public.shopping_extras (household_id, week_start, label)
         values ($1, '2026-11-16', 'Lait')`,
        [lea.householdId],
      );
      return (
        await db.query(
          "select created_by from public.shopping_extras where household_id = $1 and label = 'Lait'",
          [lea.householdId],
        )
      ).rows[0].created_by;
    });
    expect(by).toBe(lea.id);
  });

  it("le prix d'un foyer s'enregistre toujours par upsert, comme l'application", async () => {
    const upsert = (cents: number) =>
      asUser(
        lea,
        (db) =>
          db.query(
            `insert into public.household_prices (household_id, ingredient_id, dimension,
               cents_per_ref, source_url, store_label, observed_on)
             values ($1, $2, 'mass', $3, null, null, '2026-11-19')
             on conflict (household_id, ingredient_id) do update set
               household_id = excluded.household_id, ingredient_id = excluded.ingredient_id,
               dimension = excluded.dimension, cents_per_ref = excluded.cents_per_ref,
               source_url = excluded.source_url, store_label = excluded.store_label,
               observed_on = excluded.observed_on`,
            [lea.householdId, ingredientId, cents],
          ),
        { commit: true },
      );
    await upsert(150);
    await upsert(180);
    const row = (
      await pool.query(
        "select cents_per_ref, created_by from public.household_prices where household_id = $1",
        [lea.householdId],
      )
    ).rows[0];
    expect(row).toEqual({ cents_per_ref: 180, created_by: lea.id });
  });

  it("l'auteur d'un prix ne se modifie pas", async () => {
    const err = await expectPgError(
      asUser(lea, (db) =>
        db.query("update public.household_prices set created_by = $1 where household_id = $2", [
          max.id,
          lea.householdId,
        ]),
      ),
    );
    expect(err).toBe("42501");
  });
});

describe("plat cuisiné hors menu", () => {
  it("la liste des manquants est bornée", async () => {
    const missing = Array.from({ length: 500 }, (_, i) => ({ name: `x${i}`.repeat(20) }));
    const err = await expectPgError(
      asUser(lea, (db) =>
        db.query("select public.recipe_cook_off_menu($1, $2, 2, '[]'::jsonb, $3, $4)", [
          lea.householdId,
          recipeId,
          JSON.stringify(missing),
          randomUUID(),
        ]),
      ),
    );
    expect(err).toBe("23514");
  });
});
