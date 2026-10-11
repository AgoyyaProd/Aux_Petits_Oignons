-- 0022 — Profil alimentaire du foyer : style de régime, objectifs, matériel de cuisine.
--
-- - Style (un seul) : omnivore, flexitarien, pescétarien, végétarien, végétalien.
--   Pescétarien, végétarien et végétalien sont des EXCLUSIONS strictes, portées comme avant
--   par household_diets (filet de sécurité en base). Flexitarien est une préférence douce
--   appliquée par le générateur (peu de plats avec viande), jamais une exclusion.
-- - Objectifs (plusieurs) : orientent le score du générateur, par des règles fixes.
-- - Matériel : les recettes qui demandent un appareil absent ne sont plus proposées.
--   Le matériel requis par chaque recette est DÉDUIT de ses étiquettes et de ses étapes par
--   des règles fixes (voir _recipe_equipment_compute), recalculé à chaque modification.

-- ---------------------------------------------------------------------------
-- Matériel de cuisine (référentiel)
-- ---------------------------------------------------------------------------
create table public.equipment (
  code text primary key check (code ~ '^[a-z_]+$'),
  label text not null,
  position smallint not null
);
insert into public.equipment (code, label, position) values
  ('plaques', 'Plaques de cuisson', 1),
  ('four', 'Four', 2),
  ('mixeur', 'Mixeur ou blender', 3),
  ('micro_ondes', 'Micro-ondes', 4);

create table public.recipe_equipment (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  equipment_code text not null references public.equipment (code),
  primary key (recipe_id, equipment_code)
);
create index recipe_equipment_code_idx on public.recipe_equipment (equipment_code);

-- Règles de déduction (fixes, sans IA) à partir des étiquettes et du texte des étapes.
create function public._recipe_equipment_compute(p_recipe_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tags text[];
  v_text text;
begin
  select r.tags into v_tags from public.recipes r where r.id = p_recipe_id;
  if not found then
    return;
  end if;
  select coalesce(string_agg(s.instruction, ' '), '') into v_text
  from public.recipe_steps s where s.recipe_id = p_recipe_id;

  delete from public.recipe_equipment where recipe_id = p_recipe_id;
  insert into public.recipe_equipment (recipe_id, equipment_code)
  select p_recipe_id, code from (
    select 'four' as code
    where 'four' = any(v_tags) or v_text ~* '(\mfour\M|°\s?C|enfourn)'
    union all
    select 'plaques'
    where 'poele' = any(v_tags) or 'mijote' = any(v_tags)
       or v_text ~* '(po[êe]le|casserole|cocotte|sauteuse|\mwok|faire (revenir|cuire|fondre|bouillir|dorer|sauter)|[ée]bullition|bain-marie|mijot|saisi|\mfrire|blanchir|\mcuire\M)'
    union all
    select 'mixeur' where v_text ~* '\mmix(er|ez|é|ée|eur)'
    union all
    select 'micro_ondes' where v_text ~* 'micro-?ondes'
  ) t;
end;
$$;
revoke execute on function public._recipe_equipment_compute(uuid) from public, anon, authenticated;

create function public._recipe_equipment_steps_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._recipe_equipment_compute(coalesce(new.recipe_id, old.recipe_id));
  return null;
end;
$$;
revoke execute on function public._recipe_equipment_steps_trigger() from public, anon, authenticated;

create function public._recipe_equipment_recipes_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._recipe_equipment_compute(new.id);
  return null;
end;
$$;
revoke execute on function public._recipe_equipment_recipes_trigger() from public, anon, authenticated;

create trigger recipe_steps_equipment
  after insert or update or delete on public.recipe_steps
  for each row execute function public._recipe_equipment_steps_trigger();
create trigger recipes_equipment
  after insert or update of tags on public.recipes
  for each row execute function public._recipe_equipment_recipes_trigger();

do $$
begin
  perform public._recipe_equipment_compute(r.id) from public.recipes r;
end;
$$;

revoke all on public.equipment, public.recipe_equipment from anon, authenticated;
grant select on public.equipment, public.recipe_equipment to authenticated;
alter table public.equipment enable row level security;
alter table public.recipe_equipment enable row level security;
create policy equipment_read on public.equipment for select to authenticated using (true);
-- Visible si la recette l'est (RLS des recettes appliquée dans la sous-requête).
create policy recipe_equipment_read on public.recipe_equipment for select to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id));

