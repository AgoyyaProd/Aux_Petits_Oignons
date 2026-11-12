# Formats d'achat (migration 0083)

1. `python3 fetch.py ingredients.json` : relevés Open Prices (France, produits) par catégorie
   de prix ; `ingredients.json` = `[slug, dimension, tags]` des ingrédients `kind = 'product'`
   (`select slug, default_dimension, tags from ingredient_price_sources … where kind = 'product'`).
2. `python3 analyze.py` : contenance la plus fréquente par ingrédient (règle décrite en tête de
   la migration 0083), écrite dans `analysis.json`.
