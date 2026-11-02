# Dix-neuvième lot de recettes originales — exécuté par scripts/generate-recipes-lot19.py.
# Deux séries : des plats asiatiques qui utilisent l'épicerie asiatique déjà au référentiel
# (pâte de curry, lait de coco, sauce soja, sauce teriyaki, huile de sésame, gingembre,
# nouilles et riz thaï ou jasmin, beurre de cacahuète), et des recettes rapides et faciles aux
# tomates séchées (25 minutes au plus). Au moins 20 g de protéines par part (vérifié par un
# test, sans compter les tomates séchées, absentes de la table Ciqual). De saison en novembre.
# Syntaxe : voir scripts/generate-recipes-migration.py. Aucune recette copiée (D7).
# Étapes : une action par étape, feu, temps et repère visuel ; aucune quantité dans le texte.

# — Asiatique —

recipe("curry-rouge-poulet-butternut-coco", "Curry rouge de poulet, butternut et lait de coco",
       "Un curry thaï doux au lait de coco, avec du poulet émincé et des cubes de butternut fondants, servi avec du riz thaï et du citron vert.",
       2, 15, 25, ["plat", "mijote", "monde"],
       ["poulet-filet 260 g", "butternut 300 g", "lait-coco 20 cl", "pate-curry 25 g", "riz-thai 140 g",
        "oignon 1 piece", "huile-tournesol 1 tbsp", "jus-citron-vert 1 tbsp", "coriandre 5 g ?"],
       ["Éplucher la butternut et la couper en cubes, émincer l'oignon et couper le poulet en lanières.",
        "Cuire le riz dans une casserole d'eau bouillante selon le temps indiqué sur le paquet, puis l'égoutter.",
        "Faire revenir l'oignon et la pâte de curry 2 minutes dans l'huile, dans une sauteuse à feu moyen, jusqu'à ce que ça embaume.",
        "Ajouter le poulet et le saisir 3 minutes, puis ajouter la butternut, le lait de coco et un fond d'eau.",
        "Laisser mijoter 15 minutes à couvert : la courge doit être tendre et le poulet cuit à cœur.",
        "Ajouter le jus de citron vert et servir avec le riz et la coriandre."],
       storage="Se garde 3 jours au réfrigérateur ; le curry est encore meilleur le lendemain.")

recipe("tofu-curry-rouge-epinards-coco", "Tofu au curry rouge, épinards et lait de coco",
       "Des cubes de tofu dorés mijotés dans un curry rouge au lait de coco, avec des épinards fondus et du riz jasmin. Un bloc entier pour deux.",
       2, 10, 20, ["plat", "poele", "monde", "lunch-box"],
       ["tofu 400 g", "lait-coco 20 cl", "pate-curry 25 g", "epinard 200 g", "riz-jasmin 140 g",
        "ail 1 piece", "huile-tournesol 1 tbsp", "sauce-soja 1 tbsp", "jus-citron-vert 1 tbsp ?"],
       ["Cuire le riz dans une casserole d'eau bouillante selon le temps indiqué sur le paquet, puis l'égoutter.",
        "Égoutter le tofu, l'éponger et le couper en cubes, et hacher l'ail.",
        "Dorer le tofu 6 minutes dans l'huile, dans une sauteuse à feu moyen-vif, en le retournant : il doit être doré sur toutes les faces.",
        "Ajouter l'ail et la pâte de curry 1 minute, puis le lait de coco et la sauce soja, et laisser frémir 5 minutes.",
        "Ajouter les épinards et les laisser tomber 2 minutes, puis servir avec le riz et le jus de citron vert."],
       storage="Se garde 3 jours au réfrigérateur ; réchauffer doucement à la poêle.")

