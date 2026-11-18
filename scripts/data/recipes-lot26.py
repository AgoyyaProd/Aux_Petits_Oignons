# Vingt-sixième lot de recettes originales — exécuté par scripts/generate-recipes-lot26.py.
# Dix « recettes de la flemme » qui remplacent les doublons retirés en 0090 : chaque idée a
# été comparée au catalogue (titres et ingrédients) avant d'être écrite.
# Critères du tag « flemme » : voir scripts/data/recipes-lot24.py et tests/db/flemme.test.ts.
# Étapes : une action par étape, feu, temps et repère visuel ; aucune quantité dans le texte.

recipe("raviolis-bouillon-legumes-parmesan", "Raviolis en bouillon aux petits légumes et parmesan",
       "Des raviolis au fromage pochés directement dans un bouillon avec un mélange de légumes surgelés, servis en assiette creuse sous une pluie de parmesan. Une soupe-repas en dix minutes.",
       2, 2, 10, ["plat", "soupe", "flemme", "express", "peu-de-vaisselle"],
       ["raviolis-frais 300 g", "melange-legumes 300 g", "parmesan 20 g",
        "bouillon-legumes 1 piece | 1 cube pour 800 ml d'eau", "ail 1 piece ?", "basilic ?", "poivre ?"],
       ["Porter l'eau à ébullition avec le cube de bouillon et l'ail écrasé.",
        "Ajouter les légumes surgelés et cuire 6 minutes à petits bouillons, jusqu'à ce qu'ils soient tendres.",
        "Ajouter les raviolis et cuire 2 à 3 minutes, jusqu'à ce qu'ils remontent.",
        "Servir en assiettes creuses, parsemé de parmesan et de basilic, et poivré."],
       storage="À manger tout de suite : les raviolis gonflent dans le bouillon.")

recipe("bouillon-gingembre-poisson-blanc-pak-choi", "Bouillon au gingembre, poisson blanc, pak choï et nouilles de riz",
       "Des filets de poisson blanc pochés encore surgelés dans un bouillon parfumé au gingembre et à la sauce soja, avec du pak choï et des nouilles de riz. Léger et réconfortant.",
       2, 3, 12, ["plat", "soupe", "monde", "flemme", "express", "peu-de-vaisselle"],
       ["poisson-blanc-surgele 300 g | 2 à 3 filets", "pak-choi 250 g | 2 petits", "nouilles-riz 100 g",
        "bouillon-volaille 1 piece | 1 cube pour 900 ml d'eau", "gingembre 10 g", "sauce-soja 2 tbsp",
        "coriandre ?", "piment ?"],
       ["Porter l'eau à ébullition avec le cube, le gingembre en lamelles et la sauce soja.",
        "Plonger les filets encore surgelés et pocher 7 à 8 minutes à frémissement, jusqu'à ce que la chair s'effeuille.",
        "Ajouter le pak choï coupé en quartiers et les nouilles, puis cuire 3 à 4 minutes.",
        "Servir dans des bols avec la coriandre et le piment."],
       storage="Se garde 1 jour au réfrigérateur ; les nouilles ramollissent.")

recipe("veloute-petits-pois-menthe-feta-oeuf", "Velouté minute de petits pois à la menthe, feta et œuf mollet",
       "Des petits pois surgelés cuits dans un bouillon et mixés avec de la menthe, servis avec de la feta émiettée et un œuf mollet. Tout vert, tout doux, prêt en un quart d'heure.",
       2, 3, 10, ["plat", "soupe", "flemme", "express"],
       ["petit-pois 450 g", "oeuf 2 piece", "feta 60 g", "bouillon-legumes 1 piece | 1 cube pour 500 ml d'eau",
        "menthe 5 g", "huile-olive 1 tbsp ?", "poivre ?"],
       ["Cuire les petits pois surgelés 8 minutes dans l'eau bouillante avec le cube de bouillon.",
        "En même temps, plonger les œufs dans l'eau bouillante 6 minutes, puis les rafraîchir et les écaler.",
        "Mixer les petits pois avec leur bouillon et la menthe jusqu'à un velouté lisse.",
        "Servir avec la feta émiettée, l'œuf coupé en deux, un filet d'huile et du poivre."],
       storage="Le velouté se garde 2 jours au réfrigérateur ; cuire les œufs au moment.")

