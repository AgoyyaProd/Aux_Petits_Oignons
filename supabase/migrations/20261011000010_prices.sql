-- 0010 — Prix : prix indicatifs (Open Prices), prix du foyer, magasin de référence.
--
-- Règle : aucun prix n'est inventé. Un prix vient soit d'une source citée
-- (relevés Open Prices agrégés, avec taille d'échantillon et période),
-- soit d'une saisie du foyer. Sans prix, l'ingrédient est signalé « sans prix ».
--
-- Un prix est exprimé en centimes par quantité de référence de sa dimension :
-- par kilogramme (masse), par litre (volume) ou par pièce (comptage).

alter table public.households
  add column reference_store text
    check (reference_store is null or char_length(btrim(reference_store)) between 1 and 60);
-- Même règle que les autres réglages du foyer : la RLS réserve la mise à jour au propriétaire.
grant update (reference_store) on public.households to authenticated;

-- ---------------------------------------------------------------------------
-- Correspondance ingrédient -> catégories Open Prices (données de référence).
-- ---------------------------------------------------------------------------
create table public.ingredient_price_sources (
  ingredient_id uuid primary key references public.ingredients (id) on delete cascade,
  -- raw : produits bruts (prix au kg ou à la pièce) ; product : produits emballés de la
  -- catégorie ; free : sans coût (eau du robinet) ; none : pas de catégorie fiable.
  kind text not null check (kind in ('raw', 'product', 'free', 'none')),
  tags text[] not null default '{}',
  -- Catégorie approchante (ex. chou rouge -> choux) : affichée comme telle.
  approximate boolean not null default false,
  updated_at timestamptz not null default now(),
  check ((kind in ('raw', 'product')) = (cardinality(tags) > 0)),
  check (cardinality(tags) <= 5)
);

create trigger ingredient_price_sources_set_updated_at
  before update on public.ingredient_price_sources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Prix indicatif agrégé par ingrédient (médiane robuste des relevés récents).
-- ---------------------------------------------------------------------------
create table public.reference_prices (
  ingredient_id uuid primary key references public.ingredients (id) on delete cascade,
  source text not null check (source in ('open_prices', 'free')),
  dimension public.dimension not null,
  cents_per_ref integer not null check (cents_per_ref between 0 and 999999),
  sample_size integer not null check (sample_size >= 0),
  observed_from date,
  observed_to date,
  computed_at timestamptz not null default now(),
  check (source = 'free' or (sample_size > 0 and observed_from is not null
    and observed_to is not null and observed_from <= observed_to))
);

-- Journal des synchronisations (traçabilité et taux de couverture).
create table public.price_sync_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  ingredients_total integer check (ingredients_total >= 0),
  ingredients_priced integer check (ingredients_priced >= 0),
  -- Par ingrédient : relevés reçus, retenus, raison d'un échec. Aucune donnée personnelle.
  details jsonb not null default '{}'::jsonb,
  started_by uuid references auth.users (id) on delete set null
);
create index price_sync_runs_started_idx on public.price_sync_runs (started_at desc);

-- ---------------------------------------------------------------------------
-- Prix saisis par le foyer : ils remplacent le prix indicatif de l'ingrédient.
-- ---------------------------------------------------------------------------
create table public.household_prices (
  household_id uuid not null references public.households (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  dimension public.dimension not null,
  cents_per_ref integer not null check (cents_per_ref between 1 and 999999),
  store_label text check (store_label is null or char_length(btrim(store_label)) between 1 and 60),
  source_url text check (source_url is null or (source_url ~ '^https://' and char_length(source_url) <= 500)),
  observed_on date not null default current_date,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, ingredient_id)
);
create index household_prices_ingredient_idx on public.household_prices (ingredient_id);

create trigger household_prices_set_updated_at
  before update on public.household_prices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Privilèges et RLS
-- ---------------------------------------------------------------------------
revoke all on public.ingredient_price_sources, public.reference_prices,
  public.price_sync_runs, public.household_prices from anon, authenticated;

grant select, insert, update, delete on public.ingredient_price_sources,
  public.reference_prices, public.price_sync_runs to authenticated;
grant select, insert, update, delete on public.household_prices to authenticated;

alter table public.ingredient_price_sources enable row level security;
alter table public.reference_prices enable row level security;
alter table public.price_sync_runs enable row level security;
alter table public.household_prices enable row level security;

create policy price_sources_read on public.ingredient_price_sources
  for select to authenticated using (true);
create policy price_sources_admin_write on public.ingredient_price_sources
  for all to authenticated
  using ((select public.is_app_admin())) with check ((select public.is_app_admin()));

create policy reference_prices_read on public.reference_prices
  for select to authenticated using (true);
create policy reference_prices_admin_write on public.reference_prices
  for all to authenticated
  using ((select public.is_app_admin())) with check ((select public.is_app_admin()));

-- Journal réservé aux administrateurs (il nomme qui a lancé la synchronisation).
create policy price_sync_runs_admin on public.price_sync_runs
  for all to authenticated
  using ((select public.is_app_admin())) with check ((select public.is_app_admin()));

create policy household_prices_member on public.household_prices
  for all to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));
