"""Génère la migration des recettes de démonstration à partir d'une spécification compacte.

Usage : python3 scripts/generate-recipes-migration.py > supabase/migrations/<horodatage>_<nom>.sql

Recettes originales rédigées pour le projet (décision D7), aucune copie de site tiers.
Chaque ligne d'ingrédient est validée contre le catalogue (migration 0004) :
slug existant, unité connue, conversion possible vers la dimension de l'ingrédient.

Syntaxe d'une ligne d'ingrédient :
  "<slug> <quantité> <unité>[ ?][ | note]"   quantité décimale avec point
  "<slug> ?[ | note]"                          facultatif, sans quantité (« au goût »)
  « ? » après l'unité = facultatif avec quantité indicative.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INGREDIENTS_SQL = ROOT / "supabase/migrations/20261011000004_reference_ingredients.sql"

UNITS = {"g": "mass", "kg": "mass", "ml": "volume", "cl": "volume", "l": "volume",
         "tsp": "volume", "tbsp": "volume", "piece": "count"}
TAGS = {"plat", "soupe", "salade", "dessert", "petit-dejeuner", "four", "poele",
        "economique", "batch-cooking", "sans-cuisson", "mijote"}


def load_ingredients():
    pattern = re.compile(r"^\s*\('([a-z0-9-]+)', '(?:[^']|'')+', '[a-z_]+', '(mass|volume|count)', ([0-9.]+|null), ([0-9.]+|null)\)")
    out = {}
    for line in INGREDIENTS_SQL.read_text(encoding="utf-8").splitlines():
        m = pattern.match(line)
        if m:
            slug, dim, dens, piece = m.groups()
            out[slug] = {"dim": dim, "density": dens != "null", "piece": piece != "null"}
    assert len(out) > 150, f"catalogue introuvable ou incomplet ({len(out)})"
    return out


def convertible(unit_dim, ing):
    d = ing["dim"]
    if unit_dim == d:
        return True
    pair = {unit_dim, d}
    if pair == {"mass", "volume"}:
        return ing["density"]
    if pair == {"mass", "count"}:
        return ing["piece"]
    if pair == {"volume", "count"}:
        return ing["piece"] and ing["density"]
    return False


R = []


def recipe(slug, title, description, servings, prep, cook, tags, ingredients, steps):
    R.append(dict(slug=slug, title=title, description=description, servings=servings,
                  prep=prep, cook=cook, tags=tags, ingredients=ingredients, steps=steps))


# ===========================================================================
# Les recettes (40) — quantités pour `servings` portions
# ===========================================================================

recipe("riz-saute-legumes-oeuf", "Riz sauté aux légumes et à l'œuf",
       "Le classique anti-gaspillage : du riz, les légumes qui traînent et des œufs.",
       4, 15, 10, ["plat", "poele", "economique"],
       ["riz 300 g | cuit la veille de préférence", "oeuf 3 piece", "carotte 2 piece | en petits dés",
        "petit-pois 150 g", "oignon 1 piece | émincé", "sauce-soja 3 tbsp", "huile-tournesol 2 tbsp",
        "ciboulette 10 g ? | ciselée"],
       ["Cuire le riz s'il n'est pas déjà cuit, puis le laisser refroidir.",
        "Faire revenir l'oignon et les carottes 5 minutes dans l'huile à feu vif.",
        "Ajouter les petits pois et le riz, sauter 3 minutes.",
        "Pousser le riz sur le côté, brouiller les œufs dans la poêle puis mélanger.",
        "Assaisonner avec la sauce soja et parsemer de ciboulette."])

recipe("pates-tomate-basilic", "Pâtes à la sauce tomate et basilic",
       "Une sauce tomate simple qui mijote pendant que les pâtes cuisent.",
       4, 10, 20, ["plat", "economique"],
       ["pates 400 g", "coulis-tomate 500 g", "oignon 1 piece | haché", "ail 2 piece | écrasé",
        "huile-olive 2 tbsp", "basilic 15 g | ciselé", "parmesan 40 g ? | râpé", "sel ?", "poivre ?"],
       ["Faire fondre l'oignon dans l'huile d'olive 5 minutes, ajouter l'ail.",
        "Verser le coulis, saler, poivrer et laisser mijoter 15 minutes.",
        "Cuire les pâtes dans une grande casserole d'eau salée.",
        "Mélanger les pâtes égouttées à la sauce, ajouter le basilic et le parmesan."])

recipe("omelette-champignons", "Omelette aux champignons",
       "Prête en un quart d'heure, idéale quand le frigo est presque vide.",
       2, 5, 10, ["plat", "poele", "economique"],
       ["oeuf 5 piece", "champignon 200 g | émincés", "beurre 15 g", "creme-fraiche 2 tbsp ?",
        "persil 5 g ? | haché", "sel ?", "poivre ?"],
       ["Faire dorer les champignons dans le beurre 5 minutes, saler.",
        "Battre les œufs avec la crème, saler et poivrer.",
        "Verser sur les champignons et cuire à feu doux jusqu'à la texture souhaitée.",
        "Plier l'omelette, parsemer de persil et servir."])

recipe("soupe-legumes-hiver", "Soupe de légumes d'hiver",
       "Une soupe épaisse qui accepte presque tous les légumes du bac.",
       4, 15, 30, ["soupe", "economique", "batch-cooking"],
       ["pomme-de-terre 300 g | en dés", "carotte 3 piece | en rondelles", "poireau 1 piece | émincé",
        "navet 200 g ?", "oignon 1 piece", "bouillon-legumes 1 piece", "eau 1.2 l",
        "creme-liquide 10 cl ?", "sel ?", "poivre ?"],
       ["Faire suer l'oignon et le poireau dans une cocotte avec un filet d'eau.",
        "Ajouter les autres légumes, le cube de bouillon et l'eau.",
        "Cuire 30 minutes à frémissement, jusqu'à ce que les légumes soient tendres.",
        "Mixer, ajouter la crème si souhaité, rectifier l'assaisonnement."])

recipe("curry-pois-chiches-epinards", "Curry de pois chiches aux épinards",
       "Un curry végétalien doux et parfumé, prêt en 30 minutes.",
       4, 10, 20, ["plat", "mijote"],
       ["pois-chiche 500 g | égouttés", "epinard 200 g", "lait-coco 400 ml", "tomate-concassee 400 g",
        "oignon 1 piece | haché", "ail 2 piece", "gingembre 15 g | râpé", "curry 2 tsp",
        "huile-tournesol 1 tbsp", "riz 300 g ? | pour servir", "coriandre 10 g ?"],
       ["Faire revenir l'oignon, l'ail et le gingembre dans l'huile 5 minutes.",
        "Ajouter le curry, mélanger 1 minute, puis les tomates et le lait de coco.",
        "Ajouter les pois chiches et laisser mijoter 15 minutes.",
        "Incorporer les épinards en fin de cuisson jusqu'à ce qu'ils tombent.",
        "Servir avec du riz et de la coriandre."])

recipe("poulet-roti-legumes", "Cuisses de poulet rôties et légumes au four",
       "Tout cuit dans le même plat : peu de vaisselle, beaucoup de goût.",
       4, 15, 50, ["plat", "four"],
       ["poulet-cuisse 4 piece", "pomme-de-terre 800 g | en quartiers", "carotte 3 piece | en bâtonnets",
        "oignon-rouge 2 piece | en quartiers", "ail 4 piece | en chemise", "huile-olive 3 tbsp",
        "herbes-provence 2 tsp", "sel ?", "poivre ?"],
       ["Préchauffer le four à 200 °C.",
        "Mélanger les légumes avec l'huile, les herbes, le sel et le poivre dans un grand plat.",
        "Poser les cuisses de poulet par-dessus, peau vers le haut, et les assaisonner.",
        "Enfourner 50 minutes en retournant les légumes à mi-cuisson."])

recipe("saumon-riz-brocoli", "Saumon, riz et brocoli au citron",
       "Un dîner complet et rapide, cuit en moins de 25 minutes.",
       4, 10, 20, ["plat", "four"],
       ["saumon 520 g | 4 pavés", "riz 250 g", "brocoli 500 g | en fleurettes", "citron 1 piece",
        "huile-olive 2 tbsp"],
       ["Cuire le riz selon les indications du paquet.",
        "Disposer les pavés de saumon dans un plat, arroser d'huile et de jus de citron.",
        "Enfourner 15 minutes à 200 °C.",
        "Cuire le brocoli 6 minutes à la vapeur et servir le tout avec des quartiers de citron."])

recipe("chili-sin-carne", "Chili sin carne",
       "La version végétale du chili, encore meilleure réchauffée.",
       4, 15, 35, ["plat", "mijote", "batch-cooking", "economique"],
       ["haricot-rouge 500 g | égouttés", "mais 150 g", "tomate-concassee 800 g", "poivron 1 piece | en dés",
        "oignon 1 piece", "ail 2 piece", "cumin 2 tsp", "paprika 1 tsp", "piment 1 g ?",
        "huile-olive 1 tbsp", "riz 300 g ? | pour servir"],
       ["Faire revenir l'oignon, l'ail et le poivron dans l'huile 5 minutes.",
        "Ajouter les épices puis les tomates, laisser mijoter 15 minutes.",
        "Ajouter les haricots et le maïs, cuire encore 15 minutes.",
        "Servir avec du riz."])

recipe("lentilles-corail-dahl", "Dahl de lentilles corail",
       "Un plat réconfortant et économique, prêt en une seule casserole.",
       4, 10, 25, ["plat", "mijote", "economique", "batch-cooking"],
       ["lentille-corail 250 g | rincées", "lait-coco 400 ml", "tomate-concassee 400 g",
        "oignon 1 piece", "ail 2 piece", "gingembre 10 g", "curcuma 1 tsp", "cumin 1 tsp",
        "huile-tournesol 1 tbsp", "eau 500 ml", "citron-vert 1 piece ?"],
       ["Faire revenir l'oignon, l'ail et le gingembre dans l'huile.",
        "Ajouter les épices, les lentilles, les tomates, le lait de coco et l'eau.",
        "Cuire 20 à 25 minutes en remuant jusqu'à ce que les lentilles soient fondantes.",
        "Ajouter un trait de citron vert avant de servir."])

recipe("gratin-dauphinois", "Gratin de pommes de terre à la crème",
       "Un accompagnement fondant qui peut aussi faire un plat avec une salade.",
       6, 20, 60, ["plat", "four"],
       ["pomme-de-terre 1.2 kg | en fines rondelles", "creme-liquide 30 cl", "lait 50 cl", "ail 1 piece",
        "beurre 10 g", "muscade 1 g ?", "sel ?", "poivre ?"],
       ["Préchauffer le four à 180 °C et frotter le plat avec l'ail puis le beurrer.",
        "Faire chauffer le lait et la crème avec sel, poivre et muscade.",
        "Ajouter les pommes de terre et cuire 10 minutes à feu doux.",
        "Verser dans le plat et enfourner 50 minutes jusqu'à ce que le dessus soit doré."])

recipe("salade-lentilles-feta", "Salade de lentilles, feta et crudités",
       "Une salade complète qui se garde bien pour le déjeuner du lendemain.",
       4, 15, 20, ["salade", "batch-cooking"],
       ["lentille-verte 200 g", "feta 150 g | émiettée", "tomate-cerise 200 g", "concombre 1 piece",
        "oignon-rouge 1 piece | finement émincé", "huile-olive 3 tbsp", "vinaigre 1 tbsp",
        "moutarde 1 tsp", "persil 10 g ?"],
       ["Cuire les lentilles 20 minutes dans l'eau non salée, les égoutter.",
        "Préparer la vinaigrette avec la moutarde, le vinaigre et l'huile.",
        "Couper les tomates et le concombre, mélanger avec l'oignon et les lentilles tièdes.",
        "Ajouter la feta, la vinaigrette et le persil."])

recipe("quiche-lardons", "Quiche aux lardons",
       "La quiche familiale, à servir avec une salade verte.",
       6, 15, 35, ["plat", "four"],
       ["pate-brisee 1 piece", "lardon 200 g", "oeuf 3 piece", "creme-liquide 20 cl", "lait 20 cl",
        "emmental 80 g", "muscade 1 g ?", "poivre ?"],
       ["Préchauffer le four à 180 °C et étaler la pâte dans un moule.",
        "Faire dorer les lardons à sec puis les répartir sur la pâte.",
        "Battre les œufs avec la crème, le lait, la muscade et le poivre.",
        "Verser l'appareil, parsemer d'emmental et enfourner 35 minutes."])

recipe("risotto-champignons", "Risotto aux champignons",
       "Crémeux sans crème : tout le secret est dans le remuage.",
       4, 10, 25, ["plat", "mijote"],
       ["riz-rond 300 g", "champignon 300 g | émincés", "oignon 1 piece | haché", "vin-blanc 10 cl",
        "bouillon-legumes 1 piece", "eau 1 l", "parmesan 50 g", "beurre 30 g", "huile-olive 1 tbsp"],
       ["Dissoudre le cube dans l'eau chaude et garder le bouillon frémissant.",
        "Faire dorer les champignons dans la moitié du beurre, réserver.",
        "Faire suer l'oignon dans l'huile, ajouter le riz et le nacrer 2 minutes.",
        "Déglacer au vin blanc puis ajouter le bouillon louche par louche pendant 18 minutes.",
        "Hors du feu, incorporer les champignons, le parmesan et le reste du beurre."])

recipe("tacos-poulet", "Wraps de poulet et crudités",
       "Un dîner rapide où chacun garnit son wrap.",
       4, 15, 10, ["plat", "poele"],
       ["tortilla 8 piece", "poulet-filet 500 g | en lanières", "poivron 1 piece | en lanières",
        "salade 1 piece", "tomate 2 piece", "fromage-blanc 150 g", "paprika 1 tsp", "cumin 1 tsp",
        "citron-vert 1 piece", "huile-tournesol 1 tbsp"],
       ["Mélanger le poulet avec le paprika, le cumin et un filet d'huile.",
        "Le saisir avec le poivron 8 à 10 minutes dans une poêle chaude.",
        "Préparer une sauce avec le fromage blanc et le jus de citron vert.",
        "Garnir les tortillas réchauffées de salade, tomate, poulet et sauce."])

recipe("soupe-potiron", "Velouté de potiron",
       "Doux et velouté, le classique de l'automne.",
       4, 15, 25, ["soupe", "economique"],
       ["potiron 1 kg | en cubes", "pomme-de-terre 200 g", "oignon 1 piece", "bouillon-legumes 1 piece",
        "eau 800 ml", "creme-liquide 10 cl ?", "muscade 1 g ?", "sel ?"],
       ["Faire suer l'oignon dans une cocotte.",
        "Ajouter le potiron, la pomme de terre, le cube et l'eau.",
        "Cuire 25 minutes puis mixer finement.",
        "Ajouter la crème et la muscade, rectifier l'assaisonnement."])

recipe("bolognaise", "Pâtes à la bolognaise",
       "Une sauce généreuse qui se congèle très bien.",
       4, 15, 40, ["plat", "mijote", "batch-cooking"],
       ["pates 400 g", "boeuf-hache 400 g", "tomate-concassee 800 g", "carotte 1 piece | en petits dés",
        "oignon 1 piece", "ail 2 piece", "concentre-tomate 30 g", "huile-olive 2 tbsp",
        "herbes-provence 1 tsp", "parmesan 40 g ?"],
       ["Faire revenir l'oignon, la carotte et l'ail dans l'huile 5 minutes.",
        "Ajouter la viande et la faire dorer en l'émiettant.",
        "Ajouter le concentré, les tomates et les herbes, laisser mijoter 30 minutes.",
        "Servir sur les pâtes cuites avec le parmesan."])

recipe("cabillaud-poireaux", "Cabillaud sur fondue de poireaux",
       "Un poisson nacré posé sur des poireaux fondants à la crème.",
       4, 15, 25, ["plat", "poele"],
       ["cabillaud 520 g | 4 dos", "poireau 3 piece | émincés", "creme-liquide 20 cl", "beurre 20 g",
        "citron 1 piece", "pomme-de-terre 600 g ? | à la vapeur", "sel ?", "poivre ?"],
       ["Faire fondre les poireaux dans le beurre à couvert 15 minutes.",
        "Ajouter la crème, saler, poivrer et laisser réduire 5 minutes.",
        "Poser les dos de cabillaud sur les poireaux, couvrir et cuire 8 minutes à feu doux.",
        "Arroser de jus de citron et servir avec des pommes de terre vapeur."])

recipe("croque-monsieur", "Croque-monsieur",
       "Le repas express du soir, doré au four.",
       4, 10, 10, ["plat", "four", "economique"],
       ["pain-de-mie 300 g | 8 tranches", "jambon 4 piece", "emmental 120 g", "beurre 30 g"],
       ["Préchauffer le four à 220 °C.",
        "Beurrer les tranches de pain, garnir de jambon et d'emmental.",
        "Refermer, parsemer du reste d'emmental et enfourner 10 minutes."])

recipe("salade-cesar-poulet", "Salade façon César au poulet",
       "Une grande salade repas, croquante et rassasiante.",
       4, 20, 10, ["salade", "poele"],
       ["salade 1 piece", "poulet-filet 400 g", "pain 120 g | en croûtons", "parmesan 50 g",
        "mayonnaise 60 g", "citron 1 piece", "huile-olive 2 tbsp", "ail 1 piece"],
       ["Faire dorer les croûtons de pain dans une poêle avec 1 cuillère d'huile et l'ail.",
        "Cuire le poulet 8 à 10 minutes dans le reste d'huile puis le trancher.",
        "Mélanger la mayonnaise avec le jus de citron et un peu de parmesan.",
        "Assembler la salade, le poulet, les croûtons, la sauce et le parmesan restant."])

recipe("ratatouille", "Ratatouille",
       "Les légumes du soleil mijotés doucement ; encore meilleure le lendemain.",
       6, 25, 45, ["plat", "mijote", "batch-cooking"],
       ["aubergine 1 piece", "courgette 2 piece", "poivron 2 piece", "tomate 4 piece", "oignon 2 piece",
        "ail 3 piece", "huile-olive 4 tbsp", "herbes-provence 2 tsp", "sel ?", "poivre ?"],
       ["Couper tous les légumes en dés de taille similaire.",
        "Faire revenir séparément aubergine, courgettes et poivrons dans l'huile.",
        "Faire fondre oignons, ail et tomates, puis réunir tous les légumes.",
        "Ajouter les herbes et laisser mijoter 30 minutes à couvert."])

recipe("pancakes", "Pancakes du dimanche",
       "Moelleux et rapides, à servir avec des fruits ou du sirop d'érable.",
       4, 10, 15, ["petit-dejeuner", "dessert", "poele"],
       ["farine 250 g", "lait 30 cl", "oeuf 2 piece", "sucre 30 g", "levure-chimique 11 g",
        "beurre 30 g | fondu", "sirop-erable 4 tbsp ?"],
       ["Mélanger la farine, le sucre et la levure.",
        "Ajouter les œufs, puis le lait petit à petit, et le beurre fondu.",
        "Cuire des petites louches de pâte dans une poêle chaude, 1 à 2 minutes par face.",
        "Servir avec le sirop d'érable."])

recipe("crumble-pommes", "Crumble aux pommes",
       "Le dessert qui sauve les pommes un peu fatiguées.",
       6, 20, 35, ["dessert", "four", "economique"],
       ["pomme 6 piece | en morceaux", "farine 150 g", "beurre 100 g | froid", "sucre-roux 100 g",
        "cannelle 1 tsp ?"],
       ["Préchauffer le four à 180 °C et répartir les pommes dans un plat.",
        "Sabler du bout des doigts la farine, le sucre et le beurre.",
        "Parsemer la pâte sur les pommes avec la cannelle.",
        "Enfourner 35 minutes jusqu'à ce que le dessus soit doré."])

recipe("buddha-bowl-quinoa", "Bol de quinoa, patate douce et avocat",
       "Un bol végétalien coloré, à préparer à l'avance.",
       4, 20, 30, ["salade", "four", "batch-cooking"],
       ["quinoa 240 g", "patate-douce 600 g | en cubes", "pois-chiche 250 g", "avocat 2 piece",
        "epinard 100 g", "huile-olive 3 tbsp", "citron 1 piece", "paprika 1 tsp", "graine-sesame 20 g ?"],
       ["Rôtir la patate douce et les pois chiches avec l'huile et le paprika 30 minutes à 200 °C.",
        "Cuire le quinoa 12 minutes dans deux fois son volume d'eau.",
        "Répartir quinoa, légumes rôtis, épinards et avocat dans les bols.",
        "Arroser de jus de citron et parsemer de sésame."])

recipe("hachis-parmentier", "Hachis parmentier",
       "Une purée gratinée sur une viande bien assaisonnée.",
       6, 30, 30, ["plat", "four", "batch-cooking"],
       ["pomme-de-terre 1.2 kg", "boeuf-hache 600 g", "oignon 2 piece", "lait 20 cl", "beurre 40 g",
        "emmental 60 g", "concentre-tomate 20 g", "sel ?", "poivre ?"],
       ["Cuire les pommes de terre à l'eau puis les écraser avec le lait et le beurre.",
        "Faire revenir les oignons, ajouter la viande et le concentré, cuire 10 minutes.",
        "Étaler la viande dans un plat, recouvrir de purée et d'emmental.",
        "Gratiner 25 minutes à 200 °C."])

recipe("soupe-tomate-pois-chiches", "Soupe épicée tomate et pois chiches",
       "Une soupe consistante, presque un plat, avec des épices douces.",
       4, 10, 25, ["soupe", "economique"],
       ["tomate-concassee 800 g", "pois-chiche 250 g", "oignon 1 piece", "carotte 2 piece", "ail 2 piece",
        "cumin 1 tsp", "paprika 1 tsp", "bouillon-legumes 1 piece", "eau 600 ml", "huile-olive 1 tbsp"],
       ["Faire revenir l'oignon, la carotte et l'ail dans l'huile.",
        "Ajouter les épices puis les tomates, le cube et l'eau.",
        "Cuire 20 minutes, mixer à moitié puis ajouter les pois chiches.",
        "Réchauffer 5 minutes et servir."])

recipe("tarte-poireaux-chevre", "Tarte aux poireaux et chèvre",
       "Une tarte fondante, végétarienne, qui se mange tiède.",
       6, 20, 35, ["plat", "four"],
       ["pate-brisee 1 piece", "poireau 3 piece", "chevre 150 g", "oeuf 3 piece", "creme-liquide 20 cl",
        "beurre 20 g", "poivre ?"],
       ["Faire fondre les poireaux émincés dans le beurre 15 minutes.",
        "Étaler la pâte dans un moule et y répartir les poireaux.",
        "Battre les œufs et la crème, verser, puis disposer le chèvre en rondelles.",
        "Enfourner 35 minutes à 180 °C."])

recipe("nouilles-sautees-tofu", "Nouilles sautées au tofu et légumes",
       "Un wok végétalien rapide, sucré-salé.",
       4, 15, 10, ["plat", "poele"],
       ["nouilles-riz 250 g", "tofu 300 g | en cubes", "carotte 2 piece | en julienne",
        "poivron 1 piece", "oignon 1 piece", "sauce-soja 4 tbsp", "sucre-roux 1 tbsp ?", "gingembre 10 g",
        "huile-sesame 2 tbsp", "cacahuete 40 g ?"],
       ["Réhydrater les nouilles dans l'eau chaude selon le paquet.",
        "Dorer le tofu dans la moitié de l'huile, réserver.",
        "Sauter les légumes et le gingembre 4 minutes à feu vif.",
        "Ajouter nouilles, tofu et sauce soja, mélanger 2 minutes et parsemer de cacahuètes."])

recipe("poelee-saucisses-lentilles", "Saucisses aux lentilles",
       "Le plat mijoté du dimanche soir, simple et généreux.",
       4, 10, 35, ["plat", "mijote", "economique"],
       ["saucisse 4 piece", "lentille-verte 300 g", "carotte 2 piece", "oignon 1 piece", "laurier 1 piece",
        "thym 2 g", "eau 1 l", "moutarde 1 tsp ?"],
       ["Faire dorer les saucisses dans une cocotte, les réserver.",
        "Faire revenir l'oignon et les carottes, ajouter les lentilles, le thym, le laurier et l'eau.",
        "Remettre les saucisses et cuire 30 minutes à frémissement.",
        "Servir avec un peu de moutarde."])

recipe("salade-pates-thon", "Salade de pâtes au thon",
       "La salade de pique-nique, à préparer avec les restes de pâtes.",
       4, 15, 10, ["salade", "economique"],
       ["pates 300 g", "thon-boite 280 g", "tomate-cerise 250 g", "mais 140 g", "oeuf 2 piece ? | durs",
        "mayonnaise 2 tbsp ?", "huile-olive 3 tbsp", "vinaigre 1 tbsp"],
       ["Cuire les pâtes, les rafraîchir et les égoutter.",
        "Émietter le thon, couper les tomates.",
        "Mélanger le tout avec le maïs et la vinaigrette.",
        "Ajouter les œufs durs en quartiers au moment de servir."])

recipe("veloute-carottes-cumin", "Velouté de carottes au cumin",
       "Économique, doux et légèrement épicé.",
       4, 10, 25, ["soupe", "economique"],
       ["carotte 8 piece", "pomme-de-terre 150 g", "oignon 1 piece", "cumin 1 tsp", "bouillon-legumes 1 piece",
        "eau 900 ml", "creme-fraiche 2 tbsp ?"],
       ["Faire suer l'oignon, ajouter le cumin.",
        "Ajouter les carottes et la pomme de terre en rondelles, le cube et l'eau.",
        "Cuire 25 minutes puis mixer.",
        "Servir avec une cuillère de crème."])

recipe("poulet-curry-coco", "Poulet au curry et lait de coco",
       "Un curry doux qui plaît aux petits comme aux grands.",
       4, 15, 25, ["plat", "mijote"],
       ["poulet-filet 600 g | en morceaux", "lait-coco 400 ml", "oignon 1 piece", "poivron 1 piece",
        "pate-curry 30 g", "huile-tournesol 1 tbsp", "riz 300 g", "coriandre 10 g ?"],
       ["Faire revenir l'oignon et le poivron dans l'huile.",
        "Ajouter le poulet et le faire dorer, puis la pâte de curry.",
        "Verser le lait de coco et laisser mijoter 15 minutes.",
        "Servir avec le riz et la coriandre."])

recipe("frittata-legumes", "Frittata aux restes de légumes",
       "L'omelette au four qui accueille tous les légumes cuits du frigo.",
       4, 10, 20, ["plat", "four", "economique"],
       ["oeuf 8 piece", "courgette 1 piece", "pomme-de-terre 300 g | cuites", "oignon 1 piece",
        "emmental 60 g", "huile-olive 2 tbsp", "sel ?", "poivre ?"],
       ["Faire revenir l'oignon, la courgette et les pommes de terre dans une poêle allant au four.",
        "Battre les œufs avec l'emmental, le sel et le poivre.",
        "Verser sur les légumes et cuire 5 minutes sur le feu.",
        "Terminer 15 minutes au four à 180 °C."])

recipe("couscous-legumes", "Couscous aux légumes et pois chiches",
       "Une version végétarienne et rapide du couscous.",
       4, 20, 35, ["plat", "mijote", "batch-cooking"],
       ["semoule 300 g", "courgette 2 piece", "carotte 3 piece", "navet 200 g", "pois-chiche 250 g",
        "tomate-concassee 400 g", "oignon 1 piece", "cumin 1 tsp", "harissa 10 g ?",
        "bouillon-legumes 1 piece", "eau 800 ml", "huile-olive 2 tbsp"],
       ["Faire revenir l'oignon dans l'huile avec le cumin.",
        "Ajouter carottes, navets, tomates, cube et eau, cuire 20 minutes.",
        "Ajouter courgettes et pois chiches, cuire encore 15 minutes.",
        "Préparer la semoule à l'eau bouillante et servir avec le bouillon de légumes et la harissa."])

recipe("steak-haricots-verts", "Steak, haricots verts et pommes sautées",
       "Le classique bistrot à la maison.",
       2, 10, 25, ["plat", "poele"],
       ["boeuf-steak 300 g", "haricot-vert 300 g", "pomme-de-terre 400 g", "beurre 20 g",
        "huile-tournesol 1 tbsp", "ail 1 piece", "persil 5 g ?"],
       ["Cuire les pommes de terre en dés à la poêle dans l'huile 20 minutes.",
        "Cuire les haricots verts 8 minutes à l'eau bouillante salée.",
        "Saisir les steaks dans le beurre 2 à 3 minutes par face.",
        "Faire sauter les haricots avec l'ail et le persil et servir."])

recipe("gnocchis-pesto", "Gnocchis poêlés au pesto et tomates cerises",
       "Dix minutes chrono pour un plat gourmand.",
       2, 5, 10, ["plat", "poele"],
       ["gnocchi 500 g", "pesto 80 g", "tomate-cerise 200 g", "parmesan 30 g ?", "huile-olive 1 tbsp"],
       ["Faire dorer les gnocchis dans l'huile 6 à 8 minutes.",
        "Ajouter les tomates cerises coupées en deux, cuire 2 minutes.",
        "Hors du feu, mélanger avec le pesto et servir avec le parmesan."])

recipe("soupe-miso-legumes", "Bouillon asiatique aux légumes et nouilles",
       "Un bouillon léger et parfumé pour les soirs pressés.",
       4, 15, 15, ["soupe"],
       ["nouilles-riz 150 g", "champignon 150 g", "carotte 1 piece", "epinard 100 g", "tofu 200 g",
        "sauce-soja 3 tbsp", "gingembre 10 g", "bouillon-legumes 1 piece", "eau 1.2 l"],
       ["Porter l'eau à ébullition avec le cube, le gingembre et la sauce soja.",
        "Ajouter les champignons et la carotte émincés, cuire 5 minutes.",
        "Ajouter les nouilles et le tofu, cuire 4 minutes.",
        "Ajouter les épinards hors du feu et servir."])

recipe("cake-banane", "Cake à la banane",
       "Le meilleur usage des bananes trop mûres.",
       8, 15, 45, ["dessert", "four", "economique"],
       ["banane 3 piece | bien mûres", "farine 200 g", "sucre-roux 80 g", "oeuf 2 piece", "beurre 80 g",
        "levure-chimique 11 g", "noix 50 g ?"],
       ["Préchauffer le four à 180 °C.",
        "Écraser les bananes, ajouter les œufs, le sucre et le beurre fondu.",
        "Incorporer la farine et la levure, puis les noix.",
        "Verser dans un moule à cake et enfourner 45 minutes."])

recipe("salade-chevre-chaud", "Salade de chèvre chaud",
       "Des toasts fondants sur une salade croquante.",
       4, 15, 8, ["salade", "four"],
       ["salade 1 piece", "chevre 200 g", "pain 160 g | en tranches", "noix 40 g", "miel 2 tbsp",
        "huile-olive 3 tbsp", "vinaigre-balsamique 1 tbsp"],
       ["Disposer une rondelle de chèvre sur chaque tranche de pain, ajouter un filet de miel.",
        "Gratiner 8 minutes au four à 200 °C.",
        "Assaisonner la salade avec l'huile et le balsamique, ajouter les noix.",
        "Servir les toasts chauds sur la salade."])

recipe("porc-moutarde", "Filet mignon à la moutarde",
       "Un plat de fête simple, avec une sauce crémeuse.",
       4, 10, 30, ["plat", "poele"],
       ["porc-filet 600 g", "creme-liquide 20 cl", "moutarde 2 tbsp", "echalote 2 piece",
        "vin-blanc 10 cl", "beurre 20 g", "pates 300 g ?"],
       ["Faire dorer le filet mignon entier dans le beurre sur toutes ses faces.",
        "Ajouter les échalotes, puis déglacer au vin blanc.",
        "Couvrir et cuire 20 minutes à feu doux.",
        "Ajouter la crème et la moutarde, réduire 5 minutes, trancher et napper."])

recipe("yaourt-granola-fruits", "Bol de yaourt, flocons d'avoine et fruits",
       "Un petit-déjeuner sans cuisson, à adapter aux fruits du moment.",
       2, 5, 0, ["petit-dejeuner", "sans-cuisson"],
       ["yaourt 2 piece", "flocon-avoine 60 g", "banane 1 piece", "fraise 120 g ?", "miel 1 tbsp ?",
        "amande 20 g ?"],
       ["Répartir les yaourts dans deux bols.",
        "Ajouter les flocons d'avoine et les fruits coupés.",
        "Terminer avec le miel et les amandes."])


# ===========================================================================
# Validation et génération SQL
# ===========================================================================
def q(s):
    return "'" + s.replace("'", "''") + "'"


def parse_line(line, ingredients, recipe_slug):
    body, _, note = line.partition("|")
    note = note.strip() or None
    tokens = body.split()
    slug = tokens[0]
    if slug not in ingredients:
        raise SystemExit(f"[{recipe_slug}] ingrédient inconnu : {slug}")
    rest = tokens[1:]
    optional = False
    if rest and rest[-1] == "?":
        optional = True
        rest = rest[:-1]
    if not rest:
        if not optional:
            raise SystemExit(f"[{recipe_slug}] {slug} : quantité manquante (ou « ? » pour facultatif)")
        return slug, None, None, note, True
    if len(rest) != 2:
        raise SystemExit(f"[{recipe_slug}] ligne mal formée : {line}")
    qty, unit = rest
    if unit not in UNITS:
        raise SystemExit(f"[{recipe_slug}] unité inconnue « {unit} » pour {slug}")
    if not re.fullmatch(r"\d+(\.\d{1,3})?", qty) or float(qty) <= 0:
        raise SystemExit(f"[{recipe_slug}] quantité invalide « {qty} » pour {slug}")
    if not convertible(UNITS[unit], ingredients[slug]):
        raise SystemExit(f"[{recipe_slug}] {slug} : unité {unit} non convertible ({ingredients[slug]['dim']})")
    return slug, qty, unit, note, optional


def main():
    ingredients = load_ingredients()
    seen = set()
    recipe_rows, ing_rows, step_rows = [], [], []
    for r in R:
        assert r["slug"] not in seen, r["slug"]
        seen.add(r["slug"])
        assert set(r["tags"]) <= TAGS, (r["slug"], set(r["tags"]) - TAGS)
        assert 3 <= len(r["title"]) <= 120 and len(r["description"]) <= 500
        assert r["steps"], r["slug"]
        used = set()
        for pos, line in enumerate(r["ingredients"]):
            slug, qty, unit, note, optional = parse_line(line, ingredients, r["slug"])
            if slug in used:
                raise SystemExit(f"[{r['slug']}] {slug} présent deux fois")
            used.add(slug)
            ing_rows.append(f"  ({q(r['slug'])}, {q(slug)}, {qty or 'null'}, {q(unit) if unit else 'null'}, "
                            f"{'true' if optional else 'false'}, {q(note) if note else 'null'}, {pos})")
        if not any(not l.split()[-1] == "?" and "?" not in l.split("|")[0] for l in r["ingredients"]):
            raise SystemExit(f"[{r['slug']}] aucun ingrédient obligatoire")
        tags = "array[" + ", ".join(q(t) for t in r["tags"]) + "]::text[]"
        recipe_rows.append(f"  ({q(r['slug'])}, {q(r['title'])}, {q(r['description'])}, {r['servings']}, "
                           f"{r['prep']}, {r['cook']}, {tags})")
        for i, step in enumerate(r["steps"], start=1):
            step_rows.append(f"  ({q(r['slug'])}, {i}, {q(step)})")

    out = [
        "-- 0009 — Recettes de démonstration (catalogue public, publiées et validées).",
        "-- Fichier GÉNÉRÉ par scripts/generate-recipes-migration.py — recettes originales (D7).",
        "-- Ne jamais éditer une fois appliqué : corriger via une nouvelle migration.",
        f"-- {len(recipe_rows)} recettes, {len(ing_rows)} lignes d'ingrédients, {len(step_rows)} étapes.",
        "",
        "insert into public.recipes (slug, title, description, servings, prep_minutes, cook_minutes, tags,",
        "  status, source, source_ref, validated_at)",
        "select v.slug, v.title, v.description, v.servings, v.prep, v.cook, v.tags,",
        "  'published', 'curated', 'Aux Petits Oignons — recette originale', now()",
        "from (values",
        ",\n".join(recipe_rows),
        ") as v(slug, title, description, servings, prep, cook, tags);",
        "",
        "insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, is_optional,",
        "  preparation_note, position)",
        "select r.id, i.id, v.qty, v.unit, v.optional, v.note, v.pos",
        "from (values",
        ",\n".join(ing_rows),
        ") as v(recipe, ingredient, qty, unit, optional, note, pos)",
        "join public.recipes r on r.slug = v.recipe",
        "join public.ingredients i on i.slug = v.ingredient;",
        "",
        "insert into public.recipe_steps (recipe_id, position, instruction)",
        "select r.id, v.pos, v.instruction",
        "from (values",
        ",\n".join(step_rows),
        ") as v(recipe, pos, instruction)",
        "join public.recipes r on r.slug = v.recipe;",
        "",
        "-- Garde-fou : une jointure silencieusement vide (slug introuvable) fait échouer la migration.",
        "do $$",
        "begin",
        f"  if (select count(*) from public.recipe_ingredients ri join public.recipes r on r.id = ri.recipe_id"
        f" where r.source = 'curated') <> {len(ing_rows)} then",
        "    raise exception 'Lignes d''ingrédients manquantes dans le catalogue de démonstration.';",
        "  end if;",
        "end;",
        "$$;",
        "",
    ]
    sys.stdout.write("\n".join(out))
    print(f"{len(recipe_rows)} recettes, {len(ing_rows)} ingrédients, {len(step_rows)} étapes", file=sys.stderr)


if __name__ == "__main__":
    main()
