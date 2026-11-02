-- 0074 — Vingt-troisième lot de recettes du catalogue (publiées et validées) :
-- sandwichs au pain bretzel et leur salade, au moins 20 g de protéines par part (calcul Ciqual).
-- Fichier GÉNÉRÉ par scripts/generate-recipes-lot23.py depuis scripts/data/recipes-lot23.py.
-- Recettes originales (D7). Ne jamais éditer une fois appliqué.
-- 5 recettes, 53 lignes d'ingrédients, 20 étapes.

insert into public.recipes (slug, title, description, storage_note, servings, prep_minutes,
  cook_minutes, tags, status, source, source_ref, validated_at)
select v.slug, v.title, v.description, v.storage, v.servings, v.prep, v.cook, v.tags,
  'published', 'curated', 'Aux Petits Oignons — recette originale', now()
from (values
  ('bretzel-dinde-comte-miel-moutarde', 'Bretzel au blanc de dinde, comté et sauce miel-moutarde', 'Un pain bretzel garni de blanc de dinde, de lamelles de comté et d''une sauce miel-moutarde au fromage blanc, avec une salade de roquette et carotte râpée. Prêt en 10 minutes.', 'Se garde 1 jour au réfrigérateur, emballé ; la salade sans vinaigrette à part.', 2, 10, 0, array['plat', 'sans-cuisson', 'express', 'lunch-box']::text[]),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'Bretzel chaud gratiné, dinde, raclette et oignon rouge', 'Un pain bretzel ouvert, tartiné de moutarde, garni de blanc de dinde et d''oignon rouge, gratiné sous une tranche de raclette fondante. Avec une salade de roquette.', 'À manger tout de suite.', 2, 10, 8, array['plat', 'four']::text[]),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'Bretzel au saumon fumé, fromage frais et oignon rouge', 'Un pain bretzel tartiné de fromage frais au citron, garni de saumon fumé, d''oignon rouge et de roquette. Frais et rapide, avec une salade de carotte.', 'Se garde 1 jour au réfrigérateur, bien emballé.', 2, 10, 0, array['plat', 'sans-cuisson', 'express', 'lunch-box']::text[]),
  ('bretzel-poulet-cheddar-miel-moutarde', 'Bretzel au poulet grillé, cheddar et miel-moutarde', 'Un pain bretzel garni de poulet doré à la poêle et glacé au miel-moutarde, avec du cheddar fondu et de la roquette. Servi chaud, avec une salade de carotte.', 'Se garde 1 jour au réfrigérateur ; se mange aussi froid.', 2, 10, 10, array['plat', 'poele', 'lunch-box']::text[]),
  ('bretzel-oeuf-chevre-roquette', 'Bretzel à l''œuf, chèvre frais et roquette', 'Un pain bretzel garni d''œufs durs en rondelles, de chèvre émietté, de roquette et d''une sauce miel-moutarde. Sans viande, avec une salade de carotte.', 'Se garde 1 jour au réfrigérateur, emballé.', 2, 10, 10, array['plat', 'lunch-box']::text[])
) as v(slug, title, description, storage, servings, prep, cook, tags);

insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, is_optional,
  preparation_note, position)
