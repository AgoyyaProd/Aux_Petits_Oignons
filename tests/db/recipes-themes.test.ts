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
  express: [
    "semoule-poulet-epices-carottes",
    "nouilles-crevettes-gingembre-carottes",
    "omelette-jambon-champignons-salade",
    "tortillas-oeufs-haricots-rouges",
    "salade-thon-pois-chiches-express",
    "escalopes-dinde-moutarde-semoule",
    "tartines-sardines-fromage-blanc-salade",
    "quesadillas-poulet-fromage-salade",
    "nouilles-tofu-champignons-soja",
    "couscous-express-pois-chiches-feta",
    "crevettes-ail-citron-semoule",
    "oeufs-plat-haricots-rouges-tomate",
    "poulet-curry-express-semoule",
    "nouilles-dinde-soja-champignons",
    "salade-oeufs-mollets-thon-pain",
    "tagliatelles-jambon-champignons-fromage-blanc",
    "pois-chiches-sautes-oeufs-pain",
    "wraps-saumon-fume-fromage-blanc",
    "crevettes-curry-nouilles-riz",
    "pizza-poele-tortilla-thon",
  ],
  antiGaspi: [
    "pain-perdu-sale-jambon-emmental",
    "riz-saute-restes-oeufs-jambon",
    "gratin-pates-restes-thon-tomate",
    "soupe-legumes-fatigues-lentilles",
    "croquettes-pommes-de-terre-thon",
    "frittata-pates-restes-champignons",
    "soupe-oignon-pain-rassis-oeuf",
    "pancakes-bananes-mures-avoine",
    "crumble-pommes-abimees-avoine",
    "hachis-parmentier-carottes-restes",
    "tarte-fond-de-frigo-jambon-poireau",
    "curry-poulet-legumes-fatigues",
    "salade-riz-lendemain-thon-oeufs",
    "galettes-legumes-rapes-yaourt",
    "boulettes-pain-rassis-boeuf-tomate",
    "poelee-pommes-de-terre-lardons-oeufs",
    "pain-perdu-pommes-cannelle",
    "soupe-nouilles-poulet-fond-frigo",
    "salade-tiede-lentilles-oeufs-mollets",
    "tortilla-espagnole-pommes-de-terre",
  ],
  peuDeMateriel: [
    "one-pot-pates-thon-tomate",
    "one-pot-pates-poulet-poireau",
    "gnocchis-poeles-tomate-mozzarella",
    "riz-sauteuse-poulet-crevettes-paprika",
    "shakshuka-pois-chiches-oeufs",
    "saumon-poireaux-pommes-de-terre-poele",
    "risotto-poulet-champignons-sauteuse",
    "chili-con-carne-riz-une-cocotte",
    "dahl-lentilles-corail-carottes-coco",
    "tajine-poulet-carottes-pois-chiches",
    "poulet-pommes-de-terre-carottes-un-plat",
    "saumon-patate-douce-brocoli-plat",
    "pois-chiches-rotis-butternut-feta",
    "cabillaud-chapelure-pommes-de-terre-poireau",
    "tofu-roti-patate-douce-carottes-soja",
    "clafoutis-sale-poireau-thon",
    "patates-douces-micro-ondes-haricots-cheddar",
    "bol-semoule-micro-ondes-thon-betterave",
    "saumon-micro-ondes-poireau-pommes-de-terre",
    "oeufs-brouilles-micro-ondes-champignons",
  ],
  soupesLunchBox: [
    "soupe-lentilles-vertes-lardons-carottes",
    "minestrone-hiver-haricots-rouges-pates",
    "veloute-butternut-pois-chiches-feta",
    "soupe-thai-poulet-coco-nouilles",
    "soupe-poireaux-pommes-de-terre-jambon",
    "harira-express-lentilles-pois-chiches",
    "soupe-poulet-petites-pates-carottes",
    "soupe-patate-douce-lentilles-gingembre",
    "salade-pates-poulet-pesto-carottes",
    "salade-quinoa-pois-chiches-feta",
    "salade-riz-complet-poulet-cacahuetes",
    "wraps-poulet-curry-yaourt-carottes",
    "salade-lentilles-betterave-chevre-noix",
    "salade-piemontaise-jambon-oeufs",
    "bento-riz-saumon-soja-brocoli",
    "muffins-oeufs-jambon-poireau",
    "chili-haricots-rouges-riz-boite",
    "salade-boulgour-poulet-carottes-raisins",
    "gratin-penne-brocoli-jambon",
    "falafels-four-pois-chiches-yaourt",
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

  it("express : 15 minutes au plus, préparation et cuisson comprises", async () => {
    const all = await facts(lot("express"));
    expect(all.size).toBe(lot("express").length);
    for (const f of all.values()) {
      expect(f.tags, f.slug).toContain("express");
      expect(f.minutes, f.slug).toBeLessThanOrEqual(15);
    }
  });

  it("anti-gaspi : recycle un reste ou un produit qui s'abîme, de saison en automne", async () => {
    const all = await facts(lot("antiGaspi"));
    expect(all.size).toBe(lot("antiGaspi").length);
    const restes = new Set([
      "pain",
      "riz",
      "pates",
      "pomme-de-terre",
      "lentille-verte",
      "banane",
      "pomme",
      "carotte",
      "poireau",
      "champignon",
    ]);
    for (const f of all.values()) {
      expect(f.tags, f.slug).toContain("anti-gaspi");
      expect(
        f.ings.some((i) => !i.optional && restes.has(i.slug)),
        f.slug,
      ).toBe(true);
      for (const month of [10, 11]) expect(recipeSeason(f.ings, month), f.slug).not.toBe("out");
    }
  });

  it("peu de matériel : un seul récipient de cuisson, ou le micro-ondes seul", async () => {
    const all = await facts(lot("peuDeMateriel"));
    expect(all.size).toBe(lot("peuDeMateriel").length);
    const vessels = new Set(["poele", "casserole", "faitout", "plat_four", "moule"]);
    for (const f of all.values()) {
      expect(f.tags, f.slug).toContain("peu-de-vaisselle");
      const used = f.equipment.filter((e) => vessels.has(e));
      expect(used.length, `${f.slug} : ${used.join(", ")}`).toBeLessThanOrEqual(1);
      if (used.length === 0) expect(f.equipment, f.slug).toEqual(["micro_ondes"]);
      for (const month of [10, 11]) expect(recipeSeason(f.ings, month), f.slug).not.toBe("out");
    }
  });

  it("soupes-repas et lunch box : se gardent, de saison en automne", async () => {
    const all = await facts(lot("soupesLunchBox"));
    expect(all.size).toBe(lot("soupesLunchBox").length);
    const { rows } = await pool.query(
      `select slug, storage_note from public.recipes where slug = any($1)`,
      [lot("soupesLunchBox")],
    );
    const storage = new Map(rows.map((r) => [r.slug as string, r.storage_note as string]));
    for (const f of all.values()) {
      expect(f.tags, f.slug).toContain("lunch-box");
      expect(storage.get(f.slug), f.slug).toMatch(/se gard(e|ent) [2-9] jours/i);
      for (const month of [10, 11]) expect(recipeSeason(f.ings, month), f.slug).not.toBe("out");
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
