# Vingt-quatrième lot de recettes originales — exécuté par scripts/generate-recipes-lot24.py.
# « Recettes de la flemme » : très rapides mais équilibrées, grâce à des produits simples
# (légumes surgelés nature, palets de légumes, légumineuses en conserve, poisson surgelé,
# falafels, houmous, carottes râpées). Nouveaux ingrédients : NEW_INGREDIENTS du générateur.
#
# Critères du tag « flemme », vérifiés par tests/db/flemme.test.ts :
#   - 15 minutes au plus en tout, dont 10 au plus de préparation ;
#   - 5 ingrédients obligatoires au plus hors placard (huile, sel, épices, sauces…) ;
#   - 4 étapes au plus ;
#   - au moins 80 g de légumes par part et 20 g de protéines par part (calcul Ciqual).
# Syntaxe : voir scripts/generate-recipes-migration.py. Aucune recette copiée (D7).
# Étapes : une action par étape, feu, temps et repère visuel ; aucune quantité dans le texte.

recipe("palets-legumes-oeufs-plat-salade", "Palets de légumes, œufs au plat et salade",
       "Des palets de légumes dorés à la poêle, des œufs au plat et une salade verte vinaigrette. Le dîner du soir où l'on n'a envie de rien, prêt en moins d'un quart d'heure.",
       2, 3, 10, ["plat", "poele", "flemme", "express", "peu-de-vaisselle"],
       ["palet-legumes 300 g | 8 palets", "oeuf 5 piece", "salade 0.5 piece",
        "huile-olive 2 tbsp", "vinaigre 1 tsp", "moutarde 1 tsp ?", "sel ?", "poivre ?"],
       ["Faire dorer les palets surgelés dans une poêle huilée à feu moyen, 4 à 5 minutes de chaque côté.",
        "Pousser les palets sur le côté et casser les œufs dans la poêle : cuire 3 à 4 minutes, jusqu'à ce que le blanc soit pris.",
        "Mélanger l'huile, le vinaigre et la moutarde, puis y retourner la salade lavée.",
        "Servir les palets et les œufs salés et poivrés, avec la salade à côté."],
       storage="À manger tout de suite.")

recipe("palets-legumes-pois-chiches-feta-yaourt", "Palets de légumes, pois chiches à la feta et sauce blanche",
       "Des palets de légumes poêlés avec une salade express de pois chiches, feta et concombre, et une sauce au fromage blanc et aux herbes.",
       2, 7, 8, ["plat", "poele", "flemme", "express"],
       ["palet-legumes 300 g | 8 palets", "pois-chiche 265 g | 1 boîte égouttée", "feta 100 g",
        "fromage-blanc 150 g", "concombre 0.5 piece", "huile-olive 2 tbsp", "vinaigre 1 tsp",
        "ciboulette 5 g ?", "sel ?", "poivre ?"],
       ["Faire dorer les palets surgelés dans une poêle huilée à feu moyen, 4 minutes de chaque côté.",
        "Rincer et égoutter les pois chiches, couper le concombre en dés et émietter la feta, puis mélanger avec un filet d'huile et le vinaigre.",
        "Mélanger le fromage blanc avec la ciboulette ciselée, du sel et du poivre.",
        "Servir les palets avec la salade de pois chiches et la sauce."],
       storage="La salade de pois chiches se garde 2 jours au réfrigérateur ; les palets se mangent chauds.")

