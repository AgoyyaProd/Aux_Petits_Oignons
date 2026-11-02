# Vingtième lot de recettes originales — exécuté par scripts/generate-recipes-lot20.py.
# Deuxième série asiatique, avec l'épicerie asiatique ajoutée par la migration 0068 : sauce
# d'huître, nuoc-mâm, miso, nouilles chinoises aux œufs, pak choï et pousses de soja. Au moins
# 20 g de protéines par part (vérifié par un test). De saison en novembre.
# Syntaxe : voir scripts/generate-recipes-migration.py. Aucune recette copiée (D7).
# Étapes : une action par étape, feu, temps et repère visuel ; aucune quantité dans le texte.

recipe("poulet-pak-choi-sauce-huitre-riz", "Poulet et pak choï à la sauce d'huître",
       "Du poulet émincé sauté au wok avec du pak choï croquant, de l'ail et du gingembre, laqué à la sauce d'huître et servi avec du riz jasmin.",
       2, 10, 20, ["plat", "poele", "monde"],
       ["poulet-filet 260 g", "pak-choi 300 g", "sauce-huitre 3 tbsp", "riz-jasmin 140 g", "ail 2 piece",
        "gingembre 10 g", "huile-tournesol 1 tbsp", "huile-sesame 1 tsp ?", "graine-sesame 5 g ?"],
       ["Cuire le riz dans une casserole d'eau bouillante selon le temps indiqué sur le paquet, puis l'égoutter.",
        "Émincer le poulet, couper le pak choï en quatre dans la longueur, hacher l'ail et râper le gingembre.",
        "Saisir le poulet 5 minutes dans l'huile, dans un wok à feu vif : il doit être doré et cuit à cœur.",
        "Ajouter l'ail, le gingembre et le pak choï avec un fond d'eau, et faire sauter 3 minutes : les feuilles doivent tomber et les tiges rester croquantes.",
        "Verser la sauce d'huître, mélanger 1 minute pour enrober, puis servir avec le riz, l'huile et les graines de sésame."],
       storage="Se garde 2 jours au réfrigérateur ; réchauffer rapidement à la poêle.")

recipe("nouilles-oeufs-boeuf-pousses-soja", "Nouilles sautées aux œufs, bœuf et pousses de soja",
       "Des nouilles chinoises aux œufs sautées avec des lanières de bœuf, des pousses de soja et des carottes, dans une sauce à la sauce d'huître et à la sauce soja.",
       2, 15, 10, ["plat", "poele", "monde"],
       ["nouilles-oeufs 160 g", "boeuf-steak 250 g", "pousse-soja 150 g", "carotte 2 piece",
        "sauce-huitre 2 tbsp", "sauce-soja 1 tbsp", "ail 1 piece", "huile-tournesol 1 tbsp", "ciboulette 5 g ?"],
       ["Cuire les nouilles dans une casserole d'eau bouillante selon le temps du paquet, puis les égoutter et les rincer à l'eau froide.",
        "Couper le bœuf en fines lanières, les carottes en fins bâtonnets et hacher l'ail.",
        "Saisir le bœuf 2 minutes dans l'huile, dans un wok à feu vif, puis le réserver : il doit rester rosé.",
        "Faire sauter les carottes et l'ail 3 minutes, puis ajouter les pousses de soja 1 minute.",
        "Ajouter les nouilles, le bœuf, la sauce d'huître et la sauce soja, mélanger 2 minutes à feu vif et servir avec la ciboulette."],
       storage="Se garde 2 jours au réfrigérateur ; réchauffer à la poêle avec une cuillère d'eau.")

