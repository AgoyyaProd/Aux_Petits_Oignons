"""Vingt-troisième lot de recettes originales (D7) : génère la migration 0074.

Sandwichs au pain bretzel avec salade (ingrédients de la migration 0073).
Au moins 20 g de protéines par part (valeurs Ciqual vérifiées par tests/db), avec conseils de
conservation. Générateur commun : scripts/recipes_lot.py.
Usage : python3 scripts/generate-recipes-lot23.py > supabase/migrations/20261102000074_recipes_lot23.sql
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recipes_lot import run  # noqa: E402

if __name__ == "__main__":
    run(lot=23, migration="0074", ordinal="vingt-troisième",
        summary='sandwichs au pain bretzel et leur salade')
