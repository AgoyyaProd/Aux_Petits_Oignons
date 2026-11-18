# Vingt-cinquième lot de recettes originales — exécuté par scripts/generate-recipes-lot25.py.
# Suite des « recettes de la flemme », avec des produits express génériques (purée en flocons,
# riz cuit en sachet, pommes de terre vapeur sous vide, pâtes fraîches, raviolis frais) et des
# protéines prêtes ou rapides (poulet cuit, maquereau en conserve, boulettes végétales, bœuf
# haché, dinde, jambon, œufs). Nouveaux ingrédients : NEW_INGREDIENTS du générateur.
#
# Critères du tag « flemme », vérifiés par tests/db/flemme.test.ts :
#   - 15 minutes au plus en tout, dont 10 au plus de préparation ;
#   - 5 ingrédients obligatoires au plus hors placard (huile, sel, épices, sauces…) ;
#   - 4 étapes au plus ;
#   - au moins 80 g de légumes par part (pommes de terre exclues) et 20 g de protéines par
#     part (calcul Ciqual).
# Syntaxe : voir scripts/generate-recipes-migration.py. Aucune recette copiée (D7), aucun nom
# de marque : des associations à nous, pas la reproduction d'un plat du commerce.
# Étapes : une action par étape, feu, temps et repère visuel ; aucune quantité dans le texte.

# --- Purée en flocons -------------------------------------------------------------------

recipe("puree-minute-ail-steak-hache-haricots-verts", "Purée minute à l'ail, steak haché et haricots verts",
       "Une purée en flocons montée au lait et parfumée à l'ail, un bœuf haché saisi et des haricots verts surgelés. Le classique du soir pressé, en un quart d'heure.",
       2, 3, 12, ["plat", "poele", "flemme", "express"],
       ["boeuf-hache 250 g | 2 steaks", "puree-flocons 80 g", "lait 250 ml | plus 250 ml d'eau",
        "haricot-vert-surgele 300 g", "ail 1 piece ?", "beurre 10 g ?", "persil ?", "sel ?", "poivre ?"],
       ["Cuire les haricots verts surgelés 8 à 10 minutes dans l'eau bouillante salée, puis les égoutter.",
        "Porter le lait, l'eau et l'ail écrasé à frémissement, retirer du feu et verser les flocons en remuant à la fourchette jusqu'à une purée lisse ; ajouter le beurre.",
        "Saisir les steaks dans une poêle chaude huilée, 2 à 3 minutes de chaque côté selon la cuisson voulue.",
        "Servir le steak salé et poivré avec la purée et les haricots verts persillés."],
       storage="À manger tout de suite ; la purée se réchauffe avec un trait de lait.")

recipe("puree-verte-epinards-oeufs-mollets", "Purée verte aux épinards et œufs mollets",
       "Une purée minute dans laquelle on fond des épinards surgelés, servie avec des œufs mollets au jaune coulant. Doux, réconfortant, sans rien à éplucher.",
       2, 2, 12, ["plat", "flemme", "express"],
       ["oeuf 4 piece", "puree-flocons 80 g", "lait 250 ml | plus 200 ml d'eau",
        "epinard-galets 250 g", "emmental 30 g ?", "muscade ?", "sel ?", "poivre ?"],
       ["Cuire les épinards surgelés à couvert dans une casserole avec un fond d'eau, 8 minutes à feu moyen, puis bien les égoutter.",
        "Plonger les œufs dans l'eau bouillante 6 minutes, les rafraîchir à l'eau froide et les écaler.",
        "Porter le lait et l'eau à frémissement, retirer du feu, verser les flocons puis incorporer les épinards, la muscade et l'emmental.",
        "Servir la purée verte avec les œufs mollets coupés en deux, salés et poivrés."],
       storage="À manger tout de suite.")

