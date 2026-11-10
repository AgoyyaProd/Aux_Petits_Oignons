"""Dix-septième lot de recettes originales (D7) : génère la migration 0059.

Soupes-repas et boîtes-repas à emporter, qui se gardent au moins deux jours au réfrigérateur.
Au moins 20 g de protéines par part (valeurs Ciqual vérifiées par tests/db), avec conseils de
conservation. Générateur commun : scripts/recipes_lot.py.
Usage : python3 scripts/generate-recipes-lot17.py > supabase/migrations/20261019000059_recipes_lot17.sql
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recipes_lot import run  # noqa: E402

if __name__ == "__main__":
    run(lot=17, migration="0059", ordinal="dix-septième",
        summary='soupes-repas et boîtes-repas à emporter')