recipe("poulet-satay-cacahuete-carottes-riz", "Poulet sauce satay à la cacahuète, carottes et riz",
       "Du poulet sauté nappé d'une sauce crémeuse au beurre de cacahuète, lait de coco, sauce soja et citron vert, avec des carottes et du riz jasmin.",
       2, 10, 20, ["plat", "poele", "monde"],
       ["poulet-filet 260 g", "beurre-cacahuete 40 g", "lait-coco 15 cl", "sauce-soja 2 tbsp",
        "jus-citron-vert 1 tbsp", "carotte 2 piece", "riz-jasmin 140 g", "gingembre 5 g",
        "huile-tournesol 1 tbsp", "cacahuete-grillee 15 g ?", "coriandre 5 g ?"],
       ["Cuire le riz dans une casserole d'eau bouillante selon le temps indiqué sur le paquet, puis l'égoutter.",
        "Couper le poulet en dés, les carottes en fines rondelles et râper le gingembre.",
        "Fouetter le beurre de cacahuète, le lait de coco, la sauce soja, le jus de citron vert et le gingembre jusqu'à obtenir une sauce lisse.",
        "Faire sauter le poulet et les carottes 8 minutes dans l'huile, dans une poêle à feu moyen-vif : le poulet doit être doré et cuit à cœur.",
        "Verser la sauce et laisser épaissir 2 minutes à feu doux, puis servir avec le riz, les cacahuètes concassées et la coriandre."],
       storage="Se garde 3 jours au réfrigérateur ; détendre la sauce d'un peu d'eau en réchauffant.")

recipe("riz-saute-cantonais-oeufs-jambon", "Riz sauté cantonais aux œufs et au jambon",
       "Un riz sauté à la poêle avec des œufs brouillés, des dés de jambon, des carottes et de l'oignon, relevé de sauce soja et d'huile de sésame. Idéal avec un reste de riz.",
       2, 10, 15, ["plat", "poele", "monde", "anti-gaspi"],
       ["riz 140 g", "oeuf 3 piece", "jambon 2 piece", "carotte 2 piece", "oignon 1 piece",
        "sauce-soja 2 tbsp", "huile-tournesol 1 tbsp", "huile-sesame 1 tsp", "ciboulette 5 g ?"],
       ["Cuire le riz dans une casserole d'eau bouillante selon le temps du paquet, l'égoutter et l'étaler pour qu'il refroidisse (ou utiliser un reste de riz froid).",
        "Couper les carottes en petits dés, émincer l'oignon et couper le jambon en dés.",
        "Brouiller les œufs battus 1 minute dans la moitié de l'huile, dans une grande poêle à feu vif, puis les réserver.",
        "Faire sauter l'oignon et les carottes 4 minutes dans le reste de l'huile, puis ajouter le riz et le jambon et faire sauter 4 minutes : le riz doit être chaud et légèrement grillé.",
        "Remettre les œufs, ajouter la sauce soja et l'huile de sésame, mélanger 1 minute et servir avec la ciboulette."],
       storage="Se garde 2 jours au réfrigérateur ; réchauffer à la poêle bien chaude.")

recipe("soupe-nouilles-poulet-gingembre-soja", "Soupe de nouilles au poulet, gingembre et sauce soja",
       "Un bouillon de volaille parfumé au gingembre et à la sauce soja, avec des nouilles de riz, du poulet poché, des champignons, du chou et un œuf mollet.",
       2, 15, 20, ["soupe", "plat", "monde"],
       ["poulet-filet 220 g", "nouilles-riz 100 g", "bouillon-volaille 1 piece", "champignon 150 g",
        "chou-vert 150 g", "oeuf 2 piece", "gingembre 15 g", "sauce-soja 3 tbsp", "huile-sesame 1 tsp ?",
        "coriandre 5 g ?"],
       ["Émincer les champignons et le chou, et couper le gingembre en fines lamelles.",
        "Porter de l'eau à ébullition dans un faitout avec le bouillon émietté, le gingembre et la sauce soja.",
        "Ajouter le poulet entier et le pocher 12 minutes à petits frémissements : il doit être cuit à cœur. Le sortir et l'effilocher.",
        "Pendant ce temps, cuire les œufs 6 minutes dans une casserole d'eau bouillante, les rafraîchir et les écaler.",
        "Ajouter les champignons, le chou et les nouilles au bouillon, et cuire 4 minutes : les nouilles doivent être tendres.",
        "Servir le bouillon avec le poulet effiloché, les œufs coupés en deux, l'huile de sésame et la coriandre."],
       storage="Le bouillon se garde 3 jours au réfrigérateur ; cuire les nouilles au moment de réchauffer.")

