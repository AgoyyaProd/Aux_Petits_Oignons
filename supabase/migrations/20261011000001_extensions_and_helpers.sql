-- 0001 — Extensions, types énumérés et fonctions utilitaires.
-- Ne jamais modifier une migration appliquée : en ajouter une nouvelle.

-- Supabase installe les extensions dans le schéma `extensions`.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Types énumérés (tous déclarés ici pour figer le vocabulaire du domaine)
-- ---------------------------------------------------------------------------
create type public.dimension as enum ('mass', 'volume', 'count');          -- base : g, ml, pièce
create type public.member_role as enum ('owner', 'member');
create type public.storage_loc as enum ('pantry', 'fridge', 'freezer');
create type public.expiry_kind as enum ('use_by', 'best_before');          -- DLC / DDM
create type public.item_status as enum ('active', 'depleted', 'discarded');
create type public.movement_kind as enum (
  'initial', 'purchase', 'consumption', 'cooking', 'correction', 'loss', 'leftover'
);
create type public.recipe_status as enum ('draft', 'published', 'rejected');
create type public.recipe_source as enum ('curated', 'ai', 'user');
create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner');
create type public.meal_status as enum ('planned', 'cooked', 'skipped');
create type public.list_status as enum ('draft', 'active', 'completed', 'archived');
create type public.price_kind as enum ('estimated', 'paid');

-- ---------------------------------------------------------------------------
-- Horodatage automatique de updated_at
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Normalisation des alias d'ingrédients :
-- minuscules, sans accents, espaces et ponctuation réduits.
-- « Pommes  de Terre » -> « pommes de terre ».
-- Les pluriels sont gérés par des alias explicites, pas par une heuristique.
-- ---------------------------------------------------------------------------
create function public.normalize_alias(input text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select nullif(
    btrim(
      regexp_replace(
        lower(extensions.unaccent('extensions.unaccent'::regdictionary, input)),
        '[^a-z0-9]+', ' ', 'g'
      )
    ),
    ''
  );
$$;

-- Fonctions utilitaires exposées : pas d'accès anonyme.
revoke execute on function public.set_updated_at() from public, anon;
revoke execute on function public.normalize_alias(text) from public, anon;
grant execute on function public.normalize_alias(text) to authenticated, service_role;
