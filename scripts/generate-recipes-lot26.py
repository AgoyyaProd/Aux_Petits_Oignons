"""Vingt-sixième lot de recettes originales (D7) : génère la migration 0091.

Dix « recettes de la flemme » qui remplacent les doublons retirés par la migration 0090 :
chaque plat a été comparé au catalogue (titres et ingrédients) pour ne pas refaire une recette
existante à un produit express près. Mêmes critères (tests/db/flemme.test.ts), aucun nouvel
ingrédient.

Usage : python3 scripts/generate-recipes-lot26.py > supabase/migrations/20261118000091_recipes_lot26.sql
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from recipes_lot import run  # noqa: E402

if __name__ == "__main__":
    run(lot=26, migration="0091", ordinal="vingt-sixième",
        summary="recettes de la flemme, en remplacement des doublons")
