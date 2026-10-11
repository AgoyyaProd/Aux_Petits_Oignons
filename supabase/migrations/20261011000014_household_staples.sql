-- 0014 — Placard : épices, herbes, condiments et produits de base « que j'ai ».
--
-- Exception explicite et déclarée par le foyer à la règle « une quantité inconnue n'est
-- jamais comptée comme disponible » : pour ces produits utilisés en petites quantités,
-- le foyer coche simplement « j'en ai ». Ils comptent comme présents (fiche recette,
-- générateur, future liste de courses) mais n'ont pas de quantité et ne sont jamais
-- décomptés du stock. Les produits frais à quantité (beurre, crème…) restent au garde-manger.

alter table public.ingredients
  add column is_staple boolean not null default false;

comment on column public.ingredients.is_staple is
  'Peut être coché dans le placard du foyer (épices, condiments, produits de base).';

update public.ingredients set is_staple = true
where category in ('epices_herbes', 'condiments')
   or slug in (
     'huile-olive', 'huile-tournesol', 'huile-sesame',
     'sel', 'sucre', 'sucre-roux', 'sucre-glace', 'sucre-vanille', 'extrait-vanille',
     'farine', 'fecule-mais', 'levure-chimique', 'chapelure',
     'bouillon-legumes', 'bouillon-volaille', 'concentre-tomate',
     'miel', 'sirop-erable', 'graine-sesame', 'capre', 'cornichon', 'olive'
   );

create table public.household_staples (
  household_id uuid not null references public.households (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (household_id, ingredient_id)
);
create index household_staples_ingredient_idx on public.household_staples (ingredient_id);

-- Seuls les produits prévus pour le placard peuvent y être cochés.
create function public.household_staples_check()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.ingredients i where i.id = new.ingredient_id and i.is_staple
  ) then
    raise exception 'Ce produit se gère au garde-manger, avec sa quantité.' using errcode = 'AP422';
  end if;
  return new;
end;
$$;

create trigger household_staples_check
  before insert or update on public.household_staples
  for each row execute function public.household_staples_check();

revoke all on public.household_staples from anon, authenticated;
grant select, insert, delete on public.household_staples to authenticated;

alter table public.household_staples enable row level security;

create policy household_staples_member on public.household_staples
  for all to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));
