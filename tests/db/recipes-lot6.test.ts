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

describe("sixième lot : recettes riches en protéines", () => {
  it("les 20 recettes sont publiées, avec étapes et conservation", async () => {
    const { rows } = await pool.query(
      `select r.slug, r.status, r.storage_note is not null as storage,
         (select count(*)::int from public.recipe_steps s where s.recipe_id = r.id) as steps
       from public.recipes r where r.slug = any($1)`,
      [LOT6],
    );
    expect(rows).toHaveLength(20);
    for (const r of rows) {
      expect(r.status).toBe("published");
      expect(r.storage).toBe(true);
      expect(r.steps).toBeGreaterThan(3);
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
      [LOT6],
    );
    expect(rows).toHaveLength(20);
    for (const r of rows) {
      const breakfast = (r.tags as string[]).includes("petit-dejeuner");
      expect(Number(r.proteins), r.slug).toBeGreaterThanOrEqual(breakfast ? 20 : 30);
    }
  });
});
