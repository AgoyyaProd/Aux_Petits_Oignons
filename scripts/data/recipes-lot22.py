# Vingt-deuxième lot de recettes originales — exécuté par scripts/generate-recipes-lot22.py.
# Flammekueche (tarte flambée) : la classique aux lardons et oignons, et des variantes (saumon
# fumé et oignon rouge, gratinée, poireaux et chèvre, munster et pommes de terre, forestière).
# Pâte maison fine sans levure (farine, eau, huile, sel), garniture fromage blanc et crème.
# Au moins 20 g de protéines par part (vérifié par un test). De saison en novembre.
# Syntaxe : voir scripts/generate-recipes-migration.py. Aucune recette copiée (D7).
# Étapes : une action par étape, feu, temps et repère visuel ; aucune quantité dans le texte.

PATE = ["farine 250 g", "eau 13 cl", "huile-tournesol 2 tbsp", "sel 2 g"]
PATE_ETAPES = [
    "Mélanger la farine, le sel, l'huile et l'eau dans un saladier, puis pétrir 5 minutes jusqu'à obtenir une pâte lisse et souple. La laisser reposer 15 minutes sous un torchon.",
    "Préchauffer le four à 250 °C avec une plaque à l'intérieur.",
    "Couper la pâte en deux et étaler chaque moitié le plus finement possible sur une feuille de papier cuisson, en un grand rectangle : on doit presque voir à travers.",
]
CUISSON = "Faire glisser chaque tarte avec son papier sur la plaque chaude et cuire 10 à 12 minutes : les bords doivent être dorés et croustillants, le dessous ferme."

recipe("flammekueche-classique-lardons-oignons", "Flammekueche classique aux lardons et oignons",
       "La tarte flambée alsacienne : une pâte très fine et croustillante, nappée de fromage blanc et de crème, couverte d'oignons émincés et de lardons, cuite à four très chaud.",
       2, 25, 12, ["plat", "four", "economique"],
       PATE + ["fromage-blanc 150 g", "creme-fraiche 10 cl", "oignon 2 piece", "lardon 150 g", "muscade 1 g ?",
               "poivre ?"],
       PATE_ETAPES + [
           "Mélanger le fromage blanc et la crème avec la muscade et du poivre, et émincer les oignons en lamelles très fines.",
           "Étaler la crème sur la pâte jusqu'aux bords, puis répartir les oignons et les lardons crus.",
           CUISSON],
       storage="À manger tout de suite ; la pâte crue se garde 1 jour au réfrigérateur, filmée.")

recipe("flammekueche-saumon-fume-oignon-rouge", "Flammekueche au saumon fumé et à l'oignon rouge",
       "Une tarte flambée garnie de crème au fromage blanc et d'oignon rouge, cuite très chaude puis couverte de saumon fumé, de ciboulette et d'un trait de citron à la sortie du four.",
       2, 25, 12, ["plat", "four"],
       PATE + ["fromage-blanc 150 g", "creme-fraiche 10 cl", "oignon-rouge 2 piece", "saumon-fume 150 g",
               "citron 1 piece", "ciboulette 5 g", "poivre ?"],
       PATE_ETAPES + [
           "Mélanger le fromage blanc et la crème avec le zeste du citron et du poivre, et émincer les oignons rouges en fines lamelles.",
           "Étaler la crème sur la pâte jusqu'aux bords et répartir les oignons rouges.",
           CUISSON,
           "À la sortie du four, couvrir de saumon fumé en lanières, de ciboulette ciselée et d'un trait de jus de citron."],
       storage="À manger tout de suite : le saumon s'ajoute toujours au dernier moment.")

