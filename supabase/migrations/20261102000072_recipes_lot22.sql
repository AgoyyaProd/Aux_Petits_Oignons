-- 0072 — Vingt-deuxième lot de recettes du catalogue (publiées et validées) :
-- flammekueches (classique, saumon fumé et variantes), au moins 20 g de protéines par part (calcul Ciqual).
-- Fichier GÉNÉRÉ par scripts/generate-recipes-lot22.py depuis scripts/data/recipes-lot22.py.
-- Recettes originales (D7). Ne jamais éditer une fois appliqué.
-- 6 recettes, 67 lignes d'ingrédients, 39 étapes.

insert into public.recipes (slug, title, description, storage_note, servings, prep_minutes,
  cook_minutes, tags, status, source, source_ref, validated_at)
select v.slug, v.title, v.description, v.storage, v.servings, v.prep, v.cook, v.tags,
  'published', 'curated', 'Aux Petits Oignons — recette originale', now()
from (values
  ('flammekueche-classique-lardons-oignons', 'Flammekueche classique aux lardons et oignons', 'La tarte flambée alsacienne : une pâte très fine et croustillante, nappée de fromage blanc et de crème, couverte d''oignons émincés et de lardons, cuite à four très chaud.', 'À manger tout de suite ; la pâte crue se garde 1 jour au réfrigérateur, filmée.', 2, 25, 12, array['plat', 'four', 'economique']::text[]),
  ('flammekueche-saumon-fume-oignon-rouge', 'Flammekueche au saumon fumé et à l''oignon rouge', 'Une tarte flambée garnie de crème au fromage blanc et d''oignon rouge, cuite très chaude puis couverte de saumon fumé, de ciboulette et d''un trait de citron à la sortie du four.', 'À manger tout de suite : le saumon s''ajoute toujours au dernier moment.', 2, 25, 12, array['plat', 'four']::text[]),
  ('flammekueche-gratinee-emmental', 'Flammekueche gratinée à l''emmental', 'La version gratinée de la tarte flambée : crème au fromage blanc, oignons, lardons et une couche d''emmental râpé qui dore à four très chaud.', 'À manger tout de suite ; se réchauffe quelques minutes au four.', 2, 25, 12, array['plat', 'four', 'economique']::text[]),
  ('flammekueche-poireaux-chevre', 'Flammekueche aux poireaux et au chèvre', 'Une tarte flambée sans viande : poireaux fondus au beurre, crème au fromage blanc et rondelles de chèvre qui dorent à la cuisson, avec un filet de miel à la sortie du four.', 'À manger tout de suite ; se réchauffe quelques minutes au four.', 2, 30, 12, array['plat', 'four']::text[]),
  ('flammekueche-munster-pommes-de-terre', 'Flammekueche au munster et aux pommes de terre', 'Une tarte flambée bien alsacienne, garnie de fines rondelles de pommes de terre, d''oignons, de munster et d''une pointe de cumin.', 'À manger tout de suite ; se réchauffe quelques minutes au four.', 2, 30, 14, array['plat', 'four']::text[]),
  ('flammekueche-forestiere-champignons-lardons', 'Flammekueche forestière aux champignons et lardons', 'Une tarte flambée garnie de champignons poêlés à l''ail, de lardons, d''oignons et de crème au fromage blanc, gratinée d''un peu de comté.', 'À manger tout de suite ; se réchauffe quelques minutes au four.', 2, 30, 12, array['plat', 'four']::text[])
) as v(slug, title, description, storage, servings, prep, cook, tags);

insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, is_optional,
  preparation_note, position)
