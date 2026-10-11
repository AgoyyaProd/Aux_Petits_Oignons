import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool, type TestUser } from "./helpers";

let fay: TestUser;
let gus: TestUser;
let carotte: string;
const WEEK = "2026-10-12";

beforeAll(async () => {
  fay = await createUser("fay-ajouts");
  gus = await createUser("gus-ajouts");
  const { rows } = await pool.query("select id from public.ingredients where slug = 'carotte'");
  carotte = rows[0].id;
});

const add = (user: TestUser, householdId: string, ingredientId: string | null, label: string) =>
  asUser(
    user,
    (db) =>
      db.query(
        `insert into public.shopping_extras (household_id, week_start, ingredient_id, label, quantity_text)
         values ($1, $2, $3, $4, '3') returning id`,
        [householdId, WEEK, ingredientId, label],
      ),
    { commit: true },
  );

describe("ajouts manuels à la liste de courses", () => {
  it("un membre ajoute un ingrédient et un texte libre", async () => {
    await add(fay, fay.householdId, carotte, "Carotte");
    await add(fay, fay.householdId, null, "Sacs poubelle");
    await add(fay, fay.householdId, null, "Éponges");
    const { rows } = await pool.query(
      "select label, created_by from public.shopping_extras where household_id = $1 order by label",
      [fay.householdId],
    );
    expect(rows.map((r) => r.label).sort()).toEqual(["Carotte", "Sacs poubelle", "Éponges"].sort());
    expect(rows.every((r) => r.created_by === fay.id)).toBe(true);
  });

  it("un même ingrédient n'est ajouté qu'une fois par semaine", async () => {
    expect(await expectPgError(add(fay, fay.householdId, carotte, "Carotte"))).toBe("23505");
  });

  it("refuse un libellé vide", async () => {
    expect(await expectPgError(add(fay, fay.householdId, null, "   "))).toBe("23514");
  });

  it("un autre foyer ne voit ni n'ajoute rien", async () => {
    const seen = await asUser(gus, (db) =>
      db.query("select 1 from public.shopping_extras where household_id = $1", [fay.householdId]),
    );
    expect(seen.rowCount).toBe(0);
    expect(await expectPgError(add(gus, fay.householdId, null, "Intrus"))).toBe("42501");
  });

  it("seules la case et la quantité sont modifiables", async () => {
    const ok = await asUser(
      fay,
      (db) =>
        db.query(
          "update public.shopping_extras set checked = true where household_id = $1 and label = 'Carotte'",
          [fay.householdId],
        ),
      { commit: true },
    );
    expect(ok.rowCount).toBe(1);
    expect(
      await expectPgError(
        asUser(fay, (db) =>
          db.query("update public.shopping_extras set label = 'x' where household_id = $1", [
            fay.householdId,
          ]),
        ),
      ),
    ).toBe("42501");
  });
});