-- ---------------------------------------------------------------------------
-- Profil alimentaire du foyer (modifiable par tous les membres, comme les régimes)
-- ---------------------------------------------------------------------------
create table public.household_food_profile (
  household_id uuid primary key references public.households (id) on delete cascade,
  eating_style text not null default 'omnivore'
    check (eating_style in ('omnivore', 'flexitarien', 'pescetarien', 'vegetarien', 'vegetalien')),
  objectives text[] not null default '{}'
    check (objectives <@ array['manger_mieux', 'plus_legumes', 'decouvrir', 'moins_gaspiller',
                               'economiser', 'rapide']::text[]),
  -- null : matériel non renseigné (aucun filtre) ; sinon, la liste de ce que le foyer possède.
  equipment text[]
    check (equipment is null or equipment <@ array['plaques', 'four', 'mixeur', 'micro_ondes']::text[]),
  updated_at timestamptz not null default now()
);

create trigger household_food_profile_set_updated_at
  before update on public.household_food_profile
  for each row execute function public.set_updated_at();

revoke all on public.household_food_profile from anon, authenticated;
grant select on public.household_food_profile to authenticated;
alter table public.household_food_profile enable row level security;
create policy household_food_profile_member_read on public.household_food_profile
  for select to authenticated
  using (household_id in (select public.my_household_ids()));

-- Enregistre le profil complet en une transaction : style (et ses exclusions strictes),
-- sans porc, allergies, objectifs, matériel. Les régimes stricts restent dans
-- household_diets, que le générateur ET meal_plan_save contrôlent.
create function public.set_food_profile(
  p_household_id uuid,
  p_eating_style text,
  p_no_pork boolean,
  p_allergens text[],
  p_objectives text[],
  p_equipment text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_diets text[];
begin
  if (select auth.uid()) is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer inaccessible.' using errcode = '42501';
  end if;
  if p_eating_style is null
     or p_eating_style not in ('omnivore', 'flexitarien', 'pescetarien', 'vegetarien', 'vegetalien') then
    raise exception 'Régime inconnu.' using errcode = 'AP422';
  end if;
  if exists (select 1 from unnest(coalesce(p_allergens, '{}')) a
             where a not in (select code from public.allergens)) then
    raise exception 'Allergène inconnu.' using errcode = 'AP422';
  end if;

  v_diets := case p_eating_style
    when 'pescetarien' then array['pescetarian']
    when 'vegetarien' then array['vegetarian']
    when 'vegetalien' then array['vegan']
    else '{}'::text[] end;
  if coalesce(p_no_pork, false) then
    v_diets := array_append(v_diets, 'no_pork');
  end if;

  delete from public.household_diets where household_id = p_household_id;
  insert into public.household_diets (household_id, diet_code)
  select p_household_id, d from unnest(v_diets) d group by d;

  delete from public.household_exclusions
  where household_id = p_household_id and allergen_code is not null;
  insert into public.household_exclusions (household_id, allergen_code, is_allergy)
  select p_household_id, a, true from unnest(coalesce(p_allergens, '{}')) a group by a;

  insert into public.household_food_profile (household_id, eating_style, objectives, equipment)
  values (p_household_id, p_eating_style,
          (select coalesce(array_agg(distinct o), '{}') from unnest(coalesce(p_objectives, '{}')) o),
          case when p_equipment is null then null
               else (select coalesce(array_agg(distinct e), '{}') from unnest(p_equipment) e) end)
  on conflict (household_id) do update set
    eating_style = excluded.eating_style,
    objectives = excluded.objectives,
    equipment = excluded.equipment;
end;
$$;

revoke execute on function public.set_food_profile(uuid, text, boolean, text[], text[], text[])
  from public, anon;
grant execute on function public.set_food_profile(uuid, text, boolean, text[], text[], text[])
  to authenticated;

-- Profils existants : style déduit des régimes déjà choisis.
insert into public.household_food_profile (household_id, eating_style)
select h.id,
  case
    when exists (select 1 from public.household_diets d where d.household_id = h.id and d.diet_code = 'vegan') then 'vegetalien'
    when exists (select 1 from public.household_diets d where d.household_id = h.id and d.diet_code = 'vegetarian') then 'vegetarien'
    when exists (select 1 from public.household_diets d where d.household_id = h.id and d.diet_code = 'pescetarian') then 'pescetarien'
    else 'omnivore' end
from public.households h
on conflict do nothing;