recipe("omelette-legumes-surgeles-emmental", "Omelette aux légumes surgelés et emmental",
       "Un mélange de légumes surgelés revenu à la poêle, puis pris dans une omelette baveuse et gratinée d'emmental. Rien à éplucher, rien à couper.",
       2, 3, 10, ["plat", "poele", "flemme", "express", "peu-de-vaisselle"],
       ["melange-legumes 300 g", "oeuf 5 piece", "emmental 40 g", "huile-olive 1 tbsp",
        "herbes-provence 1 tsp ?", "sel ?", "poivre ?"],
       ["Faire revenir les légumes surgelés dans la poêle huilée à feu vif, 5 à 6 minutes, jusqu'à ce qu'ils n'aient plus de glace et commencent à dorer.",
        "Battre les œufs avec les herbes, du sel et du poivre.",
        "Verser les œufs sur les légumes et cuire 3 à 4 minutes à feu moyen sans remuer, jusqu'à ce que le dessus soit presque pris.",
        "Parsemer d'emmental, plier l'omelette en deux et servir aussitôt."],
       storage="À manger tout de suite.")

recipe("poisson-blanc-epinards-semoule", "Poisson blanc, épinards et semoule au citron",
       "Des filets de poisson blanc cuits directement surgelés, des épinards en galets et une semoule prête en 5 minutes. Léger, riche en protéines, sans décongélation.",
       2, 2, 13, ["plat", "poele", "flemme", "express"],
       ["poisson-blanc-surgele 300 g | 2 à 3 filets", "epinard-galets 300 g", "semoule 120 g",
        "huile-olive 2 tbsp", "jus-citron 1 tbsp ?", "ail 1 piece ?", "sel ?", "poivre ?"],
       ["Mettre les épinards surgelés dans une casserole avec un filet d'huile et l'ail écrasé, couvrir et cuire 8 à 10 minutes à feu doux en remuant de temps en temps.",
        "Poser les filets encore surgelés dans une poêle huilée, couvrir et cuire 10 à 12 minutes à feu moyen en les retournant à mi-cuisson : la chair doit s'effeuiller.",
        "Verser la semoule dans un bol, la couvrir d'eau bouillante salée à hauteur, couvrir 5 minutes puis l'égrener à la fourchette.",
        "Servir le poisson arrosé de jus de citron, avec les épinards et la semoule."],
       storage="Se garde 1 jour au réfrigérateur ; réchauffer doucement à couvert.")

recipe("wraps-falafels-carottes-houmous", "Wraps de falafels, houmous et carottes râpées",
       "Des tortillas tartinées de houmous, garnies de falafels réchauffés, de carottes râpées et d'une sauce au fromage blanc. Cinq produits, dix minutes.",
       2, 5, 5, ["plat", "poele", "flemme", "express", "lunch-box"],
       ["tortilla 4 piece", "falafel 200 g", "houmous 80 g", "carotte-rapee 200 g",
        "fromage-blanc 100 g", "cumin 0.5 tsp ?", "huile-olive 1 tsp ?", "sel ?"],
       ["Réchauffer les falafels dans une poêle légèrement huilée, 4 à 5 minutes à feu moyen en les retournant.",
        "Mélanger le fromage blanc avec le cumin et une pincée de sel.",
        "Tartiner chaque tortilla de houmous, puis garnir de carottes râpées, de falafels écrasés grossièrement et de sauce.",
        "Rouler les tortillas bien serrées et les couper en deux."],
       storage="Se garde 1 jour au réfrigérateur, emballé ; la sauce à part si possible.")

recipe("lentilles-oeufs-mollets-carottes", "Bol de lentilles, œufs mollets et carottes râpées",
       "Des lentilles en conserve en salade avec des carottes râpées, une vinaigrette moutardée et des œufs mollets au jaune coulant. Un vrai repas sans allumer plus d'une casserole.",
       2, 5, 6, ["plat", "salade", "flemme", "express", "lunch-box", "peu-de-vaisselle"],
       ["lentille-boite 400 g | 1 grande boîte égouttée", "oeuf 4 piece", "carotte-rapee 200 g",
        "moutarde 1 tsp", "huile-olive 2 tbsp", "vinaigre 1 tbsp", "persil 5 g ?", "sel ?", "poivre ?"],
       ["Plonger les œufs dans l'eau bouillante et cuire 6 minutes, puis les passer sous l'eau froide.",
        "Fouetter la moutarde, le vinaigre, l'huile, du sel et du poivre.",
        "Rincer et égoutter les lentilles, puis les mélanger aux carottes râpées et à la vinaigrette.",
        "Écaler les œufs, les poser sur les lentilles et parsemer de persil."],
       storage="Les lentilles assaisonnées se gardent 2 jours au réfrigérateur ; les œufs, 1 jour dans leur coquille.")

