-- 0062 — Riz thaï classique et riz parfumé au jasmin, deux ingrédients distincts.
--
-- « Riz thaï (jasmin) » regroupait les deux. Le slug `riz-thai` devient le riz thaï classique
-- (long grain, non parfumé) : ses 9 recettes, le garde-manger et l'historique restent tels
-- quels. Le nouveau « Riz parfumé au jasmin » (`riz-jasmin`) est, comme lui, une variante du
-- riz : un paquet de l'un ou de l'autre couvre les recettes au riz, mais pas celles qui
-- demandent l'autre variété.
--
-- Noms : « riz jasmin », « riz parfumé » et « riz thaï jasmin » mènent désormais au jasmin ;
-- « riz thaï » reste au classique.
-- Nutrition : Ciqual 2025, 9119 « Riz thaï ou basmati, cru », la même pour les deux.
-- Prix : la catégorie Open Prices en:jasmine-rice passe au jasmin, avec le prix de référence
-- déjà calculé sur elle. Le riz thaï classique reprend les catégories du riz long blanc
-- (en:long-grain-rices, en:white-rices), signalées comme approchantes, et le prix de
-- référence du riz ; la synchronisation des prix le recalculera de la même façon.

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple, parent_id)
select 'riz-jasmin', 'Riz parfumé au jasmin', 'feculents', 'mass', null, null, true, false, p.id
from public.ingredients p where p.slug = 'riz';

update public.ingredients set name = 'Riz thaï' where slug = 'riz-thai';

-- Les noms qui désignent le jasmin quittent le riz thaï classique.
update public.ingredient_aliases a set ingredient_id = j.id
from public.ingredients j, public.ingredients t
where j.slug = 'riz-jasmin' and t.slug = 'riz-thai' and a.ingredient_id = t.id
  and a.alias_normalized in (public.normalize_alias('riz thai jasmin'),
    public.normalize_alias('riz parfume'), public.normalize_alias('riz jasmin'));

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('riz parfume au jasmin', 'riz-jasmin'),
  ('riz jasmin thai', 'riz-jasmin'),
  ('riz thai parfume', 'riz-jasmin'),
  ('riz hom mali', 'riz-jasmin'),
  ('jasmin', 'riz-jasmin'),
  ('riz thai classique', 'riz-thai'),
  ('riz long grain thai', 'riz-thai'),
  ('riz thai long grain', 'riz-thai')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'product', array['en:jasmine-rice'], false
from public.ingredients i where i.slug = 'riz-jasmin';

update public.ingredient_price_sources s
set tags = array['en:long-grain-rices', 'en:white-rices'], approximate = true
from public.ingredients i where i.id = s.ingredient_id and i.slug = 'riz-thai';

-- Prix de référence : celui calculé sur en:jasmine-rice va au jasmin ; le riz thaï classique
-- reprend celui du riz long blanc.
insert into public.reference_prices (ingredient_id, source, dimension, cents_per_ref,
  sample_size, observed_from, observed_to, computed_at)
select j.id, rp.source, rp.dimension, rp.cents_per_ref, rp.sample_size, rp.observed_from,
  rp.observed_to, rp.computed_at
from public.reference_prices rp
join public.ingredients t on t.id = rp.ingredient_id and t.slug = 'riz-thai'
cross join public.ingredients j where j.slug = 'riz-jasmin';

update public.reference_prices t
set cents_per_ref = r.cents_per_ref, sample_size = r.sample_size, observed_from = r.observed_from,
  observed_to = r.observed_to, computed_at = r.computed_at
from public.reference_prices r
where r.ingredient_id = (select id from public.ingredients where slug = 'riz')
  and t.ingredient_id = (select id from public.ingredients where slug = 'riz-thai')
  and t.source = r.source and t.dimension = r.dimension;

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select j.id, n.ciqual_code, n.ciqual_name, n.kcal, n.proteins_g, n.carbs_g, n.sugars_g,
  n.fat_g, n.saturated_fat_g, n.fiber_g, n.salt_g
from public.ingredient_nutrition n
join public.ingredients t on t.id = n.ingredient_id and t.slug = 'riz-thai'
cross join public.ingredients j where j.slug = 'riz-jasmin';
