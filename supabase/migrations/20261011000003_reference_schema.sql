-- 0003 — Référentiel partagé : unités, régimes, allergènes, ingrédients et alias.
-- Lecture : tout utilisateur connecté. Écriture : administrateurs (app_admins) uniquement.
-- Le vocabulaire fixe (unités, régimes, allergènes) est inséré ici : il est requis
-- en production, contrairement au seed qui ne sert qu'en local.

-- ===========================================================================
-- Unités : facteur ENTIER vers l'unité de base de la dimension (g, ml, pièce).
-- ===========================================================================
create table public.units (
  code text primary key check (code ~ '^[a-z]+$'),
  label text not null,
  dimension public.dimension not null,
  to_base integer not null check (to_base > 0),
  sort_order smallint not null default 0
);

insert into public.units (code, label, dimension, to_base, sort_order) values
  ('g',     'g',            'mass',   1,    10),
  ('kg',    'kg',           'mass',   1000, 20),
  ('ml',    'ml',           'volume', 1,    30),
  ('cl',    'cl',           'volume', 10,   40),
  ('l',     'l',            'volume', 1000, 50),
  ('tsp',   'c. à café',    'volume', 5,    60),
  ('tbsp',  'c. à soupe',   'volume', 15,   70),
  ('piece', 'pièce',        'count',  1,    80);

-- ===========================================================================
-- Régimes et allergènes (tables de codes).
-- ===========================================================================
create table public.diets (
  code text primary key check (code ~ '^[a-z_]+$'),
  label text not null
);

insert into public.diets (code, label) values
  ('vegetarian',  'Végétarien'),
  ('vegan',       'Végétalien'),
  ('pescetarian', 'Pescétarien'),
  ('no_pork',     'Sans porc');

create table public.allergens (
  code text primary key check (code ~ '^[a-z_]+$'),
  label text not null
);

-- Les 14 allergènes à déclaration obligatoire (règlement UE 1169/2011, annexe II).
insert into public.allergens (code, label) values
  ('gluten',      'Céréales contenant du gluten'),
  ('crustaceans', 'Crustacés'),
  ('eggs',        'Œufs'),
  ('fish',        'Poissons'),
  ('peanuts',     'Arachides'),
  ('soy',         'Soja'),
  ('milk',        'Lait'),
  ('tree_nuts',   'Fruits à coque'),
  ('celery',      'Céleri'),
  ('mustard',     'Moutarde'),
  ('sesame',      'Graines de sésame'),
  ('sulphites',   'Anhydride sulfureux et sulfites'),
  ('lupin',       'Lupin'),
  ('molluscs',    'Mollusques');

-- ===========================================================================
-- Ingrédients
-- ===========================================================================
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  category text not null check (category in (
    'fruits', 'legumes', 'feculents', 'legumineuses', 'viandes', 'poissons',
    'oeufs_laitiers', 'fromages', 'epicerie_salee', 'epicerie_sucree',
    'condiments', 'epices_herbes', 'matieres_grasses', 'boissons'
  )),
  default_dimension public.dimension not null,
  -- Conversions propres à l'ingrédient. NULL = conversion interdite.
  density_g_per_ml numeric(6,3) check (density_g_per_ml > 0 and density_g_per_ml < 25),
  piece_weight_g numeric(8,2) check (piece_weight_g > 0 and piece_weight_g < 20000),
  default_shelf_life_days smallint check (default_shelf_life_days between 1 and 3650),
  is_validated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index ingredients_category_idx on public.ingredients (category);

create trigger ingredients_set_updated_at
  before update on public.ingredients
  for each row execute function public.set_updated_at();

-- Alias normalisés : « Pommes de terre », « pdt », « patate » -> même ingrédient.
-- La contrainte garantit qu'aucun alias non normalisé ne peut être stocké.
create table public.ingredient_aliases (
  alias_normalized text primary key
    check (alias_normalized = public.normalize_alias(alias_normalized)),
  ingredient_id uuid not null references public.ingredients (id) on delete cascade
);
create index ingredient_aliases_ingredient_idx on public.ingredient_aliases (ingredient_id);

