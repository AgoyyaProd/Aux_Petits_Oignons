-- 0099 — Choux de Bruxelles, frais (Ciqual 20058) et surgelés (Ciqual 20206, rayon surgelés).
-- Les surgelés sont une variante des frais : une recette « choux de Bruxelles » les accepte
-- en stock (ils se cuisent pareil, sans parage). Prix : saisie du foyer ou tickets de caisse.

insert into public.ingredients (slug, name, category, default_dimension, is_validated, is_frozen)
values
  ('chou-bruxelles', 'Choux de Bruxelles', 'legumes', 'mass', true, false),
  ('chou-bruxelles-surgele', 'Choux de Bruxelles surgelés', 'legumes', 'mass', true, true);

update public.ingredients c set parent_id = p.id
from public.ingredients p
where c.slug = 'chou-bruxelles-surgele' and p.slug = 'chou-bruxelles';

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('choux de bruxelles', 'chou-bruxelles'),
  ('chou de bruxelles', 'chou-bruxelles'),
  ('choux bruxelles', 'chou-bruxelles'),
  ('choux de bruxelles surgeles', 'chou-bruxelles-surgele'),
  ('chou de bruxelles surgele', 'chou-bruxelles-surgele')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values
  ('chou-bruxelles', 20058, 'Chou de Bruxelles, cru', 43.9, 3.38, 4.59, 2.2, 0.3, 0.062, 3.8, 0.063),
  ('chou-bruxelles-surgele', 20206, 'Chou de Bruxelles, surgelé, cru', 45.2, 3.78, 4.69, 2.35, 0.41, 0.084, 3.8, 0.025)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'none', array[]::text[], false from public.ingredients i
where i.slug in ('chou-bruxelles', 'chou-bruxelles-surgele');
