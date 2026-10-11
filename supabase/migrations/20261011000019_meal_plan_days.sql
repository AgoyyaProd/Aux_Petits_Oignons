-- 0019 — Plats placés jour par jour : chaque plat du menu peut avoir un jour (dans la
-- semaine du menu) et un repas (midi ou soir). Les deux sont facultatifs, mais vont ensemble.
-- La liste de courses utilise ce jour pour savoir si un produit du garde-manger sera encore
-- bon au moment du repas (DLC).
--
-- meal_plan_save accepte désormais, pour chaque plat, "planned_on" (AAAA-MM-JJ) et "slot"
-- ("lunch" | "dinner"). Sa signature ne change pas.

alter table public.meal_plan_entries
  add column planned_on date,
  add column meal_slot text check (meal_slot in ('lunch', 'dinner')),
  add constraint meal_plan_entries_slot_pair check ((planned_on is null) = (meal_slot is null));

-- Entrées attendues : [{"recipe_id", "servings", "locked", "planned_on"?, "slot"?}, ...]
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
  ) then
    raise exception 'Plat invalide.' using errcode = 'AP422';
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
    (plan_id, household_id, position, recipe_id, servings, locked, planned_on, meal_slot)
  select v_plan.id, p_household_id, e.ord::smallint, (e.value ->> 'recipe_id')::uuid,
         (e.value ->> 'servings')::smallint, coalesce((e.value ->> 'locked')::boolean, false),
         (e.value ->> 'planned_on')::date, e.value ->> 'slot'
  from jsonb_array_elements(p_entries) with ordinality as e(value, ord);

  return query select v_plan.id, v_plan.version;
end;
$$;

