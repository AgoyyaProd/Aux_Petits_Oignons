# Seizième lot de recettes originales — exécuté par scripts/generate-recipes-lot16.py.
# Peu de matériel, peu de vaisselle : un seul récipient de cuisson par recette (une sauteuse,
# une poêle, un faitout ou un plat au four), ou rien d'autre qu'un bol et le micro-ondes.
# Le matériel est déduit des étapes : un test vérifie qu'aucune n'exige deux récipients.
# Au moins 20 g de protéines par part. Légumes de garde ou d'automne, ingrédients chiffrés,
# jus de citron en volume. Pas de friteuse à air (matériel non proposé dans les réglages).
# Syntaxe : voir scripts/generate-recipes-migration.py. Aucune recette copiée (D7).
# Étapes : une action par étape, feu, temps et repère visuel ; aucune quantité dans le texte.

# — Une sauteuse ou une poêle —

recipe("one-pot-pates-thon-tomate", "One pot de pâtes au thon et à la tomate",
       "Des pâtes cuites directement dans la sauce tomate à l'oignon et à l'ail, avec le thon ajouté à la fin et du parmesan. Une seule sauteuse, rien à égoutter.",
       2, 5, 15, ["plat", "poele", "peu-de-vaisselle", "economique"],
       ["pates 160 g", "thon-boite 140 g", "tomate-concassee 400 g", "oignon 1 piece", "ail 1 piece",
        "herbes-provence 1 tsp", "huile-olive 1 tsp", "parmesan 20 g", "basilic 5 g ?", "sel ?", "poivre ?"],
       ["Émincer l'oignon et l'ail et les faire revenir 2 minutes dans l'huile, dans une grande sauteuse, à feu moyen.",
        "Ajouter les pâtes, les tomates, les herbes, une pincée de sel et de l'eau à hauteur.",
        "Laisser mijoter 12 minutes à couvert en remuant souvent, en ajoutant un peu d'eau si besoin : les pâtes doivent être tendres et la sauce nappante.",
        "Hors du feu, ajouter le thon émietté et le parmesan, poivrer et servir avec le basilic."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("one-pot-pates-poulet-poireau", "One pot de pâtes au poulet, poireau et champignons",
       "Des pâtes cuites dans un bouillon léger avec du poulet, du poireau et des champignons, liées au fromage blanc et au parmesan. Crémeux sans crème, et une seule sauteuse.",
       2, 10, 15, ["plat", "poele", "peu-de-vaisselle"],
       ["pates 160 g", "poulet-filet 220 g", "poireau 1 piece", "champignon 150 g", "bouillon-volaille 0.5 piece",
        "fromage-blanc 100 g", "parmesan 15 g", "huile-olive 1 tsp", "poivre ?"],
       ["Couper le poulet en dés, émincer le poireau et les champignons.",
        "Saisir le poulet 3 minutes dans l'huile, dans une grande sauteuse, à feu vif, puis ajouter le poireau et les champignons 2 minutes.",
        "Ajouter les pâtes, le bouillon émietté et de l'eau à hauteur, et laisser mijoter 12 minutes en remuant souvent : les pâtes doivent être tendres et le poulet cuit à cœur.",
        "Hors du feu, incorporer le fromage blanc et le parmesan, poivrer et servir."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("gnocchis-poeles-tomate-mozzarella", "Gnocchis dorés à la poêle, tomate et mozzarella",
       "Des gnocchis dorés à la poêle sans précuisson, nappés de sauce tomate aux herbes, couverts de mozzarella fondue à couvert. Une poêle et c'est tout.",
       2, 5, 15, ["plat", "poele", "peu-de-vaisselle", "economique"],
       ["gnocchi 400 g", "tomate-concassee 400 g", "mozzarella 1 piece", "ail 1 piece", "herbes-provence 1 tsp",
        "huile-olive 1 tbsp", "salade 0.5 piece", "basilic 5 g ?", "sel ?"],
       ["Faire dorer les gnocchis 6 minutes dans l'huile, dans une grande poêle, à feu moyen, en remuant : ils doivent être croustillants.",
        "Ajouter l'ail râpé, les tomates, les herbes et une pincée de sel, et laisser mijoter 5 minutes.",
        "Poser la mozzarella en tranches, couvrir et laisser fondre 3 minutes à feu doux.",
        "Servir avec le basilic et la salade."],
       storage="À manger tout de suite.")

recipe("riz-sauteuse-poulet-crevettes-paprika", "Riz à la sauteuse au poulet, crevettes et paprika",
       "Un riz cuit dans la sauteuse avec du poulet, de l'oignon, de la tomate, du paprika et du curcuma, puis des crevettes ajoutées en fin de cuisson. Façon paella, sans la poêle spéciale.",
       2, 10, 25, ["plat", "poele", "peu-de-vaisselle", "monde"],
       ["riz 140 g", "poulet-filet 180 g", "crevette 150 g", "oignon 1 piece", "tomate-concassee 200 g",
        "paprika 1 tsp", "curcuma 0.5 tsp", "bouillon-volaille 0.5 piece", "huile-olive 1 tbsp", "jus-citron 1 tbsp",
        "persil 5 g ?"],
       ["Couper le poulet en dés et émincer l'oignon.",
        "Saisir le poulet et l'oignon 4 minutes dans l'huile, dans une grande sauteuse, à feu vif, avec le paprika et le curcuma.",
        "Ajouter le riz, les tomates, le bouillon émietté et de l'eau, et laisser mijoter 15 minutes à couvert, sans remuer.",
        "Enfoncer les crevettes dans le riz et laisser mijoter encore 4 minutes : elles doivent être roses et le riz tendre.",
        "Arroser de jus de citron et servir avec le persil."],
       storage="Se garde 1 jour au réfrigérateur ; bien réchauffer.")

recipe("shakshuka-pois-chiches-oeufs", "Shakshuka aux pois chiches et œufs pochés",
       "Des œufs pochés dans une sauce tomate épicée au cumin et au paprika, enrichie de pois chiches, servis dans la poêle avec du pain pour saucer.",
       2, 5, 20, ["plat", "poele", "peu-de-vaisselle", "economique", "monde"],
       ["oeuf 4 piece", "pois-chiche 265 g", "tomate-concassee 400 g", "oignon 1 piece", "cumin 1 tsp",
        "paprika 1 tsp", "huile-olive 1 tbsp", "pain 80 g", "coriandre 5 g ?", "sel ?"],
       ["Émincer l'oignon et le faire revenir 4 minutes dans l'huile, dans une poêle, à feu moyen.",
        "Ajouter le cumin, le paprika, les tomates, les pois chiches égouttés et du sel, et laisser mijoter 8 minutes.",
        "Creuser quatre puits, y casser les œufs, couvrir et laisser 6 minutes à feu doux : les blancs doivent être pris et les jaunes coulants.",
        "Servir dans la poêle avec la coriandre et le pain."],
       storage="La sauce se garde 3 jours au réfrigérateur ; pocher les œufs au moment de servir.")

recipe("saumon-poireaux-pommes-de-terre-poele", "Saumon, poireaux fondus et pommes de terre à la poêle",
       "Des pommes de terre en petits dés dorées à couvert, des poireaux fondus et des pavés de saumon posés dessus pour finir, avec un trait de citron. Tout dans la même poêle.",
       2, 10, 25, ["plat", "poele", "peu-de-vaisselle"],
       ["saumon 260 g", "pomme-de-terre 3 piece", "poireau 2 piece", "huile-olive 1 tbsp", "jus-citron 1 tbsp",
        "ciboulette 5 g ?", "sel ?", "poivre ?"],
       ["Couper les pommes de terre en petits dés et émincer les poireaux.",
        "Faire dorer les pommes de terre 10 minutes dans l'huile, dans une grande poêle couverte, à feu moyen, en remuant de temps en temps.",
        "Ajouter les poireaux et une pincée de sel et laisser fondre 6 minutes à couvert.",
        "Poser le saumon sur les légumes, couvrir et laisser 7 minutes à feu doux : il doit s'effeuiller facilement.",
        "Arroser de jus de citron, poivrer et servir avec la ciboulette."],
       storage="Se garde 1 jour au réfrigérateur.")

recipe("risotto-poulet-champignons-sauteuse", "Risotto au poulet et aux champignons",
       "Un risotto crémeux au parmesan, avec du poulet et des champignons saisis dans la même sauteuse. On remue, et c'est à peu près tout.",
       2, 10, 25, ["plat", "poele", "peu-de-vaisselle"],
       ["riz-arborio 150 g", "poulet-filet 200 g", "champignon 200 g", "oignon 1 piece", "bouillon-volaille 0.5 piece",
        "parmesan 25 g", "huile-olive 1 tbsp", "persil 5 g ?", "poivre ?"],
       ["Couper le poulet en dés, émincer l'oignon et les champignons.",
        "Saisir le poulet et les champignons 5 minutes dans l'huile, dans une sauteuse, à feu vif, puis ajouter l'oignon 2 minutes.",
        "Ajouter le riz et le nacrer 1 minute en remuant, puis le bouillon émietté et une louche d'eau chaude.",
        "Laisser mijoter 18 minutes en ajoutant de l'eau chaude au fur et à mesure et en remuant souvent : le riz doit être crémeux et encore un peu ferme.",
        "Hors du feu, incorporer le parmesan, poivrer et servir avec le persil."],
       storage="Se garde 1 jour au réfrigérateur ; réchauffer avec un peu d'eau.")

# — Un faitout ou une cocotte —

recipe("chili-con-carne-riz-une-cocotte", "Chili con carne et riz dans la même cocotte",
       "Un chili de bœuf aux haricots rouges, cumin et paprika, dans lequel on fait cuire le riz directement. Un plat complet, une seule cocotte à laver.",
       2, 10, 30, ["plat", "peu-de-vaisselle", "economique", "monde"],
       ["boeuf-hache 220 g", "haricot-rouge 265 g", "riz 100 g", "tomate-concassee 400 g", "oignon 1 piece",
        "cumin 1 tsp", "paprika 1 tsp", "huile-olive 1 tsp", "yaourt 1 piece", "coriandre 5 g ?", "sel ?"],
       ["Émincer l'oignon et le faire revenir 3 minutes dans l'huile, dans une cocotte, à feu moyen.",
        "Ajouter la viande, le cumin et le paprika et faire dorer 5 minutes : la viande ne doit plus être rose.",
        "Ajouter les tomates, les haricots égouttés, le riz, du sel et de l'eau à hauteur.",
        "Laisser mijoter 20 minutes à couvert en remuant de temps en temps : le riz doit être tendre.",
        "Servir avec le yaourt et la coriandre."],
       storage="Se garde 3 jours au réfrigérateur ou 2 mois au congélateur.")

recipe("dahl-lentilles-corail-carottes-coco", "Dahl de lentilles corail aux carottes et coco",
       "Des lentilles corail mijotées dans un faitout avec des carottes, de la tomate, du curry et du lait de coco, jusqu'à devenir fondantes, servies avec du pain et du yaourt.",
       2, 10, 25, ["plat", "peu-de-vaisselle", "economique", "monde"],
       ["lentille-corail 160 g", "carotte 2 piece", "oignon 1 piece", "tomate-concassee 200 g", "lait-coco 10 cl",
        "curry 2 tsp", "gingembre 10 g", "huile-tournesol 1 tsp", "yaourt 1 piece", "pain 80 g",
        "coriandre 5 g ?", "sel ?"],
       ["Émincer l'oignon, râper le gingembre et couper les carottes en petits dés.",
        "Faire revenir l'oignon, le gingembre et le curry 3 minutes dans l'huile, dans un faitout, à feu moyen.",
        "Ajouter les carottes, les lentilles rincées, les tomates, le lait de coco et de l'eau à hauteur.",
        "Laisser mijoter 20 minutes en remuant de temps en temps : les lentilles doivent se défaire. Saler.",
        "Servir avec le yaourt, la coriandre et le pain."],
       storage="Se garde 3 jours au réfrigérateur ou 2 mois au congélateur.")

recipe("tajine-poulet-carottes-pois-chiches", "Tajine de poulet aux carottes et pois chiches",
       "Du poulet mijoté au cumin et au curcuma avec des carottes, des pois chiches, de la tomate et des raisins secs, servi sur une semoule gonflée dans le bouillon de cuisson.",
       2, 15, 30, ["plat", "peu-de-vaisselle", "monde"],
       ["poulet-filet 240 g", "pois-chiche 265 g", "carotte 2 piece", "oignon 1 piece", "tomate-concassee 200 g",
        "raisin-sec 20 g", "cumin 1 tsp", "curcuma 0.5 tsp", "huile-olive 1 tbsp", "semoule 80 g",
        "coriandre 5 g ?", "sel ?"],
       ["Couper le poulet en morceaux, les carottes en rondelles et émincer l'oignon.",
        "Faire revenir le poulet et l'oignon 5 minutes dans l'huile, dans un faitout, à feu moyen, avec le cumin et le curcuma.",
        "Ajouter les carottes, les pois chiches égouttés, les tomates, les raisins secs, du sel et de l'eau, et laisser mijoter 20 minutes à couvert : le poulet doit être cuit à cœur.",
        "Verser la semoule dans un saladier, la couvrir de bouillon prélevé dans le faitout et couvrir 5 minutes.",
        "Égrener la semoule et servir avec le tajine et la coriandre."],
       storage="Le tajine se garde 3 jours au réfrigérateur ou 2 mois au congélateur.")

# — Un plat au four —

recipe("poulet-pommes-de-terre-carottes-un-plat", "Poulet, pommes de terre et carottes rôtis dans un seul plat",
       "Des morceaux de poulet, des pommes de terre, des carottes et de l'oignon rouge rôtis ensemble aux herbes et à l'ail, avec un yaourt citronné. On enfourne et on oublie.",
       2, 15, 35, ["plat", "four", "peu-de-vaisselle", "economique"],
       ["poulet-filet 280 g", "pomme-de-terre 3 piece", "carotte 3 piece", "oignon-rouge 1 piece", "ail 2 piece",
        "herbes-provence 1 tsp", "paprika 1 tsp", "huile-olive 1 tbsp", "yaourt 1 piece", "jus-citron 1 tbsp",
        "sel ?", "poivre ?"],
       ["Préchauffer le four à 210 °C.",
        "Couper les pommes de terre et les carottes en morceaux, l'oignon en quartiers, et les mélanger dans un grand plat avec l'huile, l'ail, les herbes, du sel et du poivre.",
        "Enfourner 20 minutes.",
        "Ajouter le poulet en gros morceaux frotté au paprika, mélanger et enfourner encore 15 minutes : le poulet doit être cuit à cœur et les légumes dorés.",
        "Servir avec le yaourt mélangé au jus de citron."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("saumon-patate-douce-brocoli-plat", "Saumon, patate douce et brocoli en un seul plat",
       "Des cubes de patate douce rôtis, rejoints par des fleurettes de brocoli et des pavés de saumon à la moutarde et au miel. Tout cuit dans le même plat.",
       2, 10, 30, ["plat", "four", "peu-de-vaisselle"],
       ["saumon 260 g", "patate-douce 400 g", "brocoli 300 g", "moutarde 1 tsp", "miel 1 tsp",
        "huile-olive 1 tbsp", "jus-citron 1 tbsp", "graine-sesame 5 g ?", "sel ?", "poivre ?"],
       ["Préchauffer le four à 210 °C.",
        "Couper la patate douce en cubes, la mélanger dans un grand plat avec la moitié de l'huile et du sel, et enfourner 15 minutes.",
        "Ajouter le brocoli en fleurettes arrosé du reste de l'huile, puis poser le saumon badigeonné de moutarde et de miel.",
        "Enfourner 15 minutes : le saumon doit s'effeuiller et le brocoli être tendre.",
        "Arroser de jus de citron, poivrer et servir avec le sésame."],
       storage="Se garde 1 jour au réfrigérateur.")

recipe("pois-chiches-rotis-butternut-feta", "Pois chiches rôtis, butternut et feta",
       "De la courge butternut et des pois chiches rôtis au cumin avec de l'oignon rouge, puis de la feta émiettée et une sauce au yaourt. Un seul plat, très peu de préparation.",
       2, 10, 35, ["plat", "four", "peu-de-vaisselle", "economique"],
       ["butternut 600 g", "pois-chiche 400 g", "feta 70 g", "oignon-rouge 1 piece", "cumin 1 tsp",
        "huile-olive 1 tbsp", "yaourt 1 piece", "jus-citron 1 tbsp", "pain 60 g", "menthe 5 g ?", "sel ?"],
       ["Préchauffer le four à 210 °C.",
        "Éplucher la butternut et la couper en cubes, émincer l'oignon rouge et égoutter les pois chiches.",
        "Mélanger le tout dans un grand plat avec l'huile, le cumin et du sel, et enfourner 30 minutes en remuant à mi-parcours : la courge doit être tendre et dorée.",
        "Émietter la feta sur le plat et repasser 5 minutes au four.",
        "Servir avec le yaourt au jus de citron, la menthe et le pain."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("cabillaud-chapelure-pommes-de-terre-poireau", "Cabillaud en croûte de chapelure, pommes de terre et poireau",
       "Des rondelles de pommes de terre et de poireau rôties en lit, avec du cabillaud couvert d'une croûte de chapelure au parmesan et au citron. Un plat, un dîner.",
       2, 15, 35, ["plat", "four", "peu-de-vaisselle"],
       ["cabillaud 300 g", "pomme-de-terre 3 piece", "poireau 1 piece", "chapelure 20 g", "parmesan 15 g",
        "jus-citron 1 tbsp", "huile-olive 1 tbsp", "persil 5 g ?", "sel ?", "poivre ?"],
       ["Préchauffer le four à 210 °C.",
        "Couper les pommes de terre en fines rondelles et le poireau en tronçons, les étaler dans un grand plat avec l'huile, du sel et du poivre, et enfourner 20 minutes.",
        "Mélanger la chapelure, le parmesan et le persil.",
        "Poser le cabillaud sur les légumes, l'arroser de jus de citron et le couvrir de chapelure.",
        "Enfourner 15 minutes : le poisson doit s'effeuiller et la croûte être dorée."],
       storage="Se garde 1 jour au réfrigérateur.")

recipe("tofu-roti-patate-douce-carottes-soja", "Tofu rôti, patate douce et carottes au soja-miel",
       "Des cubes de tofu, de patate douce et de carotte rôtis dans un plat avec une sauce soja, miel et gingembre qui caramélise, parsemés de sésame.",
       2, 10, 30, ["plat", "four", "peu-de-vaisselle", "monde"],
       ["tofu 350 g", "patate-douce 300 g", "carotte 2 piece", "sauce-soja 1 tbsp", "miel 1 tsp", "gingembre 10 g",
        "huile-sesame 1 tbsp", "graine-sesame 10 g", "jus-citron-vert 1 tbsp", "coriandre 5 g ?"],
       ["Préchauffer le four à 210 °C.",
        "Couper le tofu, la patate douce et les carottes en cubes.",
        "Mélanger la sauce soja, le miel, le gingembre râpé et l'huile, et en enrober le tofu et les légumes dans un grand plat.",
        "Enfourner 30 minutes en remuant à mi-parcours : le tofu doit être doré et les légumes tendres.",
        "Arroser de jus de citron vert et servir avec le sésame et la coriandre."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("clafoutis-sale-poireau-thon", "Clafoutis salé au poireau et au thon",
       "Un appareil aux œufs et au lait versé sur du poireau émincé cru et du thon, avec un peu d'emmental, puis doré au four. Une salade à côté, et un seul plat à laver.",
       2, 15, 35, ["plat", "four", "peu-de-vaisselle", "economique"],
       ["oeuf 4 piece", "lait 25 cl", "farine 40 g", "thon-boite 140 g", "poireau 1 piece", "emmental 30 g",
        "muscade 0.5 tsp", "huile-olive 1 tsp", "salade 0.5 piece", "vinaigre 1 tsp", "sel ?", "poivre ?"],
       ["Préchauffer le four à 190 °C et huiler un plat.",
        "Émincer très finement le poireau et le répartir dans le plat avec le thon émietté.",
        "Fouetter les œufs avec la farine, puis le lait, la muscade, du sel et du poivre, et verser dans le plat.",
        "Parsemer d'emmental et enfourner 35 minutes : le clafoutis doit être gonflé, doré et pris au centre.",
        "Servir tiède avec la salade assaisonnée au vinaigre."],
       storage="Se garde 2 jours au réfrigérateur ; se mange aussi froid.")

# — Un bol et le micro-ondes —

recipe("patates-douces-micro-ondes-haricots-cheddar", "Patates douces farcies au micro-ondes, haricots rouges et cheddar",
       "Des patates douces attendries au micro-ondes, ouvertes et garnies de haricots rouges au cumin, de cheddar fondu et de yaourt. Aucune casserole.",
       2, 5, 12, ["plat", "peu-de-vaisselle", "economique", "monde"],
       ["patate-douce 600 g", "haricot-rouge 265 g", "cheddar 40 g", "yaourt 2 piece", "cumin 1 tsp",
        "jus-citron-vert 1 tbsp", "coriandre 5 g ?", "sel ?"],
       ["Piquer les patates douces à la fourchette et les passer 10 minutes au micro-ondes à pleine puissance, en les retournant à mi-parcours : la pointe d'un couteau doit s'enfoncer sans effort.",
        "Pendant ce temps, mélanger les haricots égouttés avec le cumin, le jus de citron vert et du sel.",
        "Ouvrir les patates douces, les garnir de haricots et de cheddar, et repasser 2 minutes au micro-ondes : le fromage doit fondre.",
        "Servir avec le yaourt et la coriandre."],
       storage="La garniture se garde 3 jours au réfrigérateur.")

recipe("bol-semoule-micro-ondes-thon-betterave", "Bol de semoule au micro-ondes, thon et betterave",
       "Une semoule gonflée au micro-ondes, mélangée à du thon, de la betterave, des carottes râpées et de l'oignon rouge, avec une vinaigrette au citron. Un bol et une fourchette.",
       2, 10, 3, ["plat", "peu-de-vaisselle", "economique"],
       ["semoule 120 g", "thon-boite 140 g", "betterave 200 g", "carotte 1 piece", "oignon-rouge 0.5 piece",
        "jus-citron 1 tbsp", "huile-olive 1 tbsp", "persil 5 g ?", "sel ?", "poivre ?"],
       ["Verser la semoule dans un grand bol avec autant d'eau froide et une pincée de sel, et passer 2 minutes au micro-ondes.",
        "Couvrir, laisser gonfler 3 minutes, puis égrener à la fourchette avec l'huile.",
        "Couper la betterave en dés, râper la carotte et émincer l'oignon rouge.",
        "Mélanger le tout avec le thon émietté, le jus de citron, du poivre et le persil."],
       storage="Se garde 2 jours au réfrigérateur ; se mange froid.")

recipe("saumon-micro-ondes-poireau-pommes-de-terre", "Saumon au micro-ondes, poireau et pommes de terre",
       "Des pommes de terre et du poireau attendris au micro-ondes dans un plat couvert, puis du saumon posé dessus avec du citron et un fromage blanc à la ciboulette. Rapide et sans odeur de friture.",
       2, 10, 14, ["plat", "peu-de-vaisselle"],
       ["saumon 260 g", "pomme-de-terre 3 piece", "poireau 1 piece", "jus-citron 1 tbsp", "huile-olive 1 tsp",
        "fromage-blanc 100 g", "ciboulette 5 g ?", "sel ?", "poivre ?"],
       ["Couper les pommes de terre en fines rondelles et émincer le poireau, les mettre dans un récipient allant au micro-ondes avec un fond d'eau et du sel.",
        "Couvrir et passer 9 minutes au micro-ondes à pleine puissance : les pommes de terre doivent être tendres.",
        "Poser le saumon sur les légumes, l'arroser de jus de citron et d'huile, couvrir et passer 4 minutes au micro-ondes : il doit s'effeuiller.",
        "Mélanger le fromage blanc avec la ciboulette et du poivre, et servir avec le saumon."],
       storage="Se garde 1 jour au réfrigérateur.")

recipe("oeufs-brouilles-micro-ondes-champignons", "Œufs brouillés au micro-ondes, champignons et tartines",
       "Des œufs battus avec des champignons émincés et un peu d'emmental, brouillés au micro-ondes en remuant toutes les 30 secondes, servis sur des tranches de pain avec une salade.",
       2, 5, 4, ["plat", "peu-de-vaisselle", "economique"],
       ["oeuf 5 piece", "champignon 150 g", "emmental 30 g", "lait 5 cl", "pain 80 g", "salade 0.5 piece",
        "vinaigre 1 tsp", "huile-olive 1 tsp", "ciboulette 5 g ?", "sel ?", "poivre ?"],
       ["Émincer finement les champignons et les passer 1 minute au micro-ondes dans un grand bol.",
        "Ajouter les œufs, le lait, l'emmental, du sel et du poivre, et battre à la fourchette.",
        "Passer 30 secondes au micro-ondes, remuer, et répéter jusqu'à ce que les œufs soient pris mais encore crémeux.",
        "Servir sur les tranches de pain avec la ciboulette et la salade assaisonnée au vinaigre et à l'huile."],
       storage="À manger tout de suite.")
