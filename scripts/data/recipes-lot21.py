# Vingt et unième lot de recettes originales — exécuté par scripts/generate-recipes-lot21.py.
# Fromages : des plats autour des fromages ajoutés par la migration 0070 (raclette,
# reblochon, camembert, mont d'or, roquefort, gorgonzola, beaufort, gruyère, cantal…). Au
# moins 20 g de protéines par part (vérifié par un test). De saison en novembre.
# Syntaxe : voir scripts/generate-recipes-migration.py. Aucune recette copiée (D7).
# Étapes : une action par étape, feu, temps et repère visuel ; aucune quantité dans le texte.

# — Fromages de montagne —

recipe("raclette-au-four-pommes-de-terre-jambon-cru", "Raclette au four, pommes de terre et jambon cru",
       "Toute la raclette sans appareil : des pommes de terre grenaille fondantes couvertes de fromage à raclette gratiné au four, avec du jambon cru, des cornichons et une salade.",
       2, 10, 35, ["plat", "four"],
       ["pomme-de-terre-grenaille 600 g", "raclette 300 g", "jambon-cru 100 g", "cornichon 60 g", "mache 60 g",
        "poivre ?"],
       ["Cuire les pommes de terre entières 20 minutes dans une casserole d'eau salée : la pointe d'un couteau doit s'enfoncer sans résistance.",
        "Préchauffer le four en position gril à 220 °C.",
        "Couper les pommes de terre en deux et les ranger côté coupé vers le haut dans un plat.",
        "Couvrir de tranches de raclette, poivrer et passer 6 à 8 minutes sous le gril : le fromage doit fondre et commencer à dorer.",
        "Servir aussitôt avec le jambon cru, les cornichons et la mâche."],
       storage="À manger tout de suite ; les pommes de terre cuites se gardent 3 jours au réfrigérateur.")

recipe("tartiflette-reblochon-lardons", "Tartiflette au reblochon et aux lardons",
       "Le grand classique savoyard : des pommes de terre, des lardons et des oignons fondus à la crème, sous un reblochon entier qui gratine au four.",
       4, 20, 50, ["plat", "four", "batch-cooking"],
       ["pomme-de-terre 1000 g", "reblochon 450 g", "lardon 200 g", "oignon 2 piece", "creme-fraiche 10 cl",
        "vin-blanc 5 cl ?", "poivre ?", "mache 100 g ?"],
       ["Cuire les pommes de terre épluchées 15 minutes dans une casserole d'eau salée : elles doivent rester un peu fermes. Les couper en rondelles épaisses.",
        "Préchauffer le four à 200 °C.",
        "Faire revenir les lardons et les oignons émincés 8 minutes dans une poêle à feu moyen, puis déglacer au vin blanc.",
        "Mélanger les pommes de terre, les lardons, les oignons et la crème dans un plat, et poivrer.",
        "Couper le reblochon en deux dans l'épaisseur et le poser croûte vers le haut sur les pommes de terre.",
        "Cuire 25 minutes au four : le fromage doit être fondu et doré. Servir avec la mâche."],
       storage="Se garde 3 jours au réfrigérateur ; réchauffer au four.")

recipe("mont-d-or-chaud-pommes-de-terre", "Mont d'or chaud au four, pommes de terre et jambon cru",
       "Une boîte de mont d'or chauffée au four avec un trait de vin blanc, à partager en y trempant des pommes de terre et du jambon cru. Le plat des soirées d'hiver.",
       3, 10, 30, ["plat", "four"],
       ["mont-d-or 450 g", "pomme-de-terre-grenaille 600 g", "jambon-cru 80 g", "ail 1 piece", "vin-blanc 3 cl ?",
        "mache 80 g ?", "poivre ?"],
       ["Préchauffer le four à 200 °C et cuire les pommes de terre 20 minutes dans une casserole d'eau salée.",
        "Retirer le couvercle de la boîte de mont d'or, l'emballer de papier aluminium sur les côtés et piquer le dessus de lamelles d'ail.",
        "Verser le vin blanc sur le fromage et cuire 20 minutes au four : le cœur doit être coulant.",
        "Servir le mont d'or dans sa boîte, avec les pommes de terre, le jambon cru, la mâche et du poivre."],
       storage="À manger tout de suite ; le reste de fromage se garde 2 jours au réfrigérateur et se réchauffe au four.")

