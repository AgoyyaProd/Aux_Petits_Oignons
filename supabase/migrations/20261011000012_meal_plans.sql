-- 0012 — Menus de la semaine : un menu par foyer et par semaine, une liste de plats.
--
-- Le menu est proposé par le générateur (code applicatif, déterministe) puis ajusté
-- par le foyer. Il est TOUJOURS enregistré en entier par meal_plan_save :
--   - atomique : le menu et ses plats changent ensemble ou pas du tout ;
--   - idempotent : rejouer la même requête (double clic, réseau) ne change rien ;
--   - version optimiste : deux onglets ne s'écrasent pas sans le savoir ;
--   - filet de sécurité : une recette contraire aux allergies ou régimes du foyer est refusée.

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  -- Lundi de la semaine concernée.
  week_start date not null check (extract(isodow from week_start) = 1),
  people smallint not null check (people between 1 and 20),
  meal_count smallint not null check (meal_count between 1 and 21),
  budget_cents integer check (budget_cents between 0 and 10000000),
  -- Graine de la proposition : « Relancer » l'incrémente, ce qui rend le tirage reproductible.
  seed integer not null default 0 check (seed >= 0),
  version integer not null default 1 check (version >= 1),
  last_idempotency_key uuid,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, week_start),
  unique (id, household_id)
);

create trigger meal_plans_set_updated_at
  before update on public.meal_plans
  for each row execute function public.set_updated_at();

create table public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  household_id uuid not null,
  position smallint not null check (position between 1 and 21),
  recipe_id uuid not null references public.recipes (id) on delete no action,
  servings smallint not null check (servings between 1 and 40),
  -- Plat gardé quand on relance la proposition.
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  -- Le plat appartient forcément au même foyer que son menu.
  foreign key (plan_id, household_id)
    references public.meal_plans (id, household_id) on delete cascade,
  unique (plan_id, position)
);
create index meal_plan_entries_recipe_idx on public.meal_plan_entries (recipe_id);
create index meal_plan_entries_household_idx on public.meal_plan_entries (household_id);

-- ---------------------------------------------------------------------------
-- Enregistrement d'un menu complet.
-- p_entries : [{"recipe_id": uuid, "servings": int, "locked": bool}, ...] dans l'ordre.
-- p_expected_version : version lue (null pour un menu qui n'existe pas encore).
-- Erreurs : 42501 foyer inaccessible, AP409 conflit de version, AP422 donnée invalide.
-- ---------------------------------------------------------------------------
create function public.meal_plan_save(
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

  insert into public.meal_plan_entries (plan_id, household_id, position, recipe_id, servings, locked)
  select v_plan.id, p_household_id, e.ord::smallint, (e.value ->> 'recipe_id')::uuid,
         (e.value ->> 'servings')::smallint, coalesce((e.value ->> 'locked')::boolean, false)
  from jsonb_array_elements(p_entries) with ordinality as e(value, ord);

  return query select v_plan.id, v_plan.version;
end;
$$;

revoke execute on function public.meal_plan_save(uuid, date, integer, integer, integer, integer, jsonb, integer, uuid)
  from public, anon;
grant execute on function public.meal_plan_save(uuid, date, integer, integer, integer, integer, jsonb, integer, uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Privilèges et RLS : lecture par les membres ; écriture uniquement via meal_plan_save.
-- ---------------------------------------------------------------------------
revoke all on public.meal_plans, public.meal_plan_entries from anon, authenticated;
grant select on public.meal_plans, public.meal_plan_entries to authenticated;

alter table public.meal_plans enable row level security;
alter table public.meal_plan_entries enable row level security;

create policy meal_plans_member_read on public.meal_plans
  for select to authenticated
  using (household_id in (select public.my_household_ids()));

create policy meal_plan_entries_member_read on public.meal_plan_entries
  for select to authenticated
  using (household_id in (select public.my_household_ids()));
