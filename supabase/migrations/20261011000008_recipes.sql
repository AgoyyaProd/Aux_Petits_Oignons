-- 0008 — Catalogue de recettes : recettes, ingrédients, étapes, traçabilité IA.
--
-- Visibilité : recettes publiées du catalogue public (household_id NULL) pour tout
-- utilisateur connecté ; recettes privées d'un foyer (futures suggestions IA acceptées)
-- pour ses seuls membres ; brouillons et rejetées du catalogue public pour les admins.
-- Écriture : administrateurs uniquement à ce stade (les recettes privées viendront en phase 6).

-- ===========================================================================
-- Traçabilité des appels IA (phase 6) : créée maintenant car une recette « ai »
-- doit toujours pointer vers la génération qui l'a produite.
-- ===========================================================================
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  requested_by uuid references auth.users (id) on delete set null,
  model text not null,
  request_payload jsonb not null,                 -- données minimisées réellement envoyées
  response_payload jsonb,
  validation_status text not null
    check (validation_status in ('valid', 'needs_review', 'rejected', 'error')),
  validation_errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index ai_generations_household_idx on public.ai_generations (household_id, created_at desc);

-- ===========================================================================
-- Recettes
-- ===========================================================================
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references public.households (id) on delete cascade,  -- NULL = catalogue public
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text check (description is null or char_length(description) <= 500),
  image_path text,
  servings smallint not null check (servings between 1 and 20),
  prep_minutes smallint not null check (prep_minutes between 0 and 600),
  cook_minutes smallint not null default 0 check (cook_minutes between 0 and 1440),
  tags text[] not null default '{}',
  status public.recipe_status not null default 'draft',
  source public.recipe_source not null,
  source_ref text,
  ai_generation_id uuid references public.ai_generations (id) on delete set null,
  validated_by uuid references auth.users (id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Une recette issue de l'IA reste rattachée à un foyer : jamais publiée telle quelle.
  check (source <> 'ai' or household_id is not null),
  -- Une recette publiée du catalogue public a été validée.
  check (status <> 'published' or household_id is not null or validated_at is not null)
);
create index recipes_public_status_idx on public.recipes (status) where household_id is null;
create index recipes_household_idx on public.recipes (household_id) where household_id is not null;
create index recipes_tags_idx on public.recipes using gin (tags);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Ingrédients d'une recette (quantités pour `recipes.servings` portions)
-- ===========================================================================
create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id),
  quantity numeric(10,3) check (quantity > 0),
  unit_code text references public.units (code),
  -- Calculés par trigger : jamais saisis à la main.
  quantity_base numeric(12,3),
  dimension public.dimension,
  is_optional boolean not null default false,
  preparation_note text check (preparation_note is null or char_length(preparation_note) <= 120),
  position smallint not null check (position >= 0),
  unique (recipe_id, ingredient_id),
  -- Seul un ingrédient facultatif (« sel, au goût ») peut ne pas avoir de quantité.
  check ((quantity is null) = (unit_code is null)),
  check (is_optional or quantity is not null)
);
create index recipe_ingredients_ingredient_idx on public.recipe_ingredients (ingredient_id);

-- Calcule quantité de base et dimension, et refuse une unité que l'ingrédient ne permet
-- pas de rapprocher du stock (ex. « 1 pièce » de riz : aucun poids unitaire connu).
create function public.recipe_ingredients_compute()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_unit public.units%rowtype;
  v_ing public.ingredients%rowtype;
  v_ok boolean;
begin
  if new.quantity is null then
    new.quantity_base := null;
    new.dimension := null;
    return new;
  end if;

  select * into v_unit from public.units u where u.code = new.unit_code;
  select * into v_ing from public.ingredients i where i.id = new.ingredient_id;

  v_ok := v_unit.dimension = v_ing.default_dimension
    or (v_unit.dimension in ('mass', 'volume') and v_ing.default_dimension in ('mass', 'volume')
        and v_ing.density_g_per_ml is not null)
    or (v_unit.dimension in ('mass', 'count') and v_ing.default_dimension in ('mass', 'count')
        and v_ing.piece_weight_g is not null)
    or (v_unit.dimension in ('volume', 'count') and v_ing.default_dimension in ('volume', 'count')
        and v_ing.piece_weight_g is not null and v_ing.density_g_per_ml is not null);

  if not v_ok then
    raise exception 'Unité « % » incompatible avec l''ingrédient « % » (aucune conversion connue).',
      v_unit.code, v_ing.name using errcode = 'AP422';
  end if;

  new.dimension := v_unit.dimension;
  new.quantity_base := new.quantity * v_unit.to_base;
  return new;
end;
$$;

create trigger recipe_ingredients_compute
  before insert or update on public.recipe_ingredients
  for each row execute function public.recipe_ingredients_compute();

create table public.recipe_steps (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position smallint not null check (position >= 1),
  instruction text not null check (char_length(btrim(instruction)) between 3 and 1000),
  primary key (recipe_id, position)
);

-- ===========================================================================
-- Allergènes et incompatibilités de régime déduits des ingrédients.
-- Les ingrédients facultatifs sont inclus : pour une allergie, le doute exclut.
-- security_invoker : la RLS des tables sous-jacentes s'applique à l'appelant.
-- ===========================================================================
create view public.recipe_allergens with (security_invoker = true) as
select distinct ri.recipe_id, ia.allergen_code
from public.recipe_ingredients ri
join public.ingredient_allergens ia on ia.ingredient_id = ri.ingredient_id;

create view public.recipe_diet_conflicts with (security_invoker = true) as
select distinct ri.recipe_id, idc.diet_code
from public.recipe_ingredients ri
join public.ingredient_diet_conflicts idc on idc.ingredient_id = ri.ingredient_id;

revoke execute on function public.recipe_ingredients_compute() from public, anon, authenticated;

-- ===========================================================================
-- Privilèges et RLS
-- ===========================================================================
revoke all on public.ai_generations, public.recipes, public.recipe_ingredients,
  public.recipe_steps, public.recipe_allergens, public.recipe_diet_conflicts
  from anon, authenticated;

grant select on public.ai_generations to authenticated;
grant select, insert, update, delete on public.recipes, public.recipe_ingredients,
  public.recipe_steps to authenticated;
grant select on public.recipe_allergens, public.recipe_diet_conflicts to authenticated;

alter table public.ai_generations enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;

create policy ai_generations_select_member on public.ai_generations
  for select to authenticated
  using (household_id in (select public.my_household_ids()));

create policy recipes_select on public.recipes
  for select to authenticated
  using (
    (household_id is null and status = 'published')
    or household_id in (select public.my_household_ids())
    or (select public.is_app_admin())
  );
create policy recipes_admin_write on public.recipes
  for all to authenticated
  using ((select public.is_app_admin()) and household_id is null)
  with check ((select public.is_app_admin()) and household_id is null);

-- Les lignes enfants suivent la visibilité de leur recette (sous-requête soumise à sa RLS).
create policy recipe_ingredients_select on public.recipe_ingredients
  for select to authenticated
  using (recipe_id in (select r.id from public.recipes r));
create policy recipe_ingredients_admin_write on public.recipe_ingredients
  for all to authenticated
  using ((select public.is_app_admin())) with check ((select public.is_app_admin()));

create policy recipe_steps_select on public.recipe_steps
  for select to authenticated
  using (recipe_id in (select r.id from public.recipes r));
create policy recipe_steps_admin_write on public.recipe_steps
  for all to authenticated
  using ((select public.is_app_admin())) with check ((select public.is_app_admin()));
