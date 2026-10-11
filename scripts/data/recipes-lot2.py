# Deuxième lot de recettes originales — exécuté par scripts/generate-recipes-lot2.py.
# Syntaxe des lignes : voir scripts/generate-recipes-migration.py.
# Quantités pour `servings` portions. Aucune recette copiée d'un site tiers (D7).

# ---------------------------------------------------------------------------
# Pâtes
# ---------------------------------------------------------------------------
recipe("spaghetti-carbonara", "Spaghetti carbonara",
       "La vraie version, sans crème : jaunes d'œufs, parmesan et lardons bien dorés.",
       4, 10, 15, ["plat", "poele"],
       ["spaghetti 400 g", "lardon 200 g", "oeuf 4 piece | 1 entier et 3 jaunes", "parmesan 80 g | râpé",
        "poivre 1 tsp | moulu", "sel ?"],
       ["Cuire les spaghetti dans une grande casserole d'eau salée.",
        "Faire dorer les lardons à sec dans une grande poêle.",
        "Battre l'œuf entier et les jaunes avec le parmesan et beaucoup de poivre.",
        "Hors du feu, mélanger les pâtes égouttées aux lardons, puis aux œufs avec un peu d'eau de cuisson pour obtenir une sauce crémeuse."])

recipe("penne-arrabbiata", "Penne all'arrabbiata",
       "Une sauce tomate relevée au piment, prête le temps de cuire les pâtes.",
       4, 5, 20, ["plat", "economique"],
       ["penne 400 g", "tomate-concassee 400 g", "ail 3 piece | émincé", "piment 2 g | séché ou frais",
        "huile-olive 3 tbsp", "persil 10 g ? | haché", "parmesan 30 g ?", "sel ?"],
       ["Faire chauffer l'huile avec l'ail et le piment sans les colorer.",
        "Ajouter les tomates, saler et laisser réduire 15 minutes.",
        "Cuire les penne al dente, les égoutter et les mélanger à la sauce.",
        "Parsemer de persil et de parmesan."])

recipe("farfalle-saumon-epinards", "Farfalle au saumon fumé et aux épinards",
       "Crème, citron et épinards frais : un plat doux, prêt en 20 minutes.",
       4, 10, 12, ["plat", "poele"],
       ["farfalle 400 g", "saumon-fume 150 g | en lanières", "epinard 150 g", "creme-liquide 20 cl",
        "citron 1 piece | zeste et jus", "poivre ?"],
       ["Cuire les farfalle dans l'eau salée.",
        "Faire tomber les épinards dans une poêle avec la crème, 3 minutes.",
        "Ajouter le zeste et un filet de jus de citron, poivrer.",
        "Mélanger avec les pâtes égouttées et le saumon juste avant de servir."])

recipe("coquillettes-jambon-emmental", "Coquillettes jambon-emmental",
       "Le plat réconfort des soirs pressés, que tout le monde aime.",
       4, 5, 12, ["plat", "economique"],
       ["coquillettes 400 g", "jambon 4 piece | en dés", "emmental 100 g", "beurre 20 g", "poivre ?"],
       ["Cuire les coquillettes dans l'eau salée.",
        "Les égoutter puis remettre dans la casserole avec le beurre.",
        "Ajouter le jambon et l'emmental, mélanger jusqu'à ce que le fromage file. Poivrer."])

recipe("tagliatelles-champignons-creme", "Tagliatelles aux champignons et à la crème",
       "Des champignons bien dorés, une touche d'ail et de crème.",
       4, 10, 15, ["plat", "poele"],
       ["tagliatelles 400 g", "champignon 400 g | émincés", "creme-fraiche 20 cl", "ail 2 piece | haché",
        "echalote 1 piece | hachée", "beurre 20 g", "persil 10 g ?", "parmesan 30 g ?", "sel ?", "poivre ?"],
       ["Faire revenir l'échalote dans le beurre, puis les champignons à feu vif jusqu'à ce qu'ils dorent.",
        "Ajouter l'ail et la crème, laisser réduire 3 minutes. Saler, poivrer.",
        "Cuire les tagliatelles, les égoutter et les mélanger à la sauce.",
        "Servir avec persil et parmesan."])

recipe("lasagnes-bolognaise", "Lasagnes à la bolognaise",
       "Le grand plat familial : sauce bolognaise mijotée et béchamel maison.",
       6, 30, 45, ["plat", "four", "batch-cooking"],
       ["pates-lasagne 300 g", "boeuf-hache 500 g", "coulis-tomate 700 g", "oignon 1 piece | haché",
        "carotte 1 piece | râpée", "ail 2 piece", "huile-olive 1 tbsp", "lait 75 cl", "beurre 50 g",
        "farine 50 g", "emmental 100 g", "muscade 0.25 tsp", "sel ?", "poivre ?"],
       ["Faire revenir l'oignon, la carotte et l'ail dans l'huile, ajouter le bœuf et le faire colorer.",
        "Verser le coulis, saler, poivrer et laisser mijoter 20 minutes.",
        "Béchamel : faire fondre le beurre, ajouter la farine, puis le lait en fouettant jusqu'à épaississement. Ajouter la muscade.",
        "Dans un plat, alterner sauce, pâtes et béchamel, en finissant par la béchamel et l'emmental.",
        "Cuire 40 minutes à 180 °C et laisser reposer 10 minutes avant de couper."])

recipe("lasagnes-epinards-ricotta", "Lasagnes épinards et ricotta",
       "Des lasagnes sans viande, fondantes et parfumées.",
       6, 25, 40, ["plat", "four", "batch-cooking"],
       ["pates-lasagne 300 g", "epinard 600 g", "ricotta 500 g", "coulis-tomate 600 g", "mozzarella 2 piece",
        "parmesan 50 g", "ail 2 piece", "muscade 0.25 tsp", "sel ?", "poivre ?"],
       ["Faire tomber les épinards avec l'ail, les égoutter et les hacher.",
        "Mélanger épinards, ricotta, la moitié du parmesan, la muscade, sel et poivre.",
        "Dans un plat, alterner coulis, pâtes et mélange épinards-ricotta.",
        "Terminer par du coulis, la mozzarella en tranches et le reste du parmesan.",
        "Cuire 40 minutes à 180 °C."])

recipe("macaronis-gratines", "Macaronis gratinés au fromage",
       "Une béchamel au cheddar et à l'emmental, gratinée au four.",
       4, 15, 20, ["plat", "four"],
       ["macaronis 350 g", "lait 60 cl", "beurre 40 g", "farine 40 g", "cheddar 120 g | râpé",
        "emmental 60 g", "muscade 0.25 tsp", "chapelure 2 tbsp ?", "sel ?"],
       ["Cuire les macaronis 2 minutes de moins que l'indication du paquet.",
        "Préparer une béchamel avec le beurre, la farine et le lait ; hors du feu, ajouter le cheddar et la muscade.",
        "Mélanger avec les pâtes, verser dans un plat, couvrir d'emmental et de chapelure.",
        "Gratiner 20 minutes à 200 °C."])

recipe("fusilli-pesto-poulet", "Fusilli au pesto, poulet et tomates cerises",
       "Un plat coloré, aussi bon chaud que froid le lendemain.",
       4, 10, 15, ["plat", "poele"],
       ["fusilli 400 g", "poulet-filet 400 g | en morceaux", "pesto 120 g", "tomate-cerise 250 g | coupées en deux",
        "huile-olive 1 tbsp", "parmesan 30 g ?", "sel ?", "poivre ?"],
       ["Cuire les fusilli dans l'eau salée.",
        "Faire dorer le poulet dans l'huile 8 minutes, saler, poivrer.",
        "Mélanger les pâtes égouttées avec le pesto, le poulet et les tomates cerises.",
        "Servir avec le parmesan."])

recipe("linguine-crevettes-ail", "Linguine aux crevettes, ail et citron",
       "Des crevettes saisies à l'ail, relevées d'un peu de piment.",
       4, 10, 12, ["plat", "poele"],
       ["linguine 400 g", "crevette 400 g | décortiquées", "ail 3 piece | émincé", "citron 1 piece",
        "huile-olive 4 tbsp", "persil 15 g", "piment 1 g ?", "sel ?"],
       ["Cuire les linguine dans l'eau salée.",
        "Faire chauffer l'huile avec l'ail et le piment, ajouter les crevettes et les saisir 3 minutes.",
        "Ajouter le jus et le zeste du citron, puis les pâtes avec un peu d'eau de cuisson.",
        "Parsemer de persil."])

