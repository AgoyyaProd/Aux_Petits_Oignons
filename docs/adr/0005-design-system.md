# ADR 0005 — Design system et refonte de l'interface

## Contexte

Brief de direction artistique : marque chaleureuse et contemporaine (« La cuisine du
quotidien, bien pensée »), ni SaaS générique ni épicerie rustique, mobile d'abord pour
l'usage quotidien, installable.

## Décisions

- **Jetons centralisés** dans `src/app/globals.css` (clair et sombre) : vert forêt
  `#0E3B2E` (structure, action principale), terracotta `#E76F51` (attention ; sa version
  foncée `#B0472C` porte le texte blanc pour respecter le contraste AA), ocre `#F4C145`
  (repères), sauge `#8FA486` (végétal, positif), pêche `#F7D7CB` (surfaces douces), crème
  `#FFF8ED` (fond). Rayons, ombres et échelle typographique (`type-display`, `type-page`,
  `type-section`, `type-card`, `type-meta`) au même endroit.
- **Polices auto-hébergées** (`@fontsource-variable`) : Fraunces pour les titres d'écran,
  Plus Jakarta Sans pour l'interface. Pas de dépendance réseau au build.
- **Logo vectoriel** (`components/brand/logo.tsx`) : feuille, cercle, demi-bol ; versions
  principale, compacte et monochrome, remplaçable par le logo définitif. Icônes d'appli
  générées à partir du même tracé (`public/icons`, `public/icon.svg`).
- **Navigation** : barre latérale vert forêt sur ordinateur (lg), barre d'onglets en bas sur
  téléphone et tablette ; mêmes rubriques, même ordre.
- **Appli installable** (manifeste `app/manifest.ts`). Pas encore de mode hors ligne.
- **Photographies** : aucune photo n'est disponible et aucune image ne doit contredire la
  recette. `RecipeVisual` compose un visuel géométrique (langage du logo) selon la famille du
  plat ; il accepte une `imageUrl` pour les vraies photos.
- **Limites affichées, jamais simulées** : pas de difficulté ni de valeurs nutritionnelles
  (pas de données fiables) ; le budget distingue objectif et estimations et indique que les
  dépenses réelles ne sont pas suivies.
- **Galerie** `/apercu` : composants avec données de démonstration, construite seulement si
  `DESIGN_PREVIEW=1` (404 en production).

## Révision — charte fournie par le foyer (11 octobre)

- Palette exacte de la charte (ocre `#F4B942`, sauge `#8FA88A`, pêche `#FADCC8`, crème
  `#FBF7EF`) ; textes en **Inter**, titres en Fraunces.
- Logo : feuille sauge à nervure, rond ocre, demi-bol **terracotta** ; nom sur trois lignes.
- Boutons : action principale terracotta avec flèche (terracotta foncé `#C2502F` pour garder
  un contraste AA avec le texte blanc), actions de structure en vert forêt plein.
- Navigation : barre horizontale en haut sur ordinateur ; cinq onglets en bas sur téléphone
  (Accueil, Recettes, Menu, Liste, Profil), garde-manger, budget et prix accessibles depuis
  le profil et l'accueil.
- Difficulté calculée par une règle fixe et affichée comme telle (`domain/recipes/difficulty`).
- Fiche ingrédient sans vente (`/ingredients/[id]`) : prix indicatif, stock, recettes.
- Ajouts manuels à la liste de courses (migration 0021) : « + » par ingrédient, « Tout
  ajouter », ajout libre, « Tout cocher », export ; jamais fusionnés avec la liste calculée.
- Pas de photos : visuels de remplacement aux formes du logo (choix du foyer).