recipe("truffade-cantal-lardons", "Truffade au cantal et aux lardons",
       "Des pommes de terre rissolées à la poêle avec de l'ail et des lardons, liées par du cantal fondu qui file. Une recette auvergnate pour les soirs froids.",
       2, 15, 30, ["plat", "poele"],
       ["pomme-de-terre 700 g", "cantal 200 g", "lardon 100 g", "ail 2 piece", "huile-tournesol 1 tbsp",
        "persil 5 g ?", "mache 60 g ?", "poivre ?"],
       ["Éplucher les pommes de terre et les couper en fines rondelles, hacher l'ail et couper le cantal en lamelles.",
        "Faire revenir les lardons 3 minutes dans l'huile, dans une grande poêle à feu moyen.",
        "Ajouter les pommes de terre et les cuire 20 minutes à couvert en remuant souvent : elles doivent être tendres et dorées.",
        "Ajouter l'ail et le cantal, et mélanger 5 minutes à feu doux jusqu'à ce que le fromage fonde et file.",
        "Poivrer et servir aussitôt avec le persil et la mâche."],
       storage="À manger de préférence tout de suite ; se garde 2 jours au réfrigérateur.")

recipe("risotto-champignons-beaufort", "Risotto aux champignons et au beaufort",
       "Un risotto crémeux aux champignons de Paris, au vin blanc et au bouillon, lié au beaufort râpé à la fin de la cuisson.",
       2, 10, 25, ["plat", "mijote"],
       ["riz-arborio 160 g", "champignon 250 g", "beaufort 100 g", "bouillon-volaille 1 piece", "oignon 1 piece",
        "vin-blanc 5 cl", "beurre 15 g", "persil 5 g ?", "poivre ?"],
       ["Délayer le bouillon dans de l'eau chaude et le garder frémissant, émincer l'oignon et les champignons, râper le beaufort.",
        "Faire revenir l'oignon et les champignons 5 minutes dans le beurre, dans une sauteuse à feu moyen.",
        "Ajouter le riz et le nacrer 2 minutes en remuant, puis verser le vin blanc et le laisser s'évaporer.",
        "Ajouter le bouillon louche par louche pendant 18 minutes, en attendant qu'il soit absorbé à chaque fois : le riz doit être crémeux et encore un peu ferme.",
        "Hors du feu, incorporer le beaufort, poivrer, couvrir 2 minutes et servir avec le persil."],
       storage="Se garde 2 jours au réfrigérateur ; réchauffer avec un peu de bouillon.")

recipe("gratin-chou-fleur-gruyere-jambon", "Gratin de chou-fleur au gruyère et jambon",
       "Des bouquets de chou-fleur et des dés de jambon nappés d'une béchamel au gruyère, gratinés au four jusqu'à être bien dorés.",
       2, 15, 30, ["plat", "four", "economique"],
       ["chou-fleur 600 g", "gruyere 100 g", "jambon 4 piece", "lait 30 cl", "farine 20 g", "beurre 20 g",
        "muscade 1 g ?", "poivre ?"],
       ["Préchauffer le four à 200 °C et cuire le chou-fleur en bouquets 8 minutes à l'eau bouillante salée, puis l'égoutter.",
        "Faire fondre le beurre dans une casserole, ajouter la farine et remuer 1 minute, puis verser le lait petit à petit en fouettant.",
        "Cuire la béchamel 4 minutes à feu doux en remuant : elle doit napper la cuillère. Ajouter la moitié du gruyère râpé, la muscade et le poivre.",
        "Ranger le chou-fleur et le jambon en dés dans un plat, napper de béchamel et parsemer du reste de gruyère.",
        "Cuire 20 minutes au four : le dessus doit être bien doré."],
       storage="Se garde 3 jours au réfrigérateur ; réchauffer au four.")

recipe("gratin-poireaux-mimolette-jambon", "Gratin de poireaux à la mimolette et au jambon",
       "Des poireaux fondants roulés dans du jambon, nappés d'une béchamel à la mimolette qui gratine en une croûte orangée.",
       2, 15, 30, ["plat", "four", "economique"],
       ["poireau 4 piece", "jambon 4 piece", "mimolette 100 g", "lait 25 cl", "farine 20 g", "beurre 20 g",
        "poivre ?"],
       ["Préchauffer le four à 200 °C. Couper les poireaux en tronçons de la longueur d'une tranche de jambon et les cuire 10 minutes à l'eau bouillante salée, puis les égoutter.",
        "Faire fondre le beurre dans une casserole, ajouter la farine 1 minute, puis verser le lait en fouettant et cuire 4 minutes jusqu'à ce que la sauce épaississe.",
        "Ajouter la moitié de la mimolette râpée à la sauce et poivrer.",
        "Rouler les poireaux dans le jambon, les ranger dans un plat, napper de sauce et parsemer du reste de mimolette.",
        "Cuire 15 minutes au four : le dessus doit être doré."],
       storage="Se garde 3 jours au réfrigérateur ; réchauffer au four.")

