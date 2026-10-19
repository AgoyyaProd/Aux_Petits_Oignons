import { describe, expect, it } from "vitest";
import { recipeSeason } from "@/domain/recipes/season";
import { pool } from "./helpers";

// Lots 12 à 17 : recettes thématiques (hiver, desserts, express, anti-gaspi, peu de matériel,
// soupes et lunch box). Listes générées depuis scripts/data/recipes-lot12.py à lot17.py.
// <lots>
const LOTS: Record<string, string[]> = {
  hiver: [
    "poireaux-vinaigrette-lentilles-oeufs",
    "parmentier-dinde-poireaux-carottes",
    "gratin-endives-poulet-moutarde",
    "navarin-dinde-navets-carottes",
    "poulet-butternut-curry-doux",
    "chaudree-saumon-poireaux-pommes-de-terre",
    "salade-mache-poulet-pomme-noix",
    "papillote-cabillaud-poireaux-carottes",
    "porc-mijote-carottes-moutarde",
    "mijote-lentilles-champignons-carottes",
    "veau-poireaux-moutarde-riz",
    "poule-au-pot-legere",
    "galettes-pommes-de-terre-saumon-fume-mache",
    "oeufs-cocotte-poireaux-champignons",
    "chili-butternut-haricots-rouges",
    "saumon-mache-betterave-quinoa",
    "dinde-endives-champignons-riz",
    "couscous-hiver-poulet-navets-pois-chiches",
    "tagliatelles-poireaux-poulet-citron",
    "galettes-butternut-pois-chiches-salade",
  ],
  desserts: [
    "poires-roties-miel-fromage-blanc",
    "crumble-pommes-avoine-leger",
    "mousse-fromage-blanc-citron",
    "clafoutis-pommes-leger",
    "creme-aux-oeufs-vanille",
    "banana-bread-avoine",
    "semoule-au-lait-orange",
    "verrines-fromage-blanc-pomme-caramelisee",
    "poelee-pommes-poires-cannelle-yaourt",
    "gateau-pommes-yaourt-avoine",
    "mousse-chocolat-fromage-blanc",
    "brownie-haricots-rouges-chocolat",
    "glace-banane-cacao",
    "pommes-farcies-noix-raisins-secs",
    "cheesecake-fromage-blanc-citron",
    "mug-cake-banane-cacao",
    "bouchees-avoine-noix-raisins",
    "poires-pochees-orange-cannelle",
    "gratin-pommes-poires-amandes",
    "muffins-pomme-avoine",
  ],
};
// </lots>

const ALL = Object.values(LOTS).flat();
const lot = (name: string) => LOTS[name] ?? [];

interface Facts {
  slug: string;
  tags: string[];
  minutes: number;
  proteins: number;
  sugars: number;
  kcal: number;
  vegetables: number;
  equipment: string[];
  ings: { slug: string; optional: boolean }[];
}

/** Valeurs par part (Ciqual, masse des lignes obligatoires) et matériel déduit des étapes. */
async function facts(slugs: string[]): Promise<Map<string, Facts>> {
  const mass = `case ri.dimension when 'mass' then ri.quantity_base
    when 'volume' then ri.quantity_base * i.density_g_per_ml
    else ri.quantity_base * i.piece_weight_g end`;
  const { rows } = await pool.query(
    `select r.slug, r.tags, r.prep_minutes + r.cook_minutes as minutes,
       coalesce(sum(${mass} * n.proteins_g / 100) filter (where not ri.is_optional), 0) / r.servings as proteins,
       coalesce(sum(${mass} * n.sugars_g / 100) filter (where not ri.is_optional), 0) / r.servings as sugars,
       coalesce(sum(${mass} * n.kcal / 100) filter (where not ri.is_optional), 0) / r.servings as kcal,
       coalesce(sum(${mass}) filter (where not ri.is_optional and i.category in ('legumes', 'fruits')), 0)
         / r.servings as vegetables,
       (select coalesce(array_agg(e.equipment_code order by e.equipment_code), '{}')
          from public.recipe_equipment e where e.recipe_id = r.id) as equipment,
       json_agg(json_build_object('slug', i.slug, 'optional', ri.is_optional)) as ings
     from public.recipes r
     join public.recipe_ingredients ri on ri.recipe_id = r.id
     join public.ingredients i on i.id = ri.ingredient_id
     left join public.ingredient_nutrition n on n.ingredient_id = i.id
     where r.slug = any($1)
     group by r.id`,
    [slugs],
  );
  return new Map(
    rows.map((r) => [
      r.slug,
      {
        ...r,
        minutes: Number(r.minutes),
        proteins: Number(r.proteins),
        sugars: Number(r.sugars),
        kcal: Number(r.kcal),
        vegetables: Number(r.vegetables),
      } as Facts,
    ]),
  );
}

const isBreakfast = (f: Facts) => f.tags.includes("petit-dejeuner") || f.tags.includes("dessert");

describe("lots 12 à 17 : recettes thématiques", () => {
  it("toutes publiées, avec au moins 3 étapes et un conseil de conservation", async () => {
    const { rows } = await pool.query(
      `select r.slug, r.status, r.storage_note is not null as storage,
         (select count(*)::int from public.recipe_steps s where s.recipe_id = r.id) as steps
       from public.recipes r where r.slug = any($1)`,
      [ALL],
    );
    expect(rows).toHaveLength(ALL.length);
    for (const r of rows) {
      expect(r.status, r.slug).toBe("published");
      expect(r.storage, r.slug).toBe(true);
      expect(r.steps, r.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("plats : au moins 20 g de protéines par part", async () => {
    const all = await facts(ALL);
    for (const f of all.values()) {
      if (!isBreakfast(f)) expect(f.proteins, f.slug).toBeGreaterThanOrEqual(20);
    }
  });

  it("desserts : au plus 350 kcal et 12 g de sucre ajouté par part", async () => {
    const all = await facts(lot("desserts"));
    expect(all.size).toBe(lot("desserts").length);
    const { rows } = await pool.query(
      `select r.slug, coalesce(sum(case ri.dimension when 'mass' then ri.quantity_base
           else ri.quantity_base * coalesce(i.density_g_per_ml, 1) end)
         filter (where i.slug = any($2) and not ri.is_optional), 0) / r.servings as added
       from public.recipes r
       join public.recipe_ingredients ri on ri.recipe_id = r.id
       join public.ingredients i on i.id = ri.ingredient_id
       where r.slug = any($1) group by r.id`,
      [
        lot("desserts"),
        ["sucre", "sucre-roux", "sucre-glace", "sucre-vanille", "miel", "sirop-erable"],
      ],
    );
    const added = new Map(rows.map((r) => [r.slug as string, Number(r.added)]));
    for (const f of all.values()) {
      expect(f.tags, f.slug).toContain("dessert");
      expect(f.kcal, f.slug).toBeLessThanOrEqual(350);
      expect(added.get(f.slug), f.slug).toBeLessThanOrEqual(12);
    }
  });

  it("hiver : de saison de décembre à février, avec des légumes", async () => {
    const all = await facts(lot("hiver"));
    expect(all.size).toBe(lot("hiver").length);
    for (const f of all.values()) {
      for (const month of [12, 1, 2]) expect(recipeSeason(f.ings, month), f.slug).not.toBe("out");
      expect(f.vegetables, f.slug).toBeGreaterThanOrEqual(150);
    }
  });
});
