# ADR 0002 — Représentation des quantités et calcul de la liste de courses

Date : 2026-10-11 · Statut : accepté

## Quantités exactes, sans virgule flottante

Une quantité est un **entier de millièmes de l'unité de base** de sa dimension
(`src/domain/units/quantity.ts`) : 1,5 kg = `{ milli: 1 500 000, dimension: "mass" }`.

- Même précision que la base (`numeric(12,3)`), aucune dépendance (pas de `decimal.js`).
- Les saisies (« 1,5 ») sont lues caractère par caractère, sans passer par un flottant.
- Les produits intermédiaires (portions, densités) sont calculés en `BigInt`,
  avec un arrondi au millième le plus proche.
- Additionner deux dimensions différentes lève `IncompatibleUnitError`.

## Conversions

Uniquement celles portées par l'ingrédient : `density_g_per_ml` (masse ↔ volume) et
`piece_weight_g` (pièce ↔ masse). Une conversion absente n'est jamais devinée : le
besoin reste sur une ligne séparée dans sa propre unité.

Les densités et poids unitaires du catalogue initial sont des **valeurs culinaires
moyennes** : elles servent à rapprocher une recette et un stock exprimés différemment,
pas à peser au gramme près.

## Algorithme de la liste de courses (`src/domain/shopping`)

1. Besoins par repas planifié (`status = planned`), ajustés aux portions, ingrédients
   facultatifs exclus, normalisés dans la dimension par défaut de l'ingrédient.
2. Le stock est réparti entre les repas **dans l'ordre chronologique** (décision D3),
   en consommant d'abord les produits entamés, puis ceux qui périment le plus tôt (FEFO).
3. Un lot dont la **DLC** tombe avant un repas ne compte pas pour ce repas.
   Une **DDM** dépassée reste utilisable mais déclenche un avertissement.
4. Une **quantité inconnue** n'est jamais comptée ; un avertissement invite à vérifier.
5. À acheter = somme des manques. Quand tout le stock est valable sur la période, c'est
   exactement `max(0, besoin cumulé − stock utilisable)`.

Le résultat est un **besoin théorique** : aucune taille de conditionnement n'est supposée.

## Écarts au plan de migrations

- 0003 : schéma du référentiel et vocabulaire fixe (unités, régimes, 14 allergènes).
- 0004 : catalogue de 177 ingrédients, **en migration et non dans le seed**, car il est
  requis en production. Généré par `scripts/generate-ingredients-migration.py`.
- Les préférences du foyer (prévues en 0004) passent en 0005.
- Le régime « halal » est remplacé par « sans porc » : la conformité halal dépend de la
  filière d'abattage, qu'un ingrédient générique ne peut pas garantir.

## Liste de courses à l'écran (phase 5, migration 0015)

- La liste **n'est pas stockée** : elle est recalculée à chaque affichage à partir du menu de
  la semaine, du garde-manger et du placard. Elle ne peut donc jamais être désynchronisée.
- Les plats du menu ne sont pas encore placés jour par jour : ils sont datés du jour (ou du
  lundi pour une semaine à venir) pour la règle des DLC.
- Ingrédients du placard : listés « déjà chez toi », jamais à acheter.
- Pièces arrondies à l'unité supérieure à l'achat (1,5 oignon -> 2) ; masses et volumes
  inchangés. Toujours un besoin, jamais une taille de paquet.
- Seules les coches « dans le panier » sont stockées (`shopping_checks`, partagées par le foyer).
- « Ranger mes courses » : `shopping_put_away` ajoute tous les produits en **une opération**
  atomique et idempotente, tracée par des mouvements `purchase`. Le foyer saisit la quantité
  réellement achetée (paquet de 500 g plutôt que 375 g nécessaires).

## Finir les courses, puis « Cuisiné » (migration 0016)

- « Finir les courses » (`shopping_finish`) range les produits cochés et marque la semaine
  (`meal_plans.shopping_done_at`), dans une seule transaction.
- Le bouton « Cuisiné » n'apparaît sur une fiche recette qu'ensuite, si la recette est au menu
  (semaine en cours, suivante ou précédente) et pas encore cuisinée.
- Le décompte est calculé par le domaine (`planCooking`) : ingrédients obligatoires ajustés
  aux portions du menu, FEFO, DLC dépassée et quantité inconnue jamais utilisées, placard
  jamais décompté, conversions seulement par l'ingrédient. Ce qui manque est signalé, rien
  n'est inventé.
- `meal_cook` applique ce décompte en une opération atomique et idempotente (mouvements
  `cooking`), avec contrôle de version par lot : un stock modifié entre-temps lève `AP409`.
- Les plats cuisinés sont tenus dans un journal (`meal_cookings`), indépendant de l'ordre du
  menu ; ils sortent de la liste de courses et ne peuvent plus être modifiés ni remplacés.