select r.id, i.id, v.qty, v.unit, v.optional, v.note, v.pos
from (values
  ('bretzel-dinde-comte-miel-moutarde', 'pain-bretzel', 180, 'g', false, '2 petits pains', 0),
  ('bretzel-dinde-comte-miel-moutarde', 'blanc-dinde', 120, 'g', false, '4 tranches', 1),
  ('bretzel-dinde-comte-miel-moutarde', 'comte', 60, 'g', false, null, 2),
  ('bretzel-dinde-comte-miel-moutarde', 'moutarde', 1, 'tbsp', false, null, 3),
  ('bretzel-dinde-comte-miel-moutarde', 'miel', 1, 'tbsp', false, null, 4),
  ('bretzel-dinde-comte-miel-moutarde', 'fromage-blanc', 40, 'g', false, null, 5),
  ('bretzel-dinde-comte-miel-moutarde', 'cornichon', 30, 'g', true, null, 6),
  ('bretzel-dinde-comte-miel-moutarde', 'roquette', 60, 'g', false, null, 7),
  ('bretzel-dinde-comte-miel-moutarde', 'carotte', 1, 'piece', false, null, 8),
  ('bretzel-dinde-comte-miel-moutarde', 'huile-olive', 1, 'tbsp', false, null, 9),
  ('bretzel-dinde-comte-miel-moutarde', 'vinaigre', 1, 'tsp', false, null, 10),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'pain-bretzel', 180, 'g', false, '2 petits pains', 0),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'blanc-dinde', 120, 'g', false, '4 tranches', 1),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'raclette', 80, 'g', false, null, 2),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'oignon-rouge', 0.5, 'piece', false, null, 3),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'moutarde', 1, 'tbsp', false, null, 4),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'miel', 1, 'tsp', true, null, 5),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'roquette', 60, 'g', false, null, 6),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'carotte', 1, 'piece', false, null, 7),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'huile-olive', 1, 'tbsp', false, null, 8),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 'vinaigre', 1, 'tsp', false, null, 9),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'pain-bretzel', 180, 'g', false, '2 petits pains', 0),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'saumon-fume', 120, 'g', false, null, 1),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'fromage-frais', 60, 'g', false, null, 2),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'oignon-rouge', 0.5, 'piece', false, null, 3),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'jus-citron', 1, 'tsp', false, null, 4),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'ciboulette', 5, 'g', true, null, 5),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'poivre', null, null, true, null, 6),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'roquette', 60, 'g', false, null, 7),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'carotte', 1, 'piece', false, null, 8),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'huile-olive', 1, 'tbsp', false, null, 9),
  ('bretzel-saumon-fume-fromage-frais-roquette', 'vinaigre', 1, 'tsp', false, null, 10),
  ('bretzel-poulet-cheddar-miel-moutarde', 'pain-bretzel', 180, 'g', false, '2 petits pains', 0),
  ('bretzel-poulet-cheddar-miel-moutarde', 'poulet-filet', 200, 'g', false, null, 1),
  ('bretzel-poulet-cheddar-miel-moutarde', 'cheddar', 50, 'g', false, null, 2),
  ('bretzel-poulet-cheddar-miel-moutarde', 'moutarde', 1, 'tbsp', false, null, 3),
  ('bretzel-poulet-cheddar-miel-moutarde', 'miel', 1, 'tbsp', false, null, 4),
  ('bretzel-poulet-cheddar-miel-moutarde', 'huile-tournesol', 1, 'tsp', false, null, 5),
  ('bretzel-poulet-cheddar-miel-moutarde', 'roquette', 60, 'g', false, null, 6),
  ('bretzel-poulet-cheddar-miel-moutarde', 'carotte', 1, 'piece', false, null, 7),
  ('bretzel-poulet-cheddar-miel-moutarde', 'huile-olive', 1, 'tbsp', false, null, 8),
  ('bretzel-poulet-cheddar-miel-moutarde', 'vinaigre', 1, 'tsp', false, null, 9),
  ('bretzel-oeuf-chevre-roquette', 'pain-bretzel', 180, 'g', false, '2 petits pains', 0),
  ('bretzel-oeuf-chevre-roquette', 'oeuf', 3, 'piece', false, null, 1),
  ('bretzel-oeuf-chevre-roquette', 'chevre', 60, 'g', false, null, 2),
  ('bretzel-oeuf-chevre-roquette', 'moutarde', 1, 'tbsp', false, null, 3),
  ('bretzel-oeuf-chevre-roquette', 'miel', 1, 'tsp', false, null, 4),
  ('bretzel-oeuf-chevre-roquette', 'fromage-blanc', 30, 'g', false, null, 5),
  ('bretzel-oeuf-chevre-roquette', 'poivre', null, null, true, null, 6),
  ('bretzel-oeuf-chevre-roquette', 'roquette', 60, 'g', false, null, 7),
  ('bretzel-oeuf-chevre-roquette', 'carotte', 1, 'piece', false, null, 8),
  ('bretzel-oeuf-chevre-roquette', 'huile-olive', 1, 'tbsp', false, null, 9),
  ('bretzel-oeuf-chevre-roquette', 'vinaigre', 1, 'tsp', false, null, 10)
) as v(recipe, ingredient, qty, unit, optional, note, pos)
join public.recipes r on r.slug = v.recipe
join public.ingredients i on i.slug = v.ingredient;

