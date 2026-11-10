"""Vingtième lot de recettes originales (D7) : génère la migration 0069.

Deuxième série asiatique, avec l'épicerie asiatique de la migration 0068.
Au moins 20 g de protéines par part (valeurs Ciqual vérifiées par tests/db), avec conseils de
conservation. Générateur commun : scripts/recipes_lot.py.
Usage : python3 scripts/generate-recipes-lot20.py > supabase/migrations/20261102000069_recipes_lot20.sql
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recipes_lot import run  # noqa: E402

if __name__ == "__main__":
    run(lot=20, migration="0069", ordinal="vingtième",
        summary="deuxième série asiatique (sauce d'huître, nuoc-mâm, miso, nouilles aux œufs…)")
