-- 0007 — Fonctions de stock : seules voies d'écriture du garde-manger.
--
-- Chaque fonction s'exécute dans UNE transaction (un appel RPC) :
--   - verrou de ligne (FOR UPDATE) sur le produit concerné ;
--   - clé d'idempotence : un nouvel essai (double clic, réseau coupé, rechargement)
--     renvoie le résultat déjà enregistré sans rien réécrire ;
--   - version attendue : une modification faite entre-temps par un autre appareil
--     est détectée au lieu d'être écrasée ;
--   - toute erreur annule l'ensemble : jamais de produit sans mouvement, ni l'inverse.
--
-- Codes d'erreur applicatifs (SQLSTATE) :
--   AP404 produit ou foyer introuvable (ou inaccessible : même réponse)
--   AP409 conflit : version périmée, clé réutilisée pour une autre action, produit inactif
--   AP422 donnée invalide (quantité, unité, dates)

-- ===========================================================================
-- Utilitaire : réserve une clé d'idempotence ou renvoie le résultat déjà connu.
-- ===========================================================================
create function public._stock_begin_operation(
  p_household_id uuid,
  p_idempotency_key uuid,
  p_kind public.movement_kind,
  out operation_id uuid,
  out replay jsonb
)
language plpgsql
set search_path = ''
as $$
declare
  v_existing public.stock_operations%rowtype;
begin
  if p_idempotency_key is null then
    raise exception 'Clé d''idempotence requise.' using errcode = 'AP422';
  end if;

  insert into public.stock_operations (household_id, idempotency_key, kind, created_by)
  values (p_household_id, p_idempotency_key, p_kind, (select auth.uid()))
  on conflict (household_id, idempotency_key) do nothing
  returning id into operation_id;

  if operation_id is null then
    -- Clé déjà utilisée : la transaction concurrente est terminée (l'index unique l'a attendue).
    select * into v_existing
    from public.stock_operations o
    where o.household_id = p_household_id and o.idempotency_key = p_idempotency_key;

    if v_existing.kind <> p_kind then
      raise exception 'Cette clé d''opération a déjà servi pour une autre action.'
        using errcode = 'AP409';
    end if;
    replay := v_existing.result || jsonb_build_object('replayed', true);
  end if;
end;
$$;

create function public._stock_finish_operation(
  p_operation_id uuid,
  p_item_id uuid,
  p_result jsonb
)
returns jsonb
language sql
set search_path = ''
as $$
  update public.stock_operations
  set result = p_result, source_table = 'pantry_items', source_id = p_item_id
  where id = p_operation_id;
  select p_result || jsonb_build_object('replayed', false);
$$;