recipe("rigatoni-saucisse-tomate", "Rigatoni à la saucisse et à la tomate",
       "Une sauce généreuse avec la chair de saucisse émiettée.",
       4, 10, 25, ["plat", "economique"],
       ["rigatoni 400 g", "saucisse 4 piece | chair retirée du boyau", "tomate-concassee 400 g",
        "oignon 1 piece", "ail 2 piece", "huile-olive 1 tbsp", "parmesan 40 g ?", "sel ?", "poivre ?"],
       ["Faire revenir l'oignon dans l'huile, ajouter la chair de saucisse et l'émietter en la dorant.",
        "Ajouter l'ail et les tomates, laisser mijoter 15 minutes.",
        "Cuire les rigatoni, les mélanger à la sauce et servir avec le parmesan."])

recipe("pates-thon-tomate", "Pâtes au thon, tomate et câpres",
       "Un plat de placard : thon en boîte, coulis, olives et câpres.",
       4, 5, 15, ["plat", "economique"],
       ["pates 400 g", "thon-boite 280 g | égoutté", "coulis-tomate 500 g", "olive 60 g", "capre 15 g ?",
        "ail 2 piece", "huile-olive 2 tbsp", "sel ?", "poivre ?"],
       ["Faire revenir l'ail dans l'huile, ajouter le coulis et laisser mijoter 10 minutes.",
        "Ajouter le thon émietté, les olives et les câpres.",
        "Mélanger avec les pâtes cuites et égouttées."])

recipe("one-pot-pasta-legumes", "One pot pasta aux légumes",
       "Tout cuit dans la même casserole, les pâtes absorbent le bouillon parfumé.",
       4, 10, 15, ["plat", "economique"],
       ["pates 350 g", "courgette 1 piece | en dés", "tomate-cerise 250 g", "oignon 1 piece | émincé",
        "ail 2 piece", "bouillon-legumes 1 piece", "eau 90 cl", "basilic 10 g ?", "parmesan 40 g ?", "sel ?"],
       ["Mettre tous les ingrédients sauf le basilic et le parmesan dans une grande casserole.",
        "Porter à ébullition puis cuire 12 minutes à feu moyen en remuant souvent.",
        "Quand le liquide est presque absorbé, ajouter le basilic et le parmesan."])

recipe("penne-courgettes-feta", "Penne aux courgettes, feta et menthe",
       "Frais et léger, avec le zeste de citron qui réveille le tout.",
       4, 10, 15, ["plat", "poele"],
       ["penne 400 g", "courgette 2 piece | en rondelles fines", "feta 150 g", "citron 1 piece",
        "menthe 10 g", "huile-olive 3 tbsp", "sel ?", "poivre ?"],
       ["Cuire les penne dans l'eau salée.",
        "Faire dorer les courgettes dans l'huile 8 minutes, saler, poivrer.",
        "Mélanger les pâtes, les courgettes, le zeste et le jus de citron.",
        "Ajouter la feta émiettée et la menthe ciselée."])

recipe("spaghetti-aglio-olio", "Spaghetti aglio, olio e peperoncino",
       "Ail, huile d'olive et piment : le plat de minuit italien.",
       4, 5, 12, ["plat", "economique"],
       ["spaghetti 400 g", "ail 4 piece | en lamelles", "huile-olive 6 tbsp", "piment 1 g",
        "persil 15 g", "parmesan 30 g ?", "sel ?"],
       ["Cuire les spaghetti dans l'eau salée.",
        "Faire chauffer doucement l'huile avec l'ail et le piment jusqu'à ce que l'ail blondisse.",
        "Mélanger avec les pâtes et un peu d'eau de cuisson, ajouter le persil."])

recipe("gratin-pates-brocoli", "Gratin de pâtes au brocoli",
       "Pâtes, brocoli et crème, gratinés à l'emmental.",
       4, 15, 25, ["plat", "four", "economique"],
       ["pates 300 g", "brocoli 400 g | en fleurettes", "creme-liquide 25 cl", "oeuf 2 piece",
        "emmental 120 g", "muscade 0.25 tsp", "sel ?", "poivre ?"],
       ["Cuire les pâtes et le brocoli ensemble 8 minutes dans l'eau salée, égoutter.",
        "Battre la crème avec les œufs, la muscade, le sel et le poivre.",
        "Verser le tout dans un plat, couvrir d'emmental.",
        "Gratiner 20 minutes à 200 °C."])

# ---------------------------------------------------------------------------
# Riz
# ---------------------------------------------------------------------------
recipe("riz-cantonais", "Riz cantonais",
       "Riz parfumé, œufs, jambon et petits pois sautés au wok.",
       4, 15, 10, ["plat", "poele", "economique"],
       ["riz-thai 300 g | cuit la veille de préférence", "oeuf 3 piece", "jambon 3 piece | en dés",
        "petit-pois 150 g", "oignon 1 piece", "sauce-soja 3 tbsp", "huile-tournesol 2 tbsp"],
       ["Cuire le riz s'il n'est pas déjà cuit et le laisser refroidir.",
        "Faire une omelette fine, la rouler et la couper en lanières.",
        "Faire revenir l'oignon dans l'huile, ajouter les petits pois, le jambon puis le riz.",
        "Ajouter la sauce soja et l'omelette, sauter 2 minutes."])

recipe("poulet-basquaise", "Poulet basquaise",
       "Poulet mijoté avec poivrons et tomates, servi avec du riz.",
       4, 20, 45, ["plat", "mijote"],
       ["poulet-cuisse 4 piece", "poivron 3 piece | en lanières", "tomate 4 piece | en morceaux",
        "oignon 2 piece", "ail 3 piece", "paprika 1 tsp", "huile-olive 2 tbsp", "riz 250 g",
        "thym 2 g ?", "sel ?", "poivre ?"],
       ["Faire dorer les cuisses dans l'huile, les réserver.",
        "Faire revenir oignons, poivrons et ail 10 minutes.",
        "Ajouter les tomates, le paprika, le thym et le poulet ; saler, poivrer.",
        "Couvrir et laisser mijoter 35 minutes. Servir avec le riz cuit."])

recipe("risotto-butternut", "Risotto à la courge butternut",
       "Crémeux et doux, avec des dés de courge fondants.",
       4, 15, 30, ["plat", "mijote"],
       ["riz-arborio 300 g", "butternut 500 g | en petits dés", "oignon 1 piece", "bouillon-legumes 2 piece",
        "eau 1.2 l | chaude", "vin-blanc 10 cl ?", "parmesan 60 g", "beurre 30 g", "sel ?"],
       ["Dissoudre les cubes de bouillon dans l'eau chaude.",
        "Faire fondre l'oignon dans la moitié du beurre, ajouter la courge et le riz, nacrer 2 minutes.",
        "Verser le vin, puis le bouillon louche par louche en remuant pendant 20 minutes.",
        "Hors du feu, ajouter le reste du beurre et le parmesan."])

recipe("poulet-yaourt-epices-basmati", "Poulet mariné au yaourt et aux épices, riz basmati",
       "Une marinade au yaourt qui rend le poulet très tendre.",
       4, 15, 25, ["plat", "poele"],
       ["poulet-filet 600 g | en morceaux", "yaourt 2 piece", "curry 2 tsp", "curcuma 1 tsp",
        "gingembre 15 g | râpé", "ail 2 piece", "oignon 1 piece", "huile-tournesol 2 tbsp",
        "riz-basmati 300 g", "coriandre 10 g ?", "sel ?"],
       ["Mélanger le poulet avec le yaourt, les épices, le gingembre, l'ail et le sel ; laisser mariner au moins 15 minutes.",
        "Cuire le riz basmati.",
        "Faire revenir l'oignon dans l'huile, ajouter le poulet et sa marinade, cuire 12 minutes à feu moyen.",
        "Servir avec le riz et la coriandre."])

recipe("paella-poulet-chorizo", "Paella au poulet, chorizo et crevettes",
       "Une paella simplifiée, cuite en une seule grande poêle.",
       6, 20, 40, ["plat", "poele"],
       ["riz-rond 400 g", "poulet-cuisse 4 piece", "chorizo 120 g | en rondelles", "crevette 300 g",
        "poivron 2 piece", "petit-pois 200 g", "oignon 1 piece", "ail 3 piece", "bouillon-volaille 2 piece",
        "eau 1.2 l", "curcuma 1 tsp", "paprika 1 tsp", "huile-olive 3 tbsp", "citron 1 piece ?"],
       ["Faire dorer le poulet dans l'huile, puis le chorizo, réserver.",
        "Faire revenir oignon, ail et poivrons, ajouter le riz et les épices.",
        "Verser l'eau et les cubes de bouillon, remettre la viande et cuire 20 minutes sans remuer.",
        "Ajouter crevettes et petits pois, cuire encore 10 minutes. Servir avec des quartiers de citron."])

