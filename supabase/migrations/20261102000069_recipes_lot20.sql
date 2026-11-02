-- 0069 — Vingtième lot de recettes du catalogue (publiées et validées) :
-- deuxième série asiatique (sauce d'huître, nuoc-mâm, miso, nouilles aux œufs…), au moins 20 g de protéines par part (calcul Ciqual).
-- Fichier GÉNÉRÉ par scripts/generate-recipes-lot20.py depuis scripts/data/recipes-lot20.py.
-- Recettes originales (D7). Ne jamais éditer une fois appliqué.
-- 8 recettes, 79 lignes d'ingrédients, 42 étapes.

insert into public.recipes (slug, title, description, storage_note, servings, prep_minutes,
  cook_minutes, tags, status, source, source_ref, validated_at)
select v.slug, v.title, v.description, v.storage, v.servings, v.prep, v.cook, v.tags,
  'published', 'curated', 'Aux Petits Oignons — recette originale', now()
from (values
  ('poulet-pak-choi-sauce-huitre-riz', 'Poulet et pak choï à la sauce d''huître', 'Du poulet émincé sauté au wok avec du pak choï croquant, de l''ail et du gingembre, laqué à la sauce d''huître et servi avec du riz jasmin.', 'Se garde 2 jours au réfrigérateur ; réchauffer rapidement à la poêle.', 2, 10, 20, array['plat', 'poele', 'monde']::text[]),
  ('nouilles-oeufs-boeuf-pousses-soja', 'Nouilles sautées aux œufs, bœuf et pousses de soja', 'Des nouilles chinoises aux œufs sautées avec des lanières de bœuf, des pousses de soja et des carottes, dans une sauce à la sauce d''huître et à la sauce soja.', 'Se garde 2 jours au réfrigérateur ; réchauffer à la poêle avec une cuillère d''eau.', 2, 15, 10, array['plat', 'poele', 'monde']::text[]),
  ('bo-bun-boeuf-nuoc-mam', 'Bo bun au bœuf, vermicelles et sauce nuoc-mâm', 'Des vermicelles de riz tièdes, du bœuf sauté à l''ail, de la salade, des carottes râpées et des pousses de soja, arrosés d''une sauce au nuoc-mâm et citron vert, avec des cacahuètes.', 'Se garde 1 jour au réfrigérateur, sauce à part ; à manger de préférence tout de suite.', 2, 20, 10, array['plat', 'salade', 'monde']::text[]),
  ('saumon-miso-pak-choi-riz', 'Saumon laqué au miso, pak choï et riz', 'Des pavés de saumon badigeonnés de miso, miel et sauce soja, rôtis au four, avec du pak choï à la vapeur et du riz.', 'Se garde 2 jours au réfrigérateur ; se mange aussi froid, en boîte-repas.', 2, 10, 20, array['plat', 'four', 'monde']::text[]),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'Poulet caramélisé au gingembre et nuoc-mâm', 'Des morceaux de poulet mijotés dans un caramel au nuoc-mâm, avec beaucoup de gingembre, de l''ail et de l''oignon, servis avec du riz thaï et du pak choï.', 'Se garde 3 jours au réfrigérateur ou 2 mois au congélateur (sans le pak choï).', 2, 15, 25, array['plat', 'mijote', 'monde']::text[]),
  ('omelette-chinoise-crevettes-pousses-soja', 'Omelette chinoise aux crevettes et pousses de soja', 'Une omelette épaisse garnie de crevettes, de pousses de soja et d''oignon, nappée d''une sauce à la sauce d''huître et servie avec du riz. Prête en 20 minutes.', 'Se garde 1 jour au réfrigérateur ; à manger de préférence tout de suite.', 2, 10, 10, array['plat', 'poele', 'monde']::text[]),
  ('nouilles-bouillon-miso-porc-oeuf', 'Nouilles au bouillon miso, porc et œuf mollet', 'Un bol de nouilles aux œufs dans un bouillon au miso, avec du porc émincé doré, du pak choï, des champignons et un œuf mollet. Réconfortant les soirs d''automne.', 'Le bouillon se garde 3 jours au réfrigérateur ; cuire les nouilles au moment de réchauffer.', 2, 15, 20, array['soupe', 'plat', 'monde']::text[]),
  ('tofu-miso-pak-choi-nouilles-riz', 'Tofu sauté au miso, pak choï et nouilles de riz', 'Des cubes de tofu dorés puis enrobés d''une sauce au miso, miel et gingembre, avec du pak choï et des nouilles de riz. Un bloc entier pour deux.', 'Se garde 3 jours au réfrigérateur ; réchauffer à la poêle avec un peu d''eau.', 2, 10, 15, array['plat', 'poele', 'monde', 'lunch-box']::text[])
) as v(slug, title, description, storage, servings, prep, cook, tags);

insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, is_optional,
  preparation_note, position)
select r.id, i.id, v.qty, v.unit, v.optional, v.note, v.pos
from (values
  ('poulet-pak-choi-sauce-huitre-riz', 'poulet-filet', 260, 'g', false, null, 0),
  ('poulet-pak-choi-sauce-huitre-riz', 'pak-choi', 300, 'g', false, null, 1),
  ('poulet-pak-choi-sauce-huitre-riz', 'sauce-huitre', 3, 'tbsp', false, null, 2),
  ('poulet-pak-choi-sauce-huitre-riz', 'riz-jasmin', 140, 'g', false, null, 3),
  ('poulet-pak-choi-sauce-huitre-riz', 'ail', 2, 'piece', false, null, 4),
  ('poulet-pak-choi-sauce-huitre-riz', 'gingembre', 10, 'g', false, null, 5),
  ('poulet-pak-choi-sauce-huitre-riz', 'huile-tournesol', 1, 'tbsp', false, null, 6),
  ('poulet-pak-choi-sauce-huitre-riz', 'huile-sesame', 1, 'tsp', true, null, 7),
  ('poulet-pak-choi-sauce-huitre-riz', 'graine-sesame', 5, 'g', true, null, 8),
  ('nouilles-oeufs-boeuf-pousses-soja', 'nouilles-oeufs', 160, 'g', false, null, 0),
  ('nouilles-oeufs-boeuf-pousses-soja', 'boeuf-steak', 250, 'g', false, null, 1),
  ('nouilles-oeufs-boeuf-pousses-soja', 'pousse-soja', 150, 'g', false, null, 2),
  ('nouilles-oeufs-boeuf-pousses-soja', 'carotte', 2, 'piece', false, null, 3),
  ('nouilles-oeufs-boeuf-pousses-soja', 'sauce-huitre', 2, 'tbsp', false, null, 4),
  ('nouilles-oeufs-boeuf-pousses-soja', 'sauce-soja', 1, 'tbsp', false, null, 5),
  ('nouilles-oeufs-boeuf-pousses-soja', 'ail', 1, 'piece', false, null, 6),
  ('nouilles-oeufs-boeuf-pousses-soja', 'huile-tournesol', 1, 'tbsp', false, null, 7),
  ('nouilles-oeufs-boeuf-pousses-soja', 'ciboulette', 5, 'g', true, null, 8),
  ('bo-bun-boeuf-nuoc-mam', 'nouilles-riz', 120, 'g', false, null, 0),
  ('bo-bun-boeuf-nuoc-mam', 'boeuf-steak', 260, 'g', false, null, 1),
  ('bo-bun-boeuf-nuoc-mam', 'pousse-soja', 100, 'g', false, null, 2),
  ('bo-bun-boeuf-nuoc-mam', 'carotte', 2, 'piece', false, null, 3),
  ('bo-bun-boeuf-nuoc-mam', 'salade', 0.5, 'piece', false, null, 4),
  ('bo-bun-boeuf-nuoc-mam', 'nuoc-mam', 3, 'tbsp', false, null, 5),
  ('bo-bun-boeuf-nuoc-mam', 'jus-citron-vert', 2, 'tbsp', false, null, 6),
  ('bo-bun-boeuf-nuoc-mam', 'sucre', 15, 'g', false, null, 7),
  ('bo-bun-boeuf-nuoc-mam', 'ail', 2, 'piece', false, null, 8),
  ('bo-bun-boeuf-nuoc-mam', 'huile-tournesol', 1, 'tbsp', false, null, 9),
  ('bo-bun-boeuf-nuoc-mam', 'cacahuete-grillee', 20, 'g', false, null, 10),
  ('bo-bun-boeuf-nuoc-mam', 'menthe', 5, 'g', true, null, 11),
  ('bo-bun-boeuf-nuoc-mam', 'coriandre', 5, 'g', true, null, 12),
  ('saumon-miso-pak-choi-riz', 'saumon', 260, 'g', false, null, 0),
  ('saumon-miso-pak-choi-riz', 'miso', 30, 'g', false, null, 1),
  ('saumon-miso-pak-choi-riz', 'miel', 10, 'g', false, null, 2),
  ('saumon-miso-pak-choi-riz', 'sauce-soja', 1, 'tbsp', false, null, 3),
  ('saumon-miso-pak-choi-riz', 'pak-choi', 300, 'g', false, null, 4),
  ('saumon-miso-pak-choi-riz', 'riz', 140, 'g', false, null, 5),
  ('saumon-miso-pak-choi-riz', 'gingembre', 5, 'g', false, null, 6),
  ('saumon-miso-pak-choi-riz', 'graine-sesame', 5, 'g', true, null, 7),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'poulet-filet', 300, 'g', false, null, 0),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'sucre', 25, 'g', false, null, 1),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'nuoc-mam', 2, 'tbsp', false, null, 2),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'gingembre', 20, 'g', false, null, 3),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'oignon', 1, 'piece', false, null, 4),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'ail', 2, 'piece', false, null, 5),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'pak-choi', 200, 'g', false, null, 6),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'riz-thai', 140, 'g', false, null, 7),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'huile-tournesol', 1, 'tsp', false, null, 8),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'poivre', null, null, true, null, 9),
  ('poulet-gingembre-nuoc-mam-riz-thai', 'coriandre', 5, 'g', true, null, 10),
  ('omelette-chinoise-crevettes-pousses-soja', 'oeuf', 5, 'piece', false, null, 0),
  ('omelette-chinoise-crevettes-pousses-soja', 'crevette', 150, 'g', false, null, 1),
  ('omelette-chinoise-crevettes-pousses-soja', 'pousse-soja', 150, 'g', false, null, 2),
  ('omelette-chinoise-crevettes-pousses-soja', 'oignon', 1, 'piece', false, null, 3),
  ('omelette-chinoise-crevettes-pousses-soja', 'sauce-huitre', 2, 'tbsp', false, null, 4),
  ('omelette-chinoise-crevettes-pousses-soja', 'fecule-mais', 5, 'g', false, null, 5),
  ('omelette-chinoise-crevettes-pousses-soja', 'riz', 120, 'g', false, null, 6),
  ('omelette-chinoise-crevettes-pousses-soja', 'huile-tournesol', 1, 'tbsp', false, null, 7),
  ('omelette-chinoise-crevettes-pousses-soja', 'ciboulette', 5, 'g', true, null, 8),
  ('nouilles-bouillon-miso-porc-oeuf', 'nouilles-oeufs', 140, 'g', false, null, 0),
  ('nouilles-bouillon-miso-porc-oeuf', 'porc-filet', 250, 'g', false, null, 1),
  ('nouilles-bouillon-miso-porc-oeuf', 'miso', 40, 'g', false, null, 2),
  ('nouilles-bouillon-miso-porc-oeuf', 'bouillon-volaille', 1, 'piece', false, null, 3),
  ('nouilles-bouillon-miso-porc-oeuf', 'pak-choi', 150, 'g', false, null, 4),
  ('nouilles-bouillon-miso-porc-oeuf', 'champignon', 100, 'g', false, null, 5),
  ('nouilles-bouillon-miso-porc-oeuf', 'oeuf', 2, 'piece', false, null, 6),
  ('nouilles-bouillon-miso-porc-oeuf', 'gingembre', 10, 'g', false, null, 7),
  ('nouilles-bouillon-miso-porc-oeuf', 'sauce-soja', 1, 'tbsp', false, null, 8),
  ('nouilles-bouillon-miso-porc-oeuf', 'huile-tournesol', 1, 'tsp', false, null, 9),
  ('nouilles-bouillon-miso-porc-oeuf', 'huile-sesame', 1, 'tsp', true, null, 10),
  ('tofu-miso-pak-choi-nouilles-riz', 'tofu', 400, 'g', false, null, 0),
  ('tofu-miso-pak-choi-nouilles-riz', 'miso', 30, 'g', false, null, 1),
  ('tofu-miso-pak-choi-nouilles-riz', 'miel', 10, 'g', false, null, 2),
  ('tofu-miso-pak-choi-nouilles-riz', 'gingembre', 10, 'g', false, null, 3),
  ('tofu-miso-pak-choi-nouilles-riz', 'pak-choi', 300, 'g', false, null, 4),
  ('tofu-miso-pak-choi-nouilles-riz', 'nouilles-riz', 100, 'g', false, null, 5),
  ('tofu-miso-pak-choi-nouilles-riz', 'fecule-mais', 10, 'g', false, null, 6),
  ('tofu-miso-pak-choi-nouilles-riz', 'huile-tournesol', 1, 'tbsp', false, null, 7),
  ('tofu-miso-pak-choi-nouilles-riz', 'graine-sesame', 5, 'g', true, null, 8)
) as v(recipe, ingredient, qty, unit, optional, note, pos)
join public.recipes r on r.slug = v.recipe
join public.ingredients i on i.slug = v.ingredient;

