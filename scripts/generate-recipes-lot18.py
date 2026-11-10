"""Dix-huitième lot de recettes originales (D7) : génère la migration 0066.

Plats à la sauce teriyaki toute prête et aux tomates séchées (ingrédients de la migration 0064).
Au moins 20 g de protéines par part (valeurs Ciqual vérifiées par tests/db), avec conseils de
conservation. Générateur commun : scripts/recipes_lot.py.
Usage : python3 scripts/generate-recipes-lot18.py > supabase/migrations/20261102000066_recipes_lot18.sql
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recipes_lot import run  # noqa: E402

if __name__ == "__main__":
    run(lot=18, migration="0066", ordinal="dix-huitième",
        summary='plats à la sauce teriyaki et aux tomates séchées')