recipe("riz-haricots-rouges", "Riz aux haricots rouges épicé",
       "Inspiré du riz créole : haricots, poivron et épices, très économique.",
       4, 10, 25, ["plat", "economique", "batch-cooking"],
       ["riz 250 g", "haricot-rouge 400 g | égouttés", "poivron 1 piece", "oignon 1 piece",
        "tomate-concassee 200 g", "cumin 1 tsp", "paprika 1 tsp", "huile-olive 2 tbsp",
        "coriandre 10 g ?", "sel ?"],
       ["Cuire le riz.",
        "Faire revenir l'oignon et le poivron dans l'huile, ajouter les épices.",
        "Ajouter les tomates et les haricots, laisser mijoter 10 minutes.",
        "Mélanger avec le riz et parsemer de coriandre."])

recipe("porc-caramel", "Porc au caramel et riz thaï",
       "Un classique sucré-salé, laqué à la sauce soja.",
       4, 15, 30, ["plat", "mijote"],
       ["porc-filet 600 g | en cubes", "sucre-roux 3 tbsp", "sauce-soja 4 tbsp", "oignon 2 piece",
        "ail 2 piece", "gingembre 10 g", "eau 15 cl", "riz-thai 300 g", "huile-tournesol 1 tbsp"],
       ["Faire dorer le porc dans l'huile, réserver.",
        "Faire fondre le sucre jusqu'au caramel blond, ajouter les oignons, l'ail et le gingembre.",
        "Remettre le porc, ajouter la sauce soja et l'eau, laisser mijoter 25 minutes jusqu'à ce que la sauce nappe.",
        "Servir avec le riz thaï."])

recipe("boeuf-brocoli-saute", "Bœuf sauté au brocoli",
       "Bœuf saisi, brocoli croquant et sauce soja-gingembre.",
       4, 15, 10, ["plat", "poele"],
       ["boeuf-steak 500 g | en fines lanières", "brocoli 400 g", "sauce-soja 4 tbsp", "ail 2 piece",
        "gingembre 15 g", "fecule-mais 1 tbsp", "huile-sesame 1 tbsp", "huile-tournesol 2 tbsp", "riz-thai 300 g"],
       ["Mélanger le bœuf avec la fécule et la moitié de la sauce soja.",
        "Cuire le riz. Blanchir le brocoli 2 minutes.",
        "Saisir le bœuf à feu très vif dans l'huile, ajouter ail, gingembre et brocoli.",
        "Ajouter le reste de sauce soja et l'huile de sésame, servir aussitôt."])

recipe("salade-riz-thon", "Salade de riz au thon",
       "La salade de pique-nique : riz, thon, maïs et œufs durs.",
       4, 20, 15, ["salade", "economique"],
       ["riz 250 g", "thon-boite 280 g", "mais 280 g", "tomate 3 piece", "poivron 1 piece", "oeuf 3 piece",
        "olive 50 g ?", "huile-olive 4 tbsp", "vinaigre 2 tbsp", "moutarde 1 tsp", "sel ?"],
       ["Cuire le riz et les œufs (10 minutes), laisser refroidir.",
        "Couper tomates, poivron et œufs en dés.",
        "Préparer la vinaigrette avec l'huile, le vinaigre et la moutarde.",
        "Mélanger tous les ingrédients avec la vinaigrette."])

recipe("crevettes-curry-coco", "Crevettes au curry et lait de coco",
       "Une sauce coco parfumée, prête en 20 minutes.",
       4, 10, 15, ["plat", "poele"],
       ["crevette 500 g", "lait-coco 400 ml", "pate-curry 40 g", "poivron 1 piece", "oignon 1 piece",
        "citron-vert 1 piece", "huile-tournesol 1 tbsp", "riz-thai 300 g", "coriandre 10 g ?"],
       ["Cuire le riz.",
        "Faire revenir l'oignon et le poivron dans l'huile, ajouter la pâte de curry.",
        "Verser le lait de coco, laisser frémir 5 minutes, ajouter les crevettes 4 minutes.",
        "Finir avec le jus de citron vert et la coriandre."])

recipe("risotto-petits-pois-jambon", "Risotto petits pois et jambon",
       "Un risotto de printemps, doux et réconfortant.",
       4, 10, 25, ["plat", "mijote"],
       ["riz-arborio 300 g", "petit-pois 250 g", "jambon 3 piece | en lanières", "oignon 1 piece",
        "bouillon-volaille 2 piece", "eau 1.2 l | chaude", "parmesan 60 g", "beurre 30 g"],
       ["Dissoudre les cubes dans l'eau chaude.",
        "Faire fondre l'oignon dans le beurre, ajouter le riz et le nacrer.",
        "Ajouter le bouillon louche par louche pendant 18 minutes, puis les petits pois.",
        "Hors du feu, ajouter le jambon et le parmesan."])

# ---------------------------------------------------------------------------
# Pommes de terre
# ---------------------------------------------------------------------------
recipe("poulet-grenailles-thym", "Poulet et grenailles rôties au thym",
       "Des petites pommes de terre croustillantes, cuites avec le poulet.",
       4, 15, 45, ["plat", "four"],
       ["poulet-cuisse 4 piece", "pomme-de-terre-grenaille 800 g", "ail 6 piece | en chemise",
        "thym 3 g", "citron 1 piece", "huile-olive 3 tbsp", "sel ?", "poivre ?"],
       ["Préchauffer le four à 200 °C.",
        "Mélanger les grenailles entières avec l'huile, l'ail, le thym, sel et poivre.",
        "Ajouter le poulet et le citron en quartiers.",
        "Rôtir 45 minutes en remuant à mi-cuisson."])

recipe("saumon-grenailles-citron", "Saumon au four et grenailles au citron",
       "Un plat complet et simple, parfumé au citron et à la ciboulette.",
       4, 10, 35, ["plat", "four"],
       ["saumon 520 g | 4 pavés", "pomme-de-terre-grenaille 700 g", "citron 1 piece", "huile-olive 3 tbsp",
        "ciboulette 10 g ?", "sel ?", "poivre ?"],
       ["Rôtir les grenailles coupées en deux avec l'huile, 25 minutes à 200 °C.",
        "Ajouter les pavés de saumon arrosés de jus de citron, cuire encore 12 minutes.",
        "Parsemer de ciboulette."])

recipe("pommes-de-terre-oeufs-plat", "Pommes de terre sautées et œufs au plat",
       "Le dîner express qui ne coûte presque rien.",
       2, 10, 25, ["plat", "poele", "economique"],
       ["pomme-de-terre 500 g | en dés", "oeuf 4 piece", "oignon 1 piece", "huile-tournesol 3 tbsp",
        "salade 1 piece ?", "persil 5 g ?", "sel ?"],
       ["Faire sauter les pommes de terre dans l'huile 20 minutes en remuant, ajouter l'oignon à mi-cuisson.",
        "Cuire les œufs au plat dans une autre poêle.",
        "Servir avec du persil et une salade verte."])

recipe("puree-saucisses", "Purée maison et saucisses",
       "Une vraie purée au beurre et au lait, et des saucisses bien dorées.",
       4, 15, 25, ["plat", "economique"],
       ["pomme-de-terre 1 kg", "saucisse 4 piece", "lait 25 cl", "beurre 50 g", "muscade 0.25 tsp ?",
        "oignon 1 piece ?", "sel ?"],
       ["Cuire les pommes de terre épluchées 20 minutes dans l'eau salée.",
        "Dorer les saucisses à la poêle 15 minutes, avec l'oignon émincé si souhaité.",
        "Écraser les pommes de terre avec le beurre et le lait chaud, ajouter la muscade."])

recipe("gratin-chou-fleur", "Gratin de chou-fleur",
       "Chou-fleur fondant sous une béchamel gratinée.",
       4, 15, 30, ["plat", "four", "economique"],
       ["chou-fleur 1 kg | en fleurettes", "lait 50 cl", "beurre 40 g", "farine 40 g", "emmental 100 g",
        "muscade 0.25 tsp", "sel ?", "poivre ?"],
       ["Cuire le chou-fleur 10 minutes à l'eau salée, bien égoutter.",
        "Préparer une béchamel avec le beurre, la farine et le lait, assaisonner.",
        "Napper le chou-fleur dans un plat, couvrir d'emmental.",
        "Gratiner 20 minutes à 200 °C."])

