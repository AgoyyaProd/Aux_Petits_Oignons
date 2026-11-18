"""Vingt-cinquième lot de recettes originales (D7) : génère la migration 0089.

Suite des « recettes de la flemme » : mêmes critères (tests/db/flemme.test.ts), avec des
produits express génériques — purée en flocons, riz cuit en sachet, pommes de terre vapeur
sous vide, pâtes fraîches, raviolis frais au fromage — et des protéines prêtes ou rapides :
poulet cuit, maquereau en conserve, boulettes végétales, plus les viandes déjà au référentiel
(bœuf haché, escalopes de dinde, jambon). Aucun nom de marque : on décrit le produit.

Nutrition : Anses, table Ciqual 2025 (licence ouverte Etalab), valeurs recopiées du fichier
Table_Ciqual_2025_FR_2025_11_03.xls pour le code indiqué, lues comme
scripts/generate-nutrition-migration.py (« traces » et « < seuil » = 0).
Allergènes : produits industriels dont la recette varie selon la marque ; on signale ceux
qu'on trouve couramment, à vérifier sur l'étiquette (mieux vaut écarter à tort qu'exposer).
Prix : aucune source vérifiée, saisie du foyer ou tickets de caisse.

Usage : python3 scripts/generate-recipes-lot25.py > supabase/migrations/20261118000089_recipes_lot25.sql
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recipes_lot import run  # noqa: E402


def item(name, category, aliases, ciqual, dim="mass", allergens=(), diets=(), frozen=False):
    return {"name": name, "category": category, "dim": dim, "density": None, "piece": None,
            "aliases": aliases, "allergens": list(allergens), "diets": list(diets),
            "frozen": frozen, "ciqual": ciqual}


MEAT = ("pescetarian", "vegan", "vegetarian")
NO_MEAT = ("vegan", "vegetarian")
NEW_INGREDIENTS = {
    "puree-flocons": item(
        "Purée en flocons", "feculents",
        ["puree en flocons", "flocons de pomme de terre", "puree express", "puree minute",
         "puree deshydratee", "puree instantanee"],
        # Flocons nature (sans lait en poudre) : le lait est compté à part dans la recette.
        (4022, "Flocons de pomme de terre, nature, déshydratés", 346.0, 8.0, 73.5, 2.35, 0.41, 0.17, 8.05, 0.55)),
    "riz-cuit-sachet": item(
        "Riz cuit en sachet", "feculents",
        ["riz cuit en sachet", "riz en sachet micro ondes", "riz express", "riz minute cuit",
         "riz precuit"],
        # Riz blanc cuit nature ; certains sachets contiennent un peu d'huile ajoutée.
        (9104, "Riz blanc, cuit, sans sel ajouté", 155.0, 3.15, 33.2, 0.0, 0.7, 0.17, 1.4, 0.045)),
    "pdt-vapeur": item(
        "Pommes de terre vapeur sous vide", "legumes",
        ["pommes de terre vapeur", "pommes de terre sous vide", "pommes de terre cuites sous vide",
         "pommes de terre precuites"],
        (4014, "Pomme de terre vapeur, sous vide", 76.0, 1.84, 15.8, 0.5, 0.25, 0.039, 2.02, 0.14)),
    "pates-fraiches": item(
        "Pâtes fraîches aux œufs", "feculents",
        ["pates fraiches", "tagliatelles fraiches", "pates fraiches aux oeufs",
         "fettuccine fraiches"],
        (9815, "Pâtes fraîches, aux oeufs, crues", 283.0, 10.1, 53.8, 2.54, 1.87, 0.49, 3.17, 0.35),
        allergens=("gluten", "eggs"), diets=("vegan",)),
    "raviolis-frais": item(
        "Raviolis frais au fromage", "feculents",
        ["raviolis frais", "raviolis au fromage", "tortellinis au fromage", "ravioles",
         "pates farcies au fromage"],
        (25181, "Pâtes fraîches farcies (ex : raviolis, tortellinis, ravioles du Dauphiné), au fromage, préemballées, crues",
         268.0, 11.3, 37.3, 3.83, 7.69, 4.28, 2.23, 1.13),
        allergens=("gluten", "eggs", "milk"), diets=("vegan",)),
    "poulet-cuit": item(
        "Émincés de poulet cuits", "viandes",
        ["poulet cuit", "emince de poulet cuit", "eminces de poulet", "aiguillettes de poulet cuites",
         "blanc de poulet cuit en des"],
        # Filet grillé nature ; les barquettes du commerce sont souvent un peu plus salées.
        (36018, "Poulet, filet sans peau grillé/poêlé", 141.0, 30.1, 0.0, 0.0, 2.0, 0.58, 0.0, 0.14),
        diets=MEAT),
    "maquereau-boite": item(
        "Maquereau en conserve au naturel", "poissons",
        ["maquereau en conserve", "filets de maquereau", "maquereau au naturel",
         "maquereau en boite"],
        (26123, "Maquereau, filet (grillé ou non), au naturel, appertisé, égoutté", 221.0, 18.8, 0.018, 0.0, 16.2, 3.74, 0.0, 0.86),
        allergens=("fish",), diets=NO_MEAT),
    "boulettes-vegetales": item(
        "Boulettes végétales", "legumineuses",
        ["boulettes vegetales", "boulettes de soja", "boulettes veggie", "boulettes sans viande"],
        (25589, "Boulette végétale au soja et/ou blé, préemballée", 211.0, 17.6, 7.98, 3.47, 10.6, 1.11, 5.45, 1.51),
        # Soja et/ou blé selon la marque : à vérifier sur l'étiquette.
        allergens=("soy", "gluten")),
    "petits-pois-carottes": item(
        "Petits pois et carottes surgelés", "legumes",
        ["petits pois carottes", "petits pois et carottes", "petits pois carottes surgeles",
         "jardiniere petits pois carottes"],
        (20214, "Petits pois et carottes, surgelés, crus", 53.0, 3.4, 7.1, 3.43, 0.47, 0.084, 3.4, 0.2),
        frozen=True),
}

if __name__ == "__main__":
    run(lot=25, migration="0089", ordinal="vingt-cinquième",
        summary="recettes de la flemme aux produits express",
        new_ingredients=NEW_INGREDIENTS)