# — Pâtes molles —

recipe("camembert-roti-pommes-de-terre-jambon-cru", "Camembert rôti, pommes de terre et jambon cru",
       "Un camembert entier rôti au four avec de l'ail et du thym, dans lequel on trempe des pommes de terre grenaille et des lamelles de jambon cru. Avec une salade de mâche.",
       2, 10, 30, ["plat", "four"],
       ["camembert 250 g", "pomme-de-terre-grenaille 500 g", "jambon-cru 60 g", "ail 1 piece", "thym 1 g",
        "mache 60 g", "huile-olive 1 tbsp"],
       ["Préchauffer le four à 200 °C et cuire les pommes de terre entières 20 minutes dans une casserole d'eau salée.",
        "Retirer l'emballage du camembert, le remettre dans sa boîte en bois, entailler le dessus en croisillons et y piquer l'ail en lamelles et le thym.",
        "Arroser d'un filet d'huile et cuire 15 minutes au four : le cœur doit être coulant.",
        "Servir le camembert avec les pommes de terre, le jambon cru et la mâche assaisonnée du reste d'huile."],
       storage="À manger tout de suite.")

recipe("flamiche-maroilles-poireaux", "Flamiche au maroilles et aux poireaux",
       "Une tarte du Nord aux poireaux fondus, garnie d'un appareil aux œufs et à la crème et de tranches de maroilles qui fondent à la cuisson.",
       4, 20, 35, ["plat", "four"],
       ["pate-brisee 1 piece", "maroilles 250 g", "poireau 2 piece", "oeuf 3 piece", "creme-fraiche 20 cl",
        "beurre 15 g", "poivre ?", "salade 1 piece ?"],
       ["Préchauffer le four à 190 °C et foncer un moule à tarte avec la pâte.",
        "Émincer les poireaux et les faire fondre 10 minutes dans le beurre, dans une poêle à feu doux : ils doivent être tendres sans colorer.",
        "Fouetter les œufs avec la crème et du poivre.",
        "Étaler les poireaux sur la pâte, verser l'appareil et répartir le maroilles en tranches, croûte comprise.",
        "Cuire 35 minutes au four : la flamiche doit être dorée et prise. Servir tiède avec la salade."],
       storage="Se garde 2 jours au réfrigérateur ; réchauffer au four.")

recipe("pommes-de-terre-farcies-munster-jambon", "Pommes de terre farcies au munster et au jambon",
       "De grosses pommes de terre évidées, garnies de leur chair écrasée avec du jambon et du cumin, couvertes de munster et gratinées au four.",
       2, 15, 45, ["plat", "four"],
       ["pomme-de-terre 700 g", "munster 200 g", "jambon 2 piece", "creme-fraiche 5 cl", "cumin 1 g",
        "mache 60 g ?", "poivre ?"],
       ["Préchauffer le four à 200 °C et cuire les pommes de terre entières 25 minutes dans une casserole d'eau salée : elles doivent être tendres.",
        "Couper les pommes de terre en deux, les évider à la cuillère en gardant une fine épaisseur de chair.",
        "Écraser la chair avec la crème, le jambon en dés, le cumin et du poivre, puis en garnir les pommes de terre.",
        "Couvrir de lamelles de munster et cuire 15 minutes au four : le fromage doit être fondu et doré.",
        "Servir avec la mâche."],
       storage="Se garde 2 jours au réfrigérateur ; réchauffer au four.")

