"""Vingt-deuxième lot de recettes originales (D7) : génère la migration 0072.

Flammekueches : la classique et des variantes.
Au moins 20 g de protéines par part (valeurs Ciqual vérifiées par tests/db), avec conseils de
conservation. Générateur commun : scripts/recipes_lot.py.
Usage : python3 scripts/generate-recipes-lot22.py > supabase/migrations/20261102000072_recipes_lot22.sql
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recipes_lot import run  # noqa: E402

if __name__ == "__main__":
    run(lot=22, migration="0072", ordinal="vingt-deuxième",
        summary='flammekueches (classique, saumon fumé et variantes)')
