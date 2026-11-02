-- 0066 — Dix-huitième lot de recettes du catalogue (publiées et validées) :
-- plats à la sauce teriyaki et aux tomates séchées, au moins 20 g de protéines par part (calcul Ciqual).
-- Fichier GÉNÉRÉ par scripts/generate-recipes-lot18.py depuis scripts/data/recipes-lot18.py.
-- Recettes originales (D7). Ne jamais éditer une fois appliqué.
-- 8 recettes, 74 lignes d'ingrédients, 41 étapes.

insert into public.recipes (slug, title, description, storage_note, servings, prep_minutes,
  cook_minutes, tags, status, source, source_ref, validated_at)
select v.slug, v.title, v.description, v.storage, v.servings, v.prep, v.cook, v.tags,
  'published', 'curated', 'Aux Petits Oignons — recette originale', now()
from (values
  ('saumon-teriyaki-riz-jasmin-brocoli', 'Saumon teriyaki, riz jasmin et brocoli', 'Des pavés de saumon laqués à la sauce teriyaki à la poêle, servis sur du riz jasmin avec du brocoli croquant et des graines de sésame.', 'Se garde 2 jours au réfrigérateur ; réchauffer doucement pour ne pas dessécher le saumon.', 2, 10, 20, array['plat', 'poele', 'monde', 'express']::text[]),
  ('nouilles-sautees-poulet-teriyaki-chou', 'Nouilles sautées au poulet teriyaki et chou', 'Des nouilles de riz sautées au wok avec du poulet émincé, du chou vert et des carottes, liées à la sauce teriyaki et parfumées au gingembre.', 'Se garde 2 jours au réfrigérateur ; réchauffer à la poêle avec une cuillère d''eau.', 2, 15, 15, array['plat', 'poele', 'monde']::text[]),
  ('tofu-teriyaki-champignons-riz', 'Tofu teriyaki aux champignons et riz', 'Des cubes de tofu dorés à la poêle puis laqués de sauce teriyaki, avec des champignons sautés et du riz. Un bloc de tofu entier pour deux.', 'Se garde 3 jours au réfrigérateur ; se mange réchauffé, le tofu perd un peu de croustillant.', 2, 10, 20, array['plat', 'poele', 'monde', 'lunch-box']::text[]),
  ('boulettes-boeuf-teriyaki-riz-carottes', 'Boulettes de bœuf teriyaki, riz et carottes', 'Des boulettes de bœuf haché au gingembre, dorées puis glacées à la sauce teriyaki, avec du riz et des carottes rôties à la poêle.', 'Se garde 3 jours au réfrigérateur ou 2 mois au congélateur (boulettes en sauce).', 2, 15, 20, array['plat', 'poele', 'monde', 'batch-cooking']::text[]),
  ('pates-tomates-sechees-feta-epinards', 'Pâtes aux tomates séchées, feta et épinards', 'Des pâtes enrobées d''une sauce minute à l''huile d''olive, à l''ail et aux tomates séchées, avec des épinards fondus, de la feta et du parmesan.', 'Se garde 2 jours au réfrigérateur ; se mange aussi froid, en salade.', 2, 10, 15, array['plat', 'poele', 'express']::text[]),
  ('salade-pois-chiches-poulet-tomates-sechees', 'Salade de pois chiches, poulet et tomates séchées', 'Une salade complète de pois chiches, quinoa et poulet doré, avec des tomates séchées, de la mâche et une vinaigrette au citron. Parfaite en boîte-repas.', 'Se garde 3 jours au réfrigérateur ; ajouter la mâche au dernier moment.', 2, 15, 15, array['salade', 'plat', 'lunch-box']::text[]),
  ('cake-sale-tomates-sechees-jambon-feta', 'Cake salé aux tomates séchées, jambon et feta', 'Un cake moelleux garni de tomates séchées, de dés de jambon, de feta et d''emmental, servi en tranches avec une salade de mâche.', 'Se garde 3 jours au réfrigérateur, emballé ; se congèle en tranches.', 4, 15, 45, array['plat', 'four', 'lunch-box', 'batch-cooking']::text[]),
  ('cabillaud-croute-tomates-sechees-puree', 'Cabillaud en croûte de tomates séchées et purée', 'Des dos de cabillaud au four sous une croûte de tomates séchées, chapelure et parmesan, avec une purée de pommes de terre maison.', 'Se garde 2 jours au réfrigérateur ; réchauffer le poisson au four pour garder la croûte.', 2, 15, 25, array['plat', 'four']::text[])
) as v(slug, title, description, storage, servings, prep, cook, tags);

insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, is_optional,
  preparation_note, position)
select r.id, i.id, v.qty, v.unit, v.optional, v.note, v.pos
from (values
  ('saumon-teriyaki-riz-jasmin-brocoli', 'saumon', 260, 'g', false, null, 0),
  ('saumon-teriyaki-riz-jasmin-brocoli', 'sauce-teriyaki', 4, 'tbsp', false, null, 1),
  ('saumon-teriyaki-riz-jasmin-brocoli', 'riz-jasmin', 140, 'g', false, null, 2),
  ('saumon-teriyaki-riz-jasmin-brocoli', 'brocoli', 300, 'g', false, null, 3),
  ('saumon-teriyaki-riz-jasmin-brocoli', 'huile-tournesol', 1, 'tsp', false, null, 4),
  ('saumon-teriyaki-riz-jasmin-brocoli', 'graine-sesame', 5, 'g', true, null, 5),
  ('saumon-teriyaki-riz-jasmin-brocoli', 'jus-citron-vert', 1, 'tbsp', true, null, 6),
  ('nouilles-sautees-poulet-teriyaki-chou', 'poulet-filet', 260, 'g', false, null, 0),
  ('nouilles-sautees-poulet-teriyaki-chou', 'nouilles-riz', 120, 'g', false, null, 1),
  ('nouilles-sautees-poulet-teriyaki-chou', 'chou-vert', 200, 'g', false, null, 2),
  ('nouilles-sautees-poulet-teriyaki-chou', 'carotte', 2, 'piece', false, null, 3),
  ('nouilles-sautees-poulet-teriyaki-chou', 'sauce-teriyaki', 4, 'tbsp', false, null, 4),
  ('nouilles-sautees-poulet-teriyaki-chou', 'gingembre', 10, 'g', false, null, 5),
  ('nouilles-sautees-poulet-teriyaki-chou', 'ail', 1, 'piece', false, null, 6),
  ('nouilles-sautees-poulet-teriyaki-chou', 'huile-tournesol', 1, 'tbsp', false, null, 7),
  ('nouilles-sautees-poulet-teriyaki-chou', 'huile-sesame', 1, 'tsp', true, null, 8),
  ('nouilles-sautees-poulet-teriyaki-chou', 'coriandre', 5, 'g', true, null, 9),
  ('tofu-teriyaki-champignons-riz', 'tofu', 400, 'g', false, null, 0),
  ('tofu-teriyaki-champignons-riz', 'champignon', 250, 'g', false, null, 1),
  ('tofu-teriyaki-champignons-riz', 'riz', 140, 'g', false, null, 2),
  ('tofu-teriyaki-champignons-riz', 'sauce-teriyaki', 4, 'tbsp', false, null, 3),
  ('tofu-teriyaki-champignons-riz', 'fecule-mais', 10, 'g', false, null, 4),
  ('tofu-teriyaki-champignons-riz', 'huile-tournesol', 1, 'tbsp', false, null, 5),
  ('tofu-teriyaki-champignons-riz', 'graine-sesame', 5, 'g', true, null, 6),
  ('tofu-teriyaki-champignons-riz', 'ciboulette', 5, 'g', true, null, 7),
  ('boulettes-boeuf-teriyaki-riz-carottes', 'boeuf-hache', 300, 'g', false, null, 0),
  ('boulettes-boeuf-teriyaki-riz-carottes', 'chapelure', 20, 'g', false, null, 1),
  ('boulettes-boeuf-teriyaki-riz-carottes', 'oeuf', 1, 'piece', false, null, 2),
  ('boulettes-boeuf-teriyaki-riz-carottes', 'gingembre', 10, 'g', false, null, 3),
  ('boulettes-boeuf-teriyaki-riz-carottes', 'sauce-teriyaki', 4, 'tbsp', false, null, 4),
  ('boulettes-boeuf-teriyaki-riz-carottes', 'riz', 140, 'g', false, null, 5),
  ('boulettes-boeuf-teriyaki-riz-carottes', 'carotte', 3, 'piece', false, null, 6),
  ('boulettes-boeuf-teriyaki-riz-carottes', 'huile-tournesol', 1, 'tbsp', false, null, 7),
  ('boulettes-boeuf-teriyaki-riz-carottes', 'graine-sesame', 5, 'g', true, null, 8),
  ('pates-tomates-sechees-feta-epinards', 'pates', 180, 'g', false, null, 0),
  ('pates-tomates-sechees-feta-epinards', 'tomate-sechee', 60, 'g', false, null, 1),
  ('pates-tomates-sechees-feta-epinards', 'epinard', 200, 'g', false, null, 2),
  ('pates-tomates-sechees-feta-epinards', 'feta', 100, 'g', false, null, 3),
  ('pates-tomates-sechees-feta-epinards', 'parmesan', 20, 'g', false, null, 4),
  ('pates-tomates-sechees-feta-epinards', 'ail', 1, 'piece', false, null, 5),
  ('pates-tomates-sechees-feta-epinards', 'huile-olive', 1, 'tbsp', false, null, 6),
  ('pates-tomates-sechees-feta-epinards', 'poivre', null, null, true, null, 7),
  ('pates-tomates-sechees-feta-epinards', 'basilic', 5, 'g', true, null, 8),
  ('salade-pois-chiches-poulet-tomates-sechees', 'pois-chiche', 265, 'g', false, null, 0),
  ('salade-pois-chiches-poulet-tomates-sechees', 'poulet-filet', 200, 'g', false, null, 1),
  ('salade-pois-chiches-poulet-tomates-sechees', 'quinoa', 80, 'g', false, null, 2),
  ('salade-pois-chiches-poulet-tomates-sechees', 'tomate-sechee', 50, 'g', false, null, 3),
  ('salade-pois-chiches-poulet-tomates-sechees', 'mache', 60, 'g', false, null, 4),
  ('salade-pois-chiches-poulet-tomates-sechees', 'jus-citron', 2, 'tbsp', false, null, 5),
  ('salade-pois-chiches-poulet-tomates-sechees', 'huile-olive', 2, 'tbsp', false, null, 6),
  ('salade-pois-chiches-poulet-tomates-sechees', 'persil', 5, 'g', true, null, 7),
  ('salade-pois-chiches-poulet-tomates-sechees', 'poivre', null, null, true, null, 8),
  ('cake-sale-tomates-sechees-jambon-feta', 'farine', 180, 'g', false, null, 0),
  ('cake-sale-tomates-sechees-jambon-feta', 'levure-chimique', 10, 'g', false, null, 1),
  ('cake-sale-tomates-sechees-jambon-feta', 'oeuf', 3, 'piece', false, null, 2),
  ('cake-sale-tomates-sechees-jambon-feta', 'lait', 10, 'cl', false, null, 3),
  ('cake-sale-tomates-sechees-jambon-feta', 'huile-olive', 6, 'cl', false, null, 4),
  ('cake-sale-tomates-sechees-jambon-feta', 'jambon', 4, 'piece', false, null, 5),
  ('cake-sale-tomates-sechees-jambon-feta', 'tomate-sechee', 60, 'g', false, null, 6),
  ('cake-sale-tomates-sechees-jambon-feta', 'feta', 100, 'g', false, null, 7),
  ('cake-sale-tomates-sechees-jambon-feta', 'emmental', 60, 'g', false, null, 8),
  ('cake-sale-tomates-sechees-jambon-feta', 'mache', 100, 'g', false, null, 9),
  ('cake-sale-tomates-sechees-jambon-feta', 'poivre', null, null, true, null, 10),
  ('cake-sale-tomates-sechees-jambon-feta', 'herbes-provence', 1, 'g', true, null, 11),
  ('cabillaud-croute-tomates-sechees-puree', 'cabillaud', 300, 'g', false, null, 0),
  ('cabillaud-croute-tomates-sechees-puree', 'tomate-sechee', 40, 'g', false, null, 1),
  ('cabillaud-croute-tomates-sechees-puree', 'chapelure', 20, 'g', false, null, 2),
  ('cabillaud-croute-tomates-sechees-puree', 'parmesan', 20, 'g', false, null, 3),
  ('cabillaud-croute-tomates-sechees-puree', 'huile-olive', 1, 'tbsp', false, null, 4),
  ('cabillaud-croute-tomates-sechees-puree', 'pomme-de-terre', 500, 'g', false, null, 5),
  ('cabillaud-croute-tomates-sechees-puree', 'lait', 10, 'cl', false, null, 6),
  ('cabillaud-croute-tomates-sechees-puree', 'beurre', 15, 'g', false, null, 7),
  ('cabillaud-croute-tomates-sechees-puree', 'sel', null, null, true, null, 8),
  ('cabillaud-croute-tomates-sechees-puree', 'poivre', null, null, true, null, 9)
) as v(recipe, ingredient, qty, unit, optional, note, pos)
join public.recipes r on r.slug = v.recipe
join public.ingredients i on i.slug = v.ingredient;

