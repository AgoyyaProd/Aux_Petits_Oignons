-- 0032 — Restes et cuisine en avance.
--
-- Un plat du menu peut être un « reste » : on mange ce qui a été cuisiné en double pour un
-- repas précédent de la même recette. Un reste ne compte pas dans la liste de courses (ses
-- portions sont ajoutées au plat cuisiné) et ne se « cuisine » pas : il ne retire rien du
-- garde-manger. meal_plan_save accepte "leftover" (booléen) et refuse un reste sans plat
-- cuisiné de la même recette ; meal_cook ne compte plus les restes.
-- Signatures inchangées : les fonctions sont remplacées à l'identique, sauf ces points.

alter table public.meal_plan_entries
  add column leftover boolean not null default false;

-- Entrées attendues : [{"recipe_id", "servings", "locked", "planned_on"?, "slot"?, "leftover"?}, ...]
create or replace function public.meal_plan_save(
  p_household_id uuid,
  p_week_start date,
  p_people integer,
  p_meal_count integer,
  p_budget_cents integer,
  p_seed integer,
  p_entries jsonb,
  p_expected_version integer,
  p_idempotency_key uuid
)
returns table (plan_id uuid, plan_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan public.meal_plans%rowtype;
  v_exists boolean;
  v_count integer;
  v_bad text;
begin
  if p_household_id is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer inaccessible.' using errcode = '42501';
  end if;
  if p_idempotency_key is null then
    raise exception 'Clé d''idempotence manquante.' using errcode = 'AP422';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then
    raise exception 'Liste de plats invalide.' using errcode = 'AP422';
  end if;
  v_count := jsonb_array_length(p_entries);
  if v_count > 21 then
    raise exception 'Au plus 21 plats par semaine.' using errcode = 'AP422';
  end if;

  -- Verrou sur le menu existant : les enregistrements concurrents passent un par un.
  select * into v_plan from public.meal_plans
  where household_id = p_household_id and week_start = p_week_start
  for update;
  v_exists := found;

  -- Rejeu de la même requête : on renvoie l'état actuel sans rien refaire.
  if v_exists and v_plan.last_idempotency_key = p_idempotency_key then
    return query select v_plan.id, v_plan.version;
    return;
  end if;

  if v_exists and v_plan.version is distinct from p_expected_version then
    raise exception 'Le menu a été modifié entre-temps. Recharge la page.' using errcode = 'AP409';
  end if;
  if not v_exists and p_expected_version is not null then
    raise exception 'Le menu a été supprimé ou n''existe pas encore.' using errcode = 'AP409';
  end if;

  -- Contrôle des plats : forme, recette visible par le foyer, publiée.
  if exists (
    select 1 from jsonb_array_elements(p_entries) e
    where jsonb_typeof(e) <> 'object'
       or (e ->> 'recipe_id') is null
       or (e ->> 'recipe_id') !~ '^[0-9a-f-]{36}$'
       or case when (e ->> 'servings') ~ '^\d{1,2}$'
               then (e ->> 'servings')::int not between 1 and 40
               else true end
       -- Jour et repas : tous deux absents, ou un jour de la semaine du menu et midi/soir.
       or ((e ->> 'planned_on') is null) <> ((e ->> 'slot') is null)
       or coalesce(e ->> 'slot', 'dinner') not in ('lunch', 'dinner')
       or case when (e ->> 'planned_on') is null then false
               when (e ->> 'planned_on') !~ '^\d{4}-\d{2}-\d{2}$' then true
               else (e ->> 'planned_on')::date not between p_week_start and p_week_start + 6 end
       or coalesce(jsonb_typeof(e -> 'leftover'), 'boolean') <> 'boolean'
  ) then
    raise exception 'Plat invalide.' using errcode = 'AP422';
  end if;

  -- Un reste suppose la même recette cuisinée pour de vrai dans le menu : sinon les courses
  -- ne compteraient pas ses ingrédients.
  if exists (
    select 1 from jsonb_array_elements(p_entries) e
    where coalesce((e ->> 'leftover')::boolean, false)
      and not exists (
        select 1 from jsonb_array_elements(p_entries) s
        where s ->> 'recipe_id' = e ->> 'recipe_id'
          and not coalesce((s ->> 'leftover')::boolean, false))
  ) then
    raise exception 'Un reste doit suivre la recette cuisinée.' using errcode = 'AP422';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_entries) e
    left join public.recipes r on r.id = (e ->> 'recipe_id')::uuid
    where r.id is null
       or r.status <> 'published'
       or (r.household_id is not null and r.household_id <> p_household_id)
  ) then
    raise exception 'Recette introuvable ou non disponible.' using errcode = 'AP422';
  end if;

  -- Filet de sécurité : allergies et régimes du foyer, en plus du filtre applicatif.
  select string_agg(distinct r.title, ', ') into v_bad
  from jsonb_array_elements(p_entries) e
  join public.recipes r on r.id = (e ->> 'recipe_id')::uuid
  where exists (
      select 1 from public.recipe_allergens a
      join public.household_exclusions x
        on x.allergen_code = a.allergen_code and x.household_id = p_household_id
      where a.recipe_id = r.id)
     or exists (
      select 1 from public.recipe_diet_conflicts d
      join public.household_diets hd
        on hd.diet_code = d.diet_code and hd.household_id = p_household_id
      where d.recipe_id = r.id);
  if v_bad is not null then
    raise exception 'Incompatible avec les allergies ou régimes du foyer : %', v_bad
      using errcode = 'AP422';
  end if;

  if not v_exists then
    begin
      insert into public.meal_plans
        (household_id, week_start, people, meal_count, budget_cents, seed, last_idempotency_key)
      values
        (p_household_id, p_week_start, p_people, p_meal_count, p_budget_cents,
         coalesce(p_seed, 0), p_idempotency_key)
      returning * into v_plan;
    exception when unique_violation then
      raise exception 'Le menu a été créé entre-temps. Recharge la page.' using errcode = 'AP409';
    end;
  else
    update public.meal_plans set
      people = p_people,
      meal_count = p_meal_count,
      budget_cents = p_budget_cents,
      seed = coalesce(p_seed, 0),
      version = version + 1,
      last_idempotency_key = p_idempotency_key
    where id = v_plan.id
    returning * into v_plan;
    delete from public.meal_plan_entries pe where pe.plan_id = v_plan.id;
  end if;

  insert into public.meal_plan_entries
    (plan_id, household_id, position, recipe_id, servings, locked, planned_on, meal_slot,
     leftover)
  select v_plan.id, p_household_id, e.ord::smallint, (e.value ->> 'recipe_id')::uuid,
         (e.value ->> 'servings')::smallint, coalesce((e.value ->> 'locked')::boolean, false),
         (e.value ->> 'planned_on')::date, e.value ->> 'slot',
         coalesce((e.value ->> 'leftover')::boolean, false)
  from jsonb_array_elements(p_entries) with ordinality as e(value, ord);

  return query select v_plan.id, v_plan.version;
end;
$$;

create or replace function public.meal_cook(
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

  -- Les restes ne se cuisinent pas : seuls les plats préparés comptent.
  select count(*) into v_planned from public.meal_plan_entries e
  where e.plan_id = v_plan.id and e.recipe_id = p_recipe_id and not e.leftover;
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
