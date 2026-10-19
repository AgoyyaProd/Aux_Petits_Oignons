# Dix-septième lot de recettes originales — exécuté par scripts/generate-recipes-lot17.py.
# Soupes-repas et plats à emporter : des soupes assez complètes pour faire un dîner, et des
# boîtes-repas qui se gardent au moins deux jours au réfrigérateur et se mangent froides ou
# réchauffées au bureau. Au moins 20 g de protéines par part (vérifié par un test).
# Légumes de garde ou d'automne-hiver, ingrédients chiffrés, jus de citron en volume.
# Syntaxe : voir scripts/generate-recipes-migration.py. Aucune recette copiée (D7).
# Étapes : une action par étape, feu, temps et repère visuel ; aucune quantité dans le texte.

# — Soupes-repas —

recipe("soupe-lentilles-vertes-lardons-carottes", "Soupe de lentilles vertes aux lardons et carottes",
       "Une soupe épaisse de lentilles vertes mijotées avec des lardons, des carottes, du poireau et du thym. Rassasiante, et encore meilleure le lendemain.",
       2, 10, 35, ["soupe", "plat", "lunch-box", "economique"],
       ["lentille-verte 140 g", "lardon 50 g", "carotte 2 piece", "poireau 1 piece", "oignon 1 piece",
        "bouillon-legumes 0.5 piece", "thym 1 g", "pain 60 g", "persil 5 g ?", "poivre ?"],
       ["Émincer l'oignon et le poireau et couper les carottes en rondelles.",
        "Faire revenir les lardons 3 minutes à sec dans un faitout, puis ajouter l'oignon et le poireau 3 minutes.",
        "Ajouter les carottes, les lentilles rincées, le thym, le bouillon émietté et de l'eau largement.",
        "Laisser mijoter 30 minutes à couvert : les lentilles doivent être fondantes.",
        "Écraser une partie des lentilles à la louche pour épaissir, poivrer et servir avec le persil et le pain."],
       storage="Se garde 3 jours au réfrigérateur ou 2 mois au congélateur ; se réchauffe très bien.")

recipe("minestrone-hiver-haricots-rouges-pates", "Minestrone d'hiver aux haricots rouges et petites pâtes",
       "Une soupe de légumes d'hiver à la tomate, avec des haricots rouges, des petites pâtes et beaucoup de parmesan. Un repas complet dans le bol.",
       2, 15, 30, ["soupe", "plat", "lunch-box", "economique"],
       ["haricot-rouge 265 g", "pates 60 g", "carotte 2 piece", "poireau 1 piece", "pomme-de-terre 1 piece",
        "tomate-concassee 200 g", "oignon 1 piece", "bouillon-legumes 0.5 piece", "huile-olive 1 tbsp",
        "parmesan 30 g", "basilic 5 g ?", "poivre ?"],
       ["Émincer l'oignon et le poireau, couper les carottes et la pomme de terre en petits dés.",
        "Faire revenir l'oignon et le poireau 4 minutes dans l'huile, dans un faitout, à feu moyen.",
        "Ajouter les légumes, les tomates, le bouillon émietté et de l'eau largement, et laisser mijoter 15 minutes.",
        "Ajouter les haricots égouttés et les pâtes, et laisser mijoter encore 10 minutes : les pâtes doivent être tendres.",
        "Servir avec le parmesan râpé, le basilic et du poivre."],
       storage="Se garde 3 jours au réfrigérateur ; les pâtes gonflent, ajouter un peu d'eau en réchauffant.")

recipe("veloute-butternut-pois-chiches-feta", "Velouté de butternut, pois chiches grillés et feta",
       "Un velouté de courge butternut au fromage blanc, garni de pois chiches dorés au paprika et de feta émiettée pour le croquant et les protéines.",
       2, 15, 30, ["soupe", "plat", "lunch-box"],
       ["butternut 600 g", "oignon 1 piece", "bouillon-legumes 0.5 piece", "fromage-blanc 150 g",
        "pois-chiche 265 g", "feta 40 g", "paprika 1 tsp", "huile-olive 1 tbsp", "pain 60 g", "sel ?", "poivre ?"],
       ["Éplucher la butternut et la couper en cubes, émincer l'oignon.",
        "Faire revenir l'oignon 3 minutes dans la moitié de l'huile, dans un faitout, puis ajouter la courge, le bouillon émietté et de l'eau à hauteur.",
        "Laisser mijoter 20 minutes : la courge doit s'écraser facilement.",
        "Pendant ce temps, dorer les pois chiches égouttés 6 minutes au paprika dans le reste de l'huile, dans une poêle.",
        "Mixer la soupe avec le fromage blanc, poivrer et servir avec les pois chiches, la feta et le pain."],
       storage="Le velouté se garde 3 jours au réfrigérateur ; garder les pois chiches à part pour qu'ils restent croquants.")