insert into public.recipe_steps (recipe_id, position, instruction)
select r.id, v.pos, v.instruction
from (values
  ('saumon-teriyaki-riz-jasmin-brocoli', 1, 'Cuire le riz dans une casserole d''eau bouillante selon le temps indiqué sur le paquet, puis l''égoutter.'),
  ('saumon-teriyaki-riz-jasmin-brocoli', 2, 'Détailler le brocoli en petits bouquets et le cuire 5 minutes à la vapeur ou à l''eau bouillante : il doit rester vert vif et croquant.'),
  ('saumon-teriyaki-riz-jasmin-brocoli', 3, 'Saisir le saumon côté peau 4 minutes dans l''huile, dans une poêle à feu moyen-vif, puis le retourner et le cuire 2 minutes.'),
  ('saumon-teriyaki-riz-jasmin-brocoli', 4, 'Verser la sauce teriyaki dans la poêle et laisser bouillonner 1 à 2 minutes en arrosant le saumon : la sauce doit napper et devenir brillante.'),
  ('saumon-teriyaki-riz-jasmin-brocoli', 5, 'Servir le saumon sur le riz avec le brocoli, napper du reste de sauce, parsemer de sésame et arroser de jus de citron vert.'),
  ('nouilles-sautees-poulet-teriyaki-chou', 1, 'Émincer le poulet et le chou, couper les carottes en fins bâtonnets, râper le gingembre et hacher l''ail.'),
  ('nouilles-sautees-poulet-teriyaki-chou', 2, 'Faire tremper les nouilles dans de l''eau bouillante hors du feu selon le temps du paquet, puis les égoutter.'),
  ('nouilles-sautees-poulet-teriyaki-chou', 3, 'Saisir le poulet 5 minutes dans l''huile, dans un wok ou une grande poêle à feu vif : il doit être doré et cuit à cœur.'),
  ('nouilles-sautees-poulet-teriyaki-chou', 4, 'Ajouter le chou, les carottes, l''ail et le gingembre, et faire sauter 4 minutes : les légumes doivent rester croquants.'),
  ('nouilles-sautees-poulet-teriyaki-chou', 5, 'Ajouter les nouilles et la sauce teriyaki, mélanger 2 minutes à feu vif, puis servir avec l''huile de sésame et la coriandre.'),
  ('tofu-teriyaki-champignons-riz', 1, 'Cuire le riz dans une casserole d''eau bouillante selon le temps indiqué sur le paquet, puis l''égoutter.'),
  ('tofu-teriyaki-champignons-riz', 2, 'Égoutter le tofu, l''éponger, le couper en cubes et l''enrober de fécule.'),
  ('tofu-teriyaki-champignons-riz', 3, 'Dorer le tofu 8 minutes dans l''huile, dans une poêle à feu moyen-vif, en le retournant : il doit être croustillant sur toutes les faces.'),
  ('tofu-teriyaki-champignons-riz', 4, 'Ajouter les champignons émincés et les faire sauter 4 minutes, jusqu''à ce qu''ils aient rendu leur eau.'),
  ('tofu-teriyaki-champignons-riz', 5, 'Verser la sauce teriyaki et mélanger 1 minute pour laquer, puis servir sur le riz avec le sésame et la ciboulette.'),
  ('boulettes-boeuf-teriyaki-riz-carottes', 1, 'Cuire le riz dans une casserole d''eau bouillante selon le temps indiqué sur le paquet, puis l''égoutter.'),
  ('boulettes-boeuf-teriyaki-riz-carottes', 2, 'Mélanger le bœuf, la chapelure, l''œuf et le gingembre râpé, puis former une douzaine de boulettes.'),
  ('boulettes-boeuf-teriyaki-riz-carottes', 3, 'Couper les carottes en rondelles fines et les dorer 8 minutes dans la moitié de l''huile, dans une poêle à feu moyen : elles doivent être tendres. Les réserver.'),
  ('boulettes-boeuf-teriyaki-riz-carottes', 4, 'Dorer les boulettes 8 minutes dans le reste de l''huile, dans la même poêle, en les roulant : elles doivent être brunes sur toutes les faces.'),
  ('boulettes-boeuf-teriyaki-riz-carottes', 5, 'Verser la sauce teriyaki, laisser réduire 2 minutes en enrobant les boulettes, puis servir avec le riz, les carottes et le sésame.'),
  ('pates-tomates-sechees-feta-epinards', 1, 'Cuire les pâtes dans une grande casserole d''eau bouillante salée selon le temps du paquet, puis les égoutter en gardant un fond d''eau de cuisson.'),
  ('pates-tomates-sechees-feta-epinards', 2, 'Couper les tomates séchées en lanières et hacher l''ail.'),
  ('pates-tomates-sechees-feta-epinards', 3, 'Faire revenir l''ail et les tomates séchées 2 minutes dans l''huile, dans une sauteuse à feu moyen, sans laisser l''ail brunir.'),
  ('pates-tomates-sechees-feta-epinards', 4, 'Ajouter les épinards et les laisser tomber 2 minutes en remuant.'),
  ('pates-tomates-sechees-feta-epinards', 5, 'Ajouter les pâtes et un peu d''eau de cuisson, mélanger, puis servir avec la feta émiettée, le parmesan râpé, le poivre et le basilic.'),
  ('salade-pois-chiches-poulet-tomates-sechees', 1, 'Rincer le quinoa et le cuire 12 minutes dans une casserole d''eau bouillante, puis l''égoutter et le laisser tiédir.'),
  ('salade-pois-chiches-poulet-tomates-sechees', 2, 'Couper le poulet en dés et le dorer 6 minutes dans la moitié de l''huile, dans une poêle à feu moyen : il doit être cuit à cœur.'),
  ('salade-pois-chiches-poulet-tomates-sechees', 3, 'Égoutter et rincer les pois chiches, et couper les tomates séchées en lanières.'),
  ('salade-pois-chiches-poulet-tomates-sechees', 4, 'Fouetter le jus de citron avec le reste de l''huile et du poivre.'),
  ('salade-pois-chiches-poulet-tomates-sechees', 5, 'Mélanger le quinoa, les pois chiches, le poulet, les tomates séchées et la vinaigrette, puis ajouter la mâche et le persil au moment de servir.'),
  ('cake-sale-tomates-sechees-jambon-feta', 1, 'Préchauffer le four à 180 °C et huiler un moule à cake.'),
  ('cake-sale-tomates-sechees-jambon-feta', 2, 'Couper le jambon en dés, les tomates séchées en lanières et émietter la feta.'),
  ('cake-sale-tomates-sechees-jambon-feta', 3, 'Fouetter les œufs, le lait et l''huile dans un saladier, puis incorporer la farine et la levure jusqu''à obtenir une pâte lisse.'),
  ('cake-sale-tomates-sechees-jambon-feta', 4, 'Ajouter le jambon, les tomates séchées, la feta, l''emmental râpé, le poivre et les herbes, et mélanger sans trop travailler la pâte.'),
  ('cake-sale-tomates-sechees-jambon-feta', 5, 'Verser dans le moule et cuire 45 minutes : la lame d''un couteau doit ressortir sèche.'),
  ('cake-sale-tomates-sechees-jambon-feta', 6, 'Laisser tiédir 10 minutes avant de démouler, puis servir en tranches avec la mâche.'),
  ('cabillaud-croute-tomates-sechees-puree', 1, 'Préchauffer le four à 200 °C.'),
  ('cabillaud-croute-tomates-sechees-puree', 2, 'Éplucher les pommes de terre, les couper en morceaux et les cuire 20 minutes dans une casserole d''eau salée : la pointe d''un couteau doit s''enfoncer sans résistance.'),
  ('cabillaud-croute-tomates-sechees-puree', 3, 'Hacher finement les tomates séchées et les mélanger à la chapelure, au parmesan râpé et à l''huile.'),
  ('cabillaud-croute-tomates-sechees-puree', 4, 'Poser le cabillaud dans un plat, le couvrir de ce mélange en pressant et cuire 15 minutes au four : la croûte doit être dorée et le poisson nacré.'),
  ('cabillaud-croute-tomates-sechees-puree', 5, 'Écraser les pommes de terre avec le lait chaud et le beurre, saler, poivrer et servir avec le poisson.')
) as v(recipe, pos, instruction)
join public.recipes r on r.slug = v.recipe;

-- Garde-fou : une jointure silencieusement vide (slug introuvable) fait échouer la migration.
do $$
begin
  if (select count(*) from public.recipe_ingredients ri join public.recipes r on r.id = ri.recipe_id
      where r.slug in ('saumon-teriyaki-riz-jasmin-brocoli', 'nouilles-sautees-poulet-teriyaki-chou', 'tofu-teriyaki-champignons-riz', 'boulettes-boeuf-teriyaki-riz-carottes', 'pates-tomates-sechees-feta-epinards', 'salade-pois-chiches-poulet-tomates-sechees', 'cake-sale-tomates-sechees-jambon-feta', 'cabillaud-croute-tomates-sechees-puree')) <> 74 then
    raise exception 'Lignes d''ingrédients manquantes dans le dix-huitième lot de recettes.';
  end if;
end;
$$;
