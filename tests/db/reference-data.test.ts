import { beforeAll, describe, expect, it } from "vitest";
import { UNITS } from "@/domain/units";
import { asUser, createUser, expectPgError, PG, pool, type TestUser } from "./helpers";

let user: TestUser;
let admin: TestUser;

beforeAll(async () => {
  user = await createUser("lecteur");
  admin = await createUser("admin");
  await pool.query("insert into public.app_admins (user_id) values ($1)", [admin.id]);
});

describe("vocabulaire fixe", () => {
  it("contient les 14 allergènes réglementaires et les unités de base", async () => {
    const { rows } = await pool.query(
      "select (select count(*)::int from public.allergens) as allergens, (select array_agg(code order by sort_order) from public.units) as units",
    );
    expect(rows[0]).toEqual({
      allergens: 14,
      units: ["g", "kg", "ml", "cl", "l", "tsp", "tbsp", "piece"],
    });
  });
});

describe("cohérence code / base", () => {
  it("la table units et la constante UNITS du domaine sont identiques", async () => {
    const { rows } = await pool.query<{ code: string; dimension: string; to_base: number }>(
      "select code, dimension::text as dimension, to_base from public.units order by code",
    );
    const fromCode = Object.entries(UNITS)
      .map(([code, u]) => ({ code, dimension: u.dimension, to_base: u.toBase }))
      .sort((a, b) => a.code.localeCompare(b.code));
    expect(rows).toEqual(fromCode);
  });
});

describe("catalogue d'ingrédients", () => {
  it("contient au moins 150 ingrédients validés", async () => {
    const { rows } = await pool.query(
      "select count(*)::int as n from public.ingredients where is_validated",
    );
    expect(rows[0].n).toBeGreaterThanOrEqual(150);
  });

  it("chaque ingrédient a son nom pour alias", async () => {
    const { rows } = await pool.query(
      `select i.slug from public.ingredients i
       where not exists (
         select 1 from public.ingredient_aliases a
         where a.ingredient_id = i.id and a.alias_normalized = public.normalize_alias(i.name)
       )`,
    );
    expect(rows).toEqual([]);
  });

  it("toute dimension autre que la masse porte sa conversion", async () => {
    const { rows } = await pool.query(
      `select slug, default_dimension from public.ingredients
       where (default_dimension = 'count' and piece_weight_g is null)
          or (default_dimension = 'volume' and density_g_per_ml is null)`,
    );
    expect(rows).toEqual([]);
  });

  it("les produits animaux sont incompatibles avec le régime végétalien", async () => {
    const { rows } = await pool.query(
      `select i.slug from public.ingredients i
       join public.ingredient_allergens a on a.ingredient_id = i.id
       where a.allergen_code in ('milk', 'eggs', 'fish', 'crustaceans', 'molluscs')
         and not exists (select 1 from public.ingredient_diet_conflicts d
                         where d.ingredient_id = i.id and d.diet_code = 'vegan')
       order by 1`,
    );
    expect(rows).toEqual([]);
  });

  it.each([
    ["Pommes de Terre", "pomme-de-terre"],
    ["pdt", "pomme-de-terre"],
    ["  ŒUFS ", "oeuf"],
    ["Huile d'olive", "huile-olive"],
    ["maizena", "fecule-mais"],
    ["bouillon de volaille", "bouillon-volaille"],
  ])("résout « %s » vers %s", async (label, slug) => {
    const resolved = await asUser(
      user,
      async (db) =>
        (
          await db.query(
            "select i.slug from public.ingredients i where i.id = public.resolve_ingredient($1)",
            [label],
          )
        ).rows[0]?.slug,
    );
    expect(resolved).toBe(slug);
  });

  it("renvoie NULL pour un libellé inconnu (validation requise)", async () => {
    const result = await asUser(
      user,
      async (db) =>
        (await db.query("select public.resolve_ingredient('poudre de licorne') as id")).rows[0].id,
    );
    expect(result).toBeNull();
  });

  it("le bouillon de volaille n'est pas végétarien, celui de légumes l'est", async () => {
    const { rows } = await pool.query(
      `select i.slug, exists (select 1 from public.ingredient_diet_conflicts d
                              where d.ingredient_id = i.id and d.diet_code = 'vegetarian') as conflict
       from public.ingredients i where i.slug in ('bouillon-legumes', 'bouillon-volaille') order by 1`,
    );
    expect(rows).toEqual([
      { slug: "bouillon-legumes", conflict: false },
      { slug: "bouillon-volaille", conflict: true },
    ]);
  });
});

describe("droits sur le référentiel", () => {
  it("un utilisateur connecté lit le catalogue", async () => {
    const n = await asUser(user, async (db) =>
      Number((await db.query("select count(*) from public.ingredients")).rows[0].count),
    );
    expect(n).toBeGreaterThanOrEqual(150);
  });

  it("un utilisateur ordinaire ne peut pas créer d'ingrédient", async () => {
    const code = await expectPgError(
      asUser(user, (db) =>
        db.query(
          "insert into public.ingredients (slug, name, category, default_dimension) values ('x', 'X', 'fruits', 'mass')",
        ),
      ),
    );
    expect(code).toBe(PG.insufficientPrivilege);
  });

  it("un utilisateur ordinaire ne peut ni modifier ni supprimer (0 ligne)", async () => {
    const result = await asUser(user, async (db) => ({
      updated: (await db.query("update public.ingredients set name = 'Piraté' where slug = 'riz'"))
        .rowCount,
      deleted: (
        await db.query("delete from public.ingredient_aliases where alias_normalized = 'pdt'")
      ).rowCount,
    }));
    expect(result).toEqual({ updated: 0, deleted: 0 });
  });

  it("le vocabulaire fixe n'est modifiable par personne côté client", async () => {
    const code = await expectPgError(
      asUser(admin, (db) =>
        db.query("insert into public.units values ('oz', 'oz', 'mass', 28, 0)"),
      ),
    );
    expect(code).toBe(PG.insufficientPrivilege);
  });

  it("un administrateur crée un ingrédient ; son nom devient un alias", async () => {
    const slug = await asUser(admin, async (db) => {
      await db.query(
        "insert into public.ingredients (slug, name, category, default_dimension) values ('yuzu', 'Yuzu', 'fruits', 'mass')",
      );
      return (
        await db.query(
          "select i.slug from public.ingredients i where i.id = public.resolve_ingredient('YUZU')",
        )
      ).rows[0]?.slug;
    });
    expect(slug).toBe("yuzu");
  });

  it("un alias non normalisé est refusé par la base", async () => {
    const code = await expectPgError(
      pool.query(
        "insert into public.ingredient_aliases select 'Pâtes Fraîches', id from public.ingredients where slug = 'pates'",
      ),
    );
    expect(code).toBe("23514");
  });

  it("une dimension en volume ne peut pas recevoir une densité aberrante", async () => {
    const code = await expectPgError(
      pool.query("update public.ingredients set density_g_per_ml = 0 where slug = 'lait'"),
    );
    expect(code).toBe("23514");
  });
});
