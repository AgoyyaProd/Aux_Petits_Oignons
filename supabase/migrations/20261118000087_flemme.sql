-- 0087 — « Recettes de la flemme » : rayon surgelés et soirs flemme.
--
-- 1. ingredients.is_frozen : produit vendu surgelé. La catégorie reste celle de l'aliment
--    (des haricots verts surgelés restent des légumes pour l'équilibre et la variété du
--    menu) ; la liste de courses les regroupe au rayon « Surgelés » et le rangement propose
--    le congélateur. Les petits pois du référentiel sont déjà comptés surgelés (Ciqual).
-- 2. household_food_profile.lazy_nights : nombre de soirs par semaine (0 à 3) où le menu
--    place en priorité une recette « flemme » (tag des recettes). Une préférence : sans
--    recette flemme compatible, le menu se remplit normalement.

alter table public.ingredients
  add column is_frozen boolean not null default false;

update public.ingredients set is_frozen = true where slug = 'petit-pois';

alter table public.household_food_profile
  add column lazy_nights smallint not null default 0
    check (lazy_nights between 0 and 3);

create function public.set_lazy_nights(p_household_id uuid, p_count smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer inaccessible.' using errcode = '42501';
  end if;
  if p_count is null or p_count < 0 or p_count > 3 then
    raise exception 'Entre 0 et 3 soirs.' using errcode = 'AP422';
  end if;
  insert into public.household_food_profile (household_id, lazy_nights)
  values (p_household_id, p_count)
  on conflict (household_id) do update set lazy_nights = excluded.lazy_nights;
end;
$$;

revoke all on function public.set_lazy_nights(uuid, smallint) from public, anon;
grant execute on function public.set_lazy_nights(uuid, smallint) to authenticated;