recipe("galettes-pommes-de-terre", "Galettes de pommes de terre, sauce fromage blanc",
       "Des galettes croustillantes et une sauce fraîche à la ciboulette.",
       4, 20, 20, ["plat", "poele", "economique"],
       ["pomme-de-terre 800 g | râpées", "oeuf 2 piece", "farine 2 tbsp", "oignon 1 piece | râpé",
        "huile-tournesol 4 tbsp", "fromage-blanc 200 g", "ciboulette 10 g", "salade 1 piece ?", "sel ?"],
       ["Presser les pommes de terre râpées dans un torchon pour retirer l'eau.",
        "Mélanger avec les œufs, la farine, l'oignon et le sel.",
        "Cuire des galettes dans l'huile chaude, 4 minutes de chaque côté.",
        "Servir avec le fromage blanc à la ciboulette et une salade."])

recipe("pommes-de-terre-farcies", "Pommes de terre farcies au jambon",
       "Des pommes de terre au four, garnies d'une farce crémeuse.",
       4, 20, 55, ["plat", "four"],
       ["pomme-de-terre 1.2 kg | 8 grosses", "jambon 3 piece", "creme-fraiche 15 cl", "emmental 80 g",
        "oignon 1 piece", "sel ?", "poivre ?"],
       ["Cuire les pommes de terre entières 40 minutes au four à 200 °C.",
        "Les couper en deux, retirer la chair et l'écraser avec la crème, le jambon et l'oignon fondu.",
        "Remplir les peaux, couvrir d'emmental.",
        "Gratiner 15 minutes."])

recipe("salade-piemontaise", "Salade piémontaise",
       "Pommes de terre, œufs, jambon et cornichons à la mayonnaise.",
       4, 20, 20, ["salade", "economique"],
       ["pomme-de-terre 800 g", "oeuf 3 piece", "jambon 3 piece", "tomate 2 piece", "cornichon 60 g",
        "mayonnaise 4 tbsp", "moutarde 1 tsp", "persil 5 g ?", "sel ?"],
       ["Cuire les pommes de terre 20 minutes et les œufs 10 minutes, laisser refroidir.",
        "Couper le tout en dés avec le jambon, les tomates et les cornichons.",
        "Mélanger avec la mayonnaise et la moutarde."])

recipe("potee-chou-saucisses", "Potée au chou et aux saucisses",
       "Un plat d'hiver mijoté, encore meilleur réchauffé.",
       6, 20, 70, ["plat", "mijote", "batch-cooking"],
       ["chou-vert 1 kg", "pomme-de-terre 800 g", "carotte 4 piece", "saucisse 6 piece", "lardon 150 g",
        "oignon 2 piece", "laurier 2 piece", "bouillon-volaille 2 piece", "eau 1.5 l", "poivre ?"],
       ["Blanchir le chou coupé en quartiers 5 minutes.",
        "Faire revenir les lardons et les oignons dans une cocotte.",
        "Ajouter le chou, les carottes, le laurier, l'eau et les cubes ; cuire 40 minutes.",
        "Ajouter les pommes de terre et les saucisses, cuire encore 30 minutes."])

# ---------------------------------------------------------------------------
# Viandes
# ---------------------------------------------------------------------------
recipe("boeuf-bourguignon", "Bœuf bourguignon",
       "Le grand mijoté au vin rouge, à préparer la veille pour qu'il soit encore meilleur.",
       6, 30, 180, ["plat", "mijote", "batch-cooking"],
       ["boeuf-bourguignon 1.2 kg | en gros cubes", "vin-rouge 75 cl", "lardon 150 g", "carotte 3 piece",
        "oignon 2 piece", "champignon 250 g", "ail 3 piece", "farine 2 tbsp", "laurier 2 piece",
        "thym 2 g", "huile-tournesol 2 tbsp", "sel ?", "poivre ?"],
       ["Faire dorer la viande par petites quantités dans l'huile, réserver.",
        "Faire revenir les lardons et les oignons, saupoudrer de farine.",
        "Remettre la viande, ajouter le vin, l'ail, les carottes, le thym et le laurier ; couvrir d'eau si besoin.",
        "Laisser mijoter 2 h 30 à couvert, à feu très doux.",
        "Ajouter les champignons dorés à la poêle et cuire encore 30 minutes."])

recipe("blanquette-veau", "Blanquette de veau",
       "La blanquette à l'ancienne, sauce crémeuse au citron, avec du riz.",
       6, 30, 120, ["plat", "mijote"],
       ["veau 1.2 kg | en morceaux", "carotte 3 piece", "oignon 1 piece", "champignon 250 g",
        "bouillon-volaille 2 piece", "laurier 2 piece", "creme-fraiche 20 cl", "beurre 40 g",
        "farine 40 g", "citron 1 piece", "riz 400 g", "sel ?", "poivre ?"],
       ["Couvrir la viande d'eau froide avec les cubes, l'oignon, les carottes et le laurier ; cuire 1 h 30 à frémissement.",
        "Faire revenir les champignons dans un peu de beurre.",
        "Préparer un roux avec le beurre et la farine, mouiller avec 60 cl de bouillon de cuisson.",
        "Ajouter la crème, le jus de citron, la viande, les carottes et les champignons ; réchauffer 10 minutes.",
        "Servir avec le riz."])

recipe("dinde-creme-champignons", "Escalopes de dinde à la crème et aux champignons",
       "Une sauce crémeuse aux champignons, prête en 25 minutes.",
       4, 10, 20, ["plat", "poele"],
       ["dinde-escalope 600 g", "champignon 300 g", "echalote 2 piece", "creme-fraiche 20 cl",
        "beurre 30 g", "riz 250 g", "persil 10 g ?", "sel ?", "poivre ?"],
       ["Cuire le riz.",
        "Dorer les escalopes dans le beurre 3 minutes par face, réserver.",
        "Faire revenir les échalotes et les champignons, ajouter la crème et laisser réduire.",
        "Remettre la dinde dans la sauce 2 minutes, servir avec le riz."])

recipe("poulet-citron-olives", "Poulet au citron et aux olives, semoule",
       "Inspiré du tajine : épices douces, citron et olives.",
       4, 15, 45, ["plat", "mijote"],
       ["poulet-cuisse 4 piece", "citron 2 piece", "olive 100 g", "oignon 2 piece", "ail 3 piece",
        "cumin 1 tsp", "curcuma 1 tsp", "gingembre 10 g", "bouillon-volaille 1 piece", "eau 40 cl",
        "huile-olive 2 tbsp", "semoule 300 g", "coriandre 10 g ?"],
       ["Dorer le poulet dans l'huile, réserver.",
        "Faire revenir oignons, ail, gingembre et épices.",
        "Remettre le poulet, ajouter l'eau, le cube, le jus d'un citron et l'autre en quartiers ; mijoter 35 minutes.",
        "Ajouter les olives 10 minutes avant la fin. Servir avec la semoule."])

recipe("cotes-porc-pommes", "Côtes de porc aux pommes",
       "Des pommes caramélisées au beurre et une sauce à la moutarde.",
       4, 10, 25, ["plat", "poele"],
       ["porc-cote 4 piece", "pomme 3 piece | en quartiers", "oignon 1 piece", "beurre 30 g",
        "moutarde 1 tbsp", "creme-fraiche 10 cl ?", "pomme-de-terre 800 g ? | vapeur", "sel ?", "poivre ?"],
       ["Dorer les côtes dans la moitié du beurre 5 minutes par face, réserver au chaud.",
        "Faire caraméliser les pommes et l'oignon dans le reste du beurre.",
        "Ajouter la moutarde et la crème, remettre les côtes 5 minutes.",
        "Servir avec des pommes de terre vapeur."])

recipe("boulettes-boeuf-sauce-tomate", "Boulettes de bœuf à la sauce tomate",
       "Des boulettes moelleuses mijotées dans la tomate, avec des spaghetti.",
       4, 25, 30, ["plat", "mijote"],
       ["boeuf-hache 500 g", "oeuf 1 piece", "chapelure 4 tbsp", "oignon 1 piece", "ail 2 piece",
        "persil 10 g", "coulis-tomate 700 g", "huile-olive 2 tbsp", "spaghetti 400 g", "parmesan 30 g ?",
        "sel ?", "poivre ?"],
       ["Mélanger le bœuf, l'œuf, la chapelure, la moitié de l'oignon, l'ail et le persil ; former des boulettes.",
        "Les dorer dans l'huile, ajouter le reste d'oignon puis le coulis.",
        "Laisser mijoter 20 minutes.",
        "Servir avec les spaghetti et le parmesan."])

