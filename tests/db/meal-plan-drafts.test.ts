import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;
const recipe: Record<string, string> = {};
const WEEK = "2026-10-19"; // un lundi

beforeAll(async () => {
  alice = await createUser("alice-brouillon");
  bob = await createUser("bob-brouillon");
  const { rows } = await pool.query(
    "select slug, id from public.recipes where slug in ('ratatouille', 'quiche-lardons', 'chili-sin-carne')",
  );
  for (const r of rows) recipe[r.slug] = r.id;
});

const entries = (...slugs: string[]) =>
  JSON.stringify(slugs.map((s) => ({ recipe_id: recipe[s], servings: 2 })));

const saveDraft = (
  user: TestUser,
  args: { base: number | null; rev: number | null; slugs: string[]; key?: string },
) =>
  asUser(
    user,
    async (db) =>
      (
        await db.query(
          "select public.meal_plan_draft_save($1, $2, $3, $4, 2, $5, 5000, 0, $6, '{}', $7) as rev",
          [
            alice.householdId,
            WEEK,
            args.base,
            args.rev,
            args.slugs.length,
            entries(...args.slugs),
            args.key ?? randomUUID(),
          ],
        )
      ).rows[0].rev as number,
    { commit: true },
  );

const validate = (user: TestUser, rev: number, key = randomUUID()) =>
  asUser(
    user,
    async (db) =>
      (
        await db.query("select * from public.meal_plan_draft_validate($1, $2, $3, $4)", [
          alice.householdId,
          WEEK,
          rev,
          key,
        ])
      ).rows[0] as { plan_id: string; plan_version: number },
    { commit: true },
  );

const planOf = async () =>
  (
    await pool.query(
      `select p.version, array_agg(r.slug order by e.position) slugs from public.meal_plans p
       join public.meal_plan_entries e on e.plan_id = p.id join public.recipes r on r.id = e.recipe_id
       where p.household_id = $1 and p.week_start = $2 group by p.version`,
      [alice.householdId, WEEK],
    )
  ).rows[0] as { version: number; slugs: string[] } | undefined;

const draftOf = async () =>
  (
    await pool.query(
      "select revision from public.meal_plan_drafts where household_id = $1 and week_start = $2",
      [alice.householdId, WEEK],
    )
  ).rows[0] as { revision: number } | undefined;

describe("brouillon de menu", () => {
  it("un menu généré reste un brouillon : aucun menu enregistré avant validation", async () => {
    expect(await saveDraft(alice, { base: null, rev: null, slugs: ["ratatouille"] })).toBe(1);
    expect(await planOf()).toBeUndefined();
    const key = randomUUID();
    expect(await saveDraft(alice, { base: null, rev: 1, slugs: ["chili-sin-carne"], key })).toBe(2);
    // Double envoi de la même modification : sans effet.
    expect(await saveDraft(alice, { base: null, rev: 1, slugs: ["chili-sin-carne"], key })).toBe(2);
  });

  it("refuse une modification faite sur une révision dépassée", async () => {
    expect(
      await expectPgError(saveDraft(alice, { base: null, rev: 1, slugs: ["ratatouille"] })),
    ).toBe("AP409");
  });

  it("un autre foyer ne peut ni lire, ni écrire, ni valider le brouillon", async () => {
    const { rowCount } = await asUser(bob, (db) =>
      db.query("select 1 from public.meal_plan_drafts where household_id = $1", [
        alice.householdId,
      ]),
    );
    expect(rowCount).toBe(0);
    expect(
      await expectPgError(saveDraft(bob, { base: null, rev: 2, slugs: ["ratatouille"] })),
    ).toBe("42501");
    expect(await expectPgError(validate(bob, 2))).toBe("42501");
  });

  it("valider enregistre le menu et supprime le brouillon, une seule fois", async () => {
    const key = randomUUID();
    const result = await validate(alice, 2, key);
    expect(result.plan_version).toBe(1);
    expect(await planOf()).toEqual({ version: 1, slugs: ["chili-sin-carne"] });
    expect(await draftOf()).toBeUndefined();
    // Rejeu de la même validation : même résultat, pas d'erreur.
    expect(await validate(alice, 2, key)).toEqual(result);
  });

  it("un nouveau brouillon part du menu validé ; l'abandonner le laisse intact", async () => {
    await saveDraft(alice, { base: 1, rev: null, slugs: ["quiche-lardons"] });
    await asUser(
      alice,
      (db) =>
        db.query(
          "delete from public.meal_plan_drafts where household_id = $1 and week_start = $2",
          [alice.householdId, WEEK],
        ),
      { commit: true },
    );
    expect(await planOf()).toEqual({ version: 1, slugs: ["chili-sin-carne"] });
  });

  it("refuse la validation si le menu a changé depuis le début du brouillon", async () => {
    await saveDraft(alice, { base: 1, rev: null, slugs: ["ratatouille"] });
    // Pendant ce temps, le menu validé passe en version 2 (ajout depuis une fiche recette).
    await asUser(
      alice,
      (db) =>
        db.query("select * from public.meal_plan_save($1, $2, 2, 1, 5000, 0, $3, 1, $4)", [
          alice.householdId,
          WEEK,
          entries("quiche-lardons"),
          randomUUID(),
        ]),
      { commit: true },
    );
    expect(await expectPgError(validate(alice, 1))).toBe("AP409");
    // Le brouillon est conservé : l'utilisateur peut l'abandonner.
    expect(await draftOf()).toEqual({ revision: 1 });
  });

  it("refuse de valider un menu vide", async () => {
    await pool.query("delete from public.meal_plan_drafts where household_id = $1", [
      alice.householdId,
    ]);
    await saveDraft(alice, { base: 2, rev: null, slugs: [] });
    expect(await expectPgError(validate(alice, 1))).toBe("AP422");
  });
});
