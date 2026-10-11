-- 0015 — Liste de courses : coches pendant les courses et rangement au garde-manger.
--
-- La liste elle-même n'est pas stockée : elle est recalculée à partir du menu de la semaine,
-- du stock et du placard (calcul pur, ADR 0002). On conserve seulement :
--   - les coches « dans le panier » (partagées entre les membres du foyer) ;
--   - le rangement des achats, fait par shopping_put_away en UNE opération atomique et
--     idempotente, tracée dans le registre de stock (mouvements « purchase »).

create table public.shopping_checks (
  household_id uuid not null references public.households (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  dimension public.dimension not null,
  checked_by uuid default auth.uid() references auth.users (id) on delete set null,
  checked_at timestamptz not null default now(),
  primary key (household_id, week_start, ingredient_id, dimension)
);
create index shopping_checks_ingredient_idx on public.shopping_checks (ingredient_id);

revoke all on public.shopping_checks from anon, authenticated;
grant select, insert, delete on public.shopping_checks to authenticated;
alter table public.shopping_checks enable row level security;

create policy shopping_checks_member on public.shopping_checks
  for all to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));

-- ---------------------------------------------------------------------------
-- Rangement des courses : un produit par ligne achetée, dans une seule opération.
-- p_items : [{"ingredient_id": uuid, "quantity": "1.5", "unit": "kg",
--             "location": "fridge", "expires_on": "2026-10-20" | null,
--             "expiry_kind": "use_by" | "best_before" | null}, ...]
-- Rejouer la même clé renvoie le résultat enregistré sans rien ajouter.
-- ---------------------------------------------------------------------------
create function public.shopping_put_away(
  p_household_id uuid,
  p_items jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_op uuid;
  v_replay jsonb;
  v_item jsonb;
  v_dimension public.dimension;
  v_to_base integer;
  v_quantity numeric;
  v_expires date;
  v_kind public.expiry_kind;
  v_item_id uuid;
  v_ids uuid[] := '{}';
  v_result jsonb;
begin
  if v_uid is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer introuvable.' using errcode = 'AP404';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then
    raise exception 'Entre 1 et 100 produits à ranger.' using errcode = 'AP422';
  end if;

  select o.operation_id, o.replay into v_op, v_replay
  from public._stock_begin_operation(p_household_id, p_idempotency_key, 'purchase') o;
  if v_replay is not null then
    return v_replay;
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item ->> 'ingredient_id', '') !~ '^[0-9a-f-]{36}$'
       or coalesce(v_item ->> 'quantity', '') !~ '^\d{1,7}(\.\d{1,3})?$'
       or coalesce(v_item ->> 'location', '') not in ('pantry', 'fridge', 'freezer')
       or coalesce(v_item ->> 'expiry_kind', 'use_by') not in ('use_by', 'best_before')
       or ((v_item ->> 'expires_on') is null) <> ((v_item ->> 'expiry_kind') is null)
       or coalesce(v_item ->> 'expires_on', '2000-01-01') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'Produit invalide dans la liste.' using errcode = 'AP422';
    end if;

    select u.dimension, u.to_base into v_dimension, v_to_base
    from public.units u where u.code = v_item ->> 'unit';
    if v_dimension is null then
      raise exception 'Unité inconnue.' using errcode = 'AP422';
    end if;
    if not exists (select 1 from public.ingredients i where i.id = (v_item ->> 'ingredient_id')::uuid) then
      raise exception 'Ingrédient inconnu.' using errcode = 'AP422';
    end if;
    v_quantity := (v_item ->> 'quantity')::numeric;
    if v_quantity <= 0 then
      raise exception 'Une quantité achetée doit être positive.' using errcode = 'AP422';
    end if;
    v_expires := (v_item ->> 'expires_on')::date;
    v_kind := (v_item ->> 'expiry_kind')::public.expiry_kind;

    insert into public.pantry_items (
      household_id, ingredient_id, location, quantity_base, dimension, display_unit,
      expires_on, expiry_kind, created_by
    ) values (
      p_household_id, (v_item ->> 'ingredient_id')::uuid,
      (v_item ->> 'location')::public.storage_loc, v_quantity * v_to_base, v_dimension,
      v_item ->> 'unit', v_expires, v_kind, v_uid
    )
    returning id into v_item_id;

    insert into public.stock_movements (
      operation_id, household_id, pantry_item_id, ingredient_id, kind,
      delta_base, quantity_after_base, note, created_by
    ) values (
      v_op, p_household_id, v_item_id, (v_item ->> 'ingredient_id')::uuid, 'purchase',
      v_quantity * v_to_base, v_quantity * v_to_base, 'Courses', v_uid
    );
    v_ids := v_ids || v_item_id;
  end loop;

  v_result := jsonb_build_object('item_ids', to_jsonb(v_ids), 'count', cardinality(v_ids));
  return public._stock_finish_operation(v_op, v_ids[1], v_result);
end;
$$;

revoke execute on function public.shopping_put_away(uuid, jsonb, uuid) from public, anon;
grant execute on function public.shopping_put_away(uuid, jsonb, uuid) to authenticated;