create table public.ingredient_allergens (
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  allergen_code text not null references public.allergens (code),
  primary key (ingredient_id, allergen_code)
);
create index ingredient_allergens_allergen_idx on public.ingredient_allergens (allergen_code);

-- Ingrédient incompatible avec un régime (ex. poulet / vegetarian).
create table public.ingredient_diet_conflicts (
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  diet_code text not null references public.diets (code),
  primary key (ingredient_id, diet_code)
);
create index ingredient_diet_conflicts_diet_idx on public.ingredient_diet_conflicts (diet_code);

-- Le nom d'un ingrédient est toujours un de ses alias.
create function public.ingredients_add_name_alias()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.ingredient_aliases (alias_normalized, ingredient_id)
  values (public.normalize_alias(new.name), new.id)
  on conflict (alias_normalized) do nothing;
  return new;
end;
$$;

create trigger ingredients_name_alias
  after insert or update of name on public.ingredients
  for each row execute function public.ingredients_add_name_alias();

-- Résolution d'un libellé libre (saisie, réponse IA) vers un ingrédient connu.
-- Renvoie NULL si inconnu : l'appelant doit alors demander une validation.
create function public.resolve_ingredient(p_label text)
returns uuid
language sql
stable
set search_path = ''
as $$
  select a.ingredient_id
  from public.ingredient_aliases a
  where a.alias_normalized = public.normalize_alias(p_label);
$$;

revoke execute on function public.ingredients_add_name_alias() from public, anon, authenticated;
revoke execute on function public.resolve_ingredient(text) from public, anon;
grant execute on function public.resolve_ingredient(text) to authenticated;

-- ===========================================================================
-- Privilèges et RLS : lecture pour les connectés, écriture pour les admins.
-- ===========================================================================
revoke all on public.units, public.diets, public.allergens, public.ingredients,
  public.ingredient_aliases, public.ingredient_allergens, public.ingredient_diet_conflicts
  from anon, authenticated;

grant select on public.units, public.diets, public.allergens to authenticated;
grant select, insert, update, delete on public.ingredients, public.ingredient_aliases,
  public.ingredient_allergens, public.ingredient_diet_conflicts to authenticated;

alter table public.units enable row level security;
alter table public.diets enable row level security;
alter table public.allergens enable row level security;
alter table public.ingredients enable row level security;
alter table public.ingredient_aliases enable row level security;
alter table public.ingredient_allergens enable row level security;
alter table public.ingredient_diet_conflicts enable row level security;

create policy units_read on public.units for select to authenticated using (true);
create policy diets_read on public.diets for select to authenticated using (true);
create policy allergens_read on public.allergens for select to authenticated using (true);

-- Une politique de lecture et une d'écriture par table éditable.
create policy ingredients_read on public.ingredients
  for select to authenticated using (true);
create policy ingredients_admin_write on public.ingredients
  for all to authenticated
  using ((select public.is_app_admin())) with check ((select public.is_app_admin()));

create policy aliases_read on public.ingredient_aliases
  for select to authenticated using (true);
create policy aliases_admin_write on public.ingredient_aliases
  for all to authenticated
  using ((select public.is_app_admin())) with check ((select public.is_app_admin()));

create policy ing_allergens_read on public.ingredient_allergens
  for select to authenticated using (true);
create policy ing_allergens_admin_write on public.ingredient_allergens
  for all to authenticated
  using ((select public.is_app_admin())) with check ((select public.is_app_admin()));

create policy ing_diets_read on public.ingredient_diet_conflicts
  for select to authenticated using (true);
create policy ing_diets_admin_write on public.ingredient_diet_conflicts
  for all to authenticated
  using ((select public.is_app_admin())) with check ((select public.is_app_admin()));