recipe("dinde-moutarde-petits-pois-carottes-puree", "Dinde à la moutarde, petits pois-carottes et purée minute",
       "Des escalopes de dinde dorées et nappées d'une sauce minute à la moutarde, avec des petits pois-carottes surgelés et une purée en flocons.",
       2, 3, 12, ["plat", "poele", "flemme", "express"],
       ["dinde-escalope 280 g | 2 escalopes", "puree-flocons 70 g", "lait 220 ml | plus 200 ml d'eau",
        "petits-pois-carottes 300 g", "moutarde 1 tbsp", "huile-olive 1 tbsp", "sel ?", "poivre ?"],
       ["Cuire les petits pois-carottes surgelés 10 minutes à couvert dans une casserole avec un fond d'eau salée.",
        "Dorer les escalopes dans une poêle huilée à feu moyen, 3 à 4 minutes de chaque côté.",
        "Déglacer la poêle avec un trait d'eau et la moutarde, et laisser napper 1 minute en retournant la dinde.",
        "Porter le lait et l'eau à frémissement, retirer du feu, verser les flocons et mélanger ; servir le tout ensemble."],
       storage="La dinde et les légumes se gardent 2 jours au réfrigérateur.")

recipe("maquereau-moutarde-puree-carottes-rapees", "Maquereau à la moutarde, purée minute et carottes râpées",
       "Des filets de maquereau en conserve écrasés à la moutarde, posés sur une purée minute, avec des carottes râpées citronnées. Riche en oméga-3, zéro cuisson du poisson.",
       2, 6, 4, ["plat", "flemme", "express", "peu-de-vaisselle"],
       ["maquereau-boite 240 g | 2 boîtes égouttées", "puree-flocons 70 g",
        "lait 200 ml | plus 200 ml d'eau", "carotte-rapee 200 g", "moutarde 1 tbsp",
        "jus-citron 1 tbsp ?", "huile-olive 1 tbsp ?", "ciboulette ?", "sel ?", "poivre ?"],
       ["Égoutter les maquereaux et les écraser grossièrement à la fourchette avec la moutarde.",
        "Assaisonner les carottes râpées avec l'huile, le jus de citron, du sel et du poivre.",
        "Porter le lait et l'eau à frémissement, retirer du feu, verser les flocons et mélanger.",
        "Servir la purée surmontée du maquereau et de ciboulette, avec les carottes râpées."],
       storage="À manger tout de suite.")

recipe("puree-minute-poisson-blanc-petits-pois-carottes", "Poisson blanc, purée aux herbes et petits pois-carottes",
       "Des filets de poisson blanc cuits encore surgelés, une purée minute aux herbes et des petits pois-carottes. Le dîner doux des soirs sans énergie.",
       2, 2, 13, ["plat", "poele", "flemme", "express"],
       ["poisson-blanc-surgele 300 g | 2 à 3 filets", "puree-flocons 70 g",
        "lait 220 ml | plus 200 ml d'eau", "petits-pois-carottes 300 g", "huile-olive 1 tbsp",
        "ciboulette ?", "persil ?", "jus-citron 1 tbsp ?", "sel ?", "poivre ?"],
       ["Cuire les petits pois-carottes surgelés 10 minutes à couvert dans une casserole avec un fond d'eau salée.",
        "Poser les filets encore surgelés dans une poêle huilée, couvrir et cuire 10 à 12 minutes à feu moyen en les retournant à mi-cuisson : la chair doit s'effeuiller.",
        "Porter le lait et l'eau à frémissement, retirer du feu, verser les flocons puis les herbes ciselées.",
        "Servir le poisson arrosé de jus de citron, avec la purée et les légumes."],
       storage="Se garde 1 jour au réfrigérateur ; réchauffer doucement à couvert.")

# --- Riz cuit en sachet -----------------------------------------------------------------

recipe("riz-minute-poulet-curry-petits-pois-carottes", "Riz poêlé au poulet, petits pois-carottes et curry",
       "Du riz cuit en sachet sauté avec du poulet déjà cuit et des petits pois-carottes surgelés, relevé de curry. Une poêle, dix minutes.",
       2, 2, 10, ["plat", "poele", "flemme", "express", "peu-de-vaisselle", "lunch-box"],
       ["poulet-cuit 200 g", "riz-cuit-sachet 250 g | 1 sachet", "petits-pois-carottes 300 g",
        "curry 1 tsp", "huile-olive 1 tbsp", "sauce-soja 1 tbsp ?", "coriandre ?"],
       ["Faire revenir les petits pois-carottes surgelés dans la poêle huilée à feu vif, 5 à 6 minutes, jusqu'à ce qu'ils soient tendres.",
        "Ajouter le poulet et le curry, puis sauter 2 minutes.",
        "Ajouter le riz égrené et la sauce soja, puis poêler 2 à 3 minutes en remuant jusqu'à ce qu'il soit chaud.",
        "Servir parsemé de coriandre."],
       storage="Se garde 2 jours au réfrigérateur ; bien réchauffer le riz.")

