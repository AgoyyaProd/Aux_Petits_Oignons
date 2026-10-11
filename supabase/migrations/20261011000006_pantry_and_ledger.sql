-- 0006 — Garde-manger et registre des mouvements de stock.
--
-- Principe : stock_movements est un REGISTRE append-only. pantry_items.quantity_base
-- en est un cache, maintenu dans la même transaction par les fonctions de 0007.
-- Aucune écriture client directe : lecture seule, toute mutation passe par une fonction.

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id),
  location public.storage_loc not null,
  -- NULL = quantité inconnue : affichée, jamais comptée comme disponible.
  quantity_base numeric(12,3) check (quantity_base >= 0),
  dimension public.dimension not null,
  -- Unité de saisie conservée pour l'affichage ; même dimension que le stock.
  display_unit text not null references public.units (code),
  expires_on date,
  expiry_kind public.expiry_kind,
  opened_at date,
  status public.item_status not null default 'active',
  -- Verrou optimiste : incrémenté à chaque modification.
  version integer not null default 1 check (version >= 1),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((expires_on is null) = (expiry_kind is null))
);
create index pantry_items_household_status_idx
  on public.pantry_items (household_id, status, expires_on);
create index pantry_items_household_ingredient_idx
  on public.pantry_items (household_id, ingredient_id);
create index pantry_items_ingredient_idx on public.pantry_items (ingredient_id);

create trigger pantry_items_set_updated_at
  before update on public.pantry_items
  for each row execute function public.set_updated_at();

-- Une opération = une action utilisateur (un clic), éventuellement plusieurs mouvements.
-- La clé d'idempotence, générée par le client, rend un nouvel essai sans effet.
create table public.stock_operations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  idempotency_key uuid not null,
  kind public.movement_kind not null,
  source_table text check (source_table in ('pantry_items', 'shopping_items', 'planned_meals')),
  source_id uuid,
  -- Résultat renvoyé à l'identique si la même clé est rejouée.
  result jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (household_id, idempotency_key)
);

create table public.stock_movements (
  id bigint generated always as identity primary key,
  operation_id uuid not null references public.stock_operations (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  -- Pas de cascade depuis le produit : supprimer un produit qui a un historique est refusé.
  -- NO ACTION (vérifié en fin d'instruction) laisse passer la suppression d'un foyer entier,
  -- où produits et mouvements disparaissent dans la même cascade.
  pantry_item_id uuid not null references public.pantry_items (id) on delete no action,
  ingredient_id uuid not null references public.ingredients (id),
  kind public.movement_kind not null,
  -- NULL quand la quantité précédente était inconnue.
  delta_base numeric(12,3),
  quantity_after_base numeric(12,3) check (quantity_after_base >= 0),
  note text check (note is null or char_length(note) <= 280),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index stock_movements_household_created_idx
  on public.stock_movements (household_id, created_at desc);
create index stock_movements_item_idx on public.stock_movements (pantry_item_id);
create index stock_movements_operation_idx on public.stock_movements (operation_id);

-- Le registre est immuable, y compris pour le rôle propriétaire hors suppression de foyer.
create function public.stock_movements_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Le registre des mouvements de stock est en ajout seul.' using errcode = '42501';
end;
$$;

create trigger stock_movements_no_update
  before update on public.stock_movements
  for each row execute function public.stock_movements_immutable();

revoke execute on function public.stock_movements_immutable() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Privilèges et RLS : lecture seule pour les membres du foyer.
-- ---------------------------------------------------------------------------
revoke all on public.pantry_items, public.stock_operations, public.stock_movements
  from anon, authenticated;
grant select on public.pantry_items, public.stock_operations, public.stock_movements
  to authenticated;

alter table public.pantry_items enable row level security;
alter table public.stock_operations enable row level security;
alter table public.stock_movements enable row level security;

create policy pantry_items_select_member on public.pantry_items
  for select to authenticated
  using (household_id in (select public.my_household_ids()));
create policy stock_operations_select_member on public.stock_operations
  for select to authenticated
  using (household_id in (select public.my_household_ids()));
create policy stock_movements_select_member on public.stock_movements
  for select to authenticated
  using (household_id in (select public.my_household_ids()));
