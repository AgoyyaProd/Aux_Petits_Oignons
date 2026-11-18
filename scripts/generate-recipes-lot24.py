"""Vingt-quatrième lot de recettes originales (D7) : génère la migration 0088.

« Recettes de la flemme » : très rapides, peu d'ingrédients, mais au moins 80 g de légumes
et 20 g de protéines par part (critères vérifiés par tests/db/flemme.test.ts). Ajoute les
produits « raccourcis » qu'elles utilisent : légumes surgelés nature, palets de légumes,
poisson blanc surgelé, falafels, lentilles en conserve, carottes râpées, houmous.

Nutrition : Anses, table Ciqual 2025 (licence ouverte Etalab), valeurs recopiées du fichier
Table_Ciqual_2025_FR_2025_11_03.xls pour le code indiqué, lues comme
scripts/generate-nutrition-migration.py (« traces » et « < seuil » = 0).
Allergènes : produits industriels dont la recette varie selon la marque ; on signale ceux
qu'on trouve couramment, à vérifier sur l'étiquette (mieux vaut écarter à tort qu'exposer).
Prix : aucune source vérifiée, saisie du foyer ou tickets de caisse.

Usage : python3 scripts/generate-recipes-lot24.py > supabase/migrations/20261118000088_recipes_lot24.sql
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recipes_lot import run  # noqa: E402


def item(name, category, aliases, ciqual, dim="mass", allergens=(), diets=(), frozen=False):
    return {"name": name, "category": category, "dim": dim, "density": None, "piece": None,
            "aliases": aliases, "allergens": list(allergens), "diets": list(diets),
            "frozen": frozen, "ciqual": ciqual}


NO_MEAT = ("vegan", "vegetarian")
NEW_INGREDIENTS = {
    "palet-legumes": item(
        "Palets de légumes surgelés", "legumes",
        ["palets de legumes", "palet de legumes", "galettes de legumes surgelees",
         "galette de legumes", "palets legumes"],
        (25199, "Palet ou galette de légumes, préfrit, surgelé", 101.0, 2.33, 8.67, 3.0, 5.67, 1.33, 3.0, 0.76),
        # Liants courants (farine, œuf, fromage) : à vérifier selon la marque.
        allergens=("gluten", "eggs", "milk"), diets=("vegan",), frozen=True),
    "melange-legumes": item(
        "Mélange de légumes surgelés", "legumes",
        ["melange de legumes surgeles", "legumes surgeles", "melange legumes",
         "legumes melanges surgeles", "poelee de legumes nature"],
        (20101, "Légumes, mélange surgelé, crus", 65.1, 2.26, 5.71, 2.18, 2.65, 0.84, 4.7, 0.6),
        frozen=True),
    "legumes-wok": item(
        "Wok de légumes surgelé", "legumes",
        ["wok de legumes", "poelee asiatique", "legumes pour wok", "poelee de legumes asiatique"],
        (20273, "Poêlée de légumes assaisonnés à l'asiatiques ou wok de légumes, surgelée, crue",
         73.5, 1.75, 4.0, 3.25, 5.0, 0.5, 2.75, 0.18),
        # Assaisonnement souvent à la sauce soja (soja, blé).
        allergens=("soy", "gluten"), frozen=True),
    "epinard-galets": item(
        "Épinards en galets surgelés", "legumes",
        ["epinards surgeles", "epinards en galets", "galets d epinards", "epinards haches surgeles",
         "epinards en branches surgeles"],
        (20083, "Epinard, haché ou purée ou en branches, surgelé, cru", 28.0, 3.32, 1.0, 0.83, 0.54, 0.041, 2.95, 0.14),
        frozen=True),
    "haricot-vert-surgele": item(
        "Haricots verts surgelés", "legumes",
        ["haricots verts surgeles", "haricot vert surgele", "haricots verts extra fins surgeles"],
        (20070, "Haricot vert, surgelé, cru", 33.1, 1.79, 4.76, 2.21, 0.21, 0.047, 2.6, 0.007),
        frozen=True),
    "legumes-couscous": item(
        "Légumes pour couscous surgelés", "legumes",
        ["legumes pour couscous", "legumes couscous surgeles", "legumes a couscous"],
        (20496, "Légumes pour couscous, surgelés, crus", 44.3, 1.93, 6.47, 3.05, 0.63, 0.1, 2.53, 0.12),
        frozen=True),
    "legumes-ratatouille": item(
        "Légumes pour ratatouille surgelés", "legumes",
        ["legumes pour ratatouille", "ratatouille surgelee", "legumes ratatouille surgeles"],
        (20266, "Légumes pour ratatouille, surgelés", 21.0, 1.01, 3.23, 2.88, 0.089, 0, 1.67, 0.082),
        frozen=True),
    "poisson-blanc-surgele": item(
        "Filets de poisson blanc surgelés", "poissons",
        ["filets de poisson blanc surgeles", "poisson blanc surgele", "filets de lieu surgeles",
         "lieu noir surgele", "filets de colin surgeles", "filets de merlu surgeles",
         "filets de cabillaud surgeles"],
        (26047, "Lieu noir, surgelé, cru", 82.4, 19.8, 0, 0, 0.37, 0.074, 0.0, 0.2),
        allergens=("fish",), diets=NO_MEAT, frozen=True),
    "falafel": item(
        "Falafels", "legumineuses",
        ["falafels", "falafel", "boulettes de pois chiches"],
        (25590, "Falafel ou boulette de pois-chiche et/ou fève, préemballé", 211.0, 7.38, 17.7, 3.57, 10.8, 1.28, 6.0, 0.87),
        # Souvent de la farine de blé et du sésame : à vérifier selon la marque.
        allergens=("gluten", "sesame")),
    "lentille-boite": item(
        "Lentilles en conserve", "legumineuses",
        ["lentilles en conserve", "lentilles en boite", "lentilles cuisinees", "lentilles au naturel",
         "lentilles cuites"],
        (20510, "Lentille, cuisinée, appertisée, égouttée", 90.4, 6.83, 12.3, 0.67, 0.64, 0.1, 4.0, 0.65)),
    "carotte-rapee": item(
        "Carottes râpées", "legumes",
        ["carottes rapees", "carotte rapee", "carottes rapees nature"],
        # Barquette nature (sans sauce) : même composition que la carotte crue.
        (20009, "Carotte, crue", 30.2, 0.78, 5.16, 4.85, 0, 0, 2.9, 0.12)),
    "houmous": item(
        "Houmous", "legumineuses",
        ["houmous", "hoummous", "humus", "hummus"],
        (25621, "Houmous, préemballé", 258.0, 8.06, 9.0, 1.66, 19.9, 2.02, 5.18, 1.08),
        allergens=("sesame",)),
}

if __name__ == "__main__":
    run(lot=24, migration="0088", ordinal="vingt-quatrième",
        summary="recettes de la flemme, très rapides mais équilibrées",
        new_ingredients=NEW_INGREDIENTS)