insert into public.recipe_steps (recipe_id, position, instruction)
select r.id, v.pos, v.instruction
from (values
  ('poulet-pak-choi-sauce-huitre-riz', 1, 'Cuire le riz dans une casserole d''eau bouillante selon le temps indiqué sur le paquet, puis l''égoutter.'),
  ('poulet-pak-choi-sauce-huitre-riz', 2, 'Émincer le poulet, couper le pak choï en quatre dans la longueur, hacher l''ail et râper le gingembre.'),
  ('poulet-pak-choi-sauce-huitre-riz', 3, 'Saisir le poulet 5 minutes dans l''huile, dans un wok à feu vif : il doit être doré et cuit à cœur.'),
  ('poulet-pak-choi-sauce-huitre-riz', 4, 'Ajouter l''ail, le gingembre et le pak choï avec un fond d''eau, et faire sauter 3 minutes : les feuilles doivent tomber et les tiges rester croquantes.'),
  ('poulet-pak-choi-sauce-huitre-riz', 5, 'Verser la sauce d''huître, mélanger 1 minute pour enrober, puis servir avec le riz, l''huile et les graines de sésame.'),
  ('nouilles-oeufs-boeuf-pousses-soja', 1, 'Cuire les nouilles dans une casserole d''eau bouillante selon le temps du paquet, puis les égoutter et les rincer à l''eau froide.'),
  ('nouilles-oeufs-boeuf-pousses-soja', 2, 'Couper le bœuf en fines lanières, les carottes en fins bâtonnets et hacher l''ail.'),
  ('nouilles-oeufs-boeuf-pousses-soja', 3, 'Saisir le bœuf 2 minutes dans l''huile, dans un wok à feu vif, puis le réserver : il doit rester rosé.'),
  ('nouilles-oeufs-boeuf-pousses-soja', 4, 'Faire sauter les carottes et l''ail 3 minutes, puis ajouter les pousses de soja 1 minute.'),
  ('nouilles-oeufs-boeuf-pousses-soja', 5, 'Ajouter les nouilles, le bœuf, la sauce d''huître et la sauce soja, mélanger 2 minutes à feu vif et servir avec la ciboulette.'),
  ('bo-bun-boeuf-nuoc-mam', 1, 'Faire tremper les vermicelles dans de l''eau bouillante hors du feu selon le temps du paquet, puis les égoutter et les rincer à l''eau tiède.'),
  ('bo-bun-boeuf-nuoc-mam', 2, 'Mélanger le nuoc-mâm, le jus de citron vert, le sucre, la moitié de l''ail haché et de l''eau jusqu''à dissoudre le sucre.'),
  ('bo-bun-boeuf-nuoc-mam', 3, 'Râper les carottes, émincer la salade et concasser les cacahuètes.'),
  ('bo-bun-boeuf-nuoc-mam', 4, 'Couper le bœuf en fines lanières et le saisir 3 minutes avec le reste de l''ail dans l''huile, dans une poêle à feu vif.'),
  ('bo-bun-boeuf-nuoc-mam', 5, 'Répartir la salade, les vermicelles, les carottes et les pousses de soja dans des bols, ajouter le bœuf chaud, la sauce, les cacahuètes et les herbes.'),
  ('saumon-miso-pak-choi-riz', 1, 'Préchauffer le four à 200 °C et cuire le riz dans une casserole d''eau bouillante selon le temps du paquet.'),
  ('saumon-miso-pak-choi-riz', 2, 'Mélanger le miso, le miel, la sauce soja et le gingembre râpé jusqu''à obtenir une pâte lisse.'),
  ('saumon-miso-pak-choi-riz', 3, 'Poser le saumon sur une plaque, le badigeonner de la pâte au miso et cuire 12 minutes au four : le dessus doit être caramélisé et le cœur encore nacré.'),
  ('saumon-miso-pak-choi-riz', 4, 'Pendant ce temps, couper le pak choï en quatre et le cuire 4 minutes à la vapeur : les tiges doivent rester croquantes.'),
  ('saumon-miso-pak-choi-riz', 5, 'Servir le saumon avec le pak choï, le riz et les graines de sésame.'),
  ('poulet-gingembre-nuoc-mam-riz-thai', 1, 'Couper le poulet en morceaux, couper le gingembre en fins bâtonnets, émincer l''oignon et hacher l''ail.'),
  ('poulet-gingembre-nuoc-mam-riz-thai', 2, 'Cuire le riz dans une casserole d''eau bouillante selon le temps indiqué sur le paquet, puis l''égoutter.'),
  ('poulet-gingembre-nuoc-mam-riz-thai', 3, 'Faire fondre le sucre à sec dans une sauteuse à feu moyen, sans remuer, jusqu''à obtenir un caramel ambré.'),
  ('poulet-gingembre-nuoc-mam-riz-thai', 4, 'Hors du feu, verser le nuoc-mâm et un fond d''eau (attention aux projections), puis remettre sur le feu et mélanger jusqu''à dissoudre le caramel.'),
  ('poulet-gingembre-nuoc-mam-riz-thai', 5, 'Ajouter le poulet, le gingembre, l''oignon et l''ail, et laisser mijoter 15 minutes en remuant : la sauce doit devenir sirupeuse et le poulet cuit à cœur.'),
  ('poulet-gingembre-nuoc-mam-riz-thai', 6, 'Ajouter le pak choï coupé en morceaux 3 minutes, poivrer et servir avec le riz et la coriandre.'),
  ('omelette-chinoise-crevettes-pousses-soja', 1, 'Cuire le riz dans une casserole d''eau bouillante selon le temps indiqué sur le paquet, puis l''égoutter.'),
  ('omelette-chinoise-crevettes-pousses-soja', 2, 'Émincer l''oignon et le faire sauter 3 minutes avec les crevettes dans la moitié de l''huile, dans une poêle à feu vif, puis ajouter les pousses de soja 1 minute.'),
  ('omelette-chinoise-crevettes-pousses-soja', 3, 'Battre les œufs, y ajouter la garniture, et cuire 4 minutes dans le reste de l''huile à feu moyen, puis retourner l''omelette et cuire 2 minutes : elle doit être dorée des deux côtés.'),
  ('omelette-chinoise-crevettes-pousses-soja', 4, 'Délayer la fécule dans la sauce d''huître et un peu d''eau, puis chauffer 1 minute dans une petite casserole jusqu''à ce que la sauce épaississe.'),
  ('omelette-chinoise-crevettes-pousses-soja', 5, 'Servir l''omelette nappée de sauce avec le riz et la ciboulette.'),
  ('nouilles-bouillon-miso-porc-oeuf', 1, 'Cuire les œufs 6 minutes dans une casserole d''eau bouillante, les rafraîchir et les écaler.'),
  ('nouilles-bouillon-miso-porc-oeuf', 2, 'Porter de l''eau à frémissement dans un faitout avec le bouillon émietté et le gingembre râpé.'),
  ('nouilles-bouillon-miso-porc-oeuf', 3, 'Couper le porc en fines tranches et le dorer 4 minutes dans l''huile avec la sauce soja, dans une poêle à feu vif : il doit être cuit et caramélisé.'),
  ('nouilles-bouillon-miso-porc-oeuf', 4, 'Ajouter les nouilles, les champignons émincés et le pak choï au bouillon, et cuire 4 minutes : les nouilles doivent être tendres.'),
  ('nouilles-bouillon-miso-porc-oeuf', 5, 'Hors du feu, délayer le miso dans une louche de bouillon et le reverser dans le faitout, sans faire bouillir.'),
  ('nouilles-bouillon-miso-porc-oeuf', 6, 'Servir dans des bols avec le porc, les œufs coupés en deux et l''huile de sésame.'),
  ('tofu-miso-pak-choi-nouilles-riz', 1, 'Faire tremper les nouilles dans de l''eau bouillante hors du feu selon le temps du paquet, puis les égoutter.'),
  ('tofu-miso-pak-choi-nouilles-riz', 2, 'Égoutter le tofu, l''éponger, le couper en cubes et l''enrober de fécule.'),
  ('tofu-miso-pak-choi-nouilles-riz', 3, 'Mélanger le miso, le miel, le gingembre râpé et un peu d''eau jusqu''à obtenir une sauce lisse.'),
  ('tofu-miso-pak-choi-nouilles-riz', 4, 'Dorer le tofu 8 minutes dans l''huile, dans une poêle à feu moyen-vif, en le retournant, puis ajouter le pak choï coupé en morceaux 3 minutes.'),
  ('tofu-miso-pak-choi-nouilles-riz', 5, 'Verser la sauce, ajouter les nouilles et mélanger 1 minute, puis servir avec les graines de sésame.')
) as v(recipe, pos, instruction)
join public.recipes r on r.slug = v.recipe;

-- Garde-fou : une jointure silencieusement vide (slug introuvable) fait échouer la migration.
do $$
begin
  if (select count(*) from public.recipe_ingredients ri join public.recipes r on r.id = ri.recipe_id
      where r.slug in ('poulet-pak-choi-sauce-huitre-riz', 'nouilles-oeufs-boeuf-pousses-soja', 'bo-bun-boeuf-nuoc-mam', 'saumon-miso-pak-choi-riz', 'poulet-gingembre-nuoc-mam-riz-thai', 'omelette-chinoise-crevettes-pousses-soja', 'nouilles-bouillon-miso-porc-oeuf', 'tofu-miso-pak-choi-nouilles-riz')) <> 79 then
    raise exception 'Lignes d''ingrédients manquantes dans le vingtième lot de recettes.';
  end if;
end;
$$;