recipe("soupe-thai-poulet-coco-nouilles", "Soupe thaï au poulet, coco et nouilles de riz",
       "Un bouillon au lait de coco et à la pâte de curry, avec du poulet émincé, des champignons, des carottes et des nouilles de riz, relevé de citron vert.",
       2, 10, 20, ["soupe", "plat", "lunch-box", "monde"],
       ["poulet-filet 240 g", "lait-coco 15 cl", "pate-curry 15 g", "champignon 150 g", "carotte 1 piece",
        "nouilles-riz 80 g", "gingembre 10 g", "sauce-soja 1 tsp", "jus-citron-vert 1 tbsp",
        "huile-tournesol 1 tsp", "coriandre 5 g ?"],
       ["Émincer le poulet et les champignons, couper la carotte en fins bâtonnets et râper le gingembre.",
        "Faire revenir la pâte de curry et le gingembre 1 minute dans l'huile, dans un faitout, à feu moyen.",
        "Ajouter le lait de coco, la sauce soja et de l'eau, porter à frémissement, puis ajouter le poulet et les légumes et laisser mijoter 8 minutes : le poulet doit être cuit à cœur.",
        "Ajouter les nouilles hors du feu et couvrir 5 minutes, jusqu'à ce qu'elles soient tendres.",
        "Ajouter le jus de citron vert et servir avec la coriandre."],
       storage="Le bouillon se garde 3 jours au réfrigérateur ; ajouter les nouilles au moment de réchauffer.")

recipe("soupe-poireaux-pommes-de-terre-jambon", "Soupe de poireaux et pommes de terre au jambon",
       "La soupe poireaux-pommes de terre du quotidien, mixée au lait, avec des lanières de jambon et de l'emmental râpé pour en faire un vrai dîner.",
       2, 15, 25, ["soupe", "plat", "lunch-box", "economique"],
       ["poireau 2 piece", "pomme-de-terre 2 piece", "oignon 1 piece", "lait 20 cl", "jambon 3 piece",
        "emmental 30 g", "beurre 10 g", "pain 60 g", "poivre ?"],
       ["Émincer les poireaux et l'oignon, éplucher les pommes de terre et les couper en morceaux.",
        "Faire fondre les poireaux et l'oignon 5 minutes dans le beurre, dans un faitout, à feu moyen.",
        "Ajouter les pommes de terre, une pincée de sel et de l'eau à hauteur, et laisser mijoter 20 minutes : les pommes de terre doivent s'écraser.",
        "Mixer avec le lait et poivrer.",
        "Servir avec le jambon en lanières, l'emmental et le pain."],
       storage="Se garde 3 jours au réfrigérateur ; ajouter le jambon et le fromage au moment de servir.")

recipe("harira-express-lentilles-pois-chiches", "Harira express aux lentilles et pois chiches",
       "Une soupe marocaine épaisse de lentilles corail, pois chiches et tomate, parfumée au cumin, au curcuma et au gingembre, finie au citron et à la coriandre.",
       2, 10, 30, ["soupe", "plat", "lunch-box", "economique", "monde"],
       ["lentille-corail 80 g", "pois-chiche 265 g", "tomate-concassee 400 g", "oignon 1 piece", "cumin 1 tsp",
        "curcuma 0.5 tsp", "gingembre 10 g", "huile-olive 1 tbsp", "jus-citron 1 tbsp", "pain 60 g",
        "coriandre 5 g ?", "sel ?"],
       ["Émincer l'oignon et râper le gingembre.",
        "Faire revenir l'oignon, le gingembre, le cumin et le curcuma 3 minutes dans l'huile, dans un faitout, à feu moyen.",
        "Ajouter les lentilles rincées, les tomates, les pois chiches égouttés, du sel et de l'eau largement.",
        "Laisser mijoter 25 minutes en remuant de temps en temps : les lentilles doivent se défaire.",
        "Ajouter le jus de citron et servir avec la coriandre et le pain."],
       storage="Se garde 3 jours au réfrigérateur ou 2 mois au congélateur.")

