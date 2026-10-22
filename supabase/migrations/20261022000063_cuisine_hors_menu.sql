-- 0063 — Cuisiner une recette qui n'est pas au menu.
--
-- Jusqu'ici, « J'ai cuisiné ce plat » n'existait que pour un plat du menu dont les courses
-- étaient finies. recipe_cook_off_menu retire du garde-manger les ingrédients d'une recette
-- cuisinée en dehors du menu, pour le nombre de portions indiqué. Même décompte que
-- meal_cook (calculé côté serveur par le domaine, FEFO, sans conversion devinée), même
-- atomicité, même idempotence, même contrôle de version par lot ; seuls le menu et les
-- courses ne sont pas exigés.
--
-- Le journal des plats cuisinés (meal_cookings) accueille ces plats sans menu : plan_id
-- devient facultatif. La clé étrangère composite (plan_id, household_id) ne s'applique
-- qu'aux lignes qui ont un menu ; rien n'est supprimé ni réécrit.

alter table public.meal_cookings alter column plan_id drop not null;

create function public.recipe_cook_off_menu(
  p_household_id uuid,
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
  v_op uuid;
  v_replay jsonb;
  v_c jsonb;
  v_item public.pantry_items%rowtype;
  v_take numeric(12,3);
  v_new numeric(12,3);
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
  if p_servings is null or p_servings not between 1 and 40 then
    raise exception 'Nombre de portions invalide.' using errcode = 'AP422';
  end if;
  if not exists (select 1 from public.recipes r where r.id = p_recipe_id and r.status = 'published') then
    raise exception 'Recette introuvable.' using errcode = 'AP404';
  end if;

  select o.operation_id, o.replay into v_op, v_replay
  from public._stock_begin_operation(p_household_id, p_idempotency_key, 'cooking') o;
  if v_replay is not null then
    return v_replay;
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
      -v_take, v_new, 'Plat cuisiné hors menu', v_uid
    );
    v_count := v_count + 1;
  end loop;

  insert into public.meal_cookings (plan_id, household_id, recipe_id, servings, operation_id, missing, cooked_by)
  values (null, p_household_id, p_recipe_id, p_servings, v_op,
          case when jsonb_typeof(p_missing) = 'array' then p_missing else '[]'::jsonb end, v_uid)
  returning id into v_cooking_id;

  v_result := jsonb_build_object('cooking_id', v_cooking_id, 'consumed', v_count);
  update public.stock_operations
  set result = v_result, source_table = 'planned_meals', source_id = v_cooking_id
  where id = v_op;
  return v_result || jsonb_build_object('replayed', false);
end;
$$;

revoke execute on function public.recipe_cook_off_menu(uuid, uuid, integer, jsonb, jsonb, uuid) from public, anon;
grant execute on function public.recipe_cook_off_menu(uuid, uuid, integer, jsonb, jsonb, uuid) to authenticated;
