# ADR 0003 — Garde-manger : registre de stock et opérations sûres

Date : 2026-10-11 · Statut : accepté

## Registre plutôt que compteur

`stock_movements` est un registre en ajout seul (un trigger refuse toute modification,
même au propriétaire de la base). `pantry_items.quantity_base` en est un cache, mis à jour
dans la même transaction. Un test vérifie que le cache égale toujours le dernier mouvement.

Le client n'a **aucun droit d'écriture** sur ces tables : toutes les mutations passent par
trois fonctions SQL (migration 0007) :

| Fonction                | Rôle                                                  |
| ----------------------- | ----------------------------------------------------- |
| `pantry_add_item`       | ajout d'un produit + mouvement « initial »            |
| `pantry_apply_movement` | consommation, perte (dont « tout jeter »), correction |
| `pantry_update_details` | emplacement, date limite, ouverture (sans mouvement)  |

## Garanties

- **Atomicité** : un appel = une transaction. Une erreur à mi-parcours n'écrit rien.
- **Idempotence** : chaque formulaire porte une clé (UUID) générée côté serveur. La même
  clé rejouée (double clic, réseau coupé après validation, rechargement) renvoie le
  résultat déjà enregistré sans nouveau mouvement. La clé n'est renouvelée qu'après un
  succès ; après une erreur, le nouvel essai garde la même clé. Une clé réutilisée pour
  une autre action ou un autre produit est refusée.
- **Concurrence** : verrou de ligne (`FOR UPDATE`) et version attendue. Une modification
  faite entre-temps depuis un autre appareil lève un conflit (`AP409`) au lieu d'écraser.
  L'idempotence est vérifiée avant la version, pour qu'un nouvel essai réussi ne soit pas
  pris pour un conflit.
- **Unités** : la base reçoit la quantité **et son unité**, et refuse une unité d'une autre
  dimension que celle du produit (retirer « 1 l » d'un stock en grammes est impossible).
- **Quantité inconnue** : acceptée à l'ajout, jamais consommable avant correction.

Codes d'erreur applicatifs : `AP404` introuvable ou inaccessible (même réponse, pour ne
rien révéler), `AP409` conflit, `AP422` donnée invalide. Leurs messages, rédigés pour
l'utilisateur, sont affichés tels quels ; toute autre erreur affiche un message générique.

## Préférences du foyer

Régimes et allergies sont modifiables par **tous les membres** (chacun déclare ses
allergies) ; les réglages du foyer (nom, taille, budget) par le **propriétaire** seul.
Un allergène ne peut pas être enregistré comme simple « dégoût » (contrainte en base).

## Limite connue

Les types générés par `supabase gen types` déclarent les arguments RPC non nuls. Les
appels passent par `src/server/modules/pantry/repository.ts`, qui décrit les signatures
réelles et valide chaque réponse avec Zod.

## Placard (ajout du 11/10/2026, migration 0014)

Exception **explicite et déclarée par le foyer** à la règle « une quantité inconnue n'est
jamais comptée comme disponible » : épices, herbes, condiments, huiles et quelques produits de
base (`ingredients.is_staple`) se cochent simplement dans le placard (`household_staples`).
Ils comptent comme présents (fiche recette, couverture du générateur, liste de courses) mais
n'ont pas de quantité et ne sont jamais décomptés du stock. Un produit à quantité (beurre,
crème…) est refusé par la base (`AP422`) et reste géré au garde-manger.