recipe("gnocchis-epinards-parmesan", "Gnocchis poêlés aux épinards et parmesan",
       "Des gnocchis dorés à la poêle, mêlés à des épinards fondus à l'ail et couverts de parmesan. Un plat réconfortant prêt en 12 minutes.",
       2, 2, 10, ["plat", "poele", "flemme", "express", "peu-de-vaisselle"],
       ["gnocchi 500 g", "epinard-galets 300 g", "parmesan 50 g", "ail 1 piece",
        "huile-olive 2 tbsp", "muscade ?", "poivre ?"],
       ["Faire dorer les gnocchis dans la poêle huilée à feu moyen-vif, 6 à 8 minutes en remuant, jusqu'à ce qu'ils soient croustillants.",
        "Ajouter l'ail écrasé et les épinards surgelés, couvrir et cuire 5 minutes en remuant jusqu'à ce qu'ils soient fondus.",
        "Assaisonner de muscade et de poivre.",
        "Servir couvert de parmesan râpé."],
       storage="Se garde 1 jour au réfrigérateur ; réchauffer à la poêle.")

recipe("wok-legumes-crevettes-nouilles", "Wok de légumes, crevettes et nouilles de riz",
       "Un wok de légumes surgelés sauté avec des crevettes et des nouilles de riz, relevé de sauce soja. Plus rapide qu'une livraison.",
       2, 2, 10, ["plat", "poele", "monde", "flemme", "express"],
       ["legumes-wok 400 g", "crevette 250 g | décortiquées", "nouilles-riz 120 g",
        "sauce-soja 2 tbsp", "huile-sesame 1 tbsp", "gingembre ?", "piment ?"],
       ["Couvrir les nouilles d'eau bouillante et les laisser gonfler 5 minutes, puis les égoutter.",
        "Faire sauter les légumes surgelés dans le wok huilé à feu vif, 5 à 6 minutes.",
        "Ajouter les crevettes et le gingembre, et sauter 2 à 3 minutes jusqu'à ce qu'elles soient roses.",
        "Ajouter les nouilles et la sauce soja, mélanger 1 minute et servir avec du piment."],
       storage="Se garde 1 jour au réfrigérateur ; réchauffer au wok avec un trait d'eau.")

