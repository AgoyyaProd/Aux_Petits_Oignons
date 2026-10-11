-- 0017 — Variantes d'ingrédients (types de pâtes, de riz, pommes de terre grenaille),
-- pâtes à lasagne, et synonymes supplémentaires.
--
-- Une variante (ex. Farfalle) a un parent (Pâtes) de même dimension. Au garde-manger, on
-- garde le nom précis ; pour une recette qui demande le parent (« Pâtes »), le stock des
-- variantes compte (couverture, liste de courses, décompte en cuisinant). Une recette qui
-- demande une variante précise n'accepte qu'elle. Un seul niveau : pas de variante de variante.
-- Les pâtes à lasagne sont un ingrédient à part (on ne les utilise pas pour une salade de pâtes).

alter table public.ingredients
  add column parent_id uuid references public.ingredients (id) on delete no action,
  add constraint ingredients_parent_not_self check (parent_id is null or parent_id <> id);
create index ingredients_parent_idx on public.ingredients (parent_id);

create function public.ingredients_parent_check()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_parent public.ingredients%rowtype;
begin
  if new.parent_id is null then
    return new;
  end if;
  select * into v_parent from public.ingredients where id = new.parent_id;
  if v_parent.parent_id is not null then
    raise exception 'Une variante ne peut pas avoir elle-même de variante.' using errcode = 'AP422';
  end if;
  if v_parent.default_dimension <> new.default_dimension then
    raise exception 'Une variante a la même dimension que son parent.' using errcode = 'AP422';
  end if;
  if exists (select 1 from public.ingredients c where c.parent_id = new.id) then
    raise exception 'Un ingrédient qui a des variantes ne peut pas devenir une variante.'
      using errcode = 'AP422';
  end if;
  return new;
end;
$$;

create trigger ingredients_parent_check
  before insert or update of parent_id, default_dimension on public.ingredients
  for each row execute function public.ingredients_parent_check();

-- Nouveaux ingrédients : catégorie et dimension héritées du parent.
insert into public.ingredients
  (slug, name, category, default_dimension, density_g_per_ml, piece_weight_g, is_validated, parent_id)
select v.slug, v.name, coalesce(p.category, 'feculents'), coalesce(p.default_dimension, 'mass'),
       null, v.piece, true, case when v.is_variant then p.id end
from (values
  ('spaghetti', 'Spaghetti', 'pates', null::numeric, true),
  ('penne', 'Penne', 'pates', null, true),
  ('farfalle', 'Farfalle', 'pates', null, true),
  ('coquillettes', 'Coquillettes', 'pates', null, true),
  ('fusilli', 'Fusilli', 'pates', null, true),
  ('tagliatelles', 'Tagliatelles', 'pates', null, true),
  ('macaronis', 'Macaronis', 'pates', null, true),
  ('linguine', 'Linguine', 'pates', null, true),
  ('rigatoni', 'Rigatoni', 'pates', null, true),
  ('riz-basmati', 'Riz basmati', 'riz', null, true),
  ('riz-thai', 'Riz thaï (jasmin)', 'riz', null, true),
  ('riz-etuve', 'Riz étuvé', 'riz', null, true),
  ('riz-arborio', 'Riz arborio', 'riz-rond', null, true),
  ('pomme-de-terre-grenaille', 'Pomme de terre grenaille', 'pomme-de-terre', 30, true),
  -- Ingrédient à part entière, pas une variante des pâtes.
  ('pates-lasagne', 'Pâtes à lasagne', 'pates', null, false)
) as v(slug, name, parent, piece, is_variant)
join public.ingredients p on p.slug = v.parent;

