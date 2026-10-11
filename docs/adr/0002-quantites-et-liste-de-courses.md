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
