"""Vingt et unième lot de recettes originales (D7) : génère la migration 0071.

Plats autour des fromages ajoutés par la migration 0070.
Au moins 20 g de protéines par part (valeurs Ciqual vérifiées par tests/db), avec conseils de
conservation. Générateur commun : scripts/recipes_lot.py.
Usage : python3 scripts/generate-recipes-lot21.py > supabase/migrations/20261102000071_recipes_lot21.sql
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recipes_lot import run  # noqa: E402

if __name__ == "__main__":
    run(lot=21, migration="0071", ordinal="vingt et unième",
        summary='plats autour des fromages')
