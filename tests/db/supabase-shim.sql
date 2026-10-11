-- Reproduction MINIMALE de l'environnement Supabase pour exécuter les migrations
-- et les tests RLS sur un PostgreSQL nu (CI sans Docker, banc local).
-- N'est JAMAIS appliqué sur un projet Supabase : il y existe déjà.
-- Reproduit : rôles API, schéma auth (users, uid(), jwt()), schéma extensions,
-- privilèges par défaut accordés par Supabase sur le schéma public.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end;
$$;

create schema if not exists extensions;
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Même lecture des claims que Supabase (request.jwt.claim.sub puis request.jwt.claims).
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

grant usage on schema auth, extensions, public to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.jwt() to anon, authenticated, service_role;
grant all on auth.users to service_role;

-- Supabase accorde par défaut tous les privilèges sur les objets créés dans public :
-- les migrations doivent donc révoquer explicitement ce qui ne doit pas être ouvert.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
