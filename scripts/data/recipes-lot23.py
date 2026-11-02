# Vingt-troisième lot de recettes originales — exécuté par scripts/generate-recipes-lot23.py.
# Sandwichs au pain bretzel, chacun avec sa petite salade : blanc de dinde, comté et sauce
# miel-moutarde, et des variantes (gratiné à la raclette, saumon fumé, poulet et cheddar,
# œuf et chèvre). Pain bretzel, blanc de dinde et roquette : migration 0073.
# Au moins 20 g de protéines par part (vérifié par un test). De saison en novembre.
# Syntaxe : voir scripts/generate-recipes-migration.py. Aucune recette copiée (D7).
# Étapes : une action par étape, feu, temps et repère visuel ; aucune quantité dans le texte.

SALADE = ["roquette 60 g", "carotte 1 piece", "huile-olive 1 tbsp", "vinaigre 1 tsp"]
SALADE_ETAPE = "Râper la carotte et la mélanger à la roquette avec l'huile et le vinaigre, à servir à côté du sandwich."

recipe("bretzel-dinde-comte-miel-moutarde", "Bretzel au blanc de dinde, comté et sauce miel-moutarde",
       "Un pain bretzel garni de blanc de dinde, de lamelles de comté et d'une sauce miel-moutarde au fromage blanc, avec une salade de roquette et carotte râpée. Prêt en 10 minutes.",
       2, 10, 0, ["plat", "sans-cuisson", "express", "lunch-box"],
       ["pain-bretzel 180 g | 2 petits pains", "blanc-dinde 120 g | 4 tranches", "comte 60 g",
        "moutarde 1 tbsp", "miel 1 tbsp", "fromage-blanc 40 g", "cornichon 30 g ?"] + SALADE,
       ["Mélanger la moutarde, le miel et le fromage blanc jusqu'à obtenir une sauce lisse.",
        "Couper les pains bretzel en deux dans l'épaisseur et le comté en fines lamelles.",
        "Tartiner les deux faces de sauce, puis garnir de blanc de dinde, de comté et de cornichons émincés.",
        SALADE_ETAPE],
       storage="Se garde 1 jour au réfrigérateur, emballé ; la salade sans vinaigrette à part.")

recipe("bretzel-chaud-dinde-raclette-oignon-rouge", "Bretzel chaud gratiné, dinde, raclette et oignon rouge",
       "Un pain bretzel ouvert, tartiné de moutarde, garni de blanc de dinde et d'oignon rouge, gratiné sous une tranche de raclette fondante. Avec une salade de roquette.",
       2, 10, 8, ["plat", "four"],
       ["pain-bretzel 180 g | 2 petits pains", "blanc-dinde 120 g | 4 tranches", "raclette 80 g",
        "oignon-rouge 0.5 piece", "moutarde 1 tbsp", "miel 1 tsp ?"] + SALADE,
       ["Préchauffer le four en position gril à 220 °C.",
        "Couper les pains en deux, tartiner chaque moitié de moutarde mélangée au miel, puis poser le blanc de dinde et l'oignon rouge émincé finement.",
        "Couvrir de raclette et passer 6 à 8 minutes sous le gril : le fromage doit fondre et dorer, le pain rester croustillant.",
        SALADE_ETAPE],
       storage="À manger tout de suite.")

recipe("bretzel-saumon-fume-fromage-frais-roquette", "Bretzel au saumon fumé, fromage frais et oignon rouge",
       "Un pain bretzel tartiné de fromage frais au citron, garni de saumon fumé, d'oignon rouge et de roquette. Frais et rapide, avec une salade de carotte.",
       2, 10, 0, ["plat", "sans-cuisson", "express", "lunch-box"],
       ["pain-bretzel 180 g | 2 petits pains", "saumon-fume 120 g", "fromage-frais 60 g", "oignon-rouge 0.5 piece",
        "jus-citron 1 tsp", "ciboulette 5 g ?", "poivre ?"] + SALADE,
       ["Mélanger le fromage frais avec le jus de citron, la ciboulette ciselée et du poivre.",
        "Couper les pains bretzel en deux et émincer très finement l'oignon rouge.",
        "Tartiner les pains de fromage frais, puis garnir de saumon fumé, d'oignon rouge et d'une poignée de roquette.",
        SALADE_ETAPE],
       storage="Se garde 1 jour au réfrigérateur, bien emballé.")

recipe("bretzel-poulet-cheddar-miel-moutarde", "Bretzel au poulet grillé, cheddar et miel-moutarde",
       "Un pain bretzel garni de poulet doré à la poêle et glacé au miel-moutarde, avec du cheddar fondu et de la roquette. Servi chaud, avec une salade de carotte.",
       2, 10, 10, ["plat", "poele", "lunch-box"],
       ["pain-bretzel 180 g | 2 petits pains", "poulet-filet 200 g", "cheddar 50 g", "moutarde 1 tbsp", "miel 1 tbsp",
        "huile-tournesol 1 tsp"] + SALADE,
       ["Couper le poulet en fines escalopes et le dorer 6 minutes dans l'huile, dans une poêle à feu moyen-vif : il doit être cuit à cœur.",
        "Mélanger la moutarde et le miel, verser sur le poulet hors du feu et le retourner pour le glacer.",
        "Couper les pains en deux, poser le poulet chaud et le cheddar en tranches, puis refermer et laisser fondre 1 minute.",
        SALADE_ETAPE],
       storage="Se garde 1 jour au réfrigérateur ; se mange aussi froid.")

recipe("bretzel-oeuf-chevre-roquette", "Bretzel à l'œuf, chèvre frais et roquette",
       "Un pain bretzel garni d'œufs durs en rondelles, de chèvre émietté, de roquette et d'une sauce miel-moutarde. Sans viande, avec une salade de carotte.",
       2, 10, 10, ["plat", "lunch-box"],
       ["pain-bretzel 180 g | 2 petits pains", "oeuf 3 piece", "chevre 60 g", "moutarde 1 tbsp", "miel 1 tsp",
        "fromage-blanc 30 g", "poivre ?"] + SALADE,
       ["Cuire les œufs 10 minutes dans une casserole d'eau bouillante, les rafraîchir, les écaler et les couper en rondelles.",
        "Mélanger la moutarde, le miel et le fromage blanc.",
        "Couper les pains en deux, les tartiner de sauce, puis garnir d'œufs, de chèvre émietté, de roquette et de poivre.",
        SALADE_ETAPE],
       storage="Se garde 1 jour au réfrigérateur, emballé.")
