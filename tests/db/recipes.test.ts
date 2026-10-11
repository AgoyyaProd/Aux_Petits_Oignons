import { beforeAll, describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, PG, pool, type TestUser } from "./helpers";

let alice: TestUser;
let bob: TestUser;
let admin: TestUser;

beforeAll(async () => {
  alice = await createUser("alice-recettes");
  bob = await createUser("bob-recettes");
  admin = await createUser("admin-recettes");
  await pool.query("insert into public.app_admins (user_id) values ($1)", [admin.id]);
});

describe("catalogue de démonstration", () => {
  it("contient 127 recettes publiées, chacune avec ingrédients et étapes", async () => {
    const { rows } = await pool.query(
      `select count(*)::int as n,
              count(*) filter (where status = 'published' and validated_at is not null)::int as publiees,
              count(*) filter (where not exists (select 1 from public.recipe_ingredients ri where ri.recipe_id = r.id))::int as sans_ingredient,
              count(*) filter (where not exists (select 1 from public.recipe_steps s where s.recipe_id = r.id))::int as sans_etape
       from public.recipes r where r.source = 'curated'`,
    );
    expect(rows[0]).toEqual({ n: 127, publiees: 127, sans_ingredient: 0, sans_etape: 0 });
  });

  it("chaque quantité est convertie en unité de base par le trigger", async () => {
    const { rows } = await pool.query(
      `select count(*)::int as n from public.recipe_ingredients
       where quantity is not null and (quantity_base is null or dimension is null)`,
    );
    expect(rows[0].n).toBe(0);
    const riz = await pool.query(
      `select ri.quantity_base, ri.dimension from public.recipe_ingredients ri
       join public.recipes r on r.id = ri.recipe_id join public.ingredients i on i.id = ri.ingredient_id
       where r.slug = 'gratin-dauphinois' and i.slug = 'pomme-de-terre'`,
    );
    expect(riz.rows[0]).toEqual({ quantity_base: "1200.000", dimension: "mass" });
  });

  it("les étapes sont numérotées sans trou", async () => {
    const { rows } = await pool.query(
      `select recipe_id from public.recipe_steps group by recipe_id having max(position) <> count(*)`,
    );
    expect(rows).toEqual([]);
  });

  it("déduit allergènes et régimes des ingrédients", async () => {
    const { rows } = await pool.query(
      `select r.slug,
              array(select a.allergen_code from public.recipe_allergens a where a.recipe_id = r.id order by 1) as allergenes,
              array(select d.diet_code from public.recipe_diet_conflicts d where d.recipe_id = r.id order by 1) as conflits
       from public.recipes r where r.slug in ('chili-sin-carne', 'quiche-lardons') order by r.slug`,
    );
    expect(rows).toEqual([
      { slug: "chili-sin-carne", allergenes: [], conflits: [] },
      {
        slug: "quiche-lardons",
        allergenes: ["eggs", "gluten", "milk"],
        conflits: ["no_pork", "pescetarian", "vegan", "vegetarian"],
      },
    ]);
  });
});

describe("intégrité des ingrédients de recette", () => {
  it("refuse une unité inconvertible pour l'ingrédient (pas de conversion devinée)", async () => {
    const code = await expectPgError(
      pool.query(
        `insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, position)
         select r.id, i.id, 1, 'piece', 99 from public.recipes r, public.ingredients i
         where r.slug = 'ratatouille' and i.slug = 'riz'`,
      ),
    );
    expect(code).toBe("AP422");
  });

  it("accepte une conversion portée par l'ingrédient (huile en grammes via sa densité)", async () => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      const { rows } = await client.query(
        `insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, position)
         select r.id, i.id, 10, 'g', 99 from public.recipes r, public.ingredients i
         where r.slug = 'crumble-pommes' and i.slug = 'huile-olive'
         returning quantity_base, dimension`,
      );
      expect(rows[0]).toEqual({ quantity_base: "10.000", dimension: "mass" });
    } finally {
      await client.query("rollback");
      client.release();
    }
  });

  it("un ingrédient obligatoire doit avoir une quantité", async () => {
    const code = await expectPgError(
      pool.query(
        `insert into public.recipe_ingredients (recipe_id, ingredient_id, is_optional, position)
         select r.id, i.id, false, 99 from public.recipes r, public.ingredients i
         where r.slug = 'ratatouille' and i.slug = 'riz'`,
      ),
    );
    expect(code).toBe("23514");
  });
});

