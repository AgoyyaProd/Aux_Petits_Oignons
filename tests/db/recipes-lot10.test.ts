import { describe, expect, it } from "vitest";
import { recipeSeason } from "@/domain/recipes/season";
import { pool } from "./helpers";

// Lot 10 : plats équilibrés d'automne et d'hiver, pensés pour le planificateur (saison, budget,
// garde-manger). Seuils plus souples que les lots 6 à 9 (protéines) mais légumes exigés.
const LOT10 = [
  "butternut-rotie-lentilles-vertes-feta",
  "soupe-potiron-lentilles-corail-cumin",
  "saumon-fondue-poireaux-riz-complet",
  "salade-endives-poire-noix-poulet",
  "filet-mignon-navets-carottes-glaces",
  "curry-butternut-pois-chiches-epinards",
  "salade-tiede-sardines-pommes-de-terre-mache",
  "frittata-poireaux-champignons-chevre",
  "pates-completes-sardines-brocoli-citron",
  "poulet-roti-potiron-pois-chiches",
  "veau-mijote-carottes-champignons",
  "cabillaud-puree-patate-douce-epinards",
  "tofu-champignons-poireaux-nouilles",
  "patates-douces-farcies-haricots-rouges",
  "oeufs-pois-chiches-epinards-cumin",
  "potee-dinde-legumes-hiver",
  "bowl-fromage-blanc-poire-noix",
  "risotto-poulet-poireaux",
  "saumon-butternut-rotie-quinoa",
  "gratin-poireaux-pommes-de-terre-thon",
];

const VEGETABLE_CATEGORIES = ["legumes", "fruits"];

describe("lot 10 : recettes équilibrées de saison", () => {
  it("les 20 recettes sont publiées, avec étapes et conservation", async () => {
    const { rows } = await pool.query(
      `select r.slug, r.status, r.storage_note is not null as storage,
         (select count(*)::int from public.recipe_steps s where s.recipe_id = r.id) as steps
       from public.recipes r where r.slug = any($1)`,
      [LOT10],
    );
    expect(rows).toHaveLength(LOT10.length);
    for (const r of rows) {
      expect(r.status).toBe("published");
      expect(r.storage).toBe(true);
      expect(r.steps).toBeGreaterThanOrEqual(3);
    }
  });

  it("protéines et légumes par part (Ciqual et poids des pièces)", async () => {
    const { rows } = await pool.query(
      `select r.slug, r.tags,
         sum(case ri.dimension
               when 'mass' then ri.quantity_base
               when 'volume' then ri.quantity_base * i.density_g_per_ml
               else ri.quantity_base * i.piece_weight_g end
             * coalesce(n.proteins_g, 0) / 100) / r.servings as proteins,
         sum(case when i.category = any($2) then case ri.dimension
               when 'mass' then ri.quantity_base
               when 'volume' then ri.quantity_base * i.density_g_per_ml
               else ri.quantity_base * i.piece_weight_g end else 0 end) / r.servings as vegetables
       from public.recipes r
       join public.recipe_ingredients ri on ri.recipe_id = r.id and not ri.is_optional
       join public.ingredients i on i.id = ri.ingredient_id
       left join public.ingredient_nutrition n on n.ingredient_id = i.id
       where r.slug = any($1)
       group by r.slug, r.tags, r.servings`,
      [LOT10, VEGETABLE_CATEGORIES],
    );
    expect(rows).toHaveLength(LOT10.length);
    for (const r of rows) {
      const breakfast = (r.tags as string[]).includes("petit-dejeuner");
      expect(Number(r.proteins), r.slug).toBeGreaterThanOrEqual(breakfast ? 12 : 20);
      expect(Number(r.vegetables), r.slug).toBeGreaterThanOrEqual(breakfast ? 100 : 150);
    }
  });

  it("aucune recette n'est hors saison en octobre ni en novembre", async () => {
    const { rows } = await pool.query(
      `select r.slug, json_agg(json_build_object('slug', i.slug, 'optional', ri.is_optional)) as ings
       from public.recipes r
       join public.recipe_ingredients ri on ri.recipe_id = r.id
       join public.ingredients i on i.id = ri.ingredient_id
       where r.slug = any($1) group by r.slug`,
      [LOT10],
    );
    expect(rows).toHaveLength(LOT10.length);
    for (const r of rows) {
      for (const month of [10, 11]) expect(recipeSeason(r.ings, month), r.slug).not.toBe("out");
    }
  });
});