recipe("feuillete-brie-poireaux", "Tarte feuilletée au brie et aux poireaux",
       "Une pâte feuilletée garnie de poireaux fondus, d'un œuf battu à la crème et de tranches de brie, cuite jusqu'à ce que le feuilletage soit croustillant.",
       2, 15, 25, ["plat", "four"],
       ["pate-feuilletee 1 piece", "brie 200 g", "poireau 2 piece", "oeuf 2 piece", "creme-fraiche 5 cl",
        "beurre 10 g", "mache 60 g", "poivre ?"],
       ["Préchauffer le four à 200 °C et dérouler la pâte sur une plaque, en gardant le papier de cuisson.",
        "Émincer les poireaux et les faire fondre 10 minutes dans le beurre, dans une poêle à feu doux.",
        "Battre les œufs avec la crème et du poivre, puis mélanger aux poireaux.",
        "Étaler la garniture sur la pâte en laissant un bord libre, puis poser le brie en tranches.",
        "Cuire 25 minutes au four : la pâte doit être dorée et croustillante. Servir avec la mâche."],
       storage="Se garde 2 jours au réfrigérateur ; réchauffer au four pour garder le croustillant.")

# — Persillés —

recipe("pates-gorgonzola-epinards-noix", "Pâtes au gorgonzola, épinards et noix",
       "Des pâtes nappées d'une sauce onctueuse au gorgonzola fondu dans la crème, avec des épinards et des noix concassées pour le croquant.",
       2, 5, 15, ["plat", "poele"],
       ["pates 180 g", "gorgonzola 100 g", "creme-liquide 10 cl", "epinard 150 g", "noix 30 g", "poivre ?"],
       ["Cuire les pâtes dans une grande casserole d'eau bouillante salée selon le temps du paquet, puis les égoutter en gardant un fond d'eau de cuisson.",
        "Faire fondre le gorgonzola dans la crème 3 minutes dans une sauteuse à feu doux, en remuant jusqu'à obtenir une sauce lisse.",
        "Ajouter les épinards et les laisser tomber 2 minutes.",
        "Ajouter les pâtes et un peu d'eau de cuisson, mélanger, puis servir avec les noix concassées et du poivre."],
       storage="Se garde 2 jours au réfrigérateur ; réchauffer avec un peu de lait.")

recipe("salade-endives-poulet-roquefort-noix", "Salade d'endives, poulet, roquefort et noix",
       "Une salade d'hiver croquante : endives, poire, poulet doré, roquefort émietté et noix, avec une vinaigrette à la moutarde.",
       2, 15, 8, ["salade", "plat", "lunch-box"],
       ["endive 4 piece", "poulet-filet 200 g", "roquefort 80 g", "poire 1 piece", "noix 30 g", "huile-olive 2 tbsp",
        "vinaigre 1 tbsp", "moutarde 1 tsp", "poivre ?"],
       ["Couper le poulet en lanières et le dorer 7 minutes dans une poêle avec un filet d'huile : il doit être cuit à cœur. Le laisser tiédir.",
        "Émincer les endives, couper la poire en lamelles et émietter le roquefort.",
        "Fouetter la moutarde, le vinaigre, le reste de l'huile et du poivre.",
        "Mélanger les endives, la poire, le poulet et la vinaigrette, puis parsemer de roquefort et de noix concassées."],
       storage="Se garde 2 jours au réfrigérateur, vinaigrette à part ; ajouter la poire au dernier moment.")

recipe("gnocchis-fourme-ambert-poire-noix", "Gnocchis à la fourme d'Ambert, poire et noix",
       "Des gnocchis dorés à la poêle, enrobés d'une sauce à la fourme d'Ambert, avec des dés de poire poêlés et des noix. Prêt en 20 minutes.",
       2, 5, 15, ["plat", "poele"],
       ["gnocchi 500 g", "fourme-ambert 100 g", "creme-liquide 10 cl", "poire 1 piece", "noix 20 g", "beurre 10 g",
        "poivre ?"],
       ["Couper la poire en dés et la poêler 3 minutes dans le beurre à feu moyen, puis la réserver.",
        "Dorer les gnocchis 8 minutes dans la même poêle à feu moyen, en remuant souvent : ils doivent être croustillants à l'extérieur.",
        "Ajouter la crème et la fourme coupée en dés, et remuer 2 minutes à feu doux jusqu'à ce que le fromage fonde.",
        "Ajouter la poire, poivrer et servir avec les noix concassées."],
       storage="Se garde 1 jour au réfrigérateur ; réchauffer à la poêle.")

# — Autres fromages —

