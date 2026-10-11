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