recipe("soupe-poulet-petites-pates-carottes", "Soupe de poulet aux petites pâtes et carottes",
       "Un bouillon de volaille où cuisent du poulet, des carottes, du poireau et des petites pâtes, au thym. Le réconfort en bol, qui voyage bien en thermos.",
       2, 10, 25, ["soupe", "plat", "lunch-box", "economique"],
       ["poulet-filet 240 g", "pates 60 g", "carotte 2 piece", "poireau 1 piece", "oignon 1 piece",
        "bouillon-volaille 0.5 piece", "thym 1 g", "huile-olive 1 tsp", "persil 5 g ?", "poivre ?"],
       ["Émincer l'oignon et le poireau, couper les carottes en rondelles et le poulet en petits dés.",
        "Faire revenir l'oignon et le poireau 3 minutes dans l'huile, dans un faitout, à feu moyen.",
        "Ajouter les carottes, le thym, le bouillon émietté et de l'eau largement, et laisser mijoter 10 minutes.",
        "Ajouter le poulet et les pâtes et laisser mijoter 10 minutes : le poulet doit être cuit à cœur et les pâtes tendres.",
        "Poivrer et servir avec le persil."],
       storage="Se garde 3 jours au réfrigérateur ; ajouter un peu d'eau en réchauffant.")

recipe("soupe-patate-douce-lentilles-gingembre", "Soupe de patate douce, lentilles corail et gingembre",
       "Une soupe veloutée de patate douce et de lentilles corail au gingembre et au lait de coco, servie avec une cuillerée de yaourt et des graines de sésame.",
       2, 10, 25, ["soupe", "plat", "lunch-box", "monde"],
       ["patate-douce 400 g", "lentille-corail 140 g", "oignon 1 piece", "gingembre 10 g", "lait-coco 5 cl",
        "curry 1 tsp", "bouillon-legumes 0.5 piece", "huile-tournesol 1 tsp", "yaourt 1 piece",
        "graine-sesame 5 g ?", "sel ?"],
       ["Éplucher la patate douce et la couper en cubes, émincer l'oignon et râper le gingembre.",
        "Faire revenir l'oignon, le gingembre et le curry 3 minutes dans l'huile, dans un faitout.",
        "Ajouter la patate douce, les lentilles rincées, le bouillon émietté et de l'eau à hauteur.",
        "Laisser mijoter 20 minutes : la patate douce et les lentilles doivent être fondantes.",
        "Mixer avec le lait de coco, saler et servir avec le yaourt et le sésame."],
       storage="Se garde 3 jours au réfrigérateur ou 2 mois au congélateur.")

# — Boîtes-repas à emporter —

recipe("salade-pates-poulet-pesto-carottes", "Salade de pâtes au poulet, pesto et carottes",
       "Des pâtes froides enrobées de pesto, avec du poulet poêlé, des carottes râpées et du parmesan. Elle se tient très bien jusqu'au déjeuner.",
       2, 10, 15, ["salade", "plat", "lunch-box"],
       ["pates 140 g", "poulet-filet 200 g", "pesto 30 g", "carotte 2 piece", "parmesan 15 g",
        "huile-olive 1 tsp", "jus-citron 1 tbsp", "basilic 5 g ?", "sel ?", "poivre ?"],
       ["Cuire les pâtes dans une casserole d'eau bouillante salée selon le temps indiqué, les égoutter et les rincer à l'eau froide.",
        "Pendant ce temps, couper le poulet en dés et le saisir 6 minutes dans l'huile, dans une poêle, à feu vif : il doit être doré et cuit à cœur.",
        "Râper les carottes.",
        "Mélanger les pâtes avec le pesto, le jus de citron, le poulet, les carottes et le parmesan, puis rectifier l'assaisonnement."],
       storage="Se garde 3 jours au réfrigérateur ; se mange froide.")

recipe("salade-quinoa-pois-chiches-feta", "Salade de quinoa, pois chiches et feta au citron",
       "Du quinoa, des pois chiches, de la feta, des carottes râpées et de l'oignon rouge, à la vinaigrette citronnée et au cumin. Aucun légume qui ramollit, idéal en boîte.",
       2, 15, 15, ["salade", "plat", "lunch-box", "economique"],
       ["quinoa 120 g", "pois-chiche 265 g", "feta 60 g", "carotte 2 piece", "oignon-rouge 0.5 piece",
        "jus-citron 2 tbsp", "huile-olive 1 tbsp", "cumin 0.5 tsp", "menthe 5 g ?", "sel ?", "poivre ?"],
       ["Rincer le quinoa et le cuire dans une casserole d'eau salée 12 minutes, puis l'égoutter et le laisser refroidir.",
        "Pendant ce temps, égoutter les pois chiches, râper les carottes et émincer finement l'oignon rouge.",
        "Fouetter le jus de citron, l'huile, le cumin, du sel et du poivre.",
        "Mélanger le quinoa, les légumes, les pois chiches et la vinaigrette, puis ajouter la feta émiettée et la menthe."],
       storage="Se garde 3 jours au réfrigérateur ; se mange froide.")