recipe("steak-hache-frites-four", "Steaks hachés et frites au four",
       "Des frites croustillantes sans friteuse, et une salade.",
       4, 15, 35, ["plat", "four", "economique"],
       ["boeuf-hache 500 g | 4 steaks", "pomme-de-terre 1 kg | en frites", "huile-tournesol 3 tbsp",
        "salade 1 piece ?", "ketchup 4 tbsp ?", "sel ?"],
       ["Mélanger les frites avec l'huile et le sel, les étaler sur une plaque.",
        "Cuire 35 minutes à 220 °C en les retournant à mi-cuisson.",
        "Cuire les steaks à la poêle selon la cuisson souhaitée.",
        "Servir avec une salade verte."])

recipe("chili-con-carne", "Chili con carne",
       "Bœuf, haricots rouges et épices, mijotés longuement.",
       6, 15, 45, ["plat", "mijote", "batch-cooking"],
       ["boeuf-hache 500 g", "haricot-rouge 500 g | égouttés", "tomate-concassee 800 g", "oignon 2 piece",
        "poivron 1 piece", "ail 3 piece", "cumin 2 tsp", "paprika 2 tsp", "piment 1 g ?",
        "huile-olive 2 tbsp", "riz 350 g", "sel ?"],
       ["Faire revenir oignons, poivron et ail dans l'huile.",
        "Ajouter le bœuf et le faire colorer, puis les épices.",
        "Ajouter les tomates et les haricots, laisser mijoter 40 minutes.",
        "Servir avec le riz."])

recipe("agneau-raisins-semoule", "Agneau mijoté aux raisins secs et amandes",
       "Un plat parfumé à la cannelle et au cumin, servi avec de la semoule.",
       6, 20, 90, ["plat", "mijote"],
       ["agneau 1 kg | épaule en morceaux", "oignon 2 piece", "carotte 3 piece", "raisin-sec 80 g",
        "amande 60 g", "miel 2 tbsp", "cannelle 1 tsp", "cumin 1 tsp", "bouillon-volaille 1 piece",
        "eau 50 cl", "huile-olive 2 tbsp", "semoule 400 g"],
       ["Dorer l'agneau dans l'huile, ajouter les oignons et les épices.",
        "Ajouter les carottes, l'eau et le cube ; mijoter 1 h 15 à couvert.",
        "Ajouter les raisins secs et le miel, cuire encore 15 minutes.",
        "Servir avec la semoule et les amandes grillées."])

recipe("merguez-semoule-legumes", "Merguez et semoule aux légumes",
       "Une version rapide du couscous, relevée à la harissa.",
       4, 15, 30, ["plat", "economique"],
       ["merguez 8 piece", "semoule 300 g", "courgette 2 piece", "carotte 2 piece", "pois-chiche 250 g",
        "oignon 1 piece", "tomate-concassee 200 g", "harissa 10 g ?", "cumin 1 tsp",
        "bouillon-legumes 1 piece", "eau 50 cl"],
       ["Cuire les légumes en morceaux avec l'oignon, les tomates, le cumin, l'eau et le cube 25 minutes.",
        "Ajouter les pois chiches 5 minutes avant la fin.",
        "Griller les merguez à la poêle.",
        "Préparer la semoule et servir le tout avec la harissa."])

recipe("rougail-saucisses", "Rougail saucisses",
       "Le plat réunionnais : saucisses mijotées dans une sauce tomate relevée.",
       4, 15, 40, ["plat", "mijote"],
       ["saucisse 6 piece | en tronçons", "tomate 6 piece | en dés", "oignon 2 piece", "ail 3 piece",
        "gingembre 15 g", "curcuma 1 tsp", "piment 1 g ?", "huile-tournesol 1 tbsp", "riz 300 g"],
       ["Faire dorer les saucisses dans l'huile.",
        "Ajouter oignons, ail, gingembre et curcuma, faire revenir 5 minutes.",
        "Ajouter les tomates et le piment, laisser mijoter 30 minutes à couvert.",
        "Servir avec le riz."])

recipe("endives-jambon", "Endives au jambon",
       "Le gratin du Nord : endives roulées dans le jambon, sous la béchamel.",
       4, 20, 40, ["plat", "four"],
       ["endive 8 piece", "jambon 8 piece", "lait 50 cl", "beurre 40 g", "farine 40 g", "emmental 100 g",
        "muscade 0.25 tsp", "sel ?", "poivre ?"],
       ["Cuire les endives 20 minutes à la vapeur et bien les presser.",
        "Préparer une béchamel avec le beurre, la farine et le lait ; assaisonner.",
        "Rouler chaque endive dans une tranche de jambon, les ranger dans un plat.",
        "Napper de béchamel, couvrir d'emmental et gratiner 20 minutes à 200 °C."])

recipe("poulet-miel-soja", "Poulet laqué miel et soja, riz",
       "Sucré-salé, prêt en 20 minutes.",
       4, 10, 15, ["plat", "poele"],
       ["poulet-filet 600 g | en morceaux", "sauce-soja 4 tbsp", "miel 2 tbsp", "ail 2 piece",
        "gingembre 10 g", "graine-sesame 10 g ?", "huile-tournesol 1 tbsp", "riz-thai 300 g",
        "brocoli 300 g ?"],
       ["Cuire le riz.",
        "Dorer le poulet dans l'huile 8 minutes.",
        "Ajouter l'ail, le gingembre, la sauce soja et le miel ; laisser laquer 3 minutes.",
        "Parsemer de sésame, servir avec le riz et le brocoli vapeur."])

recipe("filet-mignon-miel-moutarde", "Filet mignon miel-moutarde et carottes rôties",
       "Un rôti tendre glacé au miel, cuit avec ses légumes.",
       4, 15, 35, ["plat", "four"],
       ["porc-filet 700 g", "miel 2 tbsp", "moutarde 2 tbsp", "carotte 6 piece", "thym 2 g",
        "huile-olive 2 tbsp", "sel ?", "poivre ?"],
       ["Mélanger le miel et la moutarde, en badigeonner le filet.",
        "Disposer les carottes coupées en bâtonnets autour, arroser d'huile et ajouter le thym.",
        "Cuire 35 minutes à 190 °C en arrosant à mi-cuisson.",
        "Laisser reposer 5 minutes avant de trancher."])

recipe("fajitas-poulet", "Fajitas de poulet",
       "Poulet épicé, poivrons et oignons dans des tortillas chaudes.",
       4, 15, 15, ["plat", "poele"],
       ["tortilla 8 piece", "poulet-filet 500 g | en lanières", "poivron 2 piece", "oignon-rouge 1 piece",
        "paprika 1 tsp", "cumin 1 tsp", "citron-vert 1 piece", "huile-tournesol 2 tbsp",
        "creme-fraiche 10 cl ?", "cheddar 80 g ?", "salade 1 piece ?"],
       ["Mélanger le poulet avec les épices et le jus de citron vert.",
        "Faire sauter le poulet dans l'huile, puis les poivrons et l'oignon en lanières.",
        "Réchauffer les tortillas.",
        "Garnir avec le poulet, les légumes, la crème, le cheddar et la salade."])

# ---------------------------------------------------------------------------
# Poissons
# ---------------------------------------------------------------------------
recipe("cabillaud-pane-haricots-verts", "Cabillaud pané et haricots verts",
       "Du poisson pané maison, croustillant et doré à la poêle.",
       4, 15, 15, ["plat", "poele"],
       ["cabillaud 600 g | 4 dos", "farine 3 tbsp", "oeuf 1 piece", "chapelure 6 tbsp", "huile-tournesol 4 tbsp",
        "haricot-vert 500 g", "citron 1 piece", "sel ?"],
       ["Cuire les haricots verts 8 minutes à l'eau salée.",
        "Passer le poisson dans la farine, l'œuf battu puis la chapelure.",
        "Le cuire dans l'huile 4 minutes par face.",
        "Servir avec les haricots et des quartiers de citron."])

