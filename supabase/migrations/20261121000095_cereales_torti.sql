-- 0095 — Nouveaux produits du référentiel :
--   Mélange de céréales (riz, blé, sarrasin) : sachet du rayon riz, composition variable selon
--     la marque. Aucun aliment Ciqual équivalent (le plus proche mêle des légumes secs) : pas
--     de valeurs nutritionnelles plutôt que des valeurs inventées. Gluten (blé).
--   Blé dur précuit (Ciqual 9080) et sarrasin en grains (Ciqual 9380), vendus seuls.
--   Pâtes torti : variante des pâtes (une recette « pâtes » accepte des torti en stock),
--     Ciqual 9810 comme les autres pâtes sèches ; prix suivi comme les fusilli.

insert into public.ingredients (slug, name, category, default_dimension, is_validated, parent_id)
select v.slug, v.name, 'feculents', 'mass', true, p.id
from (values
  ('melange-cereales', 'Mélange de céréales (riz, blé, sarrasin)', null),
  ('ble-precuit', 'Blé dur précuit', null),
  ('sarrasin', 'Sarrasin en grains', null),
  ('pates-torti', 'Torti', 'pates')
) as v(slug, name, parent)
left join public.ingredients p on p.slug = v.parent;

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('melange de cereales', 'melange-cereales'),
  ('cereales riz ble sarrasin', 'melange-cereales'),
  ('melange riz ble sarrasin', 'melange-cereales'),
  ('cereales gourmandes', 'melange-cereales'),
  ('melange cereales', 'melange-cereales'),
  ('ble precuit', 'ble-precuit'),
  ('ble dur', 'ble-precuit'),
  ('ble dur precuit', 'ble-precuit'),
  ('ble a cuire', 'ble-precuit'),
  ('sarrasin', 'sarrasin'),
  ('graines de sarrasin', 'sarrasin'),
  ('kasha', 'sarrasin'),
  ('ble noir', 'sarrasin'),
  ('torti', 'pates-torti'),
  ('tortis', 'pates-torti'),
  ('pates torti', 'pates-torti')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, 'gluten' from public.ingredients i
where i.slug in ('melange-cereales', 'ble-precuit', 'pates-torti');

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values
  ('ble-precuit', 9080, 'Blé dur complet, précuit, à cuire', 359.0, 13.7, 67.7, 0.83, 1.83, 0.37, 6.67, 0.01),
  ('sarrasin', 9380, 'Sarrasin complet, cru', 362.0, 13.3, 67.5, null, 3.4, 0.74, 4.0, 0.0025),
  ('pates-torti', 9810, 'Pâtes sèches, standard, crues', 364.0, 12.0, 72.7, 2.58, 1.6, 0.33, 2.91, 0.016)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;

-- Prix : les torti suivent les fusilli (même rayon) ; les autres, saisie du foyer.
insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select t.id, f.kind, f.tags, f.approximate
from public.ingredients t, public.ingredient_price_sources f
join public.ingredients fi on fi.id = f.ingredient_id and fi.slug = 'fusilli'
where t.slug = 'pates-torti';
insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'none', array[]::text[], false from public.ingredients i
where i.slug in ('melange-cereales', 'ble-precuit', 'sarrasin');

do $$
begin
  if (select count(*) from public.ingredients where slug in
      ('melange-cereales', 'ble-precuit', 'sarrasin', 'pates-torti')) <> 4
     or (select count(*) from public.ingredient_price_sources s join public.ingredients i on i.id = s.ingredient_id
         where i.slug in ('melange-cereales', 'ble-precuit', 'sarrasin', 'pates-torti')) <> 4 then
    raise exception 'Nouveaux produits incomplets.';
  end if;
end;
$$;
