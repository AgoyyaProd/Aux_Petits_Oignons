-- 0097 — Nouveaux produits :
--   Farine de gruau (« spéciale viennoiseries ») : farine blanche de type T45, plus riche en
--     protéines (gluten) pour la pâte levée feuilletée et les brioches. Variante de la farine
--     de blé (une recette « farine » l'accepte). Ciqual n'a pas de gruau : valeurs de la
--     farine T45 (9440). Prix suivi comme la farine.
--   Graines de chia (Ciqual 15047). Pas un allergène réglementaire.

insert into public.ingredients (slug, name, category, default_dimension, is_validated, parent_id)
select v.slug, v.name, v.category, 'mass', true, p.id
from (values
  ('farine-gruau', 'Farine de gruau (spéciale viennoiseries)', 'feculents', 'farine'),
  ('graine-chia', 'Graines de chia', 'epicerie_sucree', null)
) as v(slug, name, category, parent)
left join public.ingredients p on p.slug = v.parent;

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('farine de gruau', 'farine-gruau'),
  ('farine gruau', 'farine-gruau'),
  ('gruau', 'farine-gruau'),
  ('farine t45 gruau', 'farine-gruau'),
  ('farine viennoiserie', 'farine-gruau'),
  ('farine viennoiseries', 'farine-gruau'),
  ('farine speciale viennoiseries', 'farine-gruau'),
  ('farine speciale viennoiserie', 'farine-gruau'),
  ('farine brioche', 'farine-gruau'),
  ('graines de chia', 'graine-chia'),
  ('graine de chia', 'graine-chia'),
  ('chia', 'graine-chia')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, 'gluten' from public.ingredients i where i.slug = 'farine-gruau';

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values
  ('farine-gruau', 9440, 'Farine de blé tendre ou froment T45 (pour pâtisserie)', 355.0, 8.44, 76.5, 0.44, 0.82, 0.13, 2.5, 0.098),
  ('graine-chia', 15047, 'Chia, graine, séchée', 454.0, 16.5, 7.72, null, 30.7, 3.33, 34.4, 0.04)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select t.id, f.kind, f.tags, f.approximate
from public.ingredients t, public.ingredient_price_sources f
join public.ingredients fi on fi.id = f.ingredient_id and fi.slug = 'farine'
where t.slug = 'farine-gruau';
insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'none', array[]::text[], false from public.ingredients i where i.slug = 'graine-chia';

do $$
begin
  if (select count(*) from public.ingredient_price_sources s join public.ingredients i on i.id = s.ingredient_id
      join public.ingredient_nutrition n on n.ingredient_id = i.id
      where i.slug in ('farine-gruau', 'graine-chia')) <> 2 then
    raise exception 'Nouveaux produits incomplets.';
  end if;
end;
$$;
