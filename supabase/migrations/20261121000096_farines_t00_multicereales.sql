-- 0096 — Nouvelles farines :
--   Farine T00 (« tipo 00 », mouture italienne la plus fine) : variante de la farine de blé
--     (une recette « farine » l'accepte en stock). Ciqual n'a pas de tipo 00 : valeurs de la
--     farine T45 (9440), la plus proche par le taux de cendres. Prix suivi comme la farine.
--   Farine multi-céréales : mélange variable selon la marque (blé, seigle, orge, avoine,
--     graines…) ; pas d'aliment Ciqual équivalent, donc pas de valeurs nutritionnelles plutôt
--     que des valeurs inventées. Gluten. Pas une variante : elle ne se substitue pas à la
--     farine blanche dans une pâtisserie.

insert into public.ingredients (slug, name, category, default_dimension, is_validated, parent_id)
select v.slug, v.name, 'feculents', 'mass', true, p.id
from (values
  ('farine-t00', 'Farine T00 (tipo 00)', 'farine'),
  ('farine-multicereales', 'Farine multi-céréales', null)
) as v(slug, name, parent)
left join public.ingredients p on p.slug = v.parent;

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('farine t00', 'farine-t00'),
  ('farine tipo 00', 'farine-t00'),
  ('farine 00', 'farine-t00'),
  ('tipo 00', 'farine-t00'),
  ('farine pizza', 'farine-t00'),
  ('farine multi cereales', 'farine-multicereales'),
  ('farine multicereales', 'farine-multicereales'),
  ('farine aux cereales', 'farine-multicereales'),
  ('farine 5 cereales', 'farine-multicereales'),
  ('farine pain aux cereales', 'farine-multicereales')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, 'gluten' from public.ingredients i
where i.slug in ('farine-t00', 'farine-multicereales');

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, 9440, 'Farine de blé tendre ou froment T45 (pour pâtisserie)', 355.0, 8.44, 76.5,
  0.44, 0.82, 0.13, 2.5, 0.098
from public.ingredients i where i.slug = 'farine-t00';

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select t.id, f.kind, f.tags, f.approximate
from public.ingredients t, public.ingredient_price_sources f
join public.ingredients fi on fi.id = f.ingredient_id and fi.slug = 'farine'
where t.slug = 'farine-t00';
insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'none', array[]::text[], false from public.ingredients i
where i.slug = 'farine-multicereales';

do $$
begin
  if (select count(*) from public.ingredient_price_sources s join public.ingredients i on i.id = s.ingredient_id
      where i.slug in ('farine-t00', 'farine-multicereales')) <> 2 then
    raise exception 'Nouvelles farines incomplètes.';
  end if;
end;
$$;
