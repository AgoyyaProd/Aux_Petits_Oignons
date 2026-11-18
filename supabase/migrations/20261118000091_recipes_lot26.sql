-- 0091 — Vingt-sixième lot de recettes du catalogue (publiées et validées) :
-- recettes de la flemme, en remplacement des doublons, au moins 20 g de protéines par part (calcul Ciqual).
-- Fichier GÉNÉRÉ par scripts/generate-recipes-lot26.py depuis scripts/data/recipes-lot26.py.
-- Recettes originales (D7). Ne jamais éditer une fois appliqué.
-- 10 recettes, 82 lignes d'ingrédients, 40 étapes.

insert into public.recipes (slug, title, description, storage_note, servings, prep_minutes,
  cook_minutes, tags, status, source, source_ref, validated_at)
select v.slug, v.title, v.description, v.storage, v.servings, v.prep, v.cook, v.tags,
  'published', 'curated', 'Marmy — recette originale', now()
from (values
  ('raviolis-bouillon-legumes-parmesan', 'Raviolis en bouillon aux petits légumes et parmesan', 'Des raviolis au fromage pochés directement dans un bouillon avec un mélange de légumes surgelés, servis en assiette creuse sous une pluie de parmesan. Une soupe-repas en dix minutes.', 'À manger tout de suite : les raviolis gonflent dans le bouillon.', 2, 2, 10, array['plat', 'soupe', 'flemme', 'express', 'peu-de-vaisselle']::text[]),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 'Bouillon au gingembre, poisson blanc, pak choï et nouilles de riz', 'Des filets de poisson blanc pochés encore surgelés dans un bouillon parfumé au gingembre et à la sauce soja, avec du pak choï et des nouilles de riz. Léger et réconfortant.', 'Se garde 1 jour au réfrigérateur ; les nouilles ramollissent.', 2, 3, 12, array['plat', 'soupe', 'monde', 'flemme', 'express', 'peu-de-vaisselle']::text[]),
  ('veloute-petits-pois-menthe-feta-oeuf', 'Velouté minute de petits pois à la menthe, feta et œuf mollet', 'Des petits pois surgelés cuits dans un bouillon et mixés avec de la menthe, servis avec de la feta émiettée et un œuf mollet. Tout vert, tout doux, prêt en un quart d''heure.', 'Le velouté se garde 2 jours au réfrigérateur ; cuire les œufs au moment.', 2, 3, 10, array['plat', 'soupe', 'flemme', 'express']::text[]),
  ('petits-pois-carottes-jambon-oeufs-dessus', 'Petits pois-carottes au jambon et œufs cuits dessus', 'Des petits pois-carottes surgelés revenus avec des lanières de jambon, puis des œufs cassés directement dans la poêle et cuits à couvert. Un plat unique, une seule poêle.', 'À manger tout de suite.', 2, 2, 13, array['plat', 'poele', 'flemme', 'express', 'peu-de-vaisselle']::text[]),
  ('tofu-pane-puree-minute-carottes-rapees', 'Tofu pané minute, purée et carottes râpées', 'Des tranches de tofu enrobées de chapelure et dorées à la poêle, une purée en flocons et des carottes râpées à la moutarde. Croustillant dehors, fondant dedans, et du croquant à côté.', 'À manger tout de suite : la chapelure ramollit.', 2, 6, 7, array['plat', 'poele', 'flemme', 'express']::text[]),
  ('soupe-froide-concombre-yaourt-falafels', 'Soupe froide de concombre au yaourt, falafels et feta', 'Un concombre mixé avec du yaourt et de la menthe, servi bien frais avec des falafels tièdes et de la feta. Le dîner de la flemme quand il fait chaud.', 'La soupe se garde 1 jour au réfrigérateur ; remuer avant de servir.', 2, 8, 4, array['plat', 'soupe', 'monde', 'flemme', 'express']::text[]),
  ('coquillettes-boeuf-hache-ratatouille', 'Coquillettes au bœuf haché et à la ratatouille', 'Des coquillettes mélangées à du bœuf haché saisi et à une ratatouille de légumes surgelés. Le réconfort d''une bolognaise sans mijotage.', 'Se garde 2 jours au réfrigérateur.', 2, 2, 12, array['plat', 'poele', 'flemme', 'express']::text[]),
  ('galette-riz-croustillante-epinards-oeuf', 'Galette de riz croustillante aux épinards et parmesan', 'Du riz cuit en sachet lié aux œufs, aux épinards et au parmesan, puis tassé dans la poêle jusqu''à former une galette dorée et croustillante. Se coupe en parts comme une tortilla.', 'Se garde 2 jours au réfrigérateur ; se mange aussi froide.', 2, 4, 11, array['plat', 'poele', 'flemme', 'express']::text[]),
  ('assiette-ratatouille-tiede-poulet-houmous', 'Assiette de ratatouille tiède, poulet et houmous', 'Une ratatouille de légumes surgelés poêlée vivement, du poulet cuit, une belle cuillerée de houmous et du pain grillé pour saucer. Une assiette à partager du bout des doigts.', 'La ratatouille au poulet se garde 2 jours au réfrigérateur.', 2, 3, 10, array['plat', 'poele', 'monde', 'flemme', 'express']::text[]),
  ('tortillas-pliees-boeuf-epinards-feta', 'Tortillas pliées au bœuf, épinards et feta', 'Des tortillas garnies de bœuf haché aux épinards et de feta, pliées en deux et dorées à sec dans la poêle, à la manière d''un pain farci turc. Croustillant, fondant, prêt en un quart d''heure.', 'À manger tout de suite.', 2, 4, 10, array['plat', 'poele', 'monde', 'flemme', 'express']::text[])
) as v(slug, title, description, storage, servings, prep, cook, tags);

insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, is_optional,
  preparation_note, position)
select r.id, i.id, v.qty, v.unit, v.optional, v.note, v.pos
from (values
  ('raviolis-bouillon-legumes-parmesan', 'raviolis-frais', 300, 'g', false, null, 0),
  ('raviolis-bouillon-legumes-parmesan', 'melange-legumes', 300, 'g', false, null, 1),
  ('raviolis-bouillon-legumes-parmesan', 'parmesan', 20, 'g', false, null, 2),
  ('raviolis-bouillon-legumes-parmesan', 'bouillon-legumes', 1, 'piece', false, '1 cube pour 800 ml d''eau', 3),
  ('raviolis-bouillon-legumes-parmesan', 'ail', 1, 'piece', true, null, 4),
  ('raviolis-bouillon-legumes-parmesan', 'basilic', null, null, true, null, 5),
  ('raviolis-bouillon-legumes-parmesan', 'poivre', null, null, true, null, 6),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 'poisson-blanc-surgele', 300, 'g', false, '2 à 3 filets', 0),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 'pak-choi', 250, 'g', false, '2 petits', 1),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 'nouilles-riz', 100, 'g', false, null, 2),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 'bouillon-volaille', 1, 'piece', false, '1 cube pour 900 ml d''eau', 3),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 'gingembre', 10, 'g', false, null, 4),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 'sauce-soja', 2, 'tbsp', false, null, 5),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 'coriandre', null, null, true, null, 6),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 'piment', null, null, true, null, 7),
  ('veloute-petits-pois-menthe-feta-oeuf', 'petit-pois', 450, 'g', false, null, 0),
  ('veloute-petits-pois-menthe-feta-oeuf', 'oeuf', 2, 'piece', false, null, 1),
  ('veloute-petits-pois-menthe-feta-oeuf', 'feta', 60, 'g', false, null, 2),
  ('veloute-petits-pois-menthe-feta-oeuf', 'bouillon-legumes', 1, 'piece', false, '1 cube pour 500 ml d''eau', 3),
  ('veloute-petits-pois-menthe-feta-oeuf', 'menthe', 5, 'g', false, null, 4),
  ('veloute-petits-pois-menthe-feta-oeuf', 'huile-olive', 1, 'tbsp', true, null, 5),
  ('veloute-petits-pois-menthe-feta-oeuf', 'poivre', null, null, true, null, 6),
  ('petits-pois-carottes-jambon-oeufs-dessus', 'petits-pois-carottes', 400, 'g', false, null, 0),
  ('petits-pois-carottes-jambon-oeufs-dessus', 'jambon', 2, 'piece', false, '2 tranches', 1),
  ('petits-pois-carottes-jambon-oeufs-dessus', 'oeuf', 4, 'piece', false, null, 2),
  ('petits-pois-carottes-jambon-oeufs-dessus', 'huile-olive', 1, 'tbsp', false, null, 3),
  ('petits-pois-carottes-jambon-oeufs-dessus', 'thym', null, null, true, null, 4),
  ('petits-pois-carottes-jambon-oeufs-dessus', 'sel', null, null, true, null, 5),
  ('petits-pois-carottes-jambon-oeufs-dessus', 'poivre', null, null, true, null, 6),
  ('tofu-pane-puree-minute-carottes-rapees', 'tofu', 250, 'g', false, null, 0),
  ('tofu-pane-puree-minute-carottes-rapees', 'puree-flocons', 70, 'g', false, null, 1),
  ('tofu-pane-puree-minute-carottes-rapees', 'lait', 200, 'ml', false, 'plus 200 ml d''eau', 2),
  ('tofu-pane-puree-minute-carottes-rapees', 'carotte-rapee', 200, 'g', false, null, 3),
  ('tofu-pane-puree-minute-carottes-rapees', 'chapelure', 30, 'g', false, null, 4),
  ('tofu-pane-puree-minute-carottes-rapees', 'moutarde', 1, 'tsp', false, null, 5),
  ('tofu-pane-puree-minute-carottes-rapees', 'vinaigre', 1, 'tsp', false, null, 6),
  ('tofu-pane-puree-minute-carottes-rapees', 'sauce-soja', 1, 'tbsp', false, null, 7),
  ('tofu-pane-puree-minute-carottes-rapees', 'huile-olive', 2, 'tbsp', false, null, 8),
  ('tofu-pane-puree-minute-carottes-rapees', 'sel', null, null, true, null, 9),
  ('tofu-pane-puree-minute-carottes-rapees', 'poivre', null, null, true, null, 10),
  ('soupe-froide-concombre-yaourt-falafels', 'concombre', 1.5, 'piece', false, null, 0),
  ('soupe-froide-concombre-yaourt-falafels', 'yaourt', 4, 'piece', false, null, 1),
  ('soupe-froide-concombre-yaourt-falafels', 'falafel', 200, 'g', false, null, 2),
  ('soupe-froide-concombre-yaourt-falafels', 'feta', 60, 'g', false, null, 3),
  ('soupe-froide-concombre-yaourt-falafels', 'menthe', 5, 'g', false, null, 4),
  ('soupe-froide-concombre-yaourt-falafels', 'jus-citron', 1, 'tbsp', true, null, 5),
  ('soupe-froide-concombre-yaourt-falafels', 'huile-olive', 1, 'tbsp', true, null, 6),
  ('soupe-froide-concombre-yaourt-falafels', 'sel', null, null, true, null, 7),
  ('soupe-froide-concombre-yaourt-falafels', 'poivre', null, null, true, null, 8),
  ('coquillettes-boeuf-hache-ratatouille', 'coquillettes', 150, 'g', false, null, 0),
  ('coquillettes-boeuf-hache-ratatouille', 'boeuf-hache', 250, 'g', false, null, 1),
  ('coquillettes-boeuf-hache-ratatouille', 'legumes-ratatouille', 400, 'g', false, null, 2),
  ('coquillettes-boeuf-hache-ratatouille', 'huile-olive', 1, 'tbsp', false, null, 3),
  ('coquillettes-boeuf-hache-ratatouille', 'herbes-provence', 1, 'tsp', false, null, 4),
  ('coquillettes-boeuf-hache-ratatouille', 'parmesan', 20, 'g', true, null, 5),
  ('coquillettes-boeuf-hache-ratatouille', 'sel', null, null, true, null, 6),
  ('coquillettes-boeuf-hache-ratatouille', 'poivre', null, null, true, null, 7),
  ('galette-riz-croustillante-epinards-oeuf', 'riz-cuit-sachet', 250, 'g', false, '1 sachet', 0),
  ('galette-riz-croustillante-epinards-oeuf', 'oeuf', 3, 'piece', false, null, 1),
  ('galette-riz-croustillante-epinards-oeuf', 'epinard-galets', 250, 'g', false, null, 2),
  ('galette-riz-croustillante-epinards-oeuf', 'parmesan', 30, 'g', false, null, 3),
  ('galette-riz-croustillante-epinards-oeuf', 'huile-olive', 2, 'tbsp', false, null, 4),
  ('galette-riz-croustillante-epinards-oeuf', 'muscade', null, null, true, null, 5),
  ('galette-riz-croustillante-epinards-oeuf', 'sel', null, null, true, null, 6),
  ('galette-riz-croustillante-epinards-oeuf', 'poivre', null, null, true, null, 7),
  ('assiette-ratatouille-tiede-poulet-houmous', 'legumes-ratatouille', 400, 'g', false, null, 0),
  ('assiette-ratatouille-tiede-poulet-houmous', 'poulet-cuit', 150, 'g', false, null, 1),
  ('assiette-ratatouille-tiede-poulet-houmous', 'houmous', 100, 'g', false, null, 2),
  ('assiette-ratatouille-tiede-poulet-houmous', 'pain', 100, 'g', false, null, 3),
  ('assiette-ratatouille-tiede-poulet-houmous', 'huile-olive', 1, 'tbsp', false, null, 4),
  ('assiette-ratatouille-tiede-poulet-houmous', 'cumin', 1, 'tsp', true, null, 5),
  ('assiette-ratatouille-tiede-poulet-houmous', 'sel', null, null, true, null, 6),
  ('assiette-ratatouille-tiede-poulet-houmous', 'poivre', null, null, true, null, 7),
  ('tortillas-pliees-boeuf-epinards-feta', 'tortilla', 4, 'piece', false, null, 0),
  ('tortillas-pliees-boeuf-epinards-feta', 'boeuf-hache', 200, 'g', false, null, 1),
  ('tortillas-pliees-boeuf-epinards-feta', 'epinard-galets', 200, 'g', false, null, 2),
  ('tortillas-pliees-boeuf-epinards-feta', 'feta', 80, 'g', false, null, 3),
  ('tortillas-pliees-boeuf-epinards-feta', 'huile-olive', 1, 'tbsp', false, null, 4),
  ('tortillas-pliees-boeuf-epinards-feta', 'cumin', 1, 'tsp', true, null, 5),
  ('tortillas-pliees-boeuf-epinards-feta', 'piment', null, null, true, null, 6),
  ('tortillas-pliees-boeuf-epinards-feta', 'sel', null, null, true, null, 7),
  ('tortillas-pliees-boeuf-epinards-feta', 'poivre', null, null, true, null, 8)
) as v(recipe, ingredient, qty, unit, optional, note, pos)
join public.recipes r on r.slug = v.recipe
join public.ingredients i on i.slug = v.ingredient;

