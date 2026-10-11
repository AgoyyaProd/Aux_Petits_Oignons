# ADR 0004 — Prix indicatifs et générateur de menu

Date : 2026-10-11 · Statut : accepté

## Contexte

Le foyer choisit un nombre de repas, de personnes et un budget ; l'application propose un
menu, que le foyer ajuste (remplacer, retirer, garder, portions). Le budget couvre **tout
le menu**, stock compris (choix du foyer). Il faut donc des prix, sans jamais en inventer.

## Source des prix

Aucune enseigne (Leclerc, Carrefour…) n'offre d'accès public à ses prix ; leurs sites
interdisent la collecte automatisée (`robots.txt` de E.Leclerc : `/recherche`,
`/catalogue` interdits). Nous n'y collectons rien.

Prix retenus, par ordre de priorité :

1. **Prix du foyer** (`household_prices`) : saisi à la main, avec lien facultatif vers la
   fiche produit. Remplace le prix indicatif de l'ingrédient.
2. **Prix indicatif** (`reference_prices`) : médiane robuste des relevés
   [Open Prices](https://prices.openfoodfacts.org) (Open Food Facts, licence ODbL) faits en
   France sur 180 jours, hors promotions. Attribution affichée sur les écrans de prix.
3. **Sans prix** : l'ingrédient est signalé, le coût affiché devient un minimum (« ≥ »).

Mesure préalable (échantillon de 24 ingrédients) : 20 avec des relevés récents en France ;
les 4 autres correspondaient à des noms de catégorie erronés, corrigés depuis la taxonomie
officielle.

## Calcul (domaine pur, `src/domain/pricing`)

- Unité de prix : centimes entiers par kg, par litre ou par pièce, selon la dimension de
  l'ingrédient.
- Un relevé est ramené à cette unité : prix au kilo ou à la pièce (produits bruts), ou prix
  du paquet divisé par sa contenance (produits emballés) ; nombre de pièces lu dans le nom
  pour les œufs (« boîte de 6 »), sinon rien.
- Conversions uniquement par la densité et le poids unitaire de l'ingrédient (comme pour les
  quantités) : sans eux, le relevé est écarté, jamais converti au jugé.
- Médiane, puis exclusion des relevés à plus d'un facteur 2,5 de la médiane, puis médiane.
  Moins de 5 relevés retenus : prix marqué « peu de relevés ».
- Coûts calculés en millièmes de centime (entiers, BigInt pour les produits), arrondis au
  centime à l'affichage seulement. Ingrédients facultatifs exclus, comme pour les courses.

## Correspondance et mise à jour

- `ingredient_price_sources` : catégorie(s) Open Prices par ingrédient, générée depuis
  `scripts/data/price-mappings.txt` (script de validation contre la taxonomie). Certaines
  sont marquées « approchantes » (chou rouge → choux, légumineuses en conserve).
- `syncReferencePrices` interroge l'API (100 relevés récents par catégorie, 6 requêtes en
  parallèle, User-Agent identifié), en commençant par les prix les plus anciens ; si le
  temps manque, la mise à jour suivante reprend. Journal dans `price_sync_runs`.
- Déclenchement : bouton réservé aux administrateurs (écritures soumises à la RLS) et tâche
  nocturne Vercel Cron (`/api/cron/prices`, secret `CRON_SECRET`, client service_role —
  seule exception documentée, limitée à des prix publics).

## Générateur de menu (`src/domain/planning`)

Déterministe : même demande + même graine = même menu ; « Relancer » incrémente la graine.
Candidats : plats principaux (ni dessert ni petit-déjeuner) compatibles avec le foyer
(allergies, régimes, aliments non souhaités) et dans son temps de préparation maximal.

Critères, dans l'ordre :

1. **Budget** : un plat n'est choisi que s'il laisse de quoi compléter le menu avec les plats
   les moins chers ; sinon le menu le moins cher possible, signalé « dépasse le budget ».
2. **Anti-gaspillage** : plats utilisant des produits prioritaires (règle D8), puis le stock.
3. **Variété** : pas de doublon, au plus 2 plats par famille de féculent ou de protéine ;
   relâchée seulement si le catalogue ne suffit pas.
4. Hasard reproductible.

Un plat sans aucun prix n'est retenu qu'en dernier recours quand un budget est fixé.

## Enregistrement du menu

Une fonction `meal_plan_save` enregistre le menu entier : atomique, idempotente (clé par
formulaire), version optimiste (`AP409`), et **filet de sécurité** en base qui refuse une
recette contraire aux allergies ou régimes du foyer. Aucune écriture directe dans
`meal_plans` / `meal_plan_entries`.

Le menu est une liste de plats pour la semaine ; leur placement jour par jour (midi/soir)
viendra avec la liste de courses et le décompte du stock.