recipe("salade-riz-complet-poulet-cacahuetes", "Salade de riz complet au poulet, carottes et cacahuètes",
       "Du riz complet, du poulet émincé, des carottes et de l'oignon rouge, dans une sauce soja, citron vert et sésame, parsemés de cacahuètes concassées.",
       2, 15, 30, ["salade", "plat", "lunch-box", "monde"],
       ["riz-complet 120 g", "poulet-filet 220 g", "carotte 2 piece", "oignon-rouge 0.5 piece", "cacahuete 20 g",
        "sauce-soja 2 tsp", "jus-citron-vert 1 tbsp", "huile-sesame 1 tbsp", "huile-tournesol 1 tsp",
        "coriandre 5 g ?"],
       ["Cuire le riz complet dans une casserole d'eau salée selon le temps indiqué, l'égoutter et le laisser refroidir.",
        "Pendant ce temps, couper le poulet en lanières et le saisir 6 minutes dans l'huile de tournesol, dans une poêle, à feu vif : il doit être cuit à cœur.",
        "Râper les carottes, émincer l'oignon rouge et concasser les cacahuètes.",
        "Mélanger la sauce soja, le jus de citron vert et l'huile de sésame, puis y mélanger le riz, le poulet et les légumes.",
        "Parsemer de cacahuètes et de coriandre."],
       storage="Se garde 3 jours au réfrigérateur ; ajouter les cacahuètes au moment de manger.")

recipe("wraps-poulet-curry-yaourt-carottes", "Wraps au poulet curry, yaourt et carottes",
       "Des tortillas roulées autour de poulet au curry refroidi, de carottes râpées, de salade et d'une sauce au yaourt. On prépare la garniture la veille, on roule le matin.",
       2, 15, 8, ["plat", "lunch-box", "monde"],
       ["tortilla 4 piece", "poulet-filet 240 g", "curry 1 tsp", "yaourt 1 piece", "carotte 2 piece",
        "salade 0.5 piece", "jus-citron 1 tbsp", "huile-olive 1 tsp", "sel ?"],
       ["Couper le poulet en lanières et le saisir 6 minutes avec le curry dans l'huile, dans une poêle, à feu vif : il doit être cuit à cœur. Laisser refroidir.",
        "Râper les carottes et les mélanger avec le jus de citron et du sel.",
        "Tartiner les tortillas de yaourt, puis garnir de salade, de carottes et de poulet.",
        "Rouler bien serré et emballer dans du papier ou un film."],
       storage="La garniture se garde 3 jours au réfrigérateur ; rouler les wraps le jour même.")

recipe("salade-lentilles-betterave-chevre-noix", "Salade de lentilles, betterave, chèvre et noix",
       "Des lentilles vertes en vinaigrette moutardée avec des dés de betterave, de l'oignon rouge, du chèvre émietté et des noix. Encore meilleure après une nuit au frais.",
       2, 10, 25, ["salade", "plat", "lunch-box", "economique"],
       ["lentille-verte 140 g", "betterave 200 g", "chevre 60 g", "noix 20 g", "oignon-rouge 0.5 piece",
        "moutarde 1 tsp", "vinaigre 1 tbsp", "huile-olive 1 tbsp", "persil 5 g ?", "sel ?", "poivre ?"],
       ["Cuire les lentilles 25 minutes dans une casserole d'eau frémissante non salée, puis les égoutter et les laisser tiédir.",
        "Couper la betterave en dés et émincer finement l'oignon rouge.",
        "Fouetter la moutarde, le vinaigre, l'huile, du sel et du poivre, et y mélanger les lentilles, la betterave et l'oignon.",
        "Ajouter le chèvre émietté, les noix concassées et le persil."],
       storage="Se garde 3 jours au réfrigérateur ; ajouter les noix au moment de manger.")

