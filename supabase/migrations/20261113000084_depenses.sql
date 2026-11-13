-- 0084 — Dépenses réelles du foyer.
--
-- Ce que le foyer a vraiment payé en caisse, saisi à la main : un total de ticket par passage
-- en caisse (jamais le détail des articles), avec en option la part non alimentaire, exclue
-- de la comparaison avec le budget alimentaire.
--
-- Saisie à la fin des courses (« Finir les courses ») ou depuis la page Budget. À la fin des
-- courses, l'estimation de la liste est figée sur la ligne (estimated_*) : une fois les
-- produits rangés, la liste se recalcule à partir du stock et ne permettrait plus de
-- comparer. Ces deux montants restent des estimations, présentées comme telles.
--
-- Modifiable et supprimable par les membres du foyer (correction d'une faute de frappe) :
-- ce n'est pas le registre du stock, qui lui n'est jamais modifié.

create table public.household_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  -- Clé du formulaire : un double envoi n'enregistre qu'une dépense.
  idempotency_key uuid not null,
  -- Semaine de menu à laquelle la dépense est rattachée (lundi).
  week_start date not null check (extract(isodow from week_start) = 1),
  spent_on date not null,
  store_label text check (store_label is null or char_length(btrim(store_label)) between 1 and 60),
  -- Total payé, en centimes (jusqu'à 10 000 €).
  amount_cents integer not null check (amount_cents between 1 and 1000000),
  -- Part non alimentaire (lessive, hygiène…), comprise dans le total.
  non_food_cents integer not null default 0 check (non_food_cents >= 0),
  -- Estimation figée à la fin des courses : à payer en magasin (paquets entiers) et part
  -- de ces achats destinée aux plats du menu. Null pour une dépense saisie à part.
  estimated_store_cents integer check (estimated_store_cents >= 0),
  estimated_meals_cents integer check (estimated_meals_cents >= 0),
  -- Des produits de la liste n'avaient pas de prix : l'estimation figée est un minimum.
  estimate_is_minimum boolean not null default false,
  source text not null check (source in ('courses', 'manuel')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, idempotency_key),
  check (non_food_cents <= amount_cents),
  check (estimated_meals_cents is null or estimated_store_cents is not null),
  check (estimated_meals_cents is null or estimated_meals_cents <= estimated_store_cents),
  -- Garde-fou contre une date saisie de travers : quatre semaines autour de la semaine.
  check (spent_on between week_start - 28 and week_start + 34)
);
create index household_expenses_week_idx on public.household_expenses (household_id, week_start);
create index household_expenses_created_by_idx on public.household_expenses (created_by);

create trigger household_expenses_touch before update on public.household_expenses
  for each row execute function public.set_updated_at();

revoke all on public.household_expenses from anon, authenticated;
grant select, insert, delete on public.household_expenses to authenticated;
-- Seuls le montant, sa part non alimentaire, la date et le magasin se corrigent ; l'estimation
-- figée et le rattachement au foyer ne bougent pas.
grant update (amount_cents, non_food_cents, spent_on, store_label) on public.household_expenses
  to authenticated;

alter table public.household_expenses enable row level security;

create policy household_expenses_member on public.household_expenses
  for all to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));
