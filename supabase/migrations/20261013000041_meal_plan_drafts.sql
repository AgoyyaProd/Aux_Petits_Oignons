-- ===========================================================================
-- 0041 · Brouillon de menu, validé explicitement
--
-- Générer, remplacer, déplacer, garder ou retirer un plat modifie un BROUILLON (un par foyer
-- et par semaine), jamais le menu enregistré. « Valider le menu » enregistre le brouillon
-- d'un coup (meal_plan_save : mêmes contrôles d'allergies, de régimes, de recettes) puis le
-- supprime, dans une seule transaction. La liste de courses, le tableau de bord et la
-- cuisine ne lisent que le menu validé. Quitter la page sans valider supprime le brouillon.
--
--  * base_version : version du menu validé au moment où le brouillon a commencé (null : pas
--    de menu). La validation échoue proprement si le menu a changé entre-temps.
--  * revision : version du brouillon (contrôle optimiste des modifications successives).
--  * last_key : clé d'idempotence de la dernière modification (double envoi = sans effet).
--  * rejected : recettes écartées par « Changer » pendant ce brouillon, pour ne pas les
--    reproposer en boucle.
-- ===========================================================================

create table public.meal_plan_drafts (
  household_id uuid not null references public.households (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  base_version integer check (base_version >= 1),
  revision integer not null default 1 check (revision >= 1),
  people smallint not null check (people between 1 and 20),
  meal_count smallint not null check (meal_count between 1 and 21),
  budget_cents integer check (budget_cents between 0 and 10000000),
  seed integer not null default 0 check (seed >= 0),
  entries jsonb not null
    check (jsonb_typeof(entries) = 'array' and jsonb_array_length(entries) <= 21),
  rejected uuid[] not null default '{}' check (cardinality(rejected) <= 300),
  last_key uuid,
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (household_id, week_start)
);

create trigger meal_plan_drafts_set_updated_at
  before update on public.meal_plan_drafts
  for each row execute function public.set_updated_at();

revoke all on public.meal_plan_drafts from anon, authenticated;
grant select, delete on public.meal_plan_drafts to authenticated;
alter table public.meal_plan_drafts enable row level security;

create policy meal_plan_drafts_member_read on public.meal_plan_drafts
  for select to authenticated
  using ((select public.is_household_member(household_id)));
create policy meal_plan_drafts_member_delete on public.meal_plan_drafts
  for delete to authenticated
  using ((select public.is_household_member(household_id)));

-- ---------------------------------------------------------------------------
-- Enregistre le brouillon complet (création ou modification), avec contrôle de révision.
-- p_expected_revision null : nouveau brouillon (refusé s'il en existe déjà un).
-- ---------------------------------------------------------------------------
create function public.meal_plan_draft_save(
  p_household_id uuid,
  p_week_start date,
  p_base_version integer,
  p_expected_revision integer,
  p_people integer,
  p_meal_count integer,
  p_budget_cents integer,
  p_seed integer,
  p_entries jsonb,
  p_rejected uuid[],
  p_key uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft public.meal_plan_drafts%rowtype;
begin
  if p_household_id is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer inaccessible.' using errcode = '42501';
  end if;
  if p_key is null then
    raise exception 'Clé d''idempotence manquante.' using errcode = 'AP422';
  end if;
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) > 21 then
    raise exception 'Liste de plats invalide.' using errcode = 'AP422';
  end if;

  select * into v_draft from public.meal_plan_drafts
  where household_id = p_household_id and week_start = p_week_start
  for update;

  if found then
    -- Rejeu de la même modification : rien à refaire.
    if v_draft.last_key = p_key then
      return v_draft.revision;
    end if;
    if p_expected_revision is distinct from v_draft.revision then
      raise exception 'Le menu a été modifié entre-temps. Recharge la page.' using errcode = 'AP409';
    end if;
    update public.meal_plan_drafts set
      people = p_people,
      meal_count = greatest(1, p_meal_count),
      budget_cents = p_budget_cents,
      seed = coalesce(p_seed, 0),
      entries = p_entries,
      rejected = coalesce(p_rejected, '{}'),
      revision = revision + 1,
      last_key = p_key,
      updated_by = auth.uid()
    where household_id = p_household_id and week_start = p_week_start
    returning * into v_draft;
    return v_draft.revision;
  end if;

  if p_expected_revision is not null then
    raise exception 'Ce brouillon a été abandonné. Recharge la page.' using errcode = 'AP409';
  end if;
  insert into public.meal_plan_drafts
    (household_id, week_start, base_version, people, meal_count, budget_cents, seed, entries,
     rejected, last_key)
  values
    (p_household_id, p_week_start, p_base_version, p_people, greatest(1, p_meal_count),
     p_budget_cents, coalesce(p_seed, 0), p_entries, coalesce(p_rejected, '{}'), p_key)
  returning * into v_draft;
  return v_draft.revision;
exception when unique_violation then
  raise exception 'Le menu a été modifié entre-temps. Recharge la page.' using errcode = 'AP409';
end;
$$;

revoke execute on function public.meal_plan_draft_save(uuid, date, integer, integer, integer,
  integer, integer, integer, jsonb, uuid[], uuid) from public, anon;
grant execute on function public.meal_plan_draft_save(uuid, date, integer, integer, integer,
  integer, integer, integer, jsonb, uuid[], uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Valide le brouillon : enregistre le menu (meal_plan_save) puis supprime le brouillon,
-- dans la même transaction. Idempotent : rejouer la même clé renvoie le menu enregistré.
-- ---------------------------------------------------------------------------
create function public.meal_plan_draft_validate(
  p_household_id uuid,
  p_week_start date,
  p_expected_revision integer,
  p_idempotency_key uuid
)
returns table (plan_id uuid, plan_version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft public.meal_plan_drafts%rowtype;
  v_plan public.meal_plans%rowtype;
begin
  if p_household_id is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer inaccessible.' using errcode = '42501';
  end if;

  select * into v_draft from public.meal_plan_drafts
  where household_id = p_household_id and week_start = p_week_start
  for update;

  if not found then
    -- Déjà validé par cette même requête (double clic, nouvel essai réseau).
    select * into v_plan from public.meal_plans
    where household_id = p_household_id and week_start = p_week_start;
    if found and v_plan.last_idempotency_key = p_idempotency_key then
      return query select v_plan.id, v_plan.version;
      return;
    end if;
    raise exception 'Ce brouillon a été abandonné. Recharge la page.' using errcode = 'AP409';
  end if;
  if p_expected_revision is distinct from v_draft.revision then
    raise exception 'Le menu a été modifié entre-temps. Recharge la page.' using errcode = 'AP409';
  end if;
  if jsonb_array_length(v_draft.entries) = 0 then
    raise exception 'Le menu est vide : ajoute au moins un plat.' using errcode = 'AP422';
  end if;

  return query
    select s.plan_id, s.plan_version from public.meal_plan_save(
      p_household_id, p_week_start, v_draft.people, v_draft.meal_count, v_draft.budget_cents,
      v_draft.seed, v_draft.entries, v_draft.base_version, p_idempotency_key) s;

  delete from public.meal_plan_drafts
  where household_id = p_household_id and week_start = p_week_start;
end;
$$;

revoke execute on function public.meal_plan_draft_validate(uuid, date, integer, uuid)
  from public, anon;
grant execute on function public.meal_plan_draft_validate(uuid, date, integer, uuid)
  to authenticated;