recipe("bol-riz-maquereau-concombre-sesame", "Bol de riz, maquereau, concombre et sésame",
       "Un bol tiède : riz en sachet, maquereau émietté à la sauce soja, concombre croquant et carottes râpées, parsemé de sésame. Aucune cuisson à surveiller.",
       2, 8, 2, ["plat", "flemme", "express", "monde", "lunch-box"],
       ["maquereau-boite 240 g | 2 boîtes égouttées", "riz-cuit-sachet 250 g | 1 sachet",
        "concombre 1 piece", "carotte-rapee 100 g", "sauce-soja 2 tbsp", "vinaigre 1 tsp",
        "graine-sesame 5 g ?", "huile-sesame 1 tsp ?"],
       ["Réchauffer le riz en sachet selon le paquet, 2 minutes.",
        "Couper le concombre en demi-rondelles et le mélanger aux carottes râpées avec le vinaigre.",
        "Émietter le maquereau égoutté avec la sauce soja et l'huile de sésame.",
        "Répartir le riz dans les bols, ajouter les légumes et le maquereau, puis parsemer de sésame."],
       storage="Se garde 1 jour au réfrigérateur, à manger froid ou tiède.")

recipe("boeuf-hache-soja-haricots-verts-riz", "Bœuf haché au soja et au gingembre, haricots verts et riz",
       "Du bœuf haché saisi à l'ail et au gingembre, laqué de sauce soja, avec des haricots verts surgelés et du riz en sachet.",
       2, 3, 11, ["plat", "poele", "monde", "flemme", "express"],
       ["boeuf-hache 250 g", "haricot-vert-surgele 300 g", "riz-cuit-sachet 250 g | 1 sachet",
        "sauce-soja 2 tbsp", "huile-sesame 1 tbsp", "gingembre 5 g", "ail 1 piece ?", "piment ?"],
       ["Cuire les haricots verts surgelés 8 minutes dans l'eau bouillante salée, puis les égoutter.",
        "Saisir le bœuf haché dans la poêle huilée à feu vif avec l'ail et le gingembre, 4 à 5 minutes en l'émiettant, jusqu'à ce qu'il soit bien doré.",
        "Ajouter les haricots verts et la sauce soja, puis sauter 2 minutes.",
        "Réchauffer le riz selon le paquet et servir avec le bœuf, relevé de piment."],
       storage="Se garde 2 jours au réfrigérateur.")

# --- Pommes de terre vapeur -------------------------------------------------------------

recipe("steak-hache-pdt-vapeur-poelee-legumes", "Steak haché, pommes de terre dorées et poêlée de légumes",
       "Des pommes de terre déjà cuites sous vide, juste dorées à la poêle, un steak haché et un mélange de légumes surgelés. Tout se fait en même temps.",
       2, 2, 12, ["plat", "poele", "flemme", "express"],
       ["boeuf-hache 250 g | 2 steaks", "pdt-vapeur 400 g", "melange-legumes 300 g",
        "huile-olive 2 tbsp", "herbes-provence 1 tsp ?", "sel ?", "poivre ?"],
       ["Couper les pommes de terre en deux et les dorer dans une poêle huilée à feu vif, 8 à 10 minutes en les retournant.",
        "Dans une autre poêle huilée, faire revenir les légumes surgelés à feu vif 6 à 8 minutes, avec les herbes.",
        "Pousser les légumes sur le côté et saisir les steaks 2 à 3 minutes de chaque côté.",
        "Servir salé et poivré."],
       storage="À manger tout de suite.")

