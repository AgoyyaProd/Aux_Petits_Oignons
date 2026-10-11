-- 0002 — Foyers, profils, membres, invitations, administrateurs.
-- Toute table est créée avec sa RLS activée dans la même migration.

-- ===========================================================================
-- Tables
-- ===========================================================================
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  people_count smallint not null default 2 check (people_count between 1 and 20),
  weekly_budget_cents integer check (weekly_budget_cents between 0 and 10000000),
  currency char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Europe/Paris'
    check (timezone ~ '^[A-Za-z_]+(/[A-Za-z0-9_+-]+)*$'),
  max_prep_minutes smallint check (max_prep_minutes between 5 and 600),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  active_household_id uuid references public.households (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_active_household_idx on public.profiles (active_household_id);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on public.household_members (user_id);

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  email extensions.citext not null,
  token_hash text not null unique,              -- SHA-256 hexadécimal ; le jeton clair n'est jamais stocké
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index household_invitations_household_idx on public.household_invitations (household_id);

-- Administrateurs du catalogue public (décision D4). Aucun accès client.
create table public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create trigger households_set_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Fonctions d'autorisation (SECURITY DEFINER : lisent household_members sans
-- déclencher sa propre RLS, ce qui évite toute récursion entre politiques).
-- ===========================================================================
create function public.my_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.household_id
  from public.household_members m
  where m.user_id = (select auth.uid());
$$;

create function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid and m.user_id = (select auth.uid())
  );
$$;

create function public.is_household_owner(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = hid
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$$;

create function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_admins a where a.user_id = (select auth.uid()));
$$;

-- ===========================================================================
-- Inscription : profil + foyer par défaut + adhésion owner, en une transaction.
-- ===========================================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_display_name text;
begin
  v_display_name := nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 80), '');

  insert into public.households (name, created_by)
  values ('Mon foyer', new.id)
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, new.id, 'owner');

  insert into public.profiles (id, display_name, active_household_id)
  values (new.id, v_display_name, v_household_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- Invitations : le propriétaire obtient un jeton à usage unique (7 jours).
-- ===========================================================================
create function public.create_household_invitation(p_household_id uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  if not public.is_household_owner(p_household_id) then
    raise exception 'Seul le propriétaire du foyer peut inviter.' using errcode = '42501';
  end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Adresse e-mail invalide.' using errcode = '22023';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.household_invitations (household_id, email, token_hash, expires_at, created_by)
  values (
    p_household_id,
    lower(btrim(p_email)),
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    now() + interval '7 days',
    (select auth.uid())
  );

  return v_token;
end;
$$;

create function public.accept_household_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_inv public.household_invitations%rowtype;
begin
  if v_uid is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;

  select * into v_inv
  from public.household_invitations i
  where i.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
  for update;

  -- Message identique dans tous les cas d'échec : ne révèle pas l'existence du jeton.
  if not found
     or v_inv.accepted_at is not null
     or v_inv.expires_at < now()
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

-- ===========================================================================
-- Droits d'exécution : rien pour anon ni PUBLIC.
-- ===========================================================================
revoke execute on function public.my_household_ids() from public, anon;
revoke execute on function public.is_household_member(uuid) from public, anon;
revoke execute on function public.is_household_owner(uuid) from public, anon;
revoke execute on function public.is_app_admin() from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.create_household_invitation(uuid, text) from public, anon;
revoke execute on function public.accept_household_invitation(text) from public, anon;

grant execute on function public.my_household_ids() to authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;
grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.create_household_invitation(uuid, text) to authenticated;
grant execute on function public.accept_household_invitation(text) to authenticated;

-- ===========================================================================
-- Privilèges de table : anon n'a rien ; authenticated n'a que ce qui sert.
-- Les colonnes modifiables sont listées explicitement.
-- ===========================================================================
revoke all on public.households, public.profiles, public.household_members,
  public.household_invitations, public.app_admins from anon, authenticated;

grant select on public.households to authenticated;
grant update (name, people_count, weekly_budget_cents, currency, timezone, max_prep_minutes)
  on public.households to authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, active_household_id) on public.profiles to authenticated;

grant select, delete on public.household_members to authenticated;
grant select, delete on public.household_invitations to authenticated;
-- app_admins : aucun privilège client.

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.app_admins enable row level security;

-- households
create policy households_select_member on public.households
  for select to authenticated
  using (id in (select public.my_household_ids()));
create policy households_update_owner on public.households
  for update to authenticated
  using ((select public.is_household_owner(id)))
  with check ((select public.is_household_owner(id)));
-- Pas d'insert ni de delete côté client : création par le trigger d'inscription.

-- profiles : soi-même, et les membres de ses foyers (nom affiché).
create policy profiles_select_self_or_comember on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or id in (
      select m.user_id from public.household_members m
      where m.household_id in (select public.my_household_ids())
    )
  );
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and (active_household_id is null
         or active_household_id in (select public.my_household_ids()))
  );

-- household_members
create policy members_select_same_household on public.household_members
  for select to authenticated
  using (household_id in (select public.my_household_ids()));
-- Le propriétaire retire un autre membre ; un membre simple peut partir.
-- Un propriétaire ne peut pas se retirer lui-même (évite un foyer sans propriétaire).
create policy members_delete on public.household_members
  for delete to authenticated
  using (
    ((select public.is_household_owner(household_id)) and user_id <> (select auth.uid()))
    or (user_id = (select auth.uid()) and role = 'member')
  );

-- household_invitations : visibles et révocables par le propriétaire uniquement.
create policy invitations_select_owner on public.household_invitations
  for select to authenticated
  using ((select public.is_household_owner(household_id)));
create policy invitations_delete_owner on public.household_invitations
  for delete to authenticated
  using ((select public.is_household_owner(household_id)));

-- app_admins : RLS activée sans politique = aucun accès client.
