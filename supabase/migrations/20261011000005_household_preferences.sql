-- 0005 — Préférences alimentaires du foyer : régimes et exclusions (allergies, dégoûts).
-- Lisibles et modifiables par tous les membres : chacun doit pouvoir déclarer ses allergies.

create table public.household_diets (
  household_id uuid not null references public.households (id) on delete cascade,
  diet_code text not null references public.diets (code),
  created_at timestamptz not null default now(),
  primary key (household_id, diet_code)
);

create table public.household_exclusions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  allergen_code text references public.allergens (code),
  ingredient_id uuid references public.ingredients (id) on delete cascade,
  -- true : allergie, blocage strict partout (recettes, IA). false : simple dégoût, à éviter.
  is_allergy boolean not null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(allergen_code, ingredient_id) = 1),
  -- Un allergène ne peut pas être un simple « dégoût » : c'est une contrainte de sécurité.
  check (allergen_code is null or is_allergy)
);
create unique index household_exclusions_allergen_uq
  on public.household_exclusions (household_id, allergen_code) where allergen_code is not null;
create unique index household_exclusions_ingredient_uq
  on public.household_exclusions (household_id, ingredient_id) where ingredient_id is not null;
create index household_exclusions_ingredient_idx on public.household_exclusions (ingredient_id);

-- ---------------------------------------------------------------------------
-- Enregistrement atomique des régimes et allergies (remplace l'ensemble).
-- SECURITY INVOKER : la RLS ci-dessous s'applique à chaque écriture.
-- ---------------------------------------------------------------------------
create function public.set_household_preferences(
  p_household_id uuid,
  p_diets text[],
  p_allergens text[]
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Foyer inaccessible.' using errcode = '42501';
  end if;

  delete from public.household_diets where household_id = p_household_id;
  insert into public.household_diets (household_id, diet_code)
  select p_household_id, d from unnest(coalesce(p_diets, '{}')) as t(d) group by d;

  delete from public.household_exclusions
  where household_id = p_household_id and allergen_code is not null;
  insert into public.household_exclusions (household_id, allergen_code, is_allergy)
  select p_household_id, a, true from unnest(coalesce(p_allergens, '{}')) as t(a) group by a;
end;
$$;

revoke execute on function public.set_household_preferences(uuid, text[], text[]) from public, anon;
grant execute on function public.set_household_preferences(uuid, text[], text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Privilèges et RLS
-- ---------------------------------------------------------------------------
revoke all on public.household_diets, public.household_exclusions from anon, authenticated;
grant select, insert, delete on public.household_diets, public.household_exclusions to authenticated;

alter table public.household_diets enable row level security;
alter table public.household_exclusions enable row level security;

create policy household_diets_member on public.household_diets
  for all to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));

create policy household_exclusions_member on public.household_exclusions
  for all to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));