-- ===========================================================================
-- Ajout d'un produit (mouvement « initial »).
-- ===========================================================================
create function public.pantry_add_item(
  p_household_id uuid,
  p_ingredient_id uuid,
  p_location public.storage_loc,
  p_quantity numeric,           -- dans l'unité p_display_unit ; NULL = quantité inconnue
  p_display_unit text,
  p_expires_on date,
  p_expiry_kind public.expiry_kind,
  p_opened boolean,
  p_idempotency_key uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_dimension public.dimension;
  v_to_base integer;
  v_quantity_base numeric(12,3);
  v_op uuid;
  v_replay jsonb;
  v_item_id uuid;
  v_result jsonb;
begin
  if v_uid is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer introuvable.' using errcode = 'AP404';
  end if;

  select u.dimension, u.to_base into v_dimension, v_to_base
  from public.units u where u.code = p_display_unit;
  if v_dimension is null then
    raise exception 'Unité inconnue.' using errcode = 'AP422';
  end if;
  if not exists (select 1 from public.ingredients i where i.id = p_ingredient_id) then
    raise exception 'Ingrédient inconnu.' using errcode = 'AP422';
  end if;
  if p_quantity is not null and p_quantity <= 0 then
    raise exception 'La quantité doit être positive, ou laissée vide si elle est inconnue.'
      using errcode = 'AP422';
  end if;
  if (p_expires_on is null) <> (p_expiry_kind is null) then
    raise exception 'Une date limite doit préciser son type (DLC ou DDM).' using errcode = 'AP422';
  end if;
  v_quantity_base := p_quantity * v_to_base;

  select o.operation_id, o.replay into v_op, v_replay
  from public._stock_begin_operation(p_household_id, p_idempotency_key, 'initial') o;
  if v_replay is not null then
    return v_replay;
  end if;

  insert into public.pantry_items (
    household_id, ingredient_id, location, quantity_base, dimension, display_unit,
    expires_on, expiry_kind, opened_at, created_by
  ) values (
    p_household_id, p_ingredient_id, p_location, v_quantity_base, v_dimension, p_display_unit,
    p_expires_on, p_expiry_kind, case when coalesce(p_opened, false) then current_date end, v_uid
  )
  returning id into v_item_id;

  insert into public.stock_movements (
    operation_id, household_id, pantry_item_id, ingredient_id, kind,
    delta_base, quantity_after_base, note, created_by
  ) values (
    v_op, p_household_id, v_item_id, p_ingredient_id, 'initial',
    v_quantity_base, v_quantity_base, nullif(btrim(p_note), ''), v_uid
  );

  v_result := jsonb_build_object(
    'item_id', v_item_id, 'quantity_base', v_quantity_base, 'status', 'active', 'version', 1
  );
  return public._stock_finish_operation(v_op, v_item_id, v_result);
end;
$$;

-- ===========================================================================
-- Consommation, perte ou correction d'un produit existant.
-- p_quantity est exprimée dans p_unit, qui doit avoir la même dimension que le produit :
-- la conversion est faite ici, jamais devinée côté client.
--   consumption / loss : p_quantity = quantité retirée (> 0).
--                        loss avec NULL = tout jeter (même si la quantité est inconnue).
--   correction         : p_quantity = nouvelle quantité réelle (>= 0).
-- ===========================================================================
create function public.pantry_apply_movement(
  p_item_id uuid,
  p_kind public.movement_kind,
  p_quantity numeric,
  p_unit text,
  p_expected_version integer,
  p_idempotency_key uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_item public.pantry_items%rowtype;
  v_op uuid;
  v_replay jsonb;
  v_unit_dimension public.dimension;
  v_to_base integer;
  v_quantity_base numeric(12,3);
  v_new numeric(12,3);
  v_delta numeric(12,3);
  v_status public.item_status;
  v_result jsonb;
begin
  if p_kind not in ('consumption', 'loss', 'correction') then
    raise exception 'Type de mouvement non autorisé ici.' using errcode = 'AP422';
  end if;

  -- Verrou : les opérations concurrentes sur ce produit s'exécutent l'une après l'autre.
  select * into v_item from public.pantry_items i where i.id = p_item_id for update;
  if not found or v_uid is null or not public.is_household_member(v_item.household_id) then
    raise exception 'Produit introuvable.' using errcode = 'AP404';
  end if;

  -- L'idempotence passe AVANT le contrôle de version : un nouvel essai d'une opération
  -- réussie doit renvoyer son résultat, pas un conflit de version.
  select o.operation_id, o.replay into v_op, v_replay
  from public._stock_begin_operation(v_item.household_id, p_idempotency_key, p_kind) o;
  if v_replay is not null then
    if v_replay ->> 'item_id' is distinct from v_item.id::text then
      raise exception 'Cette clé d''opération a déjà servi pour un autre produit.'
        using errcode = 'AP409';
    end if;
    return v_replay;
  end if;

  if p_expected_version is distinct from v_item.version then
    raise exception 'Ce produit a été modifié entre-temps. Recharge la page.'
      using errcode = 'AP409', hint = 'STALE_ITEM';
  end if;

  if p_quantity is not null then
    select u.dimension, u.to_base into v_unit_dimension, v_to_base
    from public.units u where u.code = p_unit;
    if v_unit_dimension is null then
      raise exception 'Unité inconnue.' using errcode = 'AP422';
    end if;
    if v_unit_dimension <> v_item.dimension then
      raise exception 'Unité incompatible avec ce produit.' using errcode = 'AP422';
    end if;
    v_quantity_base := p_quantity * v_to_base;
  end if;

  if p_kind = 'correction' then
    if v_item.status = 'discarded' then
      raise exception 'Ce produit a été jeté : ajoute-le à nouveau.' using errcode = 'AP409';
    end if;
    if v_quantity_base is null or v_quantity_base < 0 then
      raise exception 'Indique la quantité réelle (zéro ou plus).' using errcode = 'AP422';
    end if;
    v_new := v_quantity_base;
    v_delta := v_new - v_item.quantity_base;  -- NULL si l'ancienne quantité était inconnue
    v_status := case when v_new = 0 then 'depleted' else 'active' end;

  else
    if v_item.status <> 'active' then
      raise exception 'Ce produit n''est plus en stock.' using errcode = 'AP409';
    end if;

    if p_kind = 'loss' and v_quantity_base is null then
      -- Tout jeter.
      v_new := 0;
      v_delta := -v_item.quantity_base;
    else
      if v_quantity_base is null or v_quantity_base <= 0 then
        raise exception 'La quantité doit être positive.' using errcode = 'AP422';
      end if;
      if v_item.quantity_base is null then
        raise exception 'Quantité en stock inconnue : corrige-la d''abord.' using errcode = 'AP422';
      end if;
      if v_quantity_base > v_item.quantity_base then
        raise exception 'Quantité supérieure au stock disponible.' using errcode = 'AP422';
      end if;
      v_new := v_item.quantity_base - v_quantity_base;
      v_delta := -v_quantity_base;
    end if;
    v_status := case
      when v_new > 0 then 'active'
      when p_kind = 'loss' then 'discarded'
      else 'depleted'
    end;
  end if;

  update public.pantry_items
  set quantity_base = v_new, status = v_status, version = version + 1
  where id = v_item.id;

  insert into public.stock_movements (
    operation_id, household_id, pantry_item_id, ingredient_id, kind,
    delta_base, quantity_after_base, note, created_by
  ) values (
    v_op, v_item.household_id, v_item.id, v_item.ingredient_id, p_kind,
    v_delta, v_new, nullif(btrim(p_note), ''), v_uid
  );

  v_result := jsonb_build_object(
    'item_id', v_item.id, 'quantity_base', v_new, 'status', v_status,
    'version', v_item.version + 1
  );
  return public._stock_finish_operation(v_op, v_item.id, v_result);
end;
$$;

-- ===========================================================================
-- Détails sans effet sur la quantité : emplacement, date limite, ouverture.
-- Pas de mouvement de stock ; protégé par la version. Un double envoi identique
-- (valeurs déjà enregistrées) réussit sans erreur.
-- ===========================================================================
create function public.pantry_update_details(
  p_item_id uuid,
  p_expected_version integer,
  p_location public.storage_loc,
  p_expires_on date,
  p_expiry_kind public.expiry_kind,
  p_opened boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.pantry_items%rowtype;
  v_opened_at date;
begin
  select * into v_item from public.pantry_items i where i.id = p_item_id for update;
  if not found or (select auth.uid()) is null or not public.is_household_member(v_item.household_id) then
    raise exception 'Produit introuvable.' using errcode = 'AP404';
  end if;
  if (p_expires_on is null) <> (p_expiry_kind is null) then
    raise exception 'Une date limite doit préciser son type (DLC ou DDM).' using errcode = 'AP422';
  end if;

  v_opened_at := case
    when not coalesce(p_opened, false) then null
    else coalesce(v_item.opened_at, current_date)
  end;

  -- Rien à changer : succès idempotent, même si la version a bougé.
  if v_item.location = p_location
     and v_item.expires_on is not distinct from p_expires_on
     and v_item.expiry_kind is not distinct from p_expiry_kind
     and v_item.opened_at is not distinct from v_opened_at then
    return jsonb_build_object('item_id', v_item.id, 'version', v_item.version, 'changed', false);
  end if;

  if p_expected_version is distinct from v_item.version then
    raise exception 'Ce produit a été modifié entre-temps. Recharge la page.'
      using errcode = 'AP409', hint = 'STALE_ITEM';
  end if;

  update public.pantry_items
  set location = p_location, expires_on = p_expires_on, expiry_kind = p_expiry_kind,
      opened_at = v_opened_at, version = version + 1
  where id = v_item.id;

  return jsonb_build_object('item_id', v_item.id, 'version', v_item.version + 1, 'changed', true);
end;
$$;

-- ===========================================================================
-- Droits d'exécution
-- ===========================================================================
revoke execute on function public._stock_begin_operation(uuid, uuid, public.movement_kind)
  from public, anon, authenticated;
revoke execute on function public._stock_finish_operation(uuid, uuid, jsonb)
  from public, anon, authenticated;

revoke execute on function public.pantry_add_item(
  uuid, uuid, public.storage_loc, numeric, text, date, public.expiry_kind, boolean, uuid, text
) from public, anon;
revoke execute on function public.pantry_apply_movement(
  uuid, public.movement_kind, numeric, text, integer, uuid, text
) from public, anon;
revoke execute on function public.pantry_update_details(
  uuid, integer, public.storage_loc, date, public.expiry_kind, boolean
) from public, anon;

grant execute on function public.pantry_add_item(
  uuid, uuid, public.storage_loc, numeric, text, date, public.expiry_kind, boolean, uuid, text
) to authenticated;
grant execute on function public.pantry_apply_movement(
  uuid, public.movement_kind, numeric, text, integer, uuid, text
) to authenticated;
grant execute on function public.pantry_update_details(
  uuid, integer, public.storage_loc, date, public.expiry_kind, boolean
) to authenticated;
