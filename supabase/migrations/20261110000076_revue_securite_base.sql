-- 0076 — Suites de la revue de code (10/11/2026) côté base.
--
-- 1. Journal des erreurs : quotas séparés. Le plafond de 300 signalements par heure était
--    commun à tout le site : des appels anonymes en boucle pouvaient le remplir et masquer
--    les erreurs des utilisateurs connectés. Désormais 300 par heure pour les signalements
--    d'utilisateurs connectés, 200 par heure pour les anonymes (pages publiques et erreurs
--    serveur), comptés à part. Nouvelle colonne `signed_in`.
-- 2. Invitation : l'adresse du compte doit être confirmée en plus d'être identique à celle
--    de l'invitation (défense en profondeur si la confirmation d'e-mail était désactivée).
-- 3. Politiques d'écriture des administrateurs : « for all » s'ajoutait aux politiques de
--    lecture à chaque SELECT (avertissement de performance). Elles sont découpées en
--    insertion, modification et suppression, avec la même condition ; la lecture reste
--    couverte par les politiques de lecture existantes.
-- 4. Index sur stock_movements.ingredient_id (clé étrangère sans index).

-- 1. ------------------------------------------------------------------------------------------
alter table public.app_errors add column signed_in boolean not null default false;

create or replace function public.report_app_error(
  p_kind text,
  p_message text,
  p_digest text default null,
  p_path text default null,
  p_release text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_signed_in boolean := (select auth.uid()) is not null;
begin
  if p_kind is null or p_kind not in ('server', 'client') then
    return;
  end if;
  if (select count(*) from public.app_errors
      where occurred_at > now() - interval '1 hour' and signed_in = v_signed_in)
     >= (case when v_signed_in then 300 else 200 end) then
    return;
  end if;
  insert into public.app_errors (kind, message, digest, path, release, signed_in)
  values (
    p_kind,
    left(coalesce(nullif(btrim(p_message), ''), 'Erreur sans message'), 500),
    left(nullif(btrim(p_digest), ''), 100),
    left(nullif(split_part(split_part(btrim(p_path), '?', 1), '#', 1), ''), 200),
    left(nullif(btrim(p_release), ''), 40),
    v_signed_in
  );
end;
$$;

-- 2. ------------------------------------------------------------------------------------------
create or replace function public.accept_household_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed timestamptz;
  v_inv public.household_invitations%rowtype;
begin
  if v_uid is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select u.email, u.email_confirmed_at into v_email, v_confirmed from auth.users u where u.id = v_uid;

  select * into v_inv
  from public.household_invitations i
  where i.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
  for update;

  -- Message identique dans tous les cas d'échec : ne révèle pas l'existence du jeton.
  if not found
     or v_inv.accepted_at is not null
     or v_inv.expires_at < now()
     or v_confirmed is null
     or lower(v_inv.email::text) <> lower(coalesce(v_email, '')) then
    raise exception 'Invitation invalide ou expirée.' using errcode = '22023';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (v_inv.household_id, v_uid, 'member')
  on conflict (household_id, user_id) do nothing;

  update public.household_invitations
  set accepted_at = now(), accepted_by = v_uid
  where id = v_inv.id;

  update public.profiles set active_household_id = v_inv.household_id where id = v_uid;

  return v_inv.household_id;
end;
$$;

-- 3. ------------------------------------------------------------------------------------------
do $$
declare
  v record;
  v_cond text;
begin
  for v in
    select * from (values
      ('ingredient_aliases', 'aliases_admin_write'),
      ('ingredient_allergens', 'ing_allergens_admin_write'),
      ('ingredient_diet_conflicts', 'ing_diets_admin_write'),
      ('ingredient_price_sources', 'price_sources_admin_write'),
      ('ingredients', 'ingredients_admin_write'),
      ('recipe_ingredients', 'recipe_ingredients_admin_write'),
      ('recipe_steps', 'recipe_steps_admin_write'),
      ('recipes', 'recipes_admin_write'),
      ('reference_prices', 'reference_prices_admin_write')
    ) as t(tbl, pol)
  loop
    v_cond := case when v.tbl = 'recipes'
      then '(select public.is_app_admin()) and household_id is null'
      else '(select public.is_app_admin())' end;
    execute format('drop policy %I on public.%I', v.pol, v.tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check (%s)',
      v.pol || '_insert', v.tbl, v_cond);
    execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)',
      v.pol || '_update', v.tbl, v_cond, v_cond);
    execute format('create policy %I on public.%I for delete to authenticated using (%s)',
      v.pol || '_delete', v.tbl, v_cond);
  end loop;
end;
$$;

-- 4. ------------------------------------------------------------------------------------------
create index stock_movements_ingredient_idx on public.stock_movements (ingredient_id);
