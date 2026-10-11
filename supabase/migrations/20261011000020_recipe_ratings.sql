-- 0020 — Avis du foyer sur les recettes : « on aime » (favori) ou « pas pour nous ».
--
-- Un avis par foyer et par recette, partagé par tous les membres. Pas d'avis = neutre.
-- Le générateur favorise les favoris et ne propose jamais un plat « pas pour nous ».
-- L'historique (plats des semaines précédentes) se lit dans les menus : pas de table dédiée.

create table public.recipe_ratings (
  household_id uuid not null references public.households (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  rating smallint not null check (rating in (-1, 1)),
  rated_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (household_id, recipe_id)
);
create index recipe_ratings_recipe_idx on public.recipe_ratings (recipe_id);
create index recipe_ratings_rated_by_idx on public.recipe_ratings (rated_by);

-- Auteur et date toujours posés par la base (pas par le client).
create function public.recipe_ratings_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.rated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

create trigger recipe_ratings_stamp
  before insert or update on public.recipe_ratings
  for each row execute function public.recipe_ratings_stamp();

revoke all on public.recipe_ratings from anon, authenticated;
grant select, insert, delete on public.recipe_ratings to authenticated;
-- Colonnes de l'upsert (insert … on conflict do update) ; la politique garde le foyer.
grant update (household_id, recipe_id, rating) on public.recipe_ratings to authenticated;

alter table public.recipe_ratings enable row level security;

-- Membres du foyer ; on ne note qu'une recette que le foyer peut voir (RLS des recettes).
create policy recipe_ratings_member on public.recipe_ratings
  for all to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (
    household_id in (select public.my_household_ids())
    and exists (select 1 from public.recipes r where r.id = recipe_id)
  );