recipe("boeuf-saute-gingembre-brocoli-riz", "Bœuf sauté au gingembre et brocoli",
       "Des lanières de bœuf saisies au wok avec du brocoli, de l'ail et du gingembre, dans une sauce soja légèrement sucrée au miel, servies avec du riz.",
       2, 15, 15, ["plat", "poele", "monde"],
       ["boeuf-steak 280 g", "brocoli 300 g", "riz 140 g", "sauce-soja 3 tbsp", "miel 10 g",
        "fecule-mais 10 g", "gingembre 10 g", "ail 1 piece", "huile-tournesol 1 tbsp", "graine-sesame 5 g ?"],
       ["Cuire le riz dans une casserole d'eau bouillante selon le temps indiqué sur le paquet, puis l'égoutter.",
        "Couper le bœuf en fines lanières, détailler le brocoli en petits bouquets, râper le gingembre et hacher l'ail.",
        "Délayer la fécule dans la sauce soja, le miel et un peu d'eau.",
        "Saisir le bœuf 2 minutes dans l'huile, dans un wok à feu vif, puis le réserver : il doit rester rosé.",
        "Faire sauter le brocoli, l'ail et le gingembre 4 minutes avec un fond d'eau : le brocoli doit rester croquant.",
        "Remettre le bœuf, verser la sauce et mélanger 1 minute jusqu'à ce qu'elle nappe, puis servir avec le riz et le sésame."],
       storage="Se garde 2 jours au réfrigérateur ; réchauffer rapidement à la poêle pour ne pas durcir le bœuf.")

recipe("crevettes-sautees-ail-gingembre-nouilles", "Crevettes sautées ail-gingembre et nouilles de riz",
       "Des crevettes sautées à l'ail et au gingembre avec des nouilles de riz, des carottes et du chou, liées à la sauce soja et au citron vert. Prêt en 20 minutes.",
       2, 10, 10, ["plat", "poele", "monde"],
       ["crevette 250 g", "nouilles-riz 120 g", "carotte 2 piece", "chou-vert 150 g", "oeuf 2 piece",
        "ail 2 piece", "gingembre 10 g", "sauce-soja 2 tbsp", "jus-citron-vert 1 tbsp", "huile-tournesol 1 tbsp",
        "coriandre 5 g ?", "cacahuete-grillee 15 g ?"],
       ["Faire tremper les nouilles dans de l'eau bouillante hors du feu selon le temps du paquet, puis les égoutter.",
        "Couper les carottes en fins bâtonnets, émincer le chou, hacher l'ail et râper le gingembre.",
        "Faire sauter les crevettes avec l'ail et le gingembre 3 minutes dans l'huile, dans un wok à feu vif : elles doivent être roses. Les réserver.",
        "Faire sauter les carottes et le chou 3 minutes, pousser les légumes sur le côté et brouiller les œufs 1 minute.",
        "Ajouter les nouilles, les crevettes, la sauce soja et le jus de citron vert, mélanger 1 minute et servir avec la coriandre et les cacahuètes."],
       storage="Se garde 1 jour au réfrigérateur ; à manger de préférence tout de suite.")

recipe("porc-caramel-soja-riz-thai", "Porc au caramel et sauce soja, riz thaï",
       "Des dés de porc mijotés dans un caramel à la sauce soja, à l'ail et à l'oignon, jusqu'à devenir laqués et fondants, avec du riz thaï et des carottes.",
       2, 10, 30, ["plat", "mijote", "monde"],
       ["porc-filet 300 g", "sucre 30 g", "sauce-soja 3 tbsp", "oignon 1 piece", "ail 2 piece",
        "carotte 2 piece", "riz-thai 140 g", "huile-tournesol 1 tsp", "poivre ?", "ciboulette 5 g ?"],
       ["Couper le porc en cubes, émincer l'oignon, hacher l'ail et couper les carottes en rondelles.",
        "Cuire le riz dans une casserole d'eau bouillante selon le temps indiqué sur le paquet, puis l'égoutter.",
        "Faire fondre le sucre à sec dans une sauteuse à feu moyen, sans remuer, jusqu'à obtenir un caramel blond.",
        "Hors du feu, verser la sauce soja et un fond d'eau (attention aux projections), puis remettre sur le feu et mélanger jusqu'à dissoudre le caramel.",
        "Ajouter le porc, l'oignon, l'ail et les carottes, et laisser mijoter 20 minutes à couvert, puis 5 minutes à découvert : la sauce doit devenir sirupeuse et brillante.",
        "Poivrer généreusement et servir avec le riz et la ciboulette."],
       storage="Se garde 3 jours au réfrigérateur ou 2 mois au congélateur.")