recipe("salade-tiede-poulet-pdt-haricots-verts", "Salade tiède de poulet, pommes de terre et haricots verts",
       "Des pommes de terre vapeur et des haricots verts encore tièdes, du poulet cuit et une vinaigrette à la moutarde. Un plat complet qui se mange aussi froid le lendemain.",
       2, 6, 8, ["plat", "flemme", "express", "lunch-box"],
       ["poulet-cuit 200 g", "pdt-vapeur 400 g", "haricot-vert-surgele 300 g",
        "huile-olive 2 tbsp", "vinaigre 1 tbsp", "moutarde 1 tsp", "echalote 1 piece ?",
        "persil ?", "sel ?", "poivre ?"],
       ["Cuire les haricots verts surgelés 8 minutes dans l'eau bouillante salée, en ajoutant les pommes de terre coupées en morceaux pour les 2 dernières minutes, puis égoutter.",
        "Mélanger l'huile, le vinaigre, la moutarde et l'échalote ciselée.",
        "Couper le poulet en lamelles.",
        "Mélanger le tout encore tiède avec la vinaigrette et le persil."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("pdt-vapeur-maquereau-concombre-fromage-blanc", "Pommes de terre, maquereau et concombre au fromage blanc",
       "Des pommes de terre vapeur tièdes, des filets de maquereau et un concombre en sauce fromage blanc ciboulette. Frais, nourrissant, sans allumer le four.",
       2, 8, 3, ["plat", "flemme", "express", "peu-de-vaisselle"],
       ["maquereau-boite 240 g | 2 boîtes égouttées", "pdt-vapeur 400 g", "concombre 1 piece",
        "fromage-blanc 150 g", "ciboulette ?", "jus-citron 1 tbsp ?", "sel ?", "poivre ?"],
       ["Réchauffer les pommes de terre selon le paquet, 2 à 3 minutes, puis les couper en rondelles.",
        "Couper le concombre en dés et le mélanger au fromage blanc, à la ciboulette, au jus de citron, au sel et au poivre.",
        "Égoutter le maquereau et le détailler en morceaux.",
        "Servir les pommes de terre avec le maquereau et le concombre au fromage blanc."],
       storage="Se garde 1 jour au réfrigérateur.")

# --- Pâtes fraîches et raviolis ----------------------------------------------------------

recipe("pates-fraiches-poulet-epinards-fromage-blanc", "Pâtes fraîches, poulet et épinards crémeux",
       "Des pâtes fraîches cuites en trois minutes, du poulet cuit et des épinards surgelés liés au fromage blanc et au parmesan. Crémeux sans crème.",
       2, 2, 10, ["plat", "flemme", "express"],
       ["pates-fraiches 250 g", "poulet-cuit 180 g", "epinard-galets 300 g", "fromage-blanc 100 g",
        "parmesan 20 g ?", "ail 1 piece ?", "muscade ?", "sel ?", "poivre ?"],
       ["Cuire les épinards surgelés à couvert dans une sauteuse avec l'ail écrasé et un fond d'eau, 7 à 8 minutes à feu moyen.",
        "Cuire les pâtes fraîches 2 à 3 minutes dans l'eau bouillante salée, puis les égoutter en gardant un peu d'eau de cuisson.",
        "Ajouter aux épinards le poulet en lamelles, le fromage blanc et la muscade, puis réchauffer 1 minute sans faire bouillir.",
        "Mélanger avec les pâtes et un trait d'eau de cuisson, puis servir avec le parmesan."],
       storage="Se garde 1 jour au réfrigérateur.")

recipe("tagliatelles-fraiches-thon-tomates-cerises", "Tagliatelles fraîches au thon et tomates cerises",
       "Des tomates cerises éclatées à la poêle avec de l'ail, du thon émietté et des tagliatelles fraîches. Un plat de placard qui a l'air d'avoir demandé du temps.",
       2, 3, 7, ["plat", "poele", "flemme", "express"],
       ["pates-fraiches 250 g", "thon-boite 140 g | 1 boîte égouttée", "tomate-cerise 250 g",
        "huile-olive 2 tbsp", "ail 1 piece ?", "basilic ?", "parmesan 20 g ?", "sel ?", "poivre ?"],
       ["Faire revenir les tomates cerises entières et l'ail écrasé dans la poêle huilée à feu vif, 5 minutes, jusqu'à ce qu'elles éclatent.",
        "Cuire les pâtes fraîches 2 à 3 minutes dans l'eau bouillante salée, puis les égoutter en gardant un peu d'eau de cuisson.",
        "Ajouter le thon émietté aux tomates, puis les pâtes et un trait d'eau de cuisson, et mélanger 1 minute.",
        "Servir avec le basilic et le parmesan."],
       storage="Se garde 1 jour au réfrigérateur.")

recipe("pates-fraiches-saumon-fume-petits-pois", "Pâtes fraîches au saumon fumé et petits pois",
       "Des pâtes fraîches enrobées d'une sauce légère à la crème et au citron, avec des petits pois surgelés et des lanières de saumon fumé.",
       2, 3, 7, ["plat", "flemme", "express"],
       ["pates-fraiches 250 g", "saumon-fume 120 g", "petit-pois 250 g", "creme 100 ml",
        "jus-citron 1 tbsp ?", "ciboulette ?", "poivre ?"],
       ["Cuire les petits pois surgelés 4 minutes dans l'eau bouillante salée, ajouter les pâtes fraîches et cuire encore 2 à 3 minutes, puis égoutter.",
        "Chauffer la crème avec le jus de citron dans la casserole vide, 1 minute.",
        "Remettre les pâtes et les petits pois, puis ajouter le saumon en lanières hors du feu.",
        "Servir avec la ciboulette et du poivre."],
       storage="À manger tout de suite.")

recipe("raviolis-fromage-petits-pois-jambon", "Raviolis au fromage, petits pois et jambon",
       "Des raviolis frais au fromage, des petits pois surgelés et des lanières de jambon, juste liés au beurre. Un plat d'enfance revisité en sept minutes.",
       2, 3, 6, ["plat", "flemme", "express", "peu-de-vaisselle"],
       ["raviolis-frais 300 g", "petit-pois 250 g", "jambon 3 piece | 3 tranches", "beurre 15 g ?",
        "parmesan 20 g ?", "poivre ?"],
       ["Cuire les petits pois surgelés 3 minutes dans l'eau bouillante salée.",
        "Ajouter les raviolis et cuire 2 à 3 minutes, jusqu'à ce qu'ils remontent, puis égoutter.",
        "Remettre dans la casserole avec le beurre et le jambon en lanières, et mélanger hors du feu.",
        "Servir poivré, avec le parmesan."],
       storage="Se garde 1 jour au réfrigérateur.")

recipe("raviolis-poeles-epinards-ail-oeuf", "Raviolis poêlés aux épinards et œuf au plat",
       "Des raviolis au fromage dorés à la poêle, sur un lit d'épinards à l'ail, avec un œuf au plat. Croustillant dessous, fondant dedans.",
       2, 2, 12, ["plat", "poele", "flemme", "express"],
       ["raviolis-frais 300 g", "epinard-galets 300 g", "oeuf 2 piece", "huile-olive 2 tbsp",
        "ail 1 piece ?", "piment ?", "sel ?", "poivre ?"],
       ["Cuire les épinards surgelés à couvert dans une casserole avec l'ail écrasé et un fond d'eau, 8 minutes à feu moyen.",
        "Dorer les raviolis crus dans une poêle huilée à feu moyen, 3 minutes, puis ajouter un fond d'eau et couvrir 2 minutes.",
        "Casser les œufs dans la poêle à côté des raviolis et cuire 3 minutes, jusqu'à ce que le blanc soit pris.",
        "Servir les raviolis et l'œuf sur les épinards, avec du piment."],
       storage="À manger tout de suite.")

# --- Boulettes végétales -----------------------------------------------------------------

recipe("boulettes-vegetales-tomate-haricots-verts-semoule", "Boulettes végétales à la tomate, haricots verts et semoule",
       "Des boulettes au soja du rayon frais, mijotées quelques minutes dans un coulis de tomate aux herbes, avec des haricots verts et une semoule minute.",
       2, 2, 12, ["plat", "flemme", "express"],
       ["boulettes-vegetales 250 g", "coulis-tomate 200 g", "haricot-vert-surgele 300 g",
        "semoule 120 g", "huile-olive 1 tbsp", "herbes-provence 1 tsp", "sel ?", "poivre ?"],
       ["Cuire les haricots verts surgelés 8 à 10 minutes dans l'eau bouillante salée, puis les égoutter.",
        "Dorer les boulettes dans une sauteuse huilée, 3 minutes, puis ajouter le coulis et les herbes et laisser mijoter 6 minutes à couvert.",
        "Verser la semoule dans un bol, la couvrir d'eau bouillante salée à hauteur, couvrir 5 minutes puis l'égrener.",
        "Servir les boulettes en sauce avec la semoule et les haricots verts."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("boulettes-vegetales-wok-legumes-riz", "Boulettes végétales sautées au wok de légumes",
       "Des boulettes au soja du rayon frais, dorées puis sautées avec un wok de légumes surgelé et du riz en sachet, laquées d'un trait de sauce soja.",
       2, 2, 10, ["plat", "poele", "monde", "flemme", "express"],
       ["boulettes-vegetales 250 g", "legumes-wok 400 g", "riz-cuit-sachet 250 g | 1 sachet",
        "sauce-soja 1 tbsp", "huile-sesame 1 tbsp", "gingembre ?", "piment ?"],
       ["Dorer les boulettes dans le wok huilé à feu moyen, 3 à 4 minutes en les roulant.",
        "Ajouter les légumes surgelés et le gingembre, puis sauter 5 minutes à feu vif.",
        "Ajouter le riz égrené et la sauce soja, puis sauter 2 minutes.",
        "Servir avec du piment."],
       storage="Se garde 2 jours au réfrigérateur.")

# --- Poulet cuit, dinde ------------------------------------------------------------------

recipe("wraps-poulet-carottes-fromage-frais-herbes", "Wraps de poulet, carottes râpées et sauce aux herbes",
       "Des tortillas garnies de poulet cuit, de carottes râpées, de salade et d'une sauce fromage blanc aux herbes. Se roulent en cinq minutes, s'emportent partout.",
       2, 8, 0, ["plat", "flemme", "express", "lunch-box", "peu-de-vaisselle"],
       ["tortilla 4 piece", "poulet-cuit 200 g", "carotte-rapee 150 g", "fromage-blanc 100 g",
        "salade 0.25 piece", "ciboulette ?", "persil ?", "sel ?", "poivre ?"],
       ["Mélanger le fromage blanc avec les herbes ciselées, du sel et du poivre.",
        "Couper le poulet en lamelles et effeuiller la salade.",
        "Tartiner les tortillas de sauce, puis garnir de poulet, de carottes râpées et de salade.",
        "Rouler serré et couper en deux."],
       storage="Se garde 1 jour au réfrigérateur, bien filmé.")

recipe("dinde-paprika-ratatouille-semoule", "Dinde au paprika, ratatouille minute et semoule",
       "Des lanières de dinde poêlées au paprika et une ratatouille de légumes surgelés, servies sur une semoule. Tout le soleil sans éplucher un légume.",
       2, 3, 12, ["plat", "poele", "flemme", "express", "lunch-box"],
       ["dinde-escalope 280 g", "legumes-ratatouille 400 g", "semoule 120 g", "paprika 1 tsp",
        "huile-olive 2 tbsp", "ail 1 piece ?", "herbes-provence ?", "sel ?", "poivre ?"],
       ["Faire revenir les légumes surgelés et l'ail dans une sauteuse huilée à feu vif, 10 minutes, jusqu'à ce que l'eau soit évaporée.",
        "Couper la dinde en lanières et la dorer au paprika dans une poêle huilée, 5 à 6 minutes.",
        "Verser la semoule dans un bol, la couvrir d'eau bouillante salée à hauteur, couvrir 5 minutes puis l'égrener.",
        "Servir la dinde et la ratatouille sur la semoule."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("gnocchi-poeles-poulet-ratatouille", "Gnocchis poêlés, poulet et ratatouille",
       "Des gnocchis dorés directement à la poêle, sans les cuire à l'eau, avec une ratatouille surgelée et du poulet cuit. Une seule poêle, un dîner complet.",
       2, 2, 12, ["plat", "poele", "flemme", "express", "peu-de-vaisselle"],
       ["gnocchi 400 g", "poulet-cuit 150 g", "legumes-ratatouille 400 g", "huile-olive 2 tbsp",
        "parmesan 20 g ?", "basilic ?", "sel ?", "poivre ?"],
       ["Dorer les gnocchis dans une grande poêle huilée à feu moyen, 5 à 6 minutes en remuant.",
        "Ajouter les légumes surgelés et cuire 6 minutes à feu vif, jusqu'à ce que l'eau soit évaporée.",
        "Ajouter le poulet en lamelles et réchauffer 1 minute.",
        "Servir avec le parmesan et le basilic."],
       storage="Se garde 1 jour au réfrigérateur.")