recipe("moules-marinieres", "Moules marinières",
       "Vin blanc, échalotes et persil : simple et rapide.",
       4, 20, 10, ["plat", "economique"],
       ["moule 2 kg | grattées et lavées", "vin-blanc 20 cl", "echalote 3 piece", "beurre 30 g",
        "persil 20 g", "creme-fraiche 10 cl ?", "pain 250 g ?", "poivre ?"],
       ["Faire fondre les échalotes dans le beurre dans une grande cocotte.",
        "Ajouter le vin et les moules, couvrir et cuire 6 à 8 minutes en secouant, jusqu'à ouverture.",
        "Ajouter le persil et la crème, poivrer.",
        "Servir avec du pain."])

recipe("papillotes-saumon-legumes", "Papillotes de saumon aux petits légumes",
       "Cuisson douce et sans matière grasse ajoutée, parfumée au citron.",
       4, 15, 20, ["plat", "four"],
       ["saumon 520 g | 4 pavés", "courgette 1 piece | en julienne", "carotte 2 piece | en julienne",
        "citron 1 piece", "thym 2 g ?", "huile-olive 1 tbsp", "riz 250 g ?", "sel ?", "poivre ?"],
       ["Répartir les légumes sur 4 feuilles de papier cuisson.",
        "Poser le saumon, ajouter une rondelle de citron, le thym, un filet d'huile, sel et poivre.",
        "Fermer les papillotes et cuire 18 minutes à 200 °C.",
        "Servir avec du riz."])

recipe("bowl-saumon-fume-avocat", "Bowl saumon fumé, avocat et riz",
       "Un bol frais et complet, sans cuisson à part le riz.",
       2, 15, 12, ["salade"],
       ["riz 150 g", "saumon-fume 120 g", "avocat 1 piece", "concombre 1 piece", "mangue 1 piece ?",
        "sauce-soja 2 tbsp", "citron-vert 1 piece", "graine-sesame 5 g ?"],
       ["Cuire le riz et le laisser tiédir.",
        "Couper l'avocat, le concombre et la mangue en dés.",
        "Répartir le riz, le saumon et les légumes dans deux bols.",
        "Arroser de sauce soja et de jus de citron vert, parsemer de sésame."])

recipe("quiche-thon-tomate", "Quiche au thon et à la tomate",
       "Une quiche de placard, parfaite avec une salade.",
       6, 15, 35, ["plat", "four", "economique"],
       ["pate-brisee 1 piece", "thon-boite 140 g", "tomate 2 piece | en rondelles", "oeuf 3 piece",
        "creme-fraiche 20 cl", "lait 10 cl", "emmental 80 g", "moutarde 1 tbsp", "sel ?", "poivre ?"],
       ["Étaler la pâte dans un moule, badigeonner le fond de moutarde.",
        "Répartir le thon émietté et les tomates.",
        "Battre les œufs, la crème, le lait et l'emmental ; assaisonner et verser.",
        "Cuire 35 minutes à 190 °C."])

recipe("tarte-fine-tomate-mozzarella", "Tarte fine feuilletée tomate-mozzarella",
       "Croustillante et rapide, idéale en été.",
       4, 15, 25, ["plat", "four"],
       ["pate-feuilletee 1 piece", "tomate 4 piece | en rondelles", "mozzarella 2 piece", "pesto 60 g",
        "basilic 10 g ?", "huile-olive 1 tbsp", "sel ?"],
       ["Étaler la pâte sur une plaque, la piquer et la tartiner de pesto en laissant un bord.",
        "Disposer les tomates et la mozzarella en tranches, arroser d'huile.",
        "Cuire 25 minutes à 200 °C.",
        "Parsemer de basilic."])

recipe("wraps-thon-crudites", "Wraps au thon et crudités",
       "Un repas froid à emporter, prêt en 10 minutes.",
       4, 10, 0, ["plat", "sans-cuisson", "economique"],
       ["tortilla 4 piece", "thon-boite 280 g", "salade 1 piece", "tomate 2 piece", "mais 140 g",
        "mayonnaise 3 tbsp", "citron 1 piece ?"],
       ["Mélanger le thon égoutté avec la mayonnaise, le maïs et un peu de jus de citron.",
        "Garnir chaque tortilla de salade, de tomate et du mélange au thon.",
        "Rouler serré et couper en deux."])

# ---------------------------------------------------------------------------
# Sans viande ni poisson
# ---------------------------------------------------------------------------
recipe("shakshuka", "Shakshuka",
       "Des œufs pochés dans une sauce tomate aux poivrons et au cumin.",
       4, 10, 25, ["plat", "poele", "economique"],
       ["oeuf 6 piece", "tomate-concassee 800 g", "poivron 2 piece", "oignon 1 piece", "ail 2 piece",
        "cumin 1 tsp", "paprika 1 tsp", "huile-olive 2 tbsp", "coriandre 10 g ?", "pain 250 g ?", "sel ?"],
       ["Faire revenir l'oignon, le poivron et l'ail dans l'huile 8 minutes.",
        "Ajouter les épices et les tomates, laisser réduire 10 minutes.",
        "Creuser des puits, y casser les œufs, couvrir et cuire 6 à 8 minutes.",
        "Parsemer de coriandre et servir avec du pain."])

recipe("lentilles-vertes-legumes", "Lentilles vertes mijotées aux légumes",
       "Un plat complet, économique et nourrissant.",
       4, 10, 35, ["plat", "mijote", "economique", "batch-cooking"],
       ["lentille-verte 300 g", "carotte 2 piece", "oignon 1 piece", "celeri-branche 100 g", "ail 2 piece",
        "laurier 1 piece", "thym 2 g", "bouillon-legumes 1 piece", "eau 1 l", "moutarde 1 tbsp ?",
        "huile-olive 1 tbsp", "sel ?"],
       ["Faire revenir l'oignon, la carotte et le céleri en dés dans l'huile.",
        "Ajouter les lentilles, l'ail, le laurier, le thym, l'eau et le cube.",
        "Cuire 30 minutes à frémissement, saler en fin de cuisson.",
        "Ajouter un peu de moutarde au moment de servir."])

recipe("falafels-four", "Falafels au four, sauce yaourt",
       "Des falafels moelleux cuits au four, avec une sauce fraîche.",
       4, 20, 25, ["plat", "four"],
       ["pois-chiche 500 g | égouttés", "oignon 1 piece", "ail 2 piece", "persil 15 g", "coriandre 15 g",
        "cumin 2 tsp", "farine 3 tbsp", "huile-olive 3 tbsp", "yaourt 2 piece", "citron 1 piece",
        "salade 1 piece ?", "sel ?"],
       ["Mixer les pois chiches avec l'oignon, l'ail, les herbes, le cumin, la farine et le sel.",
        "Former des boulettes, les poser sur une plaque huilée et les badigeonner d'huile.",
        "Cuire 25 minutes à 200 °C en les retournant à mi-cuisson.",
        "Servir avec le yaourt citronné et une salade."])

recipe("patates-douces-feta-pois-chiches", "Patates douces rôties, pois chiches et feta",
       "Un plat de four coloré, doux et épicé.",
       4, 15, 35, ["plat", "four"],
       ["patate-douce 900 g | en cubes", "pois-chiche 400 g", "feta 150 g", "huile-olive 3 tbsp",
        "cumin 1 tsp", "paprika 1 tsp", "citron 1 piece", "persil 10 g ?", "sel ?"],
       ["Mélanger patates douces et pois chiches avec l'huile, les épices et le sel.",
        "Rôtir 35 minutes à 200 °C.",
        "Ajouter la feta émiettée, le jus de citron et le persil."])

recipe("tofu-croustillant-brocoli", "Tofu croustillant, brocoli et riz",
       "Du tofu bien doré, laqué à la sauce soja.",
       4, 15, 20, ["plat", "poele"],
       ["tofu 400 g | en cubes", "fecule-mais 2 tbsp", "brocoli 400 g", "sauce-soja 4 tbsp", "ail 2 piece",
        "gingembre 10 g", "huile-tournesol 3 tbsp", "huile-sesame 1 tbsp", "riz-thai 300 g",
        "graine-sesame 10 g ?"],
       ["Cuire le riz. Rouler le tofu dans la fécule.",
        "Dorer le tofu dans l'huile 10 minutes en le retournant.",
        "Ajouter le brocoli, l'ail et le gingembre, sauter 5 minutes.",
        "Ajouter la sauce soja et l'huile de sésame, parsemer de graines."])