recipe("salade-nouilles-poulet-cacahuete-chou-rouge", "Salade de nouilles au poulet, cacahuète et chou rouge",
       "Une salade froide de nouilles de riz, poulet, chou rouge et carottes râpées, avec une sauce au beurre de cacahuète, sauce soja et citron vert. Parfaite en boîte-repas.",
       2, 20, 10, ["salade", "plat", "monde", "lunch-box"],
       ["nouilles-riz 100 g", "poulet-filet 220 g", "chou-rouge 150 g", "carotte 2 piece",
        "beurre-cacahuete 40 g", "sauce-soja 2 tbsp", "jus-citron-vert 2 tbsp", "gingembre 5 g",
        "huile-tournesol 1 tsp", "huile-sesame 1 tsp ?", "coriandre 5 g ?"],
       ["Faire tremper les nouilles dans de l'eau bouillante hors du feu selon le temps du paquet, les égoutter et les rincer à l'eau froide.",
        "Couper le poulet en lanières et le dorer 6 minutes dans l'huile, dans une poêle à feu moyen : il doit être cuit à cœur. Le laisser tiédir.",
        "Émincer finement le chou rouge et râper les carottes et le gingembre.",
        "Fouetter le beurre de cacahuète avec la sauce soja, le jus de citron vert, le gingembre et un peu d'eau jusqu'à obtenir une sauce nappante.",
        "Mélanger les nouilles, le poulet, les légumes et la sauce, puis servir avec l'huile de sésame et la coriandre."],
       storage="Se garde 3 jours au réfrigérateur ; mélanger la sauce au moment de servir si possible.")

# — Tomates séchées, rapides et faciles —

recipe("croque-vege-tomates-sechees-epinards", "Croque végé aux tomates séchées et épinards",
       "Des croque-monsieur sans jambon, garnis de fromage frais, tomates séchées, pousses d'épinards et emmental, dorés à la poêle et servis avec une salade.",
       2, 5, 10, ["plat", "poele", "express"],
       ["pain-de-mie 160 g", "fromage-frais 80 g", "tomate-sechee 40 g", "epinard 60 g", "emmental 100 g",
        "beurre 15 g", "mache 60 g", "poivre ?"],
       ["Tartiner les tranches de pain de mie de fromage frais et couper les tomates séchées en lanières.",
        "Garnir la moitié des tranches de tomates séchées, d'épinards et d'emmental râpé, poivrer, puis refermer avec les autres tranches.",
        "Beurrer l'extérieur des croques et les cuire 4 à 5 minutes de chaque côté dans une poêle à feu moyen, en pressant : ils doivent être dorés et le fromage fondu.",
        "Couper en deux et servir aussitôt avec la mâche."],
       storage="À manger tout de suite ; les croques garnis non cuits se gardent 1 jour au réfrigérateur.")

recipe("omelette-tomates-sechees-feta-ciboulette", "Omelette aux tomates séchées, feta et ciboulette",
       "Une omelette baveuse garnie de tomates séchées et de feta émiettée, parfumée à la ciboulette, avec du pain grillé et de la mâche. Prête en 15 minutes.",
       2, 5, 10, ["plat", "poele", "express"],
       ["oeuf 5 piece", "tomate-sechee 40 g", "feta 60 g", "pain 80 g", "mache 60 g", "huile-olive 1 tbsp",
        "ciboulette 5 g ?", "poivre ?"],
       ["Couper les tomates séchées en lanières, émietter la feta et ciseler la ciboulette.",
        "Battre les œufs avec du poivre et la ciboulette.",
        "Verser les œufs dans l'huile chaude, dans une poêle à feu moyen, et ramener les bords vers le centre pendant 2 minutes.",
        "Parsemer de tomates séchées et de feta, et cuire encore 2 minutes : le dessus doit rester légèrement baveux.",
        "Plier l'omelette en deux et servir avec le pain grillé et la mâche."],
       storage="À manger tout de suite ; froide, elle se glisse dans une boîte-repas pour le lendemain.")

