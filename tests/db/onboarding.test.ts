import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let owner: TestUser;
let guest: TestUser;
let stranger: TestUser;

beforeAll(async () => {
  owner = await createUser("bienvenue-proprio");
  guest = await createUser("bienvenue-invite");
  stranger = await createUser("bienvenue-autre");
  // L'invité rejoint le foyer du propriétaire comme simple membre.
  await pool.query(
    "insert into public.household_members (household_id, user_id, role) values ($1, $2, 'member')",
    [owner.householdId, guest.id],
  );
  await pool.query("update public.profiles set active_household_id = $1 where id = $2", [
    owner.householdId,
    guest.id,
  ]);
});

type Args = {
  household: string;
  name?: string | null;
  people?: number | null;
  budget?: number | null;
  prep?: number | null;
  slots?: string[] | null;
  perCook?: number | null;
  style?: string;
};

const complete = (user: TestUser, a: Args, commit = false) =>
  asUser(
    user,
    (db) =>
      db.query(
        `select public.complete_onboarding($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          a.household,
          a.name ?? null,
          a.people ?? null,
          a.budget ?? null,
          a.prep ?? null,
          a.slots ?? null,
          a.perCook ?? null,
          a.style ?? "omnivore",
          true,
          ["gluten"],
          ["rapide"],
          ["plaques", "four"],
        ],
      ),
    { commit },
  );

const onboardedAt = async (user: TestUser) =>
  (
    await pool.query<{ onboarded_at: Date | null; display_name: string | null }>(
      "select onboarded_at, display_name from public.profiles where id = $1",
      [user.id],
    )
  ).rows[0]!;

describe("questionnaire de bienvenue", () => {
  it("un nouveau compte n'a pas encore fait le questionnaire", async () => {
    expect((await onboardedAt(owner)).onboarded_at).toBeNull();
  });

  it("le propriétaire enregistre tout d'un coup : foyer, semaine, profil alimentaire, prénom", async () => {
    await complete(
      owner,
      {
        household: owner.householdId,
        name: "  Agathe ",
        people: 2,
        budget: 8000,
        prep: 30,
        slots: ["mon:dinner", "tue:dinner"],
        perCook: 2,
        style: "flexitarien",
      },
      true,
    );
    const h = await pool.query(
      "select people_count, weekly_budget_cents, max_prep_minutes, meal_slots, meals_per_cook from public.households where id = $1",
      [owner.householdId],
    );
    expect(h.rows[0]).toEqual({
      people_count: 2,
      weekly_budget_cents: 8000,
      max_prep_minutes: 30,
      meal_slots: ["mon:dinner", "tue:dinner"],
      meals_per_cook: 2,
    });
    const fp = await pool.query(
      "select eating_style, objectives, equipment from public.household_food_profile where household_id = $1",
      [owner.householdId],
    );
    expect(fp.rows[0]).toEqual({
      eating_style: "flexitarien",
      objectives: ["rapide"],
      equipment: ["four", "plaques"],
    });
    const diets = await pool.query(
      "select diet_code from public.household_diets where household_id = $1",
      [owner.householdId],
    );
    expect(diets.rows.map((r) => r.diet_code)).toEqual(["no_pork"]);
    const p = await onboardedAt(owner);
    expect(p.display_name).toBe("Agathe");
    expect(p.onboarded_at).not.toBeNull();
  });

  it("rejouer le questionnaire garde la date du premier passage et le prénom si vide", async () => {
    const before = (await onboardedAt(owner)).onboarded_at;
    await complete(
      owner,
      { household: owner.householdId, name: "", people: 3, slots: ["mon:lunch"], perCook: 1 },
      true,
    );
    const after = await onboardedAt(owner);
    expect(after.onboarded_at).toEqual(before);
    expect(after.display_name).toBe("Agathe");
  });

  it("tout ou rien : une valeur invalide n'enregistre rien", async () => {
    const code = await expectPgError(
      complete(owner, {
        household: owner.householdId,
        people: 2,
        slots: [], // semaine vide refusée par la contrainte
        perCook: 1,
      }),
    );
    expect(code).toBe("23514");
    expect(
      await expectPgError(
        complete(owner, {
          household: owner.householdId,
          people: 2,
          slots: ["mon:lunch"],
          perCook: 1,
          style: "carnivore",
        }),
      ),
    ).toBe("AP422");
  });

  it("un membre invité ne peut pas changer le foyer", async () => {
    const code = await expectPgError(
      complete(guest, {
        household: owner.householdId,
        people: 9,
        slots: ["mon:lunch"],
        perCook: 1,
      }),
    );
    expect(code).toBe("42501");
  });

  it("un membre invité termine le questionnaire sans la partie foyer", async () => {
    await complete(guest, { household: owner.householdId, name: "Invité" }, true);
    expect((await onboardedAt(guest)).onboarded_at).not.toBeNull();
    const h = await pool.query("select people_count from public.households where id = $1", [
      owner.householdId,
    ]);
    expect(h.rows[0].people_count).toBe(3);
  });

  it("un autre foyer est inaccessible", async () => {
    expect(await expectPgError(complete(stranger, { household: owner.householdId }))).toBe("42501");
  });

  it("chacun ne peut marquer que son propre profil comme accueilli", async () => {
    const { rowCount } = await asUser(stranger, (db) =>
      db.query("update public.profiles set onboarded_at = now() where id = $1", [owner.id]),
    );
    expect(rowCount).toBe(0);
    const own = await asUser(stranger, (db) =>
      db.query("update public.profiles set onboarded_at = now() where id = $1", [stranger.id]),
    );
    expect(own.rowCount).toBe(1);
  });

  it("un visiteur non connecté ne peut pas appeler la fonction", async () => {
    expect(
      await expectPgError(complete(null as unknown as TestUser, { household: owner.householdId })),
    ).toBe("42501");
  });
});
