-- ===========================================================================
-- 0039 · Questionnaire de bienvenue (première connexion)
--
-- profiles.onboarded_at : null tant que l'utilisateur n'a ni rempli ni passé le
-- questionnaire. Les comptes existants sont considérés comme déjà accueillis.
--
-- complete_onboarding : enregistre tout le questionnaire en UNE transaction
-- (foyer, semaine type, profil alimentaire, prénom, fin du questionnaire).
-- SECURITY INVOKER : la RLS s'applique ; la partie « foyer » est réservée au
-- propriétaire (un membre invité ne transmet que son prénom et le profil alimentaire).
-- Idempotent : rejouer le même appel donne le même état ; onboarded_at garde sa
-- première valeur.
-- ===========================================================================

alter table public.profiles add column onboarded_at timestamptz;

update public.profiles set onboarded_at = created_at where onboarded_at is null;

grant update (onboarded_at) on public.profiles to authenticated;

create function public.complete_onboarding(
  p_household_id uuid,
  p_display_name text,
  p_people_count smallint,
  p_weekly_budget_cents integer,
  p_max_prep_minutes smallint,
  p_meal_slots text[],
  p_meals_per_cook smallint,
  p_eating_style text,
  p_no_pork boolean,
  p_allergens text[],
  p_objectives text[],
  p_equipment text[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_household_member(p_household_id) then
    raise exception 'Foyer inaccessible.' using errcode = '42501';
  end if;

  -- Partie foyer : tout ou rien, et seulement pour le propriétaire (RLS).
  if p_people_count is not null then
    update public.households
    set people_count = p_people_count,
        weekly_budget_cents = p_weekly_budget_cents,
        max_prep_minutes = p_max_prep_minutes,
        meal_slots = p_meal_slots,
        meals_per_cook = p_meals_per_cook
    where id = p_household_id;
    if not found then
      raise exception 'Seul le propriétaire du foyer peut modifier ces réglages.'
        using errcode = '42501';
    end if;
  end if;

  perform public.set_food_profile(
    p_household_id, p_eating_style, p_no_pork, p_allergens, p_objectives, p_equipment
  );

  update public.profiles
  set display_name = coalesce(nullif(left(btrim(p_display_name), 80), ''), display_name),
      onboarded_at = coalesce(onboarded_at, now())
  where id = (select auth.uid());
end;
$$;

revoke execute on function public.complete_onboarding(
  uuid, text, smallint, integer, smallint, text[], smallint, text, boolean, text[], text[], text[]
) from public, anon;
grant execute on function public.complete_onboarding(
  uuid, text, smallint, integer, smallint, text[], smallint, text, boolean, text[], text[], text[]
) to authenticated;
