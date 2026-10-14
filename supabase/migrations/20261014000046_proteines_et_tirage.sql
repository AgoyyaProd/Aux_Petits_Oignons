-- 0046 — Objectif de protéines par part et mémoire des plats écartés.
--
-- 1. household_food_profile.protein_target_g : objectif du foyer en grammes de protéines par
--    part (null = pas d'objectif). Le générateur favorise les plats qui l'atteignent, le menu
--    affiche la jauge. Une préférence, jamais un filtre.
-- 2. recipe_skips : chaque « Changer » note le plat écarté ; le tirage les propose moins
--    pendant quelques semaines. Données du foyer, lisibles et ajoutées par ses membres.

alter table public.household_food_profile
  add column protein_target_g smallint
    check (protein_target_g is null or protein_target_g between 5 and 100);

create function public.set_protein_target(p_household_id uuid, p_grams smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer inaccessible.' using errcode = '42501';
  end if;
  if p_grams is not null and (p_grams < 5 or p_grams > 100) then
    raise exception 'Objectif entre 5 et 100 g.' using errcode = 'AP422';
  end if;
  insert into public.household_food_profile (household_id, protein_target_g)
  values (p_household_id, p_grams)
  on conflict (household_id) do update set protein_target_g = excluded.protein_target_g;
end;
$$;

revoke all on function public.set_protein_target(uuid, smallint) from public, anon;
grant execute on function public.set_protein_target(uuid, smallint) to authenticated;

create table public.recipe_skips (
  id bigint generated always as identity primary key,
  household_id uuid not null references public.households (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  skipped_at timestamptz not null default now()
);
create index recipe_skips_household_idx on public.recipe_skips (household_id, skipped_at desc);

revoke all on public.recipe_skips from anon, authenticated;
grant select, insert on public.recipe_skips to authenticated;
alter table public.recipe_skips enable row level security;

create policy recipe_skips_member_read on public.recipe_skips
  for select to authenticated
  using (household_id in (select public.my_household_ids()));
create policy recipe_skips_member_insert on public.recipe_skips
  for insert to authenticated
  with check (household_id in (select public.my_household_ids()));
