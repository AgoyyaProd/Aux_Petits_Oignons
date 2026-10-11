# ADR 0001 — Décisions initiales du MVP

Date : 2026-10-11 · Statut : accepté (propositions par défaut du dossier d'architecture)

| N°  | Sujet                          | Décision                                                                                           | Révisable à faible coût ? |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------- |
| D1  | Foyers multiples               | Schéma multi-foyers (`household_members`), interface mono-foyer via `profiles.active_household_id` | Oui                       |
| D2  | Créneaux de repas              | Déjeuner et dîner affichés ; `breakfast` existe dans l'énumération                                 | Oui                       |
| D3  | Réservations de stock          | Calculées à la volée (allocation chronologique), pas de table dédiée                               | Moyen                     |
| D4  | Validation du catalogue public | Table `app_admins`, aucune écriture client sur le référentiel                                      | Oui                       |
| D5  | Fournisseur IA                 | Claude (API Anthropic), appelé uniquement côté serveur                                             | Oui (interface isolée)    |
| D6  | Connexion                      | E-mail + mot de passe et lien magique ; OAuth reporté                                              | Oui                       |
| D7  | Recettes de démonstration      | Rédigées pour le projet, pas copiées de sites tiers                                                | —                         |
| D8  | « À consommer en priorité »    | DLC à 3 jours ou moins, ou produit ouvert                                                          | Oui                       |

## Écarts par rapport au dossier d'architecture

- **Tests de base de données en Vitest + `pg` plutôt qu'en pgTAP.** Un seul outil de test,
  et les mêmes tests tournent sur Supabase local (Docker) ou sur un PostgreSQL nu (CI).
  Ils jouent les rôles `authenticated` / `anon` avec un JWT simulé, comme l'API.
- **`proxy.ts` au lieu de `middleware.ts`** : renommage introduit par Next.js 16.
- **Cache Components (Next.js 16)** : toute lecture de session se fait derrière une
  frontière `<Suspense>` ; aucune donnée de foyer n'est mise en cache côté serveur
  (`use cache`) au MVP, pour éviter tout risque de fuite entre foyers.
- **shadcn/ui reporté** à la phase 2 : trois primitives suffisent pour l'authentification.
- **Normalisation des alias** : minuscules, sans accents ni ponctuation ; les pluriels
  sont des alias explicites plutôt qu'une heuristique.