recipe("bo-bun-boeuf-nuoc-mam", "Bo bun au bœuf, vermicelles et sauce nuoc-mâm",
       "Des vermicelles de riz tièdes, du bœuf sauté à l'ail, de la salade, des carottes râpées et des pousses de soja, arrosés d'une sauce au nuoc-mâm et citron vert, avec des cacahuètes.",
       2, 20, 10, ["plat", "salade", "monde"],
       ["nouilles-riz 120 g", "boeuf-steak 260 g", "pousse-soja 100 g", "carotte 2 piece", "salade 0.5 piece",
        "nuoc-mam 3 tbsp", "jus-citron-vert 2 tbsp", "sucre 15 g", "ail 2 piece", "huile-tournesol 1 tbsp",
        "cacahuete-grillee 20 g", "menthe 5 g ?", "coriandre 5 g ?"],
       ["Faire tremper les vermicelles dans de l'eau bouillante hors du feu selon le temps du paquet, puis les égoutter et les rincer à l'eau tiède.",
        "Mélanger le nuoc-mâm, le jus de citron vert, le sucre, la moitié de l'ail haché et de l'eau jusqu'à dissoudre le sucre.",
        "Râper les carottes, émincer la salade et concasser les cacahuètes.",
        "Couper le bœuf en fines lanières et le saisir 3 minutes avec le reste de l'ail dans l'huile, dans une poêle à feu vif.",
        "Répartir la salade, les vermicelles, les carottes et les pousses de soja dans des bols, ajouter le bœuf chaud, la sauce, les cacahuètes et les herbes."],
       storage="Se garde 1 jour au réfrigérateur, sauce à part ; à manger de préférence tout de suite.")

recipe("saumon-miso-pak-choi-riz", "Saumon laqué au miso, pak choï et riz",
       "Des pavés de saumon badigeonnés de miso, miel et sauce soja, rôtis au four, avec du pak choï à la vapeur et du riz.",
       2, 10, 20, ["plat", "four", "monde"],
       ["saumon 260 g", "miso 30 g", "miel 10 g", "sauce-soja 1 tbsp", "pak-choi 300 g", "riz 140 g",
        "gingembre 5 g", "graine-sesame 5 g ?"],
       ["Préchauffer le four à 200 °C et cuire le riz dans une casserole d'eau bouillante selon le temps du paquet.",
        "Mélanger le miso, le miel, la sauce soja et le gingembre râpé jusqu'à obtenir une pâte lisse.",
        "Poser le saumon sur une plaque, le badigeonner de la pâte au miso et cuire 12 minutes au four : le dessus doit être caramélisé et le cœur encore nacré.",
        "Pendant ce temps, couper le pak choï en quatre et le cuire 4 minutes à la vapeur : les tiges doivent rester croquantes.",
        "Servir le saumon avec le pak choï, le riz et les graines de sésame."],
       storage="Se garde 2 jours au réfrigérateur ; se mange aussi froid, en boîte-repas.")

recipe("poulet-gingembre-nuoc-mam-riz-thai", "Poulet caramélisé au gingembre et nuoc-mâm",
       "Des morceaux de poulet mijotés dans un caramel au nuoc-mâm, avec beaucoup de gingembre, de l'ail et de l'oignon, servis avec du riz thaï et du pak choï.",
       2, 15, 25, ["plat", "mijote", "monde"],
       ["poulet-filet 300 g", "sucre 25 g", "nuoc-mam 2 tbsp", "gingembre 20 g", "oignon 1 piece", "ail 2 piece",
        "pak-choi 200 g", "riz-thai 140 g", "huile-tournesol 1 tsp", "poivre ?", "coriandre 5 g ?"],
       ["Couper le poulet en morceaux, couper le gingembre en fins bâtonnets, émincer l'oignon et hacher l'ail.",
        "Cuire le riz dans une casserole d'eau bouillante selon le temps indiqué sur le paquet, puis l'égoutter.",
        "Faire fondre le sucre à sec dans une sauteuse à feu moyen, sans remuer, jusqu'à obtenir un caramel ambré.",
        "Hors du feu, verser le nuoc-mâm et un fond d'eau (attention aux projections), puis remettre sur le feu et mélanger jusqu'à dissoudre le caramel.",
        "Ajouter le poulet, le gingembre, l'oignon et l'ail, et laisser mijoter 15 minutes en remuant : la sauce doit devenir sirupeuse et le poulet cuit à cœur.",
        "Ajouter le pak choï coupé en morceaux 3 minutes, poivrer et servir avec le riz et la coriandre."],
       storage="Se garde 3 jours au réfrigérateur ou 2 mois au congélateur (sans le pak choï).")