insert into public.recipe_steps (recipe_id, position, instruction)
select r.id, v.pos, v.instruction
from (values
  ('raviolis-bouillon-legumes-parmesan', 1, 'Porter l''eau à ébullition avec le cube de bouillon et l''ail écrasé.'),
  ('raviolis-bouillon-legumes-parmesan', 2, 'Ajouter les légumes surgelés et cuire 6 minutes à petits bouillons, jusqu''à ce qu''ils soient tendres.'),
  ('raviolis-bouillon-legumes-parmesan', 3, 'Ajouter les raviolis et cuire 2 à 3 minutes, jusqu''à ce qu''ils remontent.'),
  ('raviolis-bouillon-legumes-parmesan', 4, 'Servir en assiettes creuses, parsemé de parmesan et de basilic, et poivré.'),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 1, 'Porter l''eau à ébullition avec le cube, le gingembre en lamelles et la sauce soja.'),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 2, 'Plonger les filets encore surgelés et pocher 7 à 8 minutes à frémissement, jusqu''à ce que la chair s''effeuille.'),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 3, 'Ajouter le pak choï coupé en quartiers et les nouilles, puis cuire 3 à 4 minutes.'),
  ('bouillon-gingembre-poisson-blanc-pak-choi', 4, 'Servir dans des bols avec la coriandre et le piment.'),
  ('veloute-petits-pois-menthe-feta-oeuf', 1, 'Cuire les petits pois surgelés 8 minutes dans l''eau bouillante avec le cube de bouillon.'),
  ('veloute-petits-pois-menthe-feta-oeuf', 2, 'En même temps, plonger les œufs dans l''eau bouillante 6 minutes, puis les rafraîchir et les écaler.'),
  ('veloute-petits-pois-menthe-feta-oeuf', 3, 'Mixer les petits pois avec leur bouillon et la menthe jusqu''à un velouté lisse.'),
  ('veloute-petits-pois-menthe-feta-oeuf', 4, 'Servir avec la feta émiettée, l''œuf coupé en deux, un filet d''huile et du poivre.'),
  ('petits-pois-carottes-jambon-oeufs-dessus', 1, 'Faire revenir les petits pois-carottes surgelés avec le thym dans la poêle huilée, à couvert, 7 à 8 minutes à feu moyen.'),
  ('petits-pois-carottes-jambon-oeufs-dessus', 2, 'Ajouter le jambon en lanières et mélanger 1 minute.'),
  ('petits-pois-carottes-jambon-oeufs-dessus', 3, 'Creuser quatre puits, y casser les œufs, couvrir et cuire 3 à 4 minutes, jusqu''à ce que le blanc soit pris.'),
  ('petits-pois-carottes-jambon-oeufs-dessus', 4, 'Servir directement dans la poêle, salé et poivré.'),
  ('tofu-pane-puree-minute-carottes-rapees', 1, 'Assaisonner les carottes râpées avec la moutarde, le vinaigre, un filet d''huile, du sel et du poivre.'),
  ('tofu-pane-puree-minute-carottes-rapees', 2, 'Couper le tofu en tranches, les badigeonner de sauce soja et les rouler dans la chapelure.'),
  ('tofu-pane-puree-minute-carottes-rapees', 3, 'Dorer les tranches dans la poêle huilée à feu moyen, 3 minutes de chaque côté.'),
  ('tofu-pane-puree-minute-carottes-rapees', 4, 'Porter le lait et l''eau à frémissement, retirer du feu, verser les flocons et mélanger ; servir le tout ensemble.'),
  ('soupe-froide-concombre-yaourt-falafels', 1, 'Couper le concombre en morceaux et le mixer avec le yaourt, la menthe, le jus de citron, du sel et du poivre.'),
  ('soupe-froide-concombre-yaourt-falafels', 2, 'Réserver la soupe au réfrigérateur pendant la suite.'),
  ('soupe-froide-concombre-yaourt-falafels', 3, 'Réchauffer les falafels dans une poêle légèrement huilée, 4 minutes en les retournant.'),
  ('soupe-froide-concombre-yaourt-falafels', 4, 'Servir la soupe froide avec la feta émiettée, un filet d''huile et les falafels à côté.'),
  ('coquillettes-boeuf-hache-ratatouille', 1, 'Cuire les coquillettes dans l''eau bouillante salée selon le paquet, puis les égoutter.'),
  ('coquillettes-boeuf-hache-ratatouille', 2, 'Saisir le bœuf haché dans une sauteuse huilée à feu vif, 4 minutes en l''émiettant.'),
  ('coquillettes-boeuf-hache-ratatouille', 3, 'Ajouter les légumes surgelés et les herbes, puis cuire 7 minutes à feu vif, jusqu''à ce que l''eau soit évaporée.'),
  ('coquillettes-boeuf-hache-ratatouille', 4, 'Mélanger avec les coquillettes et servir avec le parmesan.'),
  ('galette-riz-croustillante-epinards-oeuf', 1, 'Faire fondre les épinards surgelés dans la poêle huilée à couvert, 5 minutes, puis les presser pour retirer l''eau.'),
  ('galette-riz-croustillante-epinards-oeuf', 2, 'Mélanger le riz, les épinards, les œufs battus, le parmesan, la muscade, du sel et du poivre.'),
  ('galette-riz-croustillante-epinards-oeuf', 3, 'Verser dans la poêle huilée bien chaude, tasser et cuire 4 minutes à feu moyen, jusqu''à ce que le dessous soit doré.'),
  ('galette-riz-croustillante-epinards-oeuf', 4, 'Retourner la galette à l''aide d''une assiette et dorer l''autre face 2 minutes.'),
  ('assiette-ratatouille-tiede-poulet-houmous', 1, 'Faire revenir les légumes surgelés et le cumin dans la poêle huilée à feu vif, 8 minutes, jusqu''à ce que l''eau soit évaporée.'),
  ('assiette-ratatouille-tiede-poulet-houmous', 2, 'Ajouter le poulet en lamelles et réchauffer 1 minute.'),
  ('assiette-ratatouille-tiede-poulet-houmous', 3, 'Griller le pain.'),
  ('assiette-ratatouille-tiede-poulet-houmous', 4, 'Servir la ratatouille au poulet avec le houmous et le pain grillé.'),
  ('tortillas-pliees-boeuf-epinards-feta', 1, 'Faire fondre les épinards surgelés dans la poêle huilée à couvert, 4 minutes.'),
  ('tortillas-pliees-boeuf-epinards-feta', 2, 'Ajouter le bœuf haché et le cumin, puis cuire 4 minutes à feu vif en émiettant, jusqu''à ce que l''eau soit évaporée.'),
  ('tortillas-pliees-boeuf-epinards-feta', 3, 'Répartir la farce et la feta émiettée sur une moitié de chaque tortilla, puis plier.'),
  ('tortillas-pliees-boeuf-epinards-feta', 4, 'Dorer les tortillas dans la poêle sèche, 1 minute de chaque côté, et couper en deux.')
) as v(recipe, pos, instruction)
join public.recipes r on r.slug = v.recipe;

-- Garde-fou : une jointure silencieusement vide (slug introuvable) fait échouer la migration.
do $$
begin
  if (select count(*) from public.recipe_ingredients ri join public.recipes r on r.id = ri.recipe_id
      where r.slug in ('raviolis-bouillon-legumes-parmesan', 'bouillon-gingembre-poisson-blanc-pak-choi', 'veloute-petits-pois-menthe-feta-oeuf', 'petits-pois-carottes-jambon-oeufs-dessus', 'tofu-pane-puree-minute-carottes-rapees', 'soupe-froide-concombre-yaourt-falafels', 'coquillettes-boeuf-hache-ratatouille', 'galette-riz-croustillante-epinards-oeuf', 'assiette-ratatouille-tiede-poulet-houmous', 'tortillas-pliees-boeuf-epinards-feta')) <> 82 then
    raise exception 'Lignes d''ingrédients manquantes dans le vingt-sixième lot de recettes.';
  end if;
end;
$$;
