# Tests de base de données

Ils vérifient les migrations, la RLS et les fonctions SQL en se connectant
réellement à PostgreSQL, avec les rôles `authenticated` / `anon` et un JWT simulé,
comme le fait l'API Supabase.

## Avec Supabase local (recommandé, nécessite Docker)

```bash
npm run db:start      # démarre la stack Supabase
npm run db:reset      # applique migrations + seed
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test:db
```

## Sans Docker (banc PostgreSQL nu, utilisé en CI)

```bash
TEST_DB_MODE=bench DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres npm run test:db
```

Le mode `bench` recrée une base jetable `meal_test`, applique `supabase-shim.sql`
(rôles et schéma `auth` minimal) puis toutes les migrations dans l'ordre.

## Écrire un test

- `createUser("alice")` crée un utilisateur ; le trigger d'inscription lui donne un foyer.
- `asUser(alice, db => …)` exécute des requêtes avec ses droits, dans une transaction annulée.
- Une requête refusée par PostgreSQL : `expectPgError(...)` renvoie le code SQLSTATE.
- Une requête filtrée par la RLS ne lève pas d'erreur : elle touche 0 ligne. Testez `rowCount`.