recipe("omelette-chinoise-crevettes-pousses-soja", "Omelette chinoise aux crevettes et pousses de soja",
       "Une omelette épaisse garnie de crevettes, de pousses de soja et d'oignon, nappée d'une sauce à la sauce d'huître et servie avec du riz. Prête en 20 minutes.",
       2, 10, 10, ["plat", "poele", "monde"],
       ["oeuf 5 piece", "crevette 150 g", "pousse-soja 150 g", "oignon 1 piece", "sauce-huitre 2 tbsp",
        "fecule-mais 5 g", "riz 120 g", "huile-tournesol 1 tbsp", "ciboulette 5 g ?"],
       ["Cuire le riz dans une casserole d'eau bouillante selon le temps indiqué sur le paquet, puis l'égoutter.",
        "Émincer l'oignon et le faire sauter 3 minutes avec les crevettes dans la moitié de l'huile, dans une poêle à feu vif, puis ajouter les pousses de soja 1 minute.",
        "Battre les œufs, y ajouter la garniture, et cuire 4 minutes dans le reste de l'huile à feu moyen, puis retourner l'omelette et cuire 2 minutes : elle doit être dorée des deux côtés.",
        "Délayer la fécule dans la sauce d'huître et un peu d'eau, puis chauffer 1 minute dans une petite casserole jusqu'à ce que la sauce épaississe.",
        "Servir l'omelette nappée de sauce avec le riz et la ciboulette."],
       storage="Se garde 1 jour au réfrigérateur ; à manger de préférence tout de suite.")

recipe("nouilles-bouillon-miso-porc-oeuf", "Nouilles au bouillon miso, porc et œuf mollet",
       "Un bol de nouilles aux œufs dans un bouillon au miso, avec du porc émincé doré, du pak choï, des champignons et un œuf mollet. Réconfortant les soirs d'automne.",
       2, 15, 20, ["soupe", "plat", "monde"],
       ["nouilles-oeufs 140 g", "porc-filet 250 g", "miso 40 g", "bouillon-volaille 1 piece", "pak-choi 150 g",
        "champignon 100 g", "oeuf 2 piece", "gingembre 10 g", "sauce-soja 1 tbsp", "huile-tournesol 1 tsp",
        "huile-sesame 1 tsp ?"],
       ["Cuire les œufs 6 minutes dans une casserole d'eau bouillante, les rafraîchir et les écaler.",
        "Porter de l'eau à frémissement dans un faitout avec le bouillon émietté et le gingembre râpé.",
        "Couper le porc en fines tranches et le dorer 4 minutes dans l'huile avec la sauce soja, dans une poêle à feu vif : il doit être cuit et caramélisé.",
        "Ajouter les nouilles, les champignons émincés et le pak choï au bouillon, et cuire 4 minutes : les nouilles doivent être tendres.",
        "Hors du feu, délayer le miso dans une louche de bouillon et le reverser dans le faitout, sans faire bouillir.",
        "Servir dans des bols avec le porc, les œufs coupés en deux et l'huile de sésame."],
       storage="Le bouillon se garde 3 jours au réfrigérateur ; cuire les nouilles au moment de réchauffer.")

recipe("tofu-miso-pak-choi-nouilles-riz", "Tofu sauté au miso, pak choï et nouilles de riz",
       "Des cubes de tofu dorés puis enrobés d'une sauce au miso, miel et gingembre, avec du pak choï et des nouilles de riz. Un bloc entier pour deux.",
       2, 10, 15, ["plat", "poele", "monde", "lunch-box"],
       ["tofu 400 g", "miso 30 g", "miel 10 g", "gingembre 10 g", "pak-choi 300 g", "nouilles-riz 100 g",
        "fecule-mais 10 g", "huile-tournesol 1 tbsp", "graine-sesame 5 g ?"],
       ["Faire tremper les nouilles dans de l'eau bouillante hors du feu selon le temps du paquet, puis les égoutter.",
        "Égoutter le tofu, l'éponger, le couper en cubes et l'enrober de fécule.",
        "Mélanger le miso, le miel, le gingembre râpé et un peu d'eau jusqu'à obtenir une sauce lisse.",
        "Dorer le tofu 8 minutes dans l'huile, dans une poêle à feu moyen-vif, en le retournant, puis ajouter le pak choï coupé en morceaux 3 minutes.",
        "Verser la sauce, ajouter les nouilles et mélanger 1 minute, puis servir avec les graines de sésame."],
       storage="Se garde 3 jours au réfrigérateur ; réchauffer à la poêle avec un peu d'eau.")
