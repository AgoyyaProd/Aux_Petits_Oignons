-- 0016 — Fin des courses et plats cuisinés.
--
-- « Finir les courses » (shopping_finish) range les achats cochés et marque les courses de la
-- semaine comme faites, en une transaction. Ce n'est qu'ensuite qu'un plat du menu peut être
-- marqué « cuisiné » (meal_cook) : ses ingrédients sont retirés du garde-manger.
--
-- Le décompte (quels lots, combien) est calculé côté serveur par le domaine (FEFO, sans
-- conversion devinée) puis appliqué ici de façon atomique et idempotente, avec contrôle de
-- version par lot : un stock modifié entre-temps lève un conflit au lieu d'être écrasé.

alter table public.meal_plans add column shopping_done_at timestamptz;

-- Journal des plats cuisinés de la semaine (indépendant de l'ordre des plats du menu).
create table public.meal_cookings (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  household_id uuid not null,
  recipe_id uuid not null references public.recipes (id) on delete no action,
  servings smallint not null check (servings between 1 and 40),
  operation_id uuid not null references public.stock_operations (id) on delete no action,
  -- Ingrédients qui manquaient au moment de cuisiner (aucun stock retiré pour eux).
  missing jsonb not null default '[]'::jsonb,
  cooked_by uuid default auth.uid() references auth.users (id) on delete set null,
  cooked_at timestamptz not null default now(),
  foreign key (plan_id, household_id)
    references public.meal_plans (id, household_id) on delete cascade
);
create index meal_cookings_plan_idx on public.meal_cookings (plan_id);
create index meal_cookings_household_idx on public.meal_cookings (household_id);
create index meal_cookings_recipe_idx on public.meal_cookings (recipe_id);
create index meal_cookings_operation_idx on public.meal_cookings (operation_id);

revoke all on public.meal_cookings from anon, authenticated;
grant select on public.meal_cookings to authenticated;
alter table public.meal_cookings enable row level security;
create policy meal_cookings_member_read on public.meal_cookings
  for select to authenticated
  using (household_id in (select public.my_household_ids()));

-- ---------------------------------------------------------------------------
-- Finir les courses : range les produits fournis (s'il y en a) et marque la semaine.
-- ---------------------------------------------------------------------------
create function public.shopping_finish(
  p_household_id uuid,
  p_week_start date,
  p_items jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.meal_plans%rowtype;
  v_put jsonb;
begin
  if (select auth.uid()) is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer introuvable.' using errcode = 'AP404';
  end if;
  select * into v_plan from public.meal_plans
  where household_id = p_household_id and week_start = p_week_start
  for update;
  if not found then
    raise exception 'Aucun menu pour cette semaine.' using errcode = 'AP404';
  end if;

  if p_items is not null and jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) > 0 then
    v_put := public.shopping_put_away(p_household_id, p_items, p_idempotency_key);
  end if;

  update public.meal_plans
  set shopping_done_at = coalesce(shopping_done_at, now())
  where id = v_plan.id
  returning * into v_plan;

  return jsonb_build_object('shopping_done_at', v_plan.shopping_done_at, 'put_away', v_put);
end;
$$;

revoke execute on function public.shopping_finish(uuid, date, jsonb, uuid) from public, anon;
grant execute on function public.shopping_finish(uuid, date, jsonb, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Plat cuisiné : retire du stock les quantités calculées, lot par lot.
-- p_consumptions : [{"item_id": uuid, "quantity_base": "123.456", "expected_version": 3}, ...]
-- p_missing      : informatif, ingrédients non trouvés en stock (enregistré tel quel).
-- Erreurs : AP404 introuvable, AP409 conflit (courses non finies, déjà cuisiné, stock
-- modifié entre-temps), AP422 donnée invalide.
-- ---------------------------------------------------------------------------
create function public.meal_cook(
  p_household_id uuid,
  p_week_start date,
  p_recipe_id uuid,
  p_servings integer,
  p_consumptions jsonb,
  p_missing jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_plan public.meal_plans%rowtype;
  v_op uuid;
  v_replay jsonb;
  v_c jsonb;
  v_item public.pantry_items%rowtype;
  v_take numeric(12,3);
  v_new numeric(12,3);
  v_planned integer;
  v_cooked integer;
  v_cooking_id uuid;
  v_count integer := 0;
  v_result jsonb;
begin
  if v_uid is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer introuvable.' using errcode = 'AP404';
  end if;
  if p_consumptions is null or jsonb_typeof(p_consumptions) <> 'array'
     or jsonb_array_length(p_consumptions) > 100 then
    raise exception 'Décompte invalide.' using errcode = 'AP422';
  end if;

  select * into v_plan from public.meal_plans
  where household_id = p_household_id and week_start = p_week_start
  for update;
  if not found then
    raise exception 'Aucun menu pour cette semaine.' using errcode = 'AP404';
  end if;

  select o.operation_id, o.replay into v_op, v_replay
  from public._stock_begin_operation(p_household_id, p_idempotency_key, 'cooking') o;
  if v_replay is not null then
    return v_replay;
  end if;

  if v_plan.shopping_done_at is null then
    raise exception 'Termine d''abord les courses de la semaine.' using errcode = 'AP409';
  end if;

  select count(*) into v_planned from public.meal_plan_entries e
  where e.plan_id = v_plan.id and e.recipe_id = p_recipe_id;
  select count(*) into v_cooked from public.meal_cookings c
  where c.plan_id = v_plan.id and c.recipe_id = p_recipe_id;
  if v_planned = 0 then
    raise exception 'Ce plat n''est pas au menu de la semaine.' using errcode = 'AP404';
  end if;
  if v_cooked >= v_planned then
    raise exception 'Ce plat est déjà marqué comme cuisiné.' using errcode = 'AP409';
  end if;
  if p_servings is null or p_servings not between 1 and 40 then
    raise exception 'Nombre de portions invalide.' using errcode = 'AP422';
  end if;

  for v_c in select value from jsonb_array_elements(p_consumptions) loop
    if jsonb_typeof(v_c) <> 'object'
       or coalesce(v_c ->> 'item_id', '') !~ '^[0-9a-f-]{36}$'
       or coalesce(v_c ->> 'quantity_base', '') !~ '^\d{1,9}(\.\d{1,3})?$'
       or coalesce(v_c ->> 'expected_version', '') !~ '^\d{1,9}$' then
      raise exception 'Décompte invalide.' using errcode = 'AP422';
    end if;

    select * into v_item from public.pantry_items i
    where i.id = (v_c ->> 'item_id')::uuid and i.household_id = p_household_id
    for update;
    if not found then
      raise exception 'Produit introuvable.' using errcode = 'AP404';
    end if;
    if v_item.version <> (v_c ->> 'expected_version')::integer or v_item.status <> 'active' then
      raise exception 'Ton garde-manger a changé entre-temps. Recharge la page.' using errcode = 'AP409';
    end if;
    v_take := (v_c ->> 'quantity_base')::numeric;
    if v_item.quantity_base is null or v_take <= 0 or v_take > v_item.quantity_base then
      raise exception 'Quantité à retirer invalide.' using errcode = 'AP409';
    end if;

    v_new := v_item.quantity_base - v_take;
    update public.pantry_items
    set quantity_base = v_new,
        status = case when v_new > 0 then 'active'::public.item_status else 'depleted' end,
        version = version + 1
    where id = v_item.id;

    insert into public.stock_movements (
      operation_id, household_id, pantry_item_id, ingredient_id, kind,
      delta_base, quantity_after_base, note, created_by
    ) values (
      v_op, p_household_id, v_item.id, v_item.ingredient_id, 'cooking',
      -v_take, v_new, 'Plat cuisiné', v_uid
    );
    v_count := v_count + 1;
  end loop;

  insert into public.meal_cookings (plan_id, household_id, recipe_id, servings, operation_id, missing, cooked_by)
  values (v_plan.id, p_household_id, p_recipe_id, p_servings, v_op,
          case when jsonb_typeof(p_missing) = 'array' then p_missing else '[]'::jsonb end, v_uid)
  returning id into v_cooking_id;

  v_result := jsonb_build_object('cooking_id', v_cooking_id, 'consumed', v_count);
  update public.stock_operations
  set result = v_result, source_table = 'planned_meals', source_id = v_cooking_id
  where id = v_op;
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

revoke execute on function public.meal_cook(uuid, date, uuid, integer, jsonb, jsonb, uuid) from public, anon;
grant execute on function public.meal_cook(uuid, date, uuid, integer, jsonb, jsonb, uuid) to authenticated;