select r.id, i.id, v.qty, v.unit, v.optional, v.note, v.pos
from (values
  ('flammekueche-classique-lardons-oignons', 'farine', 250, 'g', false, null, 0),
  ('flammekueche-classique-lardons-oignons', 'eau', 13, 'cl', false, null, 1),
  ('flammekueche-classique-lardons-oignons', 'huile-tournesol', 2, 'tbsp', false, null, 2),
  ('flammekueche-classique-lardons-oignons', 'sel', 2, 'g', false, null, 3),
  ('flammekueche-classique-lardons-oignons', 'fromage-blanc', 150, 'g', false, null, 4),
  ('flammekueche-classique-lardons-oignons', 'creme-fraiche', 10, 'cl', false, null, 5),
  ('flammekueche-classique-lardons-oignons', 'oignon', 2, 'piece', false, null, 6),
  ('flammekueche-classique-lardons-oignons', 'lardon', 150, 'g', false, null, 7),
  ('flammekueche-classique-lardons-oignons', 'muscade', 1, 'g', true, null, 8),
  ('flammekueche-classique-lardons-oignons', 'poivre', null, null, true, null, 9),
  ('flammekueche-saumon-fume-oignon-rouge', 'farine', 250, 'g', false, null, 0),
  ('flammekueche-saumon-fume-oignon-rouge', 'eau', 13, 'cl', false, null, 1),
  ('flammekueche-saumon-fume-oignon-rouge', 'huile-tournesol', 2, 'tbsp', false, null, 2),
  ('flammekueche-saumon-fume-oignon-rouge', 'sel', 2, 'g', false, null, 3),
  ('flammekueche-saumon-fume-oignon-rouge', 'fromage-blanc', 150, 'g', false, null, 4),
  ('flammekueche-saumon-fume-oignon-rouge', 'creme-fraiche', 10, 'cl', false, null, 5),
  ('flammekueche-saumon-fume-oignon-rouge', 'oignon-rouge', 2, 'piece', false, null, 6),
  ('flammekueche-saumon-fume-oignon-rouge', 'saumon-fume', 150, 'g', false, null, 7),
  ('flammekueche-saumon-fume-oignon-rouge', 'citron', 1, 'piece', false, null, 8),
  ('flammekueche-saumon-fume-oignon-rouge', 'ciboulette', 5, 'g', false, null, 9),
  ('flammekueche-saumon-fume-oignon-rouge', 'poivre', null, null, true, null, 10),
  ('flammekueche-gratinee-emmental', 'farine', 250, 'g', false, null, 0),
  ('flammekueche-gratinee-emmental', 'eau', 13, 'cl', false, null, 1),
  ('flammekueche-gratinee-emmental', 'huile-tournesol', 2, 'tbsp', false, null, 2),
  ('flammekueche-gratinee-emmental', 'sel', 2, 'g', false, null, 3),
  ('flammekueche-gratinee-emmental', 'fromage-blanc', 150, 'g', false, null, 4),
  ('flammekueche-gratinee-emmental', 'creme-fraiche', 10, 'cl', false, null, 5),
  ('flammekueche-gratinee-emmental', 'oignon', 2, 'piece', false, null, 6),
  ('flammekueche-gratinee-emmental', 'lardon', 120, 'g', false, null, 7),
  ('flammekueche-gratinee-emmental', 'emmental', 80, 'g', false, null, 8),
  ('flammekueche-gratinee-emmental', 'poivre', null, null, true, null, 9),
  ('flammekueche-poireaux-chevre', 'farine', 250, 'g', false, null, 0),
  ('flammekueche-poireaux-chevre', 'eau', 13, 'cl', false, null, 1),
  ('flammekueche-poireaux-chevre', 'huile-tournesol', 2, 'tbsp', false, null, 2),
  ('flammekueche-poireaux-chevre', 'sel', 2, 'g', false, null, 3),
  ('flammekueche-poireaux-chevre', 'fromage-blanc', 150, 'g', false, null, 4),
  ('flammekueche-poireaux-chevre', 'creme-fraiche', 5, 'cl', false, null, 5),
  ('flammekueche-poireaux-chevre', 'poireau', 2, 'piece', false, null, 6),
  ('flammekueche-poireaux-chevre', 'chevre', 120, 'g', false, null, 7),
  ('flammekueche-poireaux-chevre', 'beurre', 10, 'g', false, null, 8),
  ('flammekueche-poireaux-chevre', 'miel', 10, 'g', true, null, 9),
  ('flammekueche-poireaux-chevre', 'noix', 20, 'g', true, null, 10),
  ('flammekueche-poireaux-chevre', 'poivre', null, null, true, null, 11),
  ('flammekueche-munster-pommes-de-terre', 'farine', 250, 'g', false, null, 0),
  ('flammekueche-munster-pommes-de-terre', 'eau', 13, 'cl', false, null, 1),
  ('flammekueche-munster-pommes-de-terre', 'huile-tournesol', 2, 'tbsp', false, null, 2),
  ('flammekueche-munster-pommes-de-terre', 'sel', 2, 'g', false, null, 3),
  ('flammekueche-munster-pommes-de-terre', 'fromage-blanc', 150, 'g', false, null, 4),
  ('flammekueche-munster-pommes-de-terre', 'creme-fraiche', 5, 'cl', false, null, 5),
  ('flammekueche-munster-pommes-de-terre', 'pomme-de-terre', 200, 'g', false, null, 6),
  ('flammekueche-munster-pommes-de-terre', 'oignon', 1, 'piece', false, null, 7),
  ('flammekueche-munster-pommes-de-terre', 'munster', 120, 'g', false, null, 8),
  ('flammekueche-munster-pommes-de-terre', 'cumin', 1, 'g', false, null, 9),
  ('flammekueche-munster-pommes-de-terre', 'poivre', null, null, true, null, 10),
  ('flammekueche-forestiere-champignons-lardons', 'farine', 250, 'g', false, null, 0),
  ('flammekueche-forestiere-champignons-lardons', 'eau', 13, 'cl', false, null, 1),
  ('flammekueche-forestiere-champignons-lardons', 'huile-tournesol', 2, 'tbsp', false, null, 2),
  ('flammekueche-forestiere-champignons-lardons', 'sel', 2, 'g', false, null, 3),
  ('flammekueche-forestiere-champignons-lardons', 'fromage-blanc', 150, 'g', false, null, 4),
  ('flammekueche-forestiere-champignons-lardons', 'creme-fraiche', 5, 'cl', false, null, 5),
  ('flammekueche-forestiere-champignons-lardons', 'champignon', 200, 'g', false, null, 6),
  ('flammekueche-forestiere-champignons-lardons', 'lardon', 100, 'g', false, null, 7),
  ('flammekueche-forestiere-champignons-lardons', 'oignon', 1, 'piece', false, null, 8),
  ('flammekueche-forestiere-champignons-lardons', 'comte', 50, 'g', false, null, 9),
  ('flammekueche-forestiere-champignons-lardons', 'ail', 1, 'piece', false, null, 10),
  ('flammekueche-forestiere-champignons-lardons', 'persil', 5, 'g', true, null, 11),
  ('flammekueche-forestiere-champignons-lardons', 'poivre', null, null, true, null, 12)
) as v(recipe, ingredient, qty, unit, optional, note, pos)
join public.recipes r on r.slug = v.recipe
join public.ingredients i on i.slug = v.ingredient;