recipe("wraps-poulet-tomates-sechees-fromage-frais", "Wraps au poulet, tomates séchées et fromage frais",
       "Des tortillas tartinées de fromage frais, garnies de poulet doré, de tomates séchées et de mâche, roulées bien serrées. Faciles à emporter.",
       2, 8, 7, ["plat", "poele", "express", "lunch-box"],
       ["tortilla 4 piece", "poulet-filet 200 g", "fromage-frais 80 g", "tomate-sechee 40 g", "mache 50 g",
        "huile-olive 1 tsp", "paprika 1 g ?", "poivre ?"],
       ["Couper le poulet en fines lanières et les tomates séchées en morceaux.",
        "Dorer le poulet 6 minutes dans l'huile avec le paprika, dans une poêle à feu moyen-vif : il doit être cuit à cœur.",
        "Tartiner les tortillas de fromage frais et répartir le poulet, les tomates séchées et la mâche.",
        "Rouler les tortillas bien serrées en rabattant les côtés, puis les couper en deux."],
       storage="Se garde 2 jours au réfrigérateur, emballé ; ajouter la mâche au dernier moment si possible.")

recipe("quesadillas-haricots-rouges-tomates-sechees", "Quesadillas aux haricots rouges, tomates séchées et cheddar",
       "Des tortillas dorées à la poêle, fourrées de haricots rouges écrasés, tomates séchées, oignon rouge et cheddar fondant. Prêt en 15 minutes.",
       2, 5, 10, ["plat", "poele", "express", "economique"],
       ["tortilla 4 piece", "haricot-rouge 265 g", "cheddar 80 g", "tomate-sechee 40 g", "oignon-rouge 1 piece",
        "cumin 1 g", "mache 50 g ?", "jus-citron-vert 1 tbsp ?"],
       ["Égoutter et rincer les haricots, puis les écraser grossièrement à la fourchette avec le cumin.",
        "Émincer finement l'oignon rouge, couper les tomates séchées en morceaux et râper le cheddar.",
        "Étaler les haricots sur deux tortillas, ajouter l'oignon, les tomates séchées et le cheddar, puis couvrir des deux autres tortillas.",
        "Cuire chaque quesadilla 2 à 3 minutes de chaque côté dans une poêle à sec à feu moyen : elle doit être dorée et le fromage fondu.",
        "Couper en parts et servir avec la mâche arrosée de jus de citron vert."],
       storage="Se gardent 2 jours au réfrigérateur ; réchauffer à la poêle pour qu'elles restent croustillantes.")

recipe("tartines-ricotta-tomates-sechees-jambon-cru", "Tartines ricotta, tomates séchées et jambon cru",
       "De grandes tartines de pain grillé à la ricotta citronnée, garnies de tomates séchées, de jambon cru et de mâche. Un dîner sans vraie cuisson en 10 minutes.",
       2, 10, 3, ["plat", "express"],
       ["pain 160 g", "ricotta 150 g", "jambon-cru 80 g", "tomate-sechee 40 g", "mache 50 g",
        "jus-citron 1 tbsp", "huile-olive 1 tsp", "poivre ?"],
       ["Griller les tranches de pain 3 minutes au grille-pain ou sous le gril du four : elles doivent être dorées et croustillantes.",
        "Mélanger la ricotta avec le jus de citron et du poivre.",
        "Couper les tomates séchées en lanières.",
        "Tartiner le pain de ricotta, ajouter les tomates séchées, le jambon cru et la mâche, puis arroser d'un filet d'huile."],
       storage="À manger tout de suite ; la ricotta citronnée se garde 2 jours au réfrigérateur.")

recipe("gnocchis-poeles-tomates-sechees-mozzarella", "Gnocchis poêlés aux tomates séchées et mozzarella",
       "Des gnocchis dorés à la poêle, sans cuisson à l'eau, avec des tomates séchées, des épinards, de la mozzarella fondante et du parmesan.",
       2, 5, 12, ["plat", "poele"],
       ["gnocchi 400 g", "tomate-sechee 40 g", "epinard 100 g", "mozzarella 1 piece", "parmesan 30 g",
        "huile-olive 1 tbsp", "ail 1 piece", "poivre ?", "basilic 5 g ?"],
       ["Couper les tomates séchées en lanières, hacher l'ail et couper la mozzarella en dés.",
        "Dorer les gnocchis 8 minutes dans l'huile, dans une grande poêle à feu moyen, en remuant souvent : ils doivent être croustillants à l'extérieur.",
        "Ajouter l'ail, les tomates séchées et les épinards, et mélanger 2 minutes jusqu'à ce que les épinards tombent.",
        "Hors du feu, ajouter la mozzarella et le parmesan râpé, poivrer, couvrir 1 minute pour faire fondre et servir avec le basilic."],
       storage="Se garde 1 jour au réfrigérateur ; réchauffer à la poêle.")