recipe("salade-piemontaise-jambon-oeufs", "Salade piémontaise au jambon et aux œufs",
       "Des pommes de terre en dés, des œufs durs, du jambon et des cornichons, liés d'une sauce mayonnaise allégée au yaourt et à la moutarde. Le classique des boîtes à déjeuner.",
       2, 15, 20, ["salade", "plat", "lunch-box", "economique"],
       ["pomme-de-terre 4 piece", "oeuf 3 piece", "jambon 3 piece", "cornichon 30 g", "oignon-rouge 0.5 piece",
        "mayonnaise 1 tbsp", "yaourt 1 piece", "moutarde 1 tsp", "persil 5 g ?", "sel ?", "poivre ?"],
       ["Cuire les pommes de terre entières 20 minutes dans une casserole d'eau bouillante salée, en ajoutant les œufs pour les 10 dernières minutes.",
        "Égoutter, refroidir les œufs dans l'eau froide et les écaler, puis couper les pommes de terre en dés.",
        "Couper le jambon en carrés, les cornichons en rondelles et émincer l'oignon rouge.",
        "Mélanger la mayonnaise, le yaourt, la moutarde, du sel et du poivre.",
        "Mélanger le tout avec les œufs en quartiers et le persil."],
       storage="Se garde 2 jours au réfrigérateur ; se mange froide.")

