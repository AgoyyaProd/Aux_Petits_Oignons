# Garde-manger

Application de planification des repas à partir du stock du foyer : inventaire,
planning hebdomadaire, liste de courses calculée, suivi du budget.

Stack : Next.js 16 (App Router, Cache Components) · TypeScript strict · Tailwind CSS 4 ·
Supabase (PostgreSQL, Auth, RLS) · Zod · Vitest.

## Démarrer en local

Prérequis : Node.js 22+, Docker (pour Supabase local).

```bash
npm install
cp .env.example .env.local
npm run db:start          # démarre Supabase ; affiche l'URL et les clés
# reporter « anon key » dans NEXT_PUBLIC_SUPABASE_ANON_KEY de .env.local
npm run db:reset          # applique migrations et seed
npm run dev               # http://localhost:3000
```

Les e-mails locaux (confirmation, lien magique) arrivent dans Mailpit : http://127.0.0.1:54324.

## Vérifier

| Commande           | Rôle                                                         |
| ------------------ | ------------------------------------------------------------ |
| `npm run check`    | lint + types + format + tests unitaires                      |
| `npm test`         | tests unitaires (domaine, validation), sans base             |
| `npm run test:db`  | migrations, RLS et fonctions SQL (voir `tests/db/README.md`) |
| `npm run build`    | build de production                                          |
| `npm run db:types` | régénère `src/types/database.ts` après une migration         |

## Organisation

```
src/app/            routes : (auth) publiques, (app) protégées, auth/callback
src/components/     ui/ (primitives accessibles), composants par fonctionnalité
src/domain/         règles métier pures (unités, besoins, courses) — sans I/O
src/server/         clients Supabase, modules métier (schema, actions, service)
src/proxy.ts        rafraîchit la session, redirige les visiteurs non connectés
supabase/           config, migrations versionnées, seed
tests/unit|db       Vitest
docs/adr/           décisions d'architecture
```

## Règles de sécurité

- La protection des données est assurée par la RLS PostgreSQL, testée dans `tests/db`.
  Le proxy et l'interface ne sont qu'un confort de navigation.
- Le client `service_role` (`src/server/supabase/admin.ts`) est interdit dans le code
  applicatif par une règle ESLint.
- Aucune clé secrète dans une variable `NEXT_PUBLIC_*`.
- Une migration appliquée n'est jamais modifiée : on en ajoute une nouvelle.
