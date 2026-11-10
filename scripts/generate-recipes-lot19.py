"""Dix-neuvième lot de recettes originales (D7) : génère la migration 0067.

Plats asiatiques (épicerie asiatique du référentiel) et recettes rapides aux tomates séchées.
Au moins 20 g de protéines par part (valeurs Ciqual vérifiées par tests/db), avec conseils de
conservation. Générateur commun : scripts/recipes_lot.py.
Usage : python3 scripts/generate-recipes-lot19.py > supabase/migrations/20261102000067_recipes_lot19.sql
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recipes_lot import run  # noqa: E402

if __name__ == "__main__":
    run(lot=19, migration="0067", ordinal="dix-neuvième",
        summary='plats asiatiques et recettes rapides aux tomates séchées')