describe("visibilité des recettes (RLS)", () => {
  let draftId: string;
  let privateId: string;

  beforeAll(async () => {
    draftId = (
      await pool.query(
        `insert into public.recipes (slug, title, servings, prep_minutes, status, source)
         values ('brouillon-test', 'Brouillon de test', 2, 10, 'draft', 'curated') returning id`,
      )
    ).rows[0].id;
    privateId = (
      await pool.query(
        `insert into public.recipes (household_id, slug, title, servings, prep_minutes, status, source)
         values ($1, 'recette-privee-alice', 'Recette privée d''Alice', 2, 10, 'draft', 'user') returning id`,
        [alice.householdId],
      )
    ).rows[0].id;
  });

  const visible = (user: TestUser, id: string) =>
    asUser(
      user,
      async (db) => (await db.query("select 1 from public.recipes where id = $1", [id])).rowCount,
    );

  it("tout utilisateur connecté voit le catalogue publié", async () => {
    const n = await asUser(bob, async (db) =>
      Number(
        (await db.query("select count(*) from public.recipes where source = 'curated'")).rows[0]
          .count,
      ),
    );
    expect(n).toBe(127);
  });

  it("un brouillon du catalogue n'est visible que des administrateurs", async () => {
    expect(await visible(alice, draftId)).toBe(0);
    expect(await visible(admin, draftId)).toBe(1);
  });

  it("une recette privée n'est visible que du foyer propriétaire", async () => {
    expect(await visible(alice, privateId)).toBe(1);
    expect(await visible(bob, privateId)).toBe(0);
  });

  it("les ingrédients et étapes suivent la visibilité de la recette", async () => {
    await pool.query(
      `insert into public.recipe_steps (recipe_id, position, instruction) values ($1, 1, 'Étape secrète')`,
      [privateId],
    );
    const seen = await asUser(
      bob,
      async (db) =>
        (await db.query("select 1 from public.recipe_steps where recipe_id = $1", [privateId]))
          .rowCount,
    );
    expect(seen).toBe(0);
  });

  it("un utilisateur ordinaire ne peut ni créer ni modifier une recette publique", async () => {
    const code = await expectPgError(
      asUser(alice, (db) =>
        db.query(
          "insert into public.recipes (slug, title, servings, prep_minutes, source) values ('pirate', 'Pirate', 2, 5, 'curated')",
        ),
      ),
    );
    expect(code).toBe(PG.insufficientPrivilege);
    const updated = await asUser(
      alice,
      async (db) =>
        (await db.query("update public.recipes set title = 'Piratée' where slug = 'ratatouille'"))
          .rowCount,
    );
    expect(updated).toBe(0);
  });

  it("une recette issue de l'IA doit appartenir à un foyer", async () => {
    const code = await expectPgError(
      pool.query(
        "insert into public.recipes (slug, title, servings, prep_minutes, source) values ('ia-publique', 'IA publique', 2, 5, 'ai')",
      ),
    );
    expect(code).toBe("23514");
  });
});

describe("cohérence des descriptions", () => {
  it("une recette qui se dit végétalienne ou végétarienne l'est vraiment", async () => {
    const { rows } = await pool.query(
      `select r.slug, d.diet_code from public.recipes r
       join public.recipe_diet_conflicts d on d.recipe_id = r.id
       where (r.description ilike '%végétalien%' and d.diet_code = 'vegan')
          or ((r.description ilike '%végétarien%' or r.description ilike '%végétal %' or r.description ilike '%végétale%')
              and d.diet_code = 'vegetarian')`,
    );
    expect(rows).toEqual([]);
  });
});