recipe("petits-pois-carottes-jambon-oeufs-dessus", "Petits pois-carottes au jambon et œufs cuits dessus",
       "Des petits pois-carottes surgelés revenus avec des lanières de jambon, puis des œufs cassés directement dans la poêle et cuits à couvert. Un plat unique, une seule poêle.",
       2, 2, 13, ["plat", "poele", "flemme", "express", "peu-de-vaisselle"],
       ["petits-pois-carottes 400 g", "jambon 2 piece | 2 tranches", "oeuf 4 piece", "huile-olive 1 tbsp",
        "thym ?", "sel ?", "poivre ?"],
       ["Faire revenir les petits pois-carottes surgelés avec le thym dans la poêle huilée, à couvert, 7 à 8 minutes à feu moyen.",
        "Ajouter le jambon en lanières et mélanger 1 minute.",
        "Creuser quatre puits, y casser les œufs, couvrir et cuire 3 à 4 minutes, jusqu'à ce que le blanc soit pris.",
        "Servir directement dans la poêle, salé et poivré."],
       storage="À manger tout de suite.")

recipe("tofu-pane-puree-minute-carottes-rapees", "Tofu pané minute, purée et carottes râpées",
       "Des tranches de tofu enrobées de chapelure et dorées à la poêle, une purée en flocons et des carottes râpées à la moutarde. Croustillant dehors, fondant dedans, et du croquant à côté.",
       2, 6, 7, ["plat", "poele", "flemme", "express"],
       ["tofu 250 g", "puree-flocons 70 g", "lait 200 ml | plus 200 ml d'eau", "carotte-rapee 200 g",
        "chapelure 30 g", "moutarde 1 tsp", "vinaigre 1 tsp", "sauce-soja 1 tbsp", "huile-olive 2 tbsp", "sel ?", "poivre ?"],
       ["Assaisonner les carottes râpées avec la moutarde, le vinaigre, un filet d'huile, du sel et du poivre.",
        "Couper le tofu en tranches, les badigeonner de sauce soja et les rouler dans la chapelure.",
        "Dorer les tranches dans la poêle huilée à feu moyen, 3 minutes de chaque côté.",
        "Porter le lait et l'eau à frémissement, retirer du feu, verser les flocons et mélanger ; servir le tout ensemble."],
       storage="À manger tout de suite : la chapelure ramollit.")

recipe("soupe-froide-concombre-yaourt-falafels", "Soupe froide de concombre au yaourt, falafels et feta",
       "Un concombre mixé avec du yaourt et de la menthe, servi bien frais avec des falafels tièdes et de la feta. Le dîner de la flemme quand il fait chaud.",
       2, 8, 4, ["plat", "soupe", "monde", "flemme", "express"],
       ["concombre 1.5 piece", "yaourt 4 piece", "falafel 200 g", "feta 60 g", "menthe 5 g",
        "jus-citron 1 tbsp ?", "huile-olive 1 tbsp ?", "sel ?", "poivre ?"],
       ["Couper le concombre en morceaux et le mixer avec le yaourt, la menthe, le jus de citron, du sel et du poivre.",
        "Réserver la soupe au réfrigérateur pendant la suite.",
        "Réchauffer les falafels dans une poêle légèrement huilée, 4 minutes en les retournant.",
        "Servir la soupe froide avec la feta émiettée, un filet d'huile et les falafels à côté."],
       storage="La soupe se garde 1 jour au réfrigérateur ; remuer avant de servir.")