recipe("salade-tiede-lentilles-saint-nectaire-lardons", "Salade tiède de lentilles, saint-nectaire et lardons",
       "Des lentilles vertes tièdes à la vinaigrette moutardée, avec des lardons grillés, des dés de saint-nectaire, de l'oignon rouge et de la mâche.",
       2, 10, 25, ["salade", "plat", "lunch-box", "economique"],
       ["lentille-verte 140 g", "saint-nectaire 120 g", "lardon 100 g", "oignon-rouge 1 piece", "mache 80 g",
        "huile-olive 2 tbsp", "vinaigre 1 tbsp", "moutarde 1 tsp", "poivre ?"],
       ["Cuire les lentilles 20 minutes dans une casserole d'eau non salée : elles doivent être tendres mais entières. Les égoutter.",
        "Dorer les lardons 5 minutes à sec dans une poêle à feu moyen.",
        "Fouetter la moutarde, le vinaigre, l'huile et du poivre, et émincer finement l'oignon rouge.",
        "Mélanger les lentilles tièdes avec la vinaigrette, l'oignon et les lardons.",
        "Ajouter le saint-nectaire en dés et la mâche au moment de servir."],
       storage="Se garde 3 jours au réfrigérateur ; ajouter la mâche au dernier moment.")

recipe("burrata-butternut-rotie-lentilles", "Burrata, butternut rôtie et lentilles",
       "Des cubes de butternut rôtis au four, servis sur des lentilles vertes tièdes et coiffés d'une burrata crémeuse, avec un filet d'huile d'olive et des graines de sésame.",
       2, 10, 30, ["plat", "four"],
       ["butternut 500 g", "lentille-verte 120 g", "burrata 125 g", "huile-olive 2 tbsp", "vinaigre-balsamique 1 tbsp",
        "graine-sesame 5 g ?", "poivre ?"],
       ["Préchauffer le four à 200 °C. Éplucher la butternut, la couper en cubes et la rôtir 30 minutes avec la moitié de l'huile : elle doit être tendre et dorée.",
        "Pendant ce temps, cuire les lentilles 20 minutes dans une casserole d'eau non salée, puis les égoutter.",
        "Assaisonner les lentilles avec le reste de l'huile, le vinaigre balsamique et du poivre.",
        "Répartir les lentilles et la butternut dans les assiettes, poser la burrata au centre, l'ouvrir et parsemer de sésame."],
       storage="Lentilles et butternut se gardent 3 jours au réfrigérateur ; ajouter la burrata au moment de servir.")

recipe("pates-cacio-e-pepe-pecorino", "Pâtes au pecorino et au poivre",
       "Des pâtes liées d'une sauce crémeuse au pecorino râpé et au poivre noir concassé, faite seulement avec l'eau de cuisson. Trois ingrédients, 15 minutes.",
       2, 5, 10, ["plat", "express", "economique"],
       ["spaghetti 200 g", "pecorino 80 g", "poivre 2 g", "beurre 10 g"],
       ["Cuire les spaghetti dans une casserole d'eau bouillante peu salée selon le temps du paquet, en gardant un grand bol d'eau de cuisson.",
        "Râper finement le pecorino et concasser le poivre, puis le torréfier 1 minute à sec dans une grande poêle.",
        "Mélanger le pecorino avec quelques cuillères d'eau de cuisson tiède jusqu'à obtenir une crème lisse.",
        "Mettre les pâtes égouttées et le beurre dans la poêle hors du feu, ajouter la crème de pecorino et mélanger vivement en ajoutant de l'eau de cuisson jusqu'à ce que la sauce nappe."],
       storage="À manger tout de suite : la sauce ne se réchauffe pas bien.")

recipe("pates-mascarpone-citron-saumon-fume", "Pâtes au mascarpone, citron et saumon fumé",
       "Des pâtes enrobées d'une sauce minute au mascarpone et au zeste de citron, avec des lanières de saumon fumé et des épinards. Prêt en 15 minutes.",
       2, 5, 10, ["plat", "express"],
       ["pates 180 g", "mascarpone 100 g", "saumon-fume 120 g", "epinard 100 g", "citron 1 piece", "poivre ?",
        "ciboulette 5 g ?"],
       ["Cuire les pâtes dans une grande casserole d'eau bouillante salée selon le temps du paquet, puis les égoutter en gardant un fond d'eau de cuisson.",
        "Râper le zeste du citron, presser son jus et couper le saumon en lanières.",
        "Faire fondre le mascarpone avec le zeste et un peu d'eau de cuisson 2 minutes dans une sauteuse à feu doux, puis ajouter les épinards 1 minute.",
        "Ajouter les pâtes, le saumon et le jus de citron, mélanger hors du feu et servir avec le poivre et la ciboulette."],
       storage="Se garde 1 jour au réfrigérateur ; à manger de préférence tout de suite.")