insert into public.recipe_steps (recipe_id, position, instruction)
select r.id, v.pos, v.instruction
from (values
  ('bretzel-dinde-comte-miel-moutarde', 1, 'Mélanger la moutarde, le miel et le fromage blanc jusqu''à obtenir une sauce lisse.'),
  ('bretzel-dinde-comte-miel-moutarde', 2, 'Couper les pains bretzel en deux dans l''épaisseur et le comté en fines lamelles.'),
  ('bretzel-dinde-comte-miel-moutarde', 3, 'Tartiner les deux faces de sauce, puis garnir de blanc de dinde, de comté et de cornichons émincés.'),
  ('bretzel-dinde-comte-miel-moutarde', 4, 'Râper la carotte et la mélanger à la roquette avec l''huile et le vinaigre, à servir à côté du sandwich.'),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 1, 'Préchauffer le four en position gril à 220 °C.'),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 2, 'Couper les pains en deux, tartiner chaque moitié de moutarde mélangée au miel, puis poser le blanc de dinde et l''oignon rouge émincé finement.'),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 3, 'Couvrir de raclette et passer 6 à 8 minutes sous le gril : le fromage doit fondre et dorer, le pain rester croustillant.'),
  ('bretzel-chaud-dinde-raclette-oignon-rouge', 4, 'Râper la carotte et la mélanger à la roquette avec l''huile et le vinaigre, à servir à côté du sandwich.'),
  ('bretzel-saumon-fume-fromage-frais-roquette', 1, 'Mélanger le fromage frais avec le jus de citron, la ciboulette ciselée et du poivre.'),
  ('bretzel-saumon-fume-fromage-frais-roquette', 2, 'Couper les pains bretzel en deux et émincer très finement l''oignon rouge.'),
  ('bretzel-saumon-fume-fromage-frais-roquette', 3, 'Tartiner les pains de fromage frais, puis garnir de saumon fumé, d''oignon rouge et d''une poignée de roquette.'),
  ('bretzel-saumon-fume-fromage-frais-roquette', 4, 'Râper la carotte et la mélanger à la roquette avec l''huile et le vinaigre, à servir à côté du sandwich.'),
  ('bretzel-poulet-cheddar-miel-moutarde', 1, 'Couper le poulet en fines escalopes et le dorer 6 minutes dans l''huile, dans une poêle à feu moyen-vif : il doit être cuit à cœur.'),
  ('bretzel-poulet-cheddar-miel-moutarde', 2, 'Mélanger la moutarde et le miel, verser sur le poulet hors du feu et le retourner pour le glacer.'),
  ('bretzel-poulet-cheddar-miel-moutarde', 3, 'Couper les pains en deux, poser le poulet chaud et le cheddar en tranches, puis refermer et laisser fondre 1 minute.'),
  ('bretzel-poulet-cheddar-miel-moutarde', 4, 'Râper la carotte et la mélanger à la roquette avec l''huile et le vinaigre, à servir à côté du sandwich.'),
  ('bretzel-oeuf-chevre-roquette', 1, 'Cuire les œufs 10 minutes dans une casserole d''eau bouillante, les rafraîchir, les écaler et les couper en rondelles.'),
  ('bretzel-oeuf-chevre-roquette', 2, 'Mélanger la moutarde, le miel et le fromage blanc.'),
  ('bretzel-oeuf-chevre-roquette', 3, 'Couper les pains en deux, les tartiner de sauce, puis garnir d''œufs, de chèvre émietté, de roquette et de poivre.'),
  ('bretzel-oeuf-chevre-roquette', 4, 'Râper la carotte et la mélanger à la roquette avec l''huile et le vinaigre, à servir à côté du sandwich.')
) as v(recipe, pos, instruction)
join public.recipes r on r.slug = v.recipe;

-- Garde-fou : une jointure silencieusement vide (slug introuvable) fait échouer la migration.
do $$
begin
  if (select count(*) from public.recipe_ingredients ri join public.recipes r on r.id = ri.recipe_id
      where r.slug in ('bretzel-dinde-comte-miel-moutarde', 'bretzel-chaud-dinde-raclette-oignon-rouge', 'bretzel-saumon-fume-fromage-frais-roquette', 'bretzel-poulet-cheddar-miel-moutarde', 'bretzel-oeuf-chevre-roquette')) <> 53 then
    raise exception 'Lignes d''ingrédients manquantes dans le vingt-troisième lot de recettes.';
  end if;
end;
$$;