-- Synonymes : créés, ou déplacés vers la variante (ex. « spaghetti » désignait « Pâtes »).
insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select v.alias, i.id
from (values
  ('spaghetti', 'spaghetti'), ('spaghettis', 'spaghetti'),
  ('penne', 'penne'), ('pennes', 'penne'), ('penne rigate', 'penne'),
  ('farfalle', 'farfalle'), ('farfalles', 'farfalle'), ('papillons', 'farfalle'),
  ('coquillettes', 'coquillettes'), ('coquillette', 'coquillettes'),
  ('fusilli', 'fusilli'), ('fusillis', 'fusilli'), ('torsades', 'fusilli'),
  ('tagliatelles', 'tagliatelles'), ('tagliatelle', 'tagliatelles'),
  ('macaroni', 'macaronis'), ('macaronis', 'macaronis'),
  ('linguine', 'linguine'), ('linguines', 'linguine'),
  ('rigatoni', 'rigatoni'), ('rigatonis', 'rigatoni'),
  ('riz basmati', 'riz-basmati'), ('basmati', 'riz-basmati'),
  ('riz thai', 'riz-thai'), ('riz jasmin', 'riz-thai'), ('riz parfume', 'riz-thai'),
  ('riz etuve', 'riz-etuve'),
  ('riz arborio', 'riz-arborio'), ('arborio', 'riz-arborio'),
  ('grenaille', 'pomme-de-terre-grenaille'), ('grenailles', 'pomme-de-terre-grenaille'),
  ('pommes de terre grenaille', 'pomme-de-terre-grenaille'),
  ('pdt grenaille', 'pomme-de-terre-grenaille'),
  ('lasagne', 'pates-lasagne'), ('lasagnes', 'pates-lasagne'),
  ('pate a lasagne', 'pates-lasagne'), ('pates a lasagnes', 'pates-lasagne'),
  ('plaques de lasagne', 'pates-lasagne'), ('feuilles de lasagne', 'pates-lasagne'),
  ('oeuf frais', 'oeuf'), ('oeufs frais', 'oeuf'), ('oeuf de poule', 'oeuf'),
  ('oeufs de poule', 'oeuf'), ('oeufs plein air', 'oeuf')
) as v(alias, slug)
join public.ingredients i on i.slug = v.slug
on conflict (alias_normalized) do update set ingredient_id = excluded.ingredient_id;

-- Allergènes et régimes : ceux du parent (les pâtes à lasagne reprennent ceux des pâtes).
insert into public.ingredient_allergens (ingredient_id, allergen_code)
select c.id, a.allergen_code
from public.ingredients c
join public.ingredients p on p.slug = case when c.slug = 'pates-lasagne' then 'pates' end
  or p.id = c.parent_id
join public.ingredient_allergens a on a.ingredient_id = p.id
where c.slug in ('spaghetti', 'penne', 'farfalle', 'coquillettes', 'fusilli', 'tagliatelles',
  'macaronis', 'linguine', 'rigatoni', 'riz-basmati', 'riz-thai', 'riz-etuve', 'riz-arborio',
  'pomme-de-terre-grenaille', 'pates-lasagne')
on conflict do nothing;

insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)
select c.id, d.diet_code
from public.ingredients c
join public.ingredients p on p.slug = case when c.slug = 'pates-lasagne' then 'pates' end
  or p.id = c.parent_id
join public.ingredient_diet_conflicts d on d.ingredient_id = p.id
where c.slug in ('spaghetti', 'penne', 'farfalle', 'coquillettes', 'fusilli', 'tagliatelles',
  'macaronis', 'linguine', 'rigatoni', 'riz-basmati', 'riz-thai', 'riz-etuve', 'riz-arborio',
  'pomme-de-terre-grenaille', 'pates-lasagne')
on conflict do nothing;

-- Prix : catégorie Open Prices précise quand elle existe ; sinon (none) le prix du parent
-- sert d'estimation, signalée comme approchante à l'affichage.
insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, v.kind, v.tags, false
from (values
  ('spaghetti', 'product', array['en:spaghetti']),
  ('penne', 'product', array['en:penne']),
  ('farfalle', 'product', array['fr:farfalles']),
  ('coquillettes', 'none', '{}'::text[]),
  ('fusilli', 'product', array['en:fusilli']),
  ('tagliatelles', 'product', array['en:tagliatelle']),
  ('macaronis', 'product', array['en:durum-wheat-macaroni']),
  ('linguine', 'product', array['en:linguine']),
  ('rigatoni', 'product', array['en:rigatoni']),
  ('riz-basmati', 'product', array['en:basmati-rices']),
  ('riz-thai', 'product', array['en:jasmine-rice']),
  ('riz-etuve', 'product', array['en:parboiled-rices']),
  ('riz-arborio', 'product', array['en:arborio-rices']),
  ('pomme-de-terre-grenaille', 'product', array['en:grenaille-potatoes', 'en:new-potatoes']),
  ('pates-lasagne', 'product', array['en:lasagna-sheets'])
) as v(slug, kind, tags)
join public.ingredients i on i.slug = v.slug;