recipe("coquillettes-boeuf-hache-ratatouille", "Coquillettes au bœuf haché et à la ratatouille",
       "Des coquillettes mélangées à du bœuf haché saisi et à une ratatouille de légumes surgelés. Le réconfort d'une bolognaise sans mijotage.",
       2, 2, 12, ["plat", "poele", "flemme", "express"],
       ["coquillettes 150 g", "boeuf-hache 250 g", "legumes-ratatouille 400 g", "huile-olive 1 tbsp",
        "herbes-provence 1 tsp", "parmesan 20 g ?", "sel ?", "poivre ?"],
       ["Cuire les coquillettes dans l'eau bouillante salée selon le paquet, puis les égoutter.",
        "Saisir le bœuf haché dans une sauteuse huilée à feu vif, 4 minutes en l'émiettant.",
        "Ajouter les légumes surgelés et les herbes, puis cuire 7 minutes à feu vif, jusqu'à ce que l'eau soit évaporée.",
        "Mélanger avec les coquillettes et servir avec le parmesan."],
       storage="Se garde 2 jours au réfrigérateur.")

recipe("galette-riz-croustillante-epinards-oeuf", "Galette de riz croustillante aux épinards et parmesan",
       "Du riz cuit en sachet lié aux œufs, aux épinards et au parmesan, puis tassé dans la poêle jusqu'à former une galette dorée et croustillante. Se coupe en parts comme une tortilla.",
       2, 4, 11, ["plat", "poele", "flemme", "express"],
       ["riz-cuit-sachet 250 g | 1 sachet", "oeuf 3 piece", "epinard-galets 250 g", "parmesan 30 g",
        "huile-olive 2 tbsp", "muscade ?", "sel ?", "poivre ?"],
       ["Faire fondre les épinards surgelés dans la poêle huilée à couvert, 5 minutes, puis les presser pour retirer l'eau.",
        "Mélanger le riz, les épinards, les œufs battus, le parmesan, la muscade, du sel et du poivre.",
        "Verser dans la poêle huilée bien chaude, tasser et cuire 4 minutes à feu moyen, jusqu'à ce que le dessous soit doré.",
        "Retourner la galette à l'aide d'une assiette et dorer l'autre face 2 minutes."],
       storage="Se garde 2 jours au réfrigérateur ; se mange aussi froide.")

recipe("assiette-ratatouille-tiede-poulet-houmous", "Assiette de ratatouille tiède, poulet et houmous",
       "Une ratatouille de légumes surgelés poêlée vivement, du poulet cuit, une belle cuillerée de houmous et du pain grillé pour saucer. Une assiette à partager du bout des doigts.",
       2, 3, 10, ["plat", "poele", "monde", "flemme", "express"],
       ["legumes-ratatouille 400 g", "poulet-cuit 150 g", "houmous 100 g", "pain 100 g",
        "huile-olive 1 tbsp", "cumin 1 tsp ?", "sel ?", "poivre ?"],
       ["Faire revenir les légumes surgelés et le cumin dans la poêle huilée à feu vif, 8 minutes, jusqu'à ce que l'eau soit évaporée.",
        "Ajouter le poulet en lamelles et réchauffer 1 minute.",
        "Griller le pain.",
        "Servir la ratatouille au poulet avec le houmous et le pain grillé."],
       storage="La ratatouille au poulet se garde 2 jours au réfrigérateur.")

recipe("tortillas-pliees-boeuf-epinards-feta", "Tortillas pliées au bœuf, épinards et feta",
       "Des tortillas garnies de bœuf haché aux épinards et de feta, pliées en deux et dorées à sec dans la poêle, à la manière d'un pain farci turc. Croustillant, fondant, prêt en un quart d'heure.",
       2, 4, 10, ["plat", "poele", "monde", "flemme", "express"],
       ["tortilla 4 piece", "boeuf-hache 200 g", "epinard-galets 200 g", "feta 80 g",
        "huile-olive 1 tbsp", "cumin 1 tsp ?", "piment ?", "sel ?", "poivre ?"],
       ["Faire fondre les épinards surgelés dans la poêle huilée à couvert, 4 minutes.",
        "Ajouter le bœuf haché et le cumin, puis cuire 4 minutes à feu vif en émiettant, jusqu'à ce que l'eau soit évaporée.",
        "Répartir la farce et la feta émiettée sur une moitié de chaque tortilla, puis plier.",
        "Dorer les tortillas dans la poêle sèche, 1 minute de chaque côté, et couper en deux."],
       storage="À manger tout de suite.")
