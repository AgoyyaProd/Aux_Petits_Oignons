import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, PG, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;
const recipe: Record<string, string> = {};
const WEEK = "2026-10-12"; // un lundi

beforeAll(async () => {
  alice = await createUser("alice-menu");
  bob = await createUser("bob-menu");
  const { rows } = await pool.query(
    "select slug, id from public.recipes where slug in ('ratatouille', 'quiche-lardons', 'chili-sin-carne')",
  );
  for (const r of rows) recipe[r.slug] = r.id;
});

interface SaveArgs {
  householdId?: string;
  week?: string;
  entries: { recipe_id: string; servings: number; locked?: boolean }[];
  expectedVersion: number | null;
  key?: string;
  seed?: number;
}

const save = (user: TestUser, args: SaveArgs) =>
  asUser(
    user,
    async (db) =>
      (
        await db.query("select * from public.meal_plan_save($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
          args.householdId ?? user.householdId,
          args.week ?? WEEK,
          2,
          args.entries.length || 1,
          5000,
          args.seed ?? 0,
          JSON.stringify(args.entries),
          args.expectedVersion,
          args.key ?? randomUUID(),
        ])
      ).rows[0] as { plan_id: string; plan_version: number },
    { commit: true },
  );

const entriesOf = async (planId: string) =>
  (
    await pool.query(
      `select r.slug, e.position, e.servings, e.locked from public.meal_plan_entries e
       join public.recipes r on r.id = e.recipe_id where e.plan_id = $1 order by e.position`,
      [planId],
    )
  ).rows;

describe("enregistrement d'un menu", () => {
  let planId: string;

  it("crée le menu et ses plats dans l'ordre", async () => {
    const result = await save(alice, {
      entries: [
        { recipe_id: recipe["ratatouille"]!, servings: 2 },
        { recipe_id: recipe["chili-sin-carne"]!, servings: 4, locked: true },
      ],
      expectedVersion: null,
    });
    planId = result.plan_id;
    expect(result.plan_version).toBe(1);
    expect(await entriesOf(planId)).toEqual([
      { slug: "ratatouille", position: 1, servings: 2, locked: false },
      { slug: "chili-sin-carne", position: 2, servings: 4, locked: true },
    ]);
  });

  it("rejouer la même requête ne change rien (double clic, réseau)", async () => {
    const key = randomUUID();
    const args = {
      entries: [{ recipe_id: recipe["ratatouille"]!, servings: 3 }],
      expectedVersion: 1,
      key,
    };
    const first = await save(alice, args);
    const replay = await save(alice, args);
    expect(first).toEqual({ plan_id: planId, plan_version: 2 });
    expect(replay).toEqual(first);
    expect(await entriesOf(planId)).toEqual([
      { slug: "ratatouille", position: 1, servings: 3, locked: false },
    ]);
  });

  it("une version périmée est refusée sans rien modifier", async () => {
    const code = await expectPgError(
      save(alice, {
        entries: [{ recipe_id: recipe["chili-sin-carne"]!, servings: 2 }],
        expectedVersion: 1,
      }),
    );
    expect(code).toBe("AP409");
    expect(await entriesOf(planId)).toHaveLength(1);
  });

  it("créer une semaine déjà existante sans version est refusé", async () => {
    const code = await expectPgError(
      save(alice, {
        entries: [{ recipe_id: recipe["ratatouille"]!, servings: 2 }],
        expectedVersion: null,
      }),
    );
    expect(code).toBe("AP409");
  });

  it("refuse un lundi invalide, des portions invalides, une recette inconnue", async () => {
    expect(
      await expectPgError(save(alice, { week: "2026-10-13", entries: [], expectedVersion: null })),
    ).toBe("23514");
    expect(
      await expectPgError(
        save(alice, {
          week: "2026-10-19",
          entries: [{ recipe_id: recipe["ratatouille"]!, servings: 0 }],
          expectedVersion: null,
        }),
      ),
    ).toBe("AP422");
    expect(
      await expectPgError(
        save(alice, {
          week: "2026-10-19",
          entries: [{ recipe_id: randomUUID(), servings: 2 }],
          expectedVersion: null,
        }),
      ),
    ).toBe("AP422");
  });
});

describe("sécurité du menu", () => {
  it("filet de sécurité : une recette contraire aux allergies du foyer est refusée", async () => {
    await pool.query(
      "insert into public.household_exclusions (household_id, allergen_code, is_allergy) values ($1, 'milk', true)",
      [bob.householdId],
    );
    const code = await expectPgError(
      save(bob, {
        entries: [{ recipe_id: recipe["quiche-lardons"]!, servings: 2 }],
        expectedVersion: null,
      }),
    );
    expect(code).toBe("AP422");
  });

  it("un autre foyer ne peut ni écrire ni lire le menu", async () => {
    const code = await expectPgError(
      save(bob, {
        householdId: alice.householdId,
        week: "2026-10-26",
        entries: [],
        expectedVersion: null,
      }),
    );
    expect(code).toBe(PG.insufficientPrivilege);
    const seen = await asUser(
      bob,
      async (db) =>
        (
          await db.query("select 1 from public.meal_plans where household_id = $1", [
            alice.householdId,
          ])
        ).rowCount,
    );
    expect(seen).toBe(0);
  });

  it("aucune écriture directe dans les tables : tout passe par meal_plan_save", async () => {
    const code = await expectPgError(
      asUser(alice, (db) =>
        db.query("delete from public.meal_plan_entries where household_id = $1", [
          alice.householdId,
        ]),
      ),
    );
    expect(code).toBe(PG.insufficientPrivilege);
  });
});