recipe("semoule-poulet-legumes-couscous", "Semoule express au poulet et légumes du couscous",
       "Le goût d'un couscous en un quart d'heure : légumes pour couscous surgelés, dés de poulet aux épices et semoule gonflée à l'eau bouillante.",
       2, 3, 12, ["plat", "poele", "monde", "flemme", "express"],
       ["poulet-filet 300 g", "legumes-couscous 400 g", "semoule 120 g", "huile-olive 2 tbsp",
        "cumin 1 tsp", "paprika 1 tsp", "harissa 10 g ?", "sel ?"],
       ["Couper le poulet en dés et le faire dorer dans la sauteuse huilée avec le cumin et le paprika, 5 minutes à feu vif.",
        "Ajouter les légumes surgelés et un fond d'eau, couvrir et cuire 8 minutes : les légumes doivent être tendres.",
        "Verser la semoule dans un bol, la couvrir d'eau bouillante salée à hauteur, couvrir 5 minutes puis l'égrener.",
        "Servir la semoule avec le poulet et ses légumes, et un peu de harissa pour ceux qui aiment."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("ratatouille-express-oeufs-feta", "Ratatouille express aux œufs et à la feta",
       "Des légumes pour ratatouille surgelés mijotés dans la tomate, des œufs pochés dedans et de la feta émiettée. À saucer avec du pain.",
       2, 2, 13, ["plat", "poele", "flemme", "express", "peu-de-vaisselle"],
       ["legumes-ratatouille 450 g", "tomate-concassee 200 g", "oeuf 4 piece", "feta 60 g",
        "pain 100 g", "huile-olive 1 tbsp", "herbes-provence 1 tsp ?", "sel ?", "poivre ?"],
       ["Faire revenir les légumes surgelés dans la poêle huilée à feu vif, 4 minutes.",
        "Ajouter la tomate et les herbes, puis laisser mijoter 4 minutes.",
        "Creuser quatre puits, y casser les œufs, couvrir et cuire 5 minutes à feu doux : le blanc doit être pris.",
        "Parsemer de feta émiettée et servir avec le pain."],
       storage="La ratatouille seule se garde 3 jours au réfrigérateur ; les œufs se cuisent au moment.")

recipe("haricots-verts-thon-oeufs-tiede", "Salade tiède de haricots verts, thon et œufs",
       "Des haricots verts surgelés cuits avec les œufs dans la même casserole, puis mélangés au thon, aux tomates cerises et à une vinaigrette.",
       2, 4, 10, ["plat", "salade", "flemme", "express", "lunch-box", "peu-de-vaisselle"],
       ["haricot-vert-surgele 400 g", "thon-boite 140 g | 1 boîte égouttée", "oeuf 2 piece",
        "tomate-cerise 150 g", "huile-olive 2 tbsp", "vinaigre 1 tbsp", "moutarde 1 tsp ?", "sel ?", "poivre ?"],
       ["Plonger les œufs et les haricots surgelés dans l'eau bouillante salée et cuire 9 minutes.",
        "Égoutter, passer les œufs sous l'eau froide et les écaler.",
        "Fouetter l'huile, le vinaigre et la moutarde, puis y mélanger les haricots, le thon émietté et les tomates coupées en deux.",
        "Servir tiède, avec les œufs coupés en quartiers."],
       storage="Se garde 1 jour au réfrigérateur, sans les œufs coupés.")

recipe("tacos-poisson-blanc-carottes-yaourt", "Tacos de poisson blanc, carottes râpées et sauce yaourt",
       "Des tortillas garnies de poisson blanc poêlé au paprika, de carottes râpées au citron vert et d'une sauce au yaourt.",
       2, 5, 10, ["plat", "poele", "monde", "flemme", "express"],
       ["poisson-blanc-surgele 300 g | 2 à 3 filets", "tortilla 4 piece", "carotte-rapee 200 g",
        "yaourt 1 piece", "jus-citron-vert 2 tbsp", "paprika 1 tsp", "huile-olive 1 tbsp", "sel ?"],
       ["Cuire les filets surgelés dans la poêle huilée avec le paprika, à couvert 10 minutes à feu moyen en les retournant, puis les effeuiller.",
        "Mélanger les carottes avec la moitié du jus de citron vert et une pincée de sel.",
        "Mélanger le yaourt avec le reste du jus de citron vert.",
        "Garnir les tortillas réchauffées de carottes, de poisson et de sauce."],
       storage="À manger tout de suite.")

recipe("lentilles-curry-epinards-coco", "Lentilles au curry, épinards et lait de coco",
       "Des lentilles en conserve mijotées 10 minutes au curry avec des épinards surgelés et du lait de coco, servies avec un yaourt. Le dahl de la flemme.",
       2, 2, 10, ["plat", "poele", "monde", "flemme", "express", "peu-de-vaisselle"],
       ["lentille-boite 400 g | 1 grande boîte égouttée", "epinard-galets 300 g",
        "lait-coco 200 ml", "yaourt 2 piece", "curry 2 tsp", "huile-olive 1 tbsp", "sel ?"],
       ["Faire chauffer le curry une minute dans la casserole huilée à feu moyen.",
        "Ajouter les épinards surgelés et le lait de coco, couvrir et cuire 5 minutes en remuant.",
        "Ajouter les lentilles rincées et égouttées, saler et laisser mijoter 4 minutes.",
        "Servir avec une cuillerée de yaourt."],
       storage="Se garde 3 jours au réfrigérateur ; se congèle bien.")

recipe("melange-legumes-tofu-nouilles", "Nouilles de riz, tofu doré et légumes sautés",
       "Du tofu doré à la poêle, un mélange de légumes surgelés et des nouilles de riz, liés à la sauce soja et au sésame.",
       2, 3, 10, ["plat", "poele", "monde", "flemme", "express"],
       ["tofu 300 g", "melange-legumes 400 g", "nouilles-riz 120 g", "sauce-soja 2 tbsp",
        "huile-sesame 1 tbsp", "graine-sesame 5 g ?", "gingembre ?"],
       ["Couvrir les nouilles d'eau bouillante et les laisser gonfler 5 minutes, puis les égoutter.",
        "Couper le tofu en dés et le faire dorer dans la poêle huilée à feu vif, 4 minutes.",
        "Ajouter les légumes surgelés et le gingembre, puis sauter 5 minutes.",
        "Ajouter les nouilles et la sauce soja, mélanger 1 minute et parsemer de sésame."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("salade-pois-chiches-thon-carottes", "Salade de pois chiches, thon et carottes râpées",
       "Pois chiches, thon, carottes râpées et concombre, avec une vinaigrette au cumin. Aucune cuisson, prête en 8 minutes, parfaite à emporter.",
       2, 8, 0, ["plat", "salade", "sans-cuisson", "flemme", "express", "lunch-box", "peu-de-vaisselle"],
       ["pois-chiche 265 g | 1 boîte égouttée", "thon-boite 140 g | 1 boîte égouttée",
        "carotte-rapee 200 g", "concombre 0.5 piece", "huile-olive 2 tbsp", "vinaigre 1 tbsp",
        "cumin 0.5 tsp ?", "persil 5 g ?", "sel ?", "poivre ?"],
       ["Rincer et égoutter les pois chiches.",
        "Couper le concombre en dés et émietter le thon.",
        "Mélanger tous les ingrédients avec l'huile, le vinaigre, le cumin, du sel et du poivre, puis parsemer de persil."],
       storage="Se garde 2 jours au réfrigérateur, en boîte fermée.")

recipe("tartines-houmous-oeufs-carottes", "Tartines de houmous, œufs mollets et carottes",
       "Du bon pain tartiné de houmous, des carottes râpées et des œufs mollets. Un repas complet sans cuisine, à part l'eau qui bout.",
       2, 5, 6, ["plat", "flemme", "express", "peu-de-vaisselle"],
       ["pain 150 g | 4 tranches", "houmous 100 g", "oeuf 4 piece", "carotte-rapee 160 g",
        "paprika ?", "huile-olive 1 tsp ?", "sel ?"],
       ["Plonger les œufs dans l'eau bouillante et cuire 6 minutes, puis les passer sous l'eau froide.",
        "Faire griller le pain.",
        "Tartiner le pain de houmous et le couvrir de carottes râpées arrosées d'un filet d'huile.",
        "Écaler les œufs, les poser sur les tartines, saler et saupoudrer de paprika."],
       storage="À manger tout de suite.")

recipe("palets-legumes-saumon-fume-fromage-frais", "Palets de légumes, saumon fumé et fromage frais",
       "Des palets de légumes bien dorés, du saumon fumé, un fromage frais aux herbes et une salade verte. Un dîner de fête sans effort.",
       2, 3, 10, ["plat", "poele", "flemme", "express"],
       ["palet-legumes 300 g | 8 palets", "saumon-fume 150 g", "fromage-frais 80 g",
        "salade 0.5 piece", "huile-olive 2 tbsp", "vinaigre 1 tsp", "ciboulette 5 g ?", "poivre ?"],
       ["Faire dorer les palets surgelés dans une poêle huilée à feu moyen, 4 à 5 minutes de chaque côté.",
        "Mélanger le fromage frais avec la ciboulette ciselée et du poivre.",
        "Assaisonner la salade avec l'huile et le vinaigre.",
        "Servir les palets chauds avec le saumon fumé, le fromage frais et la salade."],
       storage="À manger tout de suite.")

recipe("gnocchis-ratatouille-mozzarella", "Gnocchis poêlés, ratatouille express et mozzarella",
       "Des gnocchis dorés dans la poêle avec des légumes pour ratatouille surgelés, puis couverts de mozzarella qui fond. Douze minutes, une seule poêle.",
       2, 2, 12, ["plat", "poele", "flemme", "express", "peu-de-vaisselle"],
       ["gnocchi 400 g", "legumes-ratatouille 300 g", "mozzarella 1 piece", "huile-olive 2 tbsp",
        "herbes-provence 1 tsp ?", "basilic ?", "sel ?", "poivre ?"],
       ["Faire dorer les gnocchis dans la poêle huilée à feu moyen-vif, 6 minutes en remuant.",
        "Ajouter les légumes surgelés et les herbes, puis sauter 5 minutes jusqu'à ce qu'ils soient tendres.",
        "Poser la mozzarella déchirée dessus, couvrir 1 minute pour la faire fondre.",
        "Saler, poivrer et servir avec du basilic."],
       storage="Se garde 1 jour au réfrigérateur ; réchauffer à la poêle.")

recipe("bowl-falafels-semoule-haricots-verts", "Bol de falafels, semoule et haricots verts",
       "Des falafels réchauffés, de la semoule, des haricots verts surgelés et une sauce au yaourt citronnée. Le bol complet de la flemme.",
       2, 4, 10, ["plat", "poele", "monde", "flemme", "express", "lunch-box"],
       ["falafel 200 g", "semoule 100 g", "haricot-vert-surgele 300 g", "yaourt 2 piece",
        "jus-citron 1 tbsp", "huile-olive 1 tbsp", "cumin ?", "sel ?"],
       ["Cuire les haricots verts surgelés 8 minutes dans l'eau bouillante salée, puis les égoutter.",
        "Verser la semoule dans un bol, la couvrir d'eau bouillante salée à hauteur, couvrir 5 minutes puis l'égrener.",
        "Réchauffer les falafels dans une poêle légèrement huilée, 4 à 5 minutes en les retournant.",
        "Mélanger le yaourt avec le jus de citron et le cumin, puis dresser les bols."],
       storage="Se garde 2 jours au réfrigérateur, la sauce à part.")

recipe("wok-legumes-poulet-nouilles", "Wok de légumes au poulet et nouilles de riz",
       "Des lamelles de poulet saisies avec un wok de légumes surgelés et des nouilles de riz, à la sauce soja. Prêt avant que l'eau du thé ne refroidisse.",
       2, 3, 10, ["plat", "poele", "monde", "flemme", "express"],
       ["poulet-filet 250 g", "legumes-wok 400 g", "nouilles-riz 120 g", "sauce-soja 2 tbsp",
        "huile-sesame 1 tbsp", "gingembre ?", "piment ?"],
       ["Couvrir les nouilles d'eau bouillante et les laisser gonfler 5 minutes, puis les égoutter.",
        "Couper le poulet en lamelles et le saisir dans le wok huilé à feu vif, 4 minutes.",
        "Ajouter les légumes surgelés et le gingembre, puis sauter 5 minutes.",
        "Ajouter les nouilles et la sauce soja, mélanger 1 minute et servir avec du piment."],
       storage="Se garde 2 jours au réfrigérateur.")