recipe("bento-riz-saumon-soja-brocoli", "Bento riz, saumon laqué au soja et brocoli",
       "Du riz, des morceaux de saumon laqués à la sauce soja et au miel, et du brocoli cuit avec le riz, parsemés de sésame. Bon froid comme réchauffé.",
       2, 10, 20, ["plat", "lunch-box", "monde"],
       ["riz 120 g", "saumon 240 g", "brocoli 250 g", "sauce-soja 1 tbsp", "miel 1 tsp", "gingembre 5 g",
        "huile-tournesol 1 tsp", "graine-sesame 5 g", "jus-citron-vert 1 tbsp"],
       ["Cuire le riz dans une casserole d'eau bouillante salée selon le temps indiqué, en ajoutant le brocoli en fleurettes pour les 4 dernières minutes, puis égoutter.",
        "Pendant ce temps, couper le saumon en gros cubes et le saisir 4 minutes dans l'huile, dans une poêle, à feu moyen.",
        "Ajouter la sauce soja, le miel et le gingembre râpé, et laisser réduire 1 minute pour laquer le saumon.",
        "Répartir le riz, le brocoli et le saumon dans les boîtes, arroser de jus de citron vert et parsemer de sésame."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("muffins-oeufs-jambon-poireau", "Muffins aux œufs, jambon et poireau",
       "Des petits flans aux œufs garnis de poireau fondu, de jambon et d'emmental, cuits au four dans un moule à muffins. Ils se mangent froids, avec une salade de carottes.",
       2, 15, 25, ["plat", "four", "lunch-box", "economique"],
       ["oeuf 6 piece", "jambon 2 piece", "poireau 1 piece", "emmental 30 g", "lait 5 cl", "huile-olive 1 tsp",
        "carotte 2 piece", "jus-citron 1 tbsp", "sel ?", "poivre ?"],
       ["Préchauffer le four à 180 °C et huiler un moule à muffins.",
        "Émincer très finement le poireau et couper le jambon en petits carrés.",
        "Battre les œufs avec le lait, l'emmental, du sel et du poivre, puis ajouter le poireau et le jambon.",
        "Répartir dans le moule et enfourner 22 minutes : les muffins doivent être gonflés et pris.",
        "Servir froids ou tièdes avec les carottes râpées au jus de citron."],
       storage="Se gardent 3 jours au réfrigérateur ; se mangent froids.")

recipe("chili-haricots-rouges-riz-boite", "Chili de haricots rouges et riz en boîte",
       "Des haricots rouges mijotés dans une sauce tomate au cumin et au paprika, servis sur du riz avec du cheddar et du yaourt. Il se réchauffe parfaitement au micro-ondes du bureau.",
       2, 10, 25, ["plat", "lunch-box", "economique", "monde"],
       ["haricot-rouge 400 g", "riz 100 g", "tomate-concassee 400 g", "oignon 1 piece", "cumin 1 tsp",
        "paprika 1 tsp", "huile-olive 1 tsp", "cheddar 30 g", "yaourt 1 piece", "coriandre 5 g ?", "sel ?"],
       ["Cuire le riz dans une casserole d'eau bouillante salée selon le temps indiqué, puis l'égoutter.",
        "Pendant ce temps, émincer l'oignon et le faire revenir 4 minutes dans l'huile, dans une sauteuse, avec le cumin et le paprika.",
        "Ajouter les tomates, les haricots égouttés et du sel, et laisser mijoter 15 minutes : la sauce doit épaissir.",
        "Répartir le riz et le chili dans les boîtes, avec le cheddar râpé, le yaourt et la coriandre."],
       storage="Se garde 3 jours au réfrigérateur ou 2 mois au congélateur.")

recipe("salade-boulgour-poulet-carottes-raisins", "Salade de boulgour au poulet, carottes et raisins",
       "Du boulgour aux épices douces, avec du poulet poêlé, des carottes râpées, des raisins secs et une vinaigrette au citron. Le couscous froid qui ne craint pas le trajet.",
       2, 15, 15, ["salade", "plat", "lunch-box", "monde"],
       ["boulgour 120 g", "poulet-filet 220 g", "carotte 2 piece", "raisin-sec 20 g", "cumin 1 tsp",
        "cannelle 0.5 tsp", "jus-citron 2 tbsp", "huile-olive 1 tbsp", "menthe 5 g ?", "sel ?"],
       ["Cuire le boulgour 12 minutes dans une casserole d'eau salée avec les raisins secs, puis l'égoutter.",
        "Pendant ce temps, couper le poulet en dés et le saisir 6 minutes dans la moitié de l'huile, dans une poêle, avec le cumin et la cannelle : il doit être cuit à cœur.",
        "Râper les carottes.",
        "Mélanger le boulgour avec le poulet, les carottes, le jus de citron, le reste de l'huile et la menthe."],
       storage="Se garde 3 jours au réfrigérateur ; se mange froide.")

recipe("gratin-penne-brocoli-jambon", "Gratin de penne au brocoli et au jambon",
       "Des penne et du brocoli dans une béchamel légère au lait, avec du jambon et de l'emmental gratiné. Préparé le dimanche, réchauffé toute la semaine.",
       2, 15, 30, ["plat", "four", "lunch-box", "economique"],
       ["penne 160 g", "brocoli 300 g", "jambon 3 piece", "lait 25 cl", "farine 20 g", "beurre 15 g",
        "emmental 40 g", "muscade 0.5 tsp", "sel ?", "poivre ?"],
       ["Préchauffer le four à 200 °C. Cuire les penne dans une casserole d'eau bouillante salée selon le temps indiqué, en ajoutant le brocoli en fleurettes pour les 4 dernières minutes, puis égoutter.",
        "Dans la même casserole, faire fondre le beurre, ajouter la farine et mélanger 1 minute, puis verser le lait en fouettant jusqu'à épaississement.",
        "Assaisonner la béchamel de muscade, de sel et de poivre, et y mélanger les pâtes, le brocoli et le jambon en morceaux.",
        "Verser dans un plat, couvrir d'emmental et enfourner 15 minutes : le dessus doit être doré."],
       storage="Se garde 3 jours au réfrigérateur ; réchauffer au micro-ondes ou au four.")

recipe("falafels-four-pois-chiches-yaourt", "Falafels au four, carottes et sauce yaourt",
       "Des boulettes de pois chiches mixés au cumin et à l'oignon, cuites au four sans friture, servies avec une sauce au yaourt citronnée et des carottes râpées. Elles se mangent froides.",
       2, 20, 25, ["plat", "four", "lunch-box", "economique", "monde"],
       ["pois-chiche 400 g", "oignon 0.5 piece", "ail 1 piece", "farine 30 g", "oeuf 1 piece", "cumin 1 tsp",
        "huile-olive 1 tbsp", "yaourt 2 piece", "jus-citron 1 tbsp", "carotte 2 piece", "pain 60 g",
        "persil 10 g ?", "sel ?"],
       ["Préchauffer le four à 200 °C et huiler une plaque.",
        "Mixer les pois chiches égouttés avec l'oignon, l'ail, le cumin, l'œuf, la farine, le persil et du sel, jusqu'à obtenir une pâte qui se tient.",
        "Former des boulettes aplaties, les poser sur la plaque et les badigeonner d'huile.",
        "Enfourner 25 minutes en les retournant à mi-parcours : elles doivent être dorées.",
        "Servir avec le yaourt au jus de citron, les carottes râpées et le pain."],
       storage="Se gardent 3 jours au réfrigérateur ; se mangent froids ou réchauffés.")