insert into public.recipe_steps (recipe_id, position, instruction)
select r.id, v.pos, v.instruction
from (values
  ('flammekueche-classique-lardons-oignons', 1, 'Mélanger la farine, le sel, l''huile et l''eau dans un saladier, puis pétrir 5 minutes jusqu''à obtenir une pâte lisse et souple. La laisser reposer 15 minutes sous un torchon.'),
  ('flammekueche-classique-lardons-oignons', 2, 'Préchauffer le four à 250 °C avec une plaque à l''intérieur.'),
  ('flammekueche-classique-lardons-oignons', 3, 'Couper la pâte en deux et étaler chaque moitié le plus finement possible sur une feuille de papier cuisson, en un grand rectangle : on doit presque voir à travers.'),
  ('flammekueche-classique-lardons-oignons', 4, 'Mélanger le fromage blanc et la crème avec la muscade et du poivre, et émincer les oignons en lamelles très fines.'),
  ('flammekueche-classique-lardons-oignons', 5, 'Étaler la crème sur la pâte jusqu''aux bords, puis répartir les oignons et les lardons crus.'),
  ('flammekueche-classique-lardons-oignons', 6, 'Faire glisser chaque tarte avec son papier sur la plaque chaude et cuire 10 à 12 minutes : les bords doivent être dorés et croustillants, le dessous ferme.'),
  ('flammekueche-saumon-fume-oignon-rouge', 1, 'Mélanger la farine, le sel, l''huile et l''eau dans un saladier, puis pétrir 5 minutes jusqu''à obtenir une pâte lisse et souple. La laisser reposer 15 minutes sous un torchon.'),
  ('flammekueche-saumon-fume-oignon-rouge', 2, 'Préchauffer le four à 250 °C avec une plaque à l''intérieur.'),
  ('flammekueche-saumon-fume-oignon-rouge', 3, 'Couper la pâte en deux et étaler chaque moitié le plus finement possible sur une feuille de papier cuisson, en un grand rectangle : on doit presque voir à travers.'),
  ('flammekueche-saumon-fume-oignon-rouge', 4, 'Mélanger le fromage blanc et la crème avec le zeste du citron et du poivre, et émincer les oignons rouges en fines lamelles.'),
  ('flammekueche-saumon-fume-oignon-rouge', 5, 'Étaler la crème sur la pâte jusqu''aux bords et répartir les oignons rouges.'),
  ('flammekueche-saumon-fume-oignon-rouge', 6, 'Faire glisser chaque tarte avec son papier sur la plaque chaude et cuire 10 à 12 minutes : les bords doivent être dorés et croustillants, le dessous ferme.'),
  ('flammekueche-saumon-fume-oignon-rouge', 7, 'À la sortie du four, couvrir de saumon fumé en lanières, de ciboulette ciselée et d''un trait de jus de citron.'),
  ('flammekueche-gratinee-emmental', 1, 'Mélanger la farine, le sel, l''huile et l''eau dans un saladier, puis pétrir 5 minutes jusqu''à obtenir une pâte lisse et souple. La laisser reposer 15 minutes sous un torchon.'),
  ('flammekueche-gratinee-emmental', 2, 'Préchauffer le four à 250 °C avec une plaque à l''intérieur.'),
  ('flammekueche-gratinee-emmental', 3, 'Couper la pâte en deux et étaler chaque moitié le plus finement possible sur une feuille de papier cuisson, en un grand rectangle : on doit presque voir à travers.'),
  ('flammekueche-gratinee-emmental', 4, 'Mélanger le fromage blanc et la crème avec du poivre, et émincer les oignons en lamelles très fines.'),
  ('flammekueche-gratinee-emmental', 5, 'Étaler la crème sur la pâte, répartir les oignons et les lardons, puis parsemer d''emmental râpé.'),
  ('flammekueche-gratinee-emmental', 6, 'Faire glisser chaque tarte avec son papier sur la plaque chaude et cuire 10 à 12 minutes : les bords doivent être dorés et croustillants, le dessous ferme.'),
  ('flammekueche-poireaux-chevre', 1, 'Mélanger la farine, le sel, l''huile et l''eau dans un saladier, puis pétrir 5 minutes jusqu''à obtenir une pâte lisse et souple. La laisser reposer 15 minutes sous un torchon.'),
  ('flammekueche-poireaux-chevre', 2, 'Préchauffer le four à 250 °C avec une plaque à l''intérieur.'),
  ('flammekueche-poireaux-chevre', 3, 'Couper la pâte en deux et étaler chaque moitié le plus finement possible sur une feuille de papier cuisson, en un grand rectangle : on doit presque voir à travers.'),
  ('flammekueche-poireaux-chevre', 4, 'Émincer les poireaux et les faire fondre 8 minutes dans le beurre, dans une poêle à feu doux : ils doivent être tendres sans colorer.'),
  ('flammekueche-poireaux-chevre', 5, 'Mélanger le fromage blanc et la crème avec du poivre, l''étaler sur la pâte, puis répartir les poireaux et le chèvre en rondelles.'),
  ('flammekueche-poireaux-chevre', 6, 'Faire glisser chaque tarte avec son papier sur la plaque chaude et cuire 10 à 12 minutes : les bords doivent être dorés et croustillants, le dessous ferme.'),
  ('flammekueche-poireaux-chevre', 7, 'À la sortie du four, arroser d''un filet de miel et parsemer de noix concassées.'),
  ('flammekueche-munster-pommes-de-terre', 1, 'Mélanger la farine, le sel, l''huile et l''eau dans un saladier, puis pétrir 5 minutes jusqu''à obtenir une pâte lisse et souple. La laisser reposer 15 minutes sous un torchon.'),
  ('flammekueche-munster-pommes-de-terre', 2, 'Préchauffer le four à 250 °C avec une plaque à l''intérieur.'),
  ('flammekueche-munster-pommes-de-terre', 3, 'Couper la pâte en deux et étaler chaque moitié le plus finement possible sur une feuille de papier cuisson, en un grand rectangle : on doit presque voir à travers.'),
  ('flammekueche-munster-pommes-de-terre', 4, 'Couper les pommes de terre en rondelles très fines et les cuire 5 minutes dans une casserole d''eau bouillante salée, puis les égoutter.'),
  ('flammekueche-munster-pommes-de-terre', 5, 'Mélanger le fromage blanc et la crème avec du poivre, l''étaler sur la pâte, puis répartir les pommes de terre, l''oignon émincé et le munster en lamelles.'),
  ('flammekueche-munster-pommes-de-terre', 6, 'Parsemer de cumin, puis faire glisser chaque tarte avec son papier sur la plaque chaude et cuire 12 à 14 minutes : les bords doivent être dorés et le fromage fondu.'),
  ('flammekueche-forestiere-champignons-lardons', 1, 'Mélanger la farine, le sel, l''huile et l''eau dans un saladier, puis pétrir 5 minutes jusqu''à obtenir une pâte lisse et souple. La laisser reposer 15 minutes sous un torchon.'),
  ('flammekueche-forestiere-champignons-lardons', 2, 'Préchauffer le four à 250 °C avec une plaque à l''intérieur.'),
  ('flammekueche-forestiere-champignons-lardons', 3, 'Couper la pâte en deux et étaler chaque moitié le plus finement possible sur une feuille de papier cuisson, en un grand rectangle : on doit presque voir à travers.'),
  ('flammekueche-forestiere-champignons-lardons', 4, 'Émincer les champignons et les faire sauter 5 minutes avec l''ail haché dans une poêle à feu vif, jusqu''à ce qu''ils aient rendu leur eau.'),
  ('flammekueche-forestiere-champignons-lardons', 5, 'Mélanger le fromage blanc et la crème avec du poivre, l''étaler sur la pâte, puis répartir l''oignon émincé, les champignons, les lardons et le comté râpé.'),
  ('flammekueche-forestiere-champignons-lardons', 6, 'Faire glisser chaque tarte avec son papier sur la plaque chaude et cuire 10 à 12 minutes : les bords doivent être dorés et croustillants, le dessous ferme.'),
  ('flammekueche-forestiere-champignons-lardons', 7, 'Parsemer de persil à la sortie du four.')
) as v(recipe, pos, instruction)
join public.recipes r on r.slug = v.recipe;

-- Garde-fou : une jointure silencieusement vide (slug introuvable) fait échouer la migration.
do $$
begin
  if (select count(*) from public.recipe_ingredients ri join public.recipes r on r.id = ri.recipe_id
      where r.slug in ('flammekueche-classique-lardons-oignons', 'flammekueche-saumon-fume-oignon-rouge', 'flammekueche-gratinee-emmental', 'flammekueche-poireaux-chevre', 'flammekueche-munster-pommes-de-terre', 'flammekueche-forestiere-champignons-lardons')) <> 67 then
    raise exception 'Lignes d''ingrédients manquantes dans le vingt-deuxième lot de recettes.';
  end if;
end;
$$;
