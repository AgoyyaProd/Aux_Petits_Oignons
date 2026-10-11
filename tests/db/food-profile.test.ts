import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let hana: TestUser;
let ivan: TestUser;

beforeAll(async () => {
  hana = await createUser("hana-profil");
  ivan = await createUser("ivan-profil");
});

const save = (
  user: TestUser,
  householdId: string,
  style: string,
  opts: { noPork?: boolean; objectives?: string[]; equipment?: string[] | null } = {},
) =>
  asUser(
    user,
    (db) =>
      db.query("select public.set_food_profile($1, $2, $3, $4, $5, $6)", [
        householdId,
        style,
        opts.noPork ?? false,
        ["peanuts"],
        opts.objectives ?? [],
        opts.equipment === undefined ? null : opts.equipment,
      ]),
    { commit: true },
  );

describe("profil alimentaire du foyer", () => {
  it("un style strict alimente les régimes contrôlés en base", async () => {
    await save(hana, hana.householdId, "vegetarien", {
      noPork: true,
      objectives: ["plus_legumes", "rapide"],
      equipment: ["plaques"],
    });
    const diets = await pool.query(
      "select diet_code from public.household_diets where household_id = $1 order by 1",
      [hana.householdId],
    );
    expect(diets.rows.map((r) => r.diet_code)).toEqual(["no_pork", "vegetarian"]);
    const profile = await pool.query(
      "select eating_style, objectives, equipment from public.household_food_profile where household_id = $1",
      [hana.householdId],
    );
    expect(profile.rows[0].eating_style).toBe("vegetarien");
    expect([...profile.rows[0].objectives].sort()).toEqual(["plus_legumes", "rapide"]);
    expect(profile.rows[0].equipment).toEqual(["plaques"]);
  });

  it("flexitarien n'exclut rien en base", async () => {
    await save(hana, hana.householdId, "flexitarien");
    const diets = await pool.query(
      "select count(*)::int as n from public.household_diets where household_id = $1",
      [hana.householdId],
    );
    expect(diets.rows[0].n).toBe(0);
  });

  it("refuse un style ou un objectif inconnu", async () => {
    expect(await expectPgError(save(hana, hana.householdId, "carnivore"))).toBe("AP422");
    expect(
      await expectPgError(save(hana, hana.householdId, "omnivore", { objectives: ["maigrir"] })),
    ).toBe("23514");
  });

  it("un autre foyer ne peut ni lire ni modifier le profil", async () => {
    expect(await expectPgError(save(ivan, hana.householdId, "omnivore"))).toBe("42501");
    const seen = await asUser(ivan, (db) =>
      db.query("select 1 from public.household_food_profile where household_id = $1", [
        hana.householdId,
      ]),
    );
    expect(seen.rowCount).toBe(0);
  });
});

describe("matériel des recettes", () => {
  it("est déduit des étapes et recalculé quand elles changent", async () => {
    const { rows } = await pool.query(
      `insert into public.recipes (slug, title, servings, prep_minutes, cook_minutes, tags, status, source, validated_at)
       values ('test-materiel', 'Test matériel', 2, 5, 10, '{plat}', 'published', 'curated', now()) returning id`,
    );
    const id = rows[0].id;
    await pool.query(
      "insert into public.recipe_steps (recipe_id, position, instruction) values ($1, 1, 'Mixer la soupe.')",
      [id],
    );
    const codes = async () =>
      (
        await pool.query(
          "select equipment_code from public.recipe_equipment where recipe_id = $1 order by 1",
          [id],
        )
      ).rows.map((r) => r.equipment_code);
    expect(await codes()).toEqual(["mixeur"]);
    await pool.query(
      "insert into public.recipe_steps (recipe_id, position, instruction) values ($1, 2, 'Enfourner 20 minutes à 180 °C.')",
      [id],
    );
    expect(await codes()).toEqual(["four", "mixeur"]);
    await pool.query("delete from public.recipes where id = $1", [id]);
  });

  it("un gratin demande le four", async () => {
    const { rows } = await pool.query(
      `select e.equipment_code from public.recipe_equipment e
       join public.recipes r on r.id = e.recipe_id where r.slug = 'gratin-chou-fleur'`,
    );
    expect(rows.map((r) => r.equipment_code)).toContain("four");
  });
});
