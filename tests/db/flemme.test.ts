import { describe, expect, it } from "vitest";
import { asUser, createUser, expectPgError, pool } from "./helpers";

/**
 * « Recettes de la flemme » (0087, 0088, 0089) : chaque recette taguée « flemme » respecte
 * les critères promis, calculés en base (durées, ingrédients hors placard, étapes, Ciqual).
 * Les pommes de terre ne comptent pas dans les légumes (féculent dans l'assiette).
 */
describe("recettes de la flemme", () => {
  it("chaque recette flemme respecte les critères", async () => {
    // Masse de chaque ligne obligatoire : base en g, ml × densité ou pièces × poids unitaire.
    const { rows } = await pool.query(
      `with lines as (
         select r.id, r.slug, r.servings, i.slug as ing, i.category, i.is_staple, ri.is_optional,
           case ri.dimension
             when 'mass' then ri.quantity_base
             when 'volume' then ri.quantity_base * i.density_g_per_ml
             else ri.quantity_base * i.piece_weight_g end as grams,
           n.proteins_g, n.ingredient_id is not null as measured
         from public.recipes r
         join public.recipe_ingredients ri on ri.recipe_id = r.id
         join public.ingredients i on i.id = ri.ingredient_id
         left join public.ingredient_nutrition n on n.ingredient_id = i.id
         where 'flemme' = any(r.tags))
       select r.slug, r.status, r.prep_minutes, r.rest_minutes, r.cook_minutes,
         (select count(*)::int from public.recipe_steps s where s.recipe_id = r.id) as steps,
         (select count(*)::int from lines l where l.id = r.id and not l.is_optional
            and not l.is_staple) as shopping,
         (select coalesce(sum(l.grams * l.proteins_g / 100), 0) / r.servings from lines l
            where l.id = r.id and not l.is_optional) as proteins,
         (select coalesce(sum(l.grams), 0) / r.servings from lines l
            where l.id = r.id and not l.is_optional and l.category = 'legumes'
            and l.ing not in ('ail', 'oignon', 'echalote', 'pomme-de-terre',
              'pomme-de-terre-grenaille', 'pdt-vapeur')) as vegetables,
         (select bool_and(l.measured or l.is_staple) from lines l
            where l.id = r.id and not l.is_optional) as measured
       from public.recipes r where 'flemme' = any(r.tags) order by r.slug`,
    );
    expect(rows.length).toBeGreaterThanOrEqual(41);
    for (const r of rows) {
      const at = `[${r.slug}]`;
      expect(r.status, at).toBe("published");
      expect(r.prep_minutes + r.rest_minutes + r.cook_minutes, at).toBeLessThanOrEqual(15);
      expect(r.prep_minutes, at).toBeLessThanOrEqual(10);
      expect(r.shopping, at).toBeLessThanOrEqual(5);
      expect(r.steps, at).toBeGreaterThanOrEqual(1);
      expect(r.steps, at).toBeLessThanOrEqual(4);
      expect(r.measured, at).toBe(true);
      expect(Number(r.proteins), at).toBeGreaterThanOrEqual(20);
      expect(Number(r.vegetables), at).toBeGreaterThanOrEqual(80);
    }
  });

  it("les nouveaux produits ont leur nutrition Ciqual, et les surgelés sont signalés", async () => {
    const { rows } = await pool.query(
      `select i.slug, i.is_frozen, n.ciqual_code
       from public.ingredients i left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where i.slug in ('palet-legumes', 'melange-legumes', 'legumes-wok', 'epinard-galets',
         'haricot-vert-surgele', 'legumes-couscous', 'legumes-ratatouille',
         'poisson-blanc-surgele', 'falafel', 'lentille-boite', 'carotte-rapee', 'houmous',
         'petit-pois', 'epinard', 'puree-flocons', 'riz-cuit-sachet', 'pdt-vapeur',
         'pates-fraiches', 'raviolis-frais', 'poulet-cuit', 'maquereau-boite',
         'boulettes-vegetales', 'petits-pois-carottes')
       order by i.slug`,
    );
    const by = Object.fromEntries(rows.map((r) => [r.slug, r]));
    expect(rows).toHaveLength(23);
    for (const r of rows) expect(r.ciqual_code, r.slug).not.toBeNull();
    expect(by["palet-legumes"].is_frozen).toBe(true);
    expect(by["poisson-blanc-surgele"].is_frozen).toBe(true);
    expect(by["petit-pois"].is_frozen).toBe(true);
    expect(by["falafel"].is_frozen).toBe(false);
    expect(by["epinard"].is_frozen).toBe(false);
    expect(by["petits-pois-carottes"].is_frozen).toBe(true);
    expect(by["puree-flocons"].is_frozen).toBe(false);
  });

  it("allergènes et régimes des produits industriels", async () => {
    const { rows } = await pool.query(
      `select i.slug,
         array(select a.allergen_code from public.ingredient_allergens a
               where a.ingredient_id = i.id order by 1) as allergens,
         array(select d.diet_code from public.ingredient_diet_conflicts d
               where d.ingredient_id = i.id order by 1) as diets
       from public.ingredients i
       where i.slug in ('palet-legumes', 'falafel', 'houmous', 'poisson-blanc-surgele', 'legumes-wok',
         'pates-fraiches', 'raviolis-frais', 'poulet-cuit', 'maquereau-boite', 'boulettes-vegetales')
       order by i.slug`,
    );
    expect(rows).toEqual([
      { slug: "boulettes-vegetales", allergens: ["gluten", "soy"], diets: [] },
      { slug: "falafel", allergens: ["gluten", "sesame"], diets: [] },
      { slug: "houmous", allergens: ["sesame"], diets: [] },
      { slug: "legumes-wok", allergens: ["gluten", "soy"], diets: [] },
      { slug: "maquereau-boite", allergens: ["fish"], diets: ["vegan", "vegetarian"] },
      { slug: "palet-legumes", allergens: ["eggs", "gluten", "milk"], diets: ["vegan"] },
      { slug: "pates-fraiches", allergens: ["eggs", "gluten"], diets: ["vegan"] },
      {
        slug: "poisson-blanc-surgele",
        allergens: ["fish"],
        diets: ["vegan", "vegetarian"],
      },
      { slug: "poulet-cuit", allergens: [], diets: ["pescetarian", "vegan", "vegetarian"] },
      { slug: "raviolis-frais", allergens: ["eggs", "gluten", "milk"], diets: ["vegan"] },
    ]);
  });

  it("les alias mènent aux nouveaux produits", async () => {
    const { rows } = await pool.query(
      `select v.alias, i.slug from (values ('Palets de légumes'), ('Galettes de légumes surgelées'),
         ('Falafels'), ('Hoummous'), ('Lentilles en conserve'), ('Carottes râpées'),
         ('Filets de lieu surgelés'), ('Purée en flocons'), ('Purée express'),
         ('Riz en sachet micro-ondes'), ('Filets de maquereau'), ('Émincés de poulet')) as v(alias)
       join public.ingredient_aliases a on a.alias_normalized = public.normalize_alias(v.alias)
       join public.ingredients i on i.id = a.ingredient_id order by v.alias`,
    );
    expect(rows.map((r) => [r.alias, r.slug])).toEqual([
      ["Carottes râpées", "carotte-rapee"],
      ["Falafels", "falafel"],
      ["Filets de lieu surgelés", "poisson-blanc-surgele"],
      ["Filets de maquereau", "maquereau-boite"],
      ["Galettes de légumes surgelées", "palet-legumes"],
      ["Hoummous", "houmous"],
      ["Lentilles en conserve", "lentille-boite"],
      ["Palets de légumes", "palet-legumes"],
      ["Purée en flocons", "puree-flocons"],
      ["Purée express", "puree-flocons"],
      ["Riz en sachet micro-ondes", "riz-cuit-sachet"],
      ["Émincés de poulet", "poulet-cuit"],
    ]);
  });
});

describe("soirs flemme du foyer", () => {
  it("un membre règle de 0 à 3 soirs ; un autre foyer ne peut pas", async () => {
    const lea = await createUser("lea-flemme");
    const max = await createUser("max-flemme");
    const set = (user: typeof lea, household: string, n: number) =>
      asUser(user, (db) => db.query("select public.set_lazy_nights($1, $2)", [household, n]), {
        commit: true,
      });
    await set(lea, lea.householdId, 2);
    const value = async () =>
      (
        await pool.query(
          "select lazy_nights from public.household_food_profile where household_id = $1",
          [lea.householdId],
        )
      ).rows[0]?.lazy_nights;
    expect(await value()).toBe(2);
    expect(await expectPgError(set(lea, lea.householdId, 4))).toBe("AP422");
    expect(await expectPgError(set(max, lea.householdId, 1))).toBe("42501");
    expect(await value()).toBe(2);
  });
});
