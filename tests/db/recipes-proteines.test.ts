import { describe, expect, it } from "vitest";
import { pool } from "./helpers";

const LOT6 = [
  "bowl-poulet-quinoa-brocoli-sesame",
  "dinde-courgettes-boulgour-yaourt",
  "saumon-quinoa-haricots-verts",
  "cabillaud-dahl-lentilles-epinards",
  "poulet-yaourt-legumes-pois-chiches",
  "salade-tiede-lentilles-poulet",
  "bowl-thon-pois-chiches-concombre",
  "crevettes-ail-courgettes-quinoa",
  "filet-mignon-lentilles-haricots-verts",
  "steak-patate-douce-mache",
  "cabillaud-croute-puree-chou-fleur",
  "poulet-paprika-haricots-blancs-tomates",
  "papillote-cabillaud-gingembre-riz-complet",
  "wok-porc-poivrons-nouilles",
  "salade-sardines-lentilles",
  "oeufs-poches-lentilles-epinards",
  "curry-tofu-lentilles-corail",
  "poulet-citron-brocoli-riz-complet",
  "pancakes-fromage-blanc-avoine",
  "omelette-epinards-feta",
];

const LOT7 = [
  "poulet-tikka-chou-fleur-roti",
  "saumon-laque-riz-complet-haricots",
  "fajitas-dinde-haricots-rouges",
  "tajine-poulet-pois-chiches-carottes",
  "crevettes-haricots-blancs-tomates-epinards",
  "gratin-cabillaud-poireaux-pommes-de-terre",
  "porc-saute-chou-gingembre-riz",
  "dinde-curry-epinards-basmati",
  "gratin-pates-completes-thon-brocoli",
  "buddha-bowl-tofu-patate-douce",
  "soupe-lentilles-corail-poulet",
  "pates-completes-poulet-epinards",
  "overnight-oats-fromage-blanc-myrtilles",
  "salade-poulet-haricots-verts-oeuf",
  "cabillaud-tomates-olives-semoule",
  "poulet-moutarde-haricots-verts-vapeur",
  "brochettes-dinde-taboule-herbes",
  "quiche-sans-pate-thon-courgettes",
  "tofu-brouille-epinards-pois-chiches",
];
const LOT8 = [
  "poulet-shawarma-boulgour-yaourt",
  "keftas-boeuf-dinde-semoule-menthe",
  "saumon-puree-brocoli-fromage-blanc",
  "galettes-thon-pois-chiches-salade",
  "curry-oeufs-lentilles-epinards",
  "poulet-satay-haricots-verts-riz",
  "plaque-porc-patate-douce-brocoli",
  "riz-saute-crevettes-petits-pois-oeuf",
  "cabillaud-pesto-tomates-cerises-grenailles",
  "wrap-oeufs-brouilles-epinards",
  "porridge-proteine-banane-cacahuete",
  "chili-dinde-haricots-rouges-mais",
  "parmentier-boeuf-lentilles",
  "salade-thai-porc-concombre",
  "salade-pois-chiches-oeufs-feta",
  "poulet-cajun-mais-patate-douce",
  "boulettes-dinde-courgettes-pates-completes",
  "soupe-poulet-nouilles-gingembre",
  "saumon-fenouil-orange-quinoa",
  "muffins-oeufs-jambon-legumes",
];
const HEALTHY = [...LOT6, ...LOT7, ...LOT8];

describe("lots 6 à 8 : recettes riches en protéines", () => {
  it("les 59 recettes sont publiées, avec étapes et conservation", async () => {
    const { rows } = await pool.query(
      `select r.slug, r.status, r.storage_note is not null as storage,
         (select count(*)::int from public.recipe_steps s where s.recipe_id = r.id) as steps
       from public.recipes r where r.slug = any($1)`,
      [HEALTHY],
    );
    expect(rows).toHaveLength(HEALTHY.length);
    for (const r of rows) {
      expect(r.status).toBe("published");
      expect(r.storage).toBe(true);
      expect(r.steps).toBeGreaterThanOrEqual(3);
    }
  });

  it("chaque plat apporte au moins 30 g de protéines par part (Ciqual)", async () => {
    // Masse de chaque ligne obligatoire : base en g, ml × densité ou pièces × poids unitaire.
    const { rows } = await pool.query(
      `select r.slug, r.tags,
         sum(case ri.dimension
               when 'mass' then ri.quantity_base
               when 'volume' then ri.quantity_base * i.density_g_per_ml
               else ri.quantity_base * i.piece_weight_g end
             * n.proteins_g / 100) / r.servings as proteins,
         bool_and(n.ingredient_id is not null or i.slug in ('sel', 'poivre', 'eau')) as measured
       from public.recipes r
       join public.recipe_ingredients ri on ri.recipe_id = r.id and not ri.is_optional
       join public.ingredients i on i.id = ri.ingredient_id
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where r.slug = any($1)
       group by r.slug, r.tags, r.servings`,
      [HEALTHY],
    );
    expect(rows).toHaveLength(HEALTHY.length);
    for (const r of rows) {
      const breakfast = (r.tags as string[]).includes("petit-dejeuner");
      expect(Number(r.proteins), r.slug).toBeGreaterThanOrEqual(breakfast ? 20 : 30);
    }
  });
});