recipe("flammekueche-gratinee-emmental", "Flammekueche gratinée à l'emmental",
       "La version gratinée de la tarte flambée : crème au fromage blanc, oignons, lardons et une couche d'emmental râpé qui dore à four très chaud.",
       2, 25, 12, ["plat", "four", "economique"],
       PATE + ["fromage-blanc 150 g", "creme-fraiche 10 cl", "oignon 2 piece", "lardon 120 g", "emmental 80 g",
               "poivre ?"],
       PATE_ETAPES + [
           "Mélanger le fromage blanc et la crème avec du poivre, et émincer les oignons en lamelles très fines.",
           "Étaler la crème sur la pâte, répartir les oignons et les lardons, puis parsemer d'emmental râpé.",
           CUISSON],
       storage="À manger tout de suite ; se réchauffe quelques minutes au four.")

recipe("flammekueche-poireaux-chevre", "Flammekueche aux poireaux et au chèvre",
       "Une tarte flambée sans viande : poireaux fondus au beurre, crème au fromage blanc et rondelles de chèvre qui dorent à la cuisson, avec un filet de miel à la sortie du four.",
       2, 30, 12, ["plat", "four"],
       PATE + ["fromage-blanc 150 g", "creme-fraiche 5 cl", "poireau 2 piece", "chevre 120 g", "beurre 10 g",
               "miel 10 g ?", "noix 20 g ?", "poivre ?"],
       PATE_ETAPES + [
           "Émincer les poireaux et les faire fondre 8 minutes dans le beurre, dans une poêle à feu doux : ils doivent être tendres sans colorer.",
           "Mélanger le fromage blanc et la crème avec du poivre, l'étaler sur la pâte, puis répartir les poireaux et le chèvre en rondelles.",
           CUISSON,
           "À la sortie du four, arroser d'un filet de miel et parsemer de noix concassées."],
       storage="À manger tout de suite ; se réchauffe quelques minutes au four.")

recipe("flammekueche-munster-pommes-de-terre", "Flammekueche au munster et aux pommes de terre",
       "Une tarte flambée bien alsacienne, garnie de fines rondelles de pommes de terre, d'oignons, de munster et d'une pointe de cumin.",
       2, 30, 14, ["plat", "four"],
       PATE + ["fromage-blanc 150 g", "creme-fraiche 5 cl", "pomme-de-terre 200 g", "oignon 1 piece",
               "munster 120 g", "cumin 1 g", "poivre ?"],
       PATE_ETAPES + [
           "Couper les pommes de terre en rondelles très fines et les cuire 5 minutes dans une casserole d'eau bouillante salée, puis les égoutter.",
           "Mélanger le fromage blanc et la crème avec du poivre, l'étaler sur la pâte, puis répartir les pommes de terre, l'oignon émincé et le munster en lamelles.",
           "Parsemer de cumin, puis faire glisser chaque tarte avec son papier sur la plaque chaude et cuire 12 à 14 minutes : les bords doivent être dorés et le fromage fondu."],
       storage="À manger tout de suite ; se réchauffe quelques minutes au four.")

recipe("flammekueche-forestiere-champignons-lardons", "Flammekueche forestière aux champignons et lardons",
       "Une tarte flambée garnie de champignons poêlés à l'ail, de lardons, d'oignons et de crème au fromage blanc, gratinée d'un peu de comté.",
       2, 30, 12, ["plat", "four"],
       PATE + ["fromage-blanc 150 g", "creme-fraiche 5 cl", "champignon 200 g", "lardon 100 g", "oignon 1 piece",
               "comte 50 g", "ail 1 piece", "persil 5 g ?", "poivre ?"],
       PATE_ETAPES + [
           "Émincer les champignons et les faire sauter 5 minutes avec l'ail haché dans une poêle à feu vif, jusqu'à ce qu'ils aient rendu leur eau.",
           "Mélanger le fromage blanc et la crème avec du poivre, l'étaler sur la pâte, puis répartir l'oignon émincé, les champignons, les lardons et le comté râpé.",
           CUISSON,
           "Parsemer de persil à la sortie du four."],
       storage="À manger tout de suite ; se réchauffe quelques minutes au four.")
