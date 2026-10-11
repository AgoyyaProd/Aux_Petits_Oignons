-- 0021 — Ajouts manuels à la liste de courses.
--
-- La liste calculée (menu − stock − placard) ne change pas. Le foyer peut y ajouter des
-- articles à la main : un ingrédient d'une recette hors menu (bouton « + » sur la fiche), ou
-- un texte libre (« sacs poubelle »). Ces ajouts :
--   - ne sont jamais fusionnés avec les besoins calculés (pas de conversion d'unité devinée :
--     la quantité est un simple texte affiché) ;
--   - ne sont pas écrasés quand le menu change ;
--   - ne rejoignent pas le garde-manger automatiquement (pas de quantité exploitable).

create table public.shopping_extras (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  ingredient_id uuid references public.ingredients (id) on delete set null,
  label text not null check (char_length(btrim(label)) between 1 and 120),
  quantity_text text check (quantity_text is null or char_length(quantity_text) <= 40),
  source_recipe_id uuid references public.recipes (id) on delete set null,
  checked boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
-- Un même ingrédient n'est ajouté qu'une fois par semaine (le « + » est idempotent).
create unique index shopping_extras_ingredient_once
  on public.shopping_extras (household_id, week_start, ingredient_id)
  where ingredient_id is not null;
create index shopping_extras_week_idx on public.shopping_extras (household_id, week_start);
create index shopping_extras_ingredient_idx on public.shopping_extras (ingredient_id);
create index shopping_extras_recipe_idx on public.shopping_extras (source_recipe_id);
create index shopping_extras_created_by_idx on public.shopping_extras (created_by);

revoke all on public.shopping_extras from anon, authenticated;
grant select, insert, delete on public.shopping_extras to authenticated;
grant update (checked, quantity_text) on public.shopping_extras to authenticated;

alter table public.shopping_extras enable row level security;

create policy shopping_extras_member on public.shopping_extras
  for all to authenticated
  using (household_id in (select public.my_household_ids()))
  with check (household_id in (select public.my_household_ids()));