recipe("aubergines-parmesane", "Aubergines à la parmesane",
       "Des couches d'aubergines, de tomate et de mozzarella gratinées.",
       4, 25, 40, ["plat", "four"],
       ["aubergine 3 piece | en tranches", "coulis-tomate 600 g", "mozzarella 2 piece", "parmesan 60 g",
        "ail 2 piece", "huile-olive 4 tbsp", "basilic 10 g", "sel ?"],
       ["Badigeonner les tranches d'aubergine d'huile et les rôtir 20 minutes à 200 °C.",
        "Faire mijoter le coulis avec l'ail 10 minutes.",
        "Alterner aubergines, sauce, mozzarella et basilic dans un plat ; finir par le parmesan.",
        "Gratiner 20 minutes à 190 °C."])

recipe("courgettes-farcies-boulgour", "Courgettes farcies au boulgour et à la feta",
       "Une farce parfumée à la menthe, cuite au four.",
       4, 20, 35, ["plat", "four"],
       ["courgette 4 piece", "boulgour 150 g", "tomate-concassee 200 g", "feta 120 g", "oignon 1 piece",
        "menthe 10 g", "huile-olive 2 tbsp", "sel ?", "poivre ?"],
       ["Cuire le boulgour. Couper les courgettes en deux et les évider.",
        "Faire revenir l'oignon et la chair des courgettes dans l'huile, ajouter les tomates.",
        "Mélanger avec le boulgour, la feta et la menthe ; garnir les courgettes.",
        "Cuire 30 minutes à 190 °C."])

recipe("tortilla-espagnole", "Tortilla espagnole",
       "L'omelette épaisse aux pommes de terre et à l'oignon.",
       4, 15, 35, ["plat", "poele", "economique"],
       ["pomme-de-terre 700 g | en fines tranches", "oeuf 6 piece", "oignon 1 piece", "huile-olive 10 cl",
        "salade 1 piece ?", "sel ?"],
       ["Cuire doucement les pommes de terre et l'oignon dans l'huile 20 minutes, sans les dorer.",
        "Égoutter et mélanger aux œufs battus salés.",
        "Cuire dans une poêle à feu doux 8 minutes, retourner à l'aide d'une assiette et cuire encore 5 minutes."])

recipe("chou-fleur-roti-curry", "Chou-fleur rôti au curry et pois chiches",
       "Rôti au four avec ses épices, servi avec une sauce au yaourt.",
       4, 15, 35, ["plat", "four"],
       ["chou-fleur 1 kg", "pois-chiche 400 g", "curry 2 tsp", "huile-olive 3 tbsp", "yaourt 2 piece",
        "citron 1 piece", "riz 250 g ?", "coriandre 10 g ?", "sel ?"],
       ["Mélanger le chou-fleur en fleurettes et les pois chiches avec l'huile, le curry et le sel.",
        "Rôtir 35 minutes à 210 °C.",
        "Mélanger le yaourt et le jus de citron.",
        "Servir avec la sauce, la coriandre et du riz."])

recipe("gnocchis-epinards-lardons", "Poêlée de gnocchis, épinards et lardons",
       "Des gnocchis dorés à la poêle, une sauce crémeuse.",
       4, 10, 15, ["plat", "poele"],
       ["gnocchi 800 g", "epinard 200 g", "lardon 150 g", "creme-liquide 15 cl", "parmesan 40 g", "poivre ?"],
       ["Dorer les lardons à sec, puis les gnocchis 6 minutes dans la même poêle.",
        "Ajouter les épinards jusqu'à ce qu'ils tombent.",
        "Verser la crème et le parmesan, poivrer et servir."])

recipe("crepes-jambon-fromage", "Crêpes salées jambon-fromage",
       "Des crêpes garnies et repliées, gratinées à la poêle.",
       4, 15, 30, ["plat", "poele", "economique"],
       ["farine 250 g", "oeuf 3 piece", "lait 50 cl", "beurre 30 g", "jambon 8 piece", "emmental 150 g",
        "salade 1 piece ?", "sel ?"],
       ["Mélanger la farine, les œufs, le sel, puis le lait progressivement et le beurre fondu ; laisser reposer.",
        "Cuire les crêpes dans une poêle beurrée.",
        "Garnir chaque crêpe de jambon et d'emmental, la plier et la laisser fondre 1 minute.",
        "Servir avec une salade."])

recipe("gratin-poireaux-jambon", "Gratin de poireaux au jambon",
       "Poireaux fondants, jambon et béchamel gratinée.",
       4, 20, 35, ["plat", "four"],
       ["poireau 4 piece", "jambon 4 piece", "lait 50 cl", "beurre 40 g", "farine 40 g", "emmental 100 g",
        "muscade 0.25 tsp", "sel ?", "poivre ?"],
       ["Cuire les poireaux coupés en tronçons 15 minutes à la vapeur.",
        "Préparer une béchamel avec le beurre, la farine et le lait.",
        "Disposer poireaux et jambon en lanières dans un plat, napper de béchamel et d'emmental.",
        "Gratiner 20 minutes à 200 °C."])

recipe("gratin-courgettes", "Gratin de courgettes",
       "Courgettes, œufs et crème, sous une couche d'emmental doré.",
       4, 15, 35, ["plat", "four", "economique"],
       ["courgette 4 piece", "oeuf 3 piece", "creme-fraiche 20 cl", "emmental 100 g", "ail 1 piece",
        "huile-olive 1 tbsp", "sel ?", "poivre ?"],
       ["Faire revenir les courgettes en rondelles avec l'ail dans l'huile 10 minutes.",
        "Battre les œufs et la crème, saler, poivrer.",
        "Verser sur les courgettes dans un plat, couvrir d'emmental.",
        "Cuire 25 minutes à 190 °C."])

recipe("oeufs-cocotte", "Œufs cocotte à la crème et mouillettes",
       "Un dîner léger et rapide.",
       2, 5, 12, ["plat", "four", "economique"],
       ["oeuf 4 piece", "creme-fraiche 4 tbsp", "jambon 1 piece ? | en dés", "ciboulette 5 g ?",
        "pain 150 g", "beurre 10 g", "sel ?", "poivre ?"],
       ["Beurrer 4 ramequins, y mettre la crème et le jambon.",
        "Casser un œuf dans chaque ramequin, saler et poivrer.",
        "Cuire 12 minutes au bain-marie dans le four à 180 °C.",
        "Parsemer de ciboulette et servir avec des mouillettes de pain grillé."])

# ---------------------------------------------------------------------------
# Soupes
# ---------------------------------------------------------------------------
recipe("soupe-oignon-gratinee", "Soupe à l'oignon gratinée",
       "Des oignons longuement caramélisés et des croûtons gratinés.",
       4, 15, 50, ["soupe", "economique"],
       ["oignon 6 piece | émincés", "beurre 40 g", "farine 1 tbsp", "vin-blanc 15 cl ?",
        "bouillon-volaille 2 piece", "eau 1.2 l", "pain 150 g | en tranches", "emmental 120 g", "poivre ?"],
       ["Faire fondre les oignons dans le beurre 25 minutes à feu doux jusqu'à ce qu'ils soient bien dorés.",
        "Saupoudrer de farine, ajouter le vin, l'eau et les cubes ; cuire 20 minutes.",
        "Verser dans des bols, couvrir de pain et d'emmental.",
        "Gratiner 5 minutes sous le gril."])

recipe("minestrone", "Minestrone",
       "La soupe italienne aux légumes, haricots blancs et petites pâtes.",
       6, 20, 35, ["soupe", "batch-cooking", "economique"],
       ["courgette 1 piece", "carotte 2 piece", "celeri-branche 100 g", "oignon 1 piece",
        "haricot-blanc 400 g", "tomate-concassee 400 g", "coquillettes 100 g", "bouillon-legumes 2 piece",
        "eau 1.5 l", "huile-olive 2 tbsp", "parmesan 40 g ?", "basilic 10 g ?"],
       ["Faire revenir l'oignon, la carotte et le céleri en dés dans l'huile.",
        "Ajouter la courgette, les tomates, l'eau et les cubes ; cuire 20 minutes.",
        "Ajouter les haricots et les coquillettes, cuire 10 minutes.",
        "Servir avec parmesan et basilic."])

recipe("veloute-poireaux-pommes-de-terre", "Velouté poireaux-pommes de terre",
       "La soupe de base, douce et crémeuse.",
       4, 15, 25, ["soupe", "economique", "batch-cooking"],
       ["poireau 3 piece", "pomme-de-terre 400 g", "oignon 1 piece", "bouillon-legumes 1 piece", "eau 1 l",
        "creme-liquide 10 cl ?", "beurre 20 g", "sel ?"],
       ["Faire fondre le poireau et l'oignon dans le beurre 5 minutes.",
        "Ajouter les pommes de terre, l'eau et le cube ; cuire 20 minutes.",
        "Mixer et ajouter la crème."])

recipe("gaspacho", "Gaspacho",
       "La soupe froide espagnole, rafraîchissante en été.",
       4, 15, 0, ["soupe", "sans-cuisson"],
       ["tomate 8 piece", "concombre 1 piece", "poivron 1 piece", "oignon-rouge 1 piece", "ail 1 piece",
        "huile-olive 4 tbsp", "vinaigre 2 tbsp", "pain 50 g ?", "sel ?"],
       ["Couper tous les légumes en morceaux.",
        "Mixer avec l'huile, le vinaigre, le pain et le sel jusqu'à obtenir une soupe lisse.",
        "Réfrigérer au moins 1 heure avant de servir."])

recipe("soupe-thai-poulet-coco", "Soupe thaïe au poulet et lait de coco",
       "Une soupe parfumée au curry et au citron vert, avec des nouilles de riz.",
       4, 15, 20, ["soupe"],
       ["poulet-filet 400 g | en fines lanières", "lait-coco 400 ml", "pate-curry 30 g", "champignon 150 g",
        "bouillon-volaille 1 piece", "eau 60 cl", "citron-vert 1 piece", "nouilles-riz 150 g",
        "coriandre 10 g ?"],
       ["Faire chauffer la pâte de curry dans une casserole, ajouter le lait de coco, l'eau et le cube.",
        "Ajouter le poulet et les champignons, cuire 10 minutes à frémissement.",
        "Ajouter les nouilles de riz 4 minutes.",
        "Finir avec le jus de citron vert et la coriandre."])

recipe("veloute-brocoli", "Velouté de brocoli",
       "Un velouté vert et doux, enrichi d'un peu de fromage.",
       4, 10, 25, ["soupe", "economique"],
       ["brocoli 600 g", "pomme-de-terre 200 g", "oignon 1 piece", "bouillon-legumes 1 piece", "eau 90 cl",
        "creme-fraiche 3 tbsp ?", "emmental 40 g ?", "sel ?"],
       ["Faire revenir l'oignon, ajouter le brocoli, la pomme de terre, l'eau et le cube.",
        "Cuire 20 minutes.",
        "Mixer avec la crème et l'emmental."])

recipe("soupe-lentilles-corail-carottes", "Soupe de lentilles corail et carottes",
       "Une soupe épaisse au cumin, adoucie au lait de coco.",
       4, 10, 25, ["soupe", "economique", "batch-cooking"],
       ["lentille-corail 200 g", "carotte 4 piece", "oignon 1 piece", "cumin 1 tsp", "lait-coco 200 ml",
        "bouillon-legumes 1 piece", "eau 1 l", "huile-olive 1 tbsp", "sel ?"],
       ["Faire revenir l'oignon et le cumin dans l'huile.",
        "Ajouter les carottes en rondelles, les lentilles rincées, l'eau et le cube ; cuire 20 minutes.",
        "Mixer avec le lait de coco."])

recipe("veloute-champignons", "Velouté de champignons",
       "Un velouté forestier, onctueux et parfumé.",
       4, 10, 25, ["soupe"],
       ["champignon 500 g", "oignon 1 piece", "pomme-de-terre 200 g", "bouillon-legumes 1 piece", "eau 80 cl",
        "creme-liquide 15 cl", "beurre 20 g", "persil 5 g ?", "sel ?"],
       ["Faire revenir l'oignon et les champignons dans le beurre 8 minutes.",
        "Ajouter la pomme de terre, l'eau et le cube ; cuire 15 minutes.",
        "Mixer avec la crème et parsemer de persil."])

# ---------------------------------------------------------------------------
# Salades
# ---------------------------------------------------------------------------
recipe("salade-nicoise", "Salade niçoise",
       "Tomates, œufs, thon, olives et haricots verts.",
       4, 20, 10, ["salade"],
       ["salade 1 piece", "tomate 4 piece", "oeuf 4 piece", "thon-boite 280 g", "haricot-vert 200 g",
        "olive 60 g", "oignon-rouge 1 piece", "huile-olive 4 tbsp", "vinaigre 1 tbsp", "sel ?"],
       ["Cuire les œufs 10 minutes et les haricots verts 6 minutes, refroidir.",
        "Disposer la salade, les tomates en quartiers, le thon, les œufs, les haricots, les olives et l'oignon.",
        "Arroser de vinaigrette."])

recipe("taboule", "Taboulé aux herbes",
       "Semoule, beaucoup d'herbes, tomate et citron.",
       4, 20, 0, ["salade", "sans-cuisson", "economique"],
       ["semoule 200 g", "tomate 3 piece", "concombre 1 piece", "oignon-rouge 1 piece", "persil 30 g",
        "menthe 20 g", "citron 2 piece", "huile-olive 5 tbsp", "sel ?"],
       ["Mélanger la semoule avec le jus de citron, l'huile et 20 cl d'eau froide ; laisser gonfler 15 minutes.",
        "Couper tomates, concombre et oignon en petits dés, hacher les herbes.",
        "Mélanger le tout, saler et réfrigérer avant de servir."])

recipe("salade-quinoa-avocat-mais", "Salade de quinoa, avocat et maïs",
       "Une salade complète aux saveurs mexicaines.",
       4, 15, 15, ["salade"],
       ["quinoa 200 g", "avocat 2 piece", "mais 280 g", "haricot-rouge 250 g", "tomate-cerise 200 g",
        "citron-vert 2 piece", "coriandre 15 g", "huile-olive 3 tbsp", "sel ?"],
       ["Cuire le quinoa 12 minutes, le rincer à l'eau froide.",
        "Mélanger avec le maïs, les haricots, les tomates et l'avocat en dés.",
        "Assaisonner avec le citron vert, l'huile, la coriandre et le sel."])

recipe("salade-grecque", "Salade grecque",
       "Tomates, concombre, feta et olives, à servir avec du pain.",
       4, 15, 0, ["salade", "sans-cuisson"],
       ["tomate 4 piece", "concombre 1 piece", "poivron 1 piece", "oignon-rouge 1 piece", "feta 200 g",
        "olive 80 g", "huile-olive 4 tbsp", "herbes-provence 1 tsp", "pain 200 g ?"],
       ["Couper les légumes en morceaux.",
        "Ajouter les olives et la feta en dés.",
        "Arroser d'huile d'olive et parsemer d'herbes."])

recipe("salade-boulgour-legumes-rotis", "Salade de boulgour aux légumes rôtis",
       "Des légumes du soleil rôtis, de la feta et de la menthe.",
       4, 20, 30, ["salade", "four", "batch-cooking"],
       ["boulgour 200 g", "aubergine 1 piece", "courgette 1 piece", "poivron 1 piece", "feta 120 g",
        "menthe 10 g", "citron 1 piece", "huile-olive 4 tbsp", "sel ?"],
       ["Rôtir les légumes en dés avec 2 cuillères d'huile 30 minutes à 200 °C.",
        "Cuire le boulgour et le laisser tiédir.",
        "Mélanger avec les légumes, la feta, la menthe, le jus de citron et le reste d'huile."])

# ---------------------------------------------------------------------------
# Desserts (non proposés par le générateur de menu)
# ---------------------------------------------------------------------------
recipe("mousse-chocolat", "Mousse au chocolat",
       "Trois ingrédients, et le tour est joué.",
       6, 20, 0, ["dessert", "sans-cuisson"],
       ["chocolat-noir 200 g", "oeuf 6 piece", "sucre 30 g"],
       ["Faire fondre le chocolat au bain-marie et le laisser tiédir.",
        "Séparer les blancs des jaunes ; mélanger les jaunes au chocolat.",
        "Monter les blancs en neige avec le sucre et les incorporer délicatement.",
        "Réfrigérer au moins 4 heures."])

recipe("riz-au-lait", "Riz au lait à la vanille",
       "Le dessert de grand-mère, crémeux et doux.",
       6, 5, 45, ["dessert", "economique"],
       ["riz-rond 150 g", "lait 1 l", "sucre 80 g", "extrait-vanille 1 tsp"],
       ["Porter le lait à ébullition avec la vanille.",
        "Ajouter le riz et cuire 40 minutes à feu très doux en remuant souvent.",
        "Ajouter le sucre en fin de cuisson et laisser refroidir."])
