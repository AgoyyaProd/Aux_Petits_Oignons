-- 0068 — Épicerie asiatique : six produits pour une deuxième série de recettes asiatiques.
--
-- Sauce d'huître et nuoc-mâm (sauce de poisson) : en volume. Densité 1,217 g/ml d'après
-- l'USDA (FoodData Central, SR Legacy) : 1 c. à soupe (14,79 ml) = 18 g pour « Sauce, oyster,
-- ready-to-serve » (174529) et « Sauce, fish, ready-to-serve » (174531), d'après le rapport
-- entre les valeurs par cuillère et pour 100 g.
-- Miso, nouilles chinoises aux œufs, pak choï et pousses de soja (haricot mungo) : en masse.
-- Allergènes : sauce d'huître = mollusques, et gluten car la plupart des marques contiennent
-- de l'amidon ou de la farine de blé ; nuoc-mâm = poisson ; miso = soja ; nouilles aux œufs =
-- gluten et œufs. Les pousses « de soja » sont des graines germées de haricot mungo : pas
-- d'allergène soja.
-- Régimes : produits animaux incompatibles avec le régime végétalien (et végétarien pour la
-- sauce d'huître et le nuoc-mâm).
-- Nutrition pour 100 g : Anses, table Ciqual 2025 (licence ouverte Etalab).
-- Prix : pas de catégorie Open Prices vérifiée ; saisie du foyer ou tickets de caisse.

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple)
values
  ('sauce-huitre', 'Sauce d''huître', 'condiments', 'volume', 1.217, null, true, false),
  ('nuoc-mam', 'Nuoc-mâm (sauce de poisson)', 'condiments', 'volume', 1.217, null, true, false),
  ('miso', 'Miso', 'condiments', 'mass', null, null, true, false),
  ('nouilles-oeufs', 'Nouilles chinoises aux œufs', 'feculents', 'mass', null, null, true, false),
  ('pak-choi', 'Pak choï', 'legumes', 'mass', null, null, true, false),
  ('pousse-soja', 'Pousses de soja (haricot mungo)', 'legumes', 'mass', null, null, true, false);

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('sauce huitre', 'sauce-huitre'),
  ('sauce d huitre', 'sauce-huitre'),
  ('sauce aux huitres', 'sauce-huitre'),
  ('oyster sauce', 'sauce-huitre'),
  ('nuoc mam', 'nuoc-mam'),
  ('nuoc-mam', 'nuoc-mam'),
  ('sauce poisson', 'nuoc-mam'),
  ('sauce de poisson', 'nuoc-mam'),
  ('fish sauce', 'nuoc-mam'),
  ('nam pla', 'nuoc-mam'),
  ('miso', 'miso'),
  ('pate miso', 'miso'),
  ('pate de miso', 'miso'),
  ('miso blanc', 'miso'),
  ('miso shiro', 'miso'),
  ('nouilles aux oeufs', 'nouilles-oeufs'),
  ('nouilles chinoises', 'nouilles-oeufs'),
  ('nouilles chinoises aux oeufs', 'nouilles-oeufs'),
  ('nouilles asiatiques aux oeufs', 'nouilles-oeufs'),
  ('nouilles de ble aux oeufs', 'nouilles-oeufs'),
  ('egg noodles', 'nouilles-oeufs'),
  ('pak choi', 'pak-choi'),
  ('pak choy', 'pak-choi'),
  ('bok choy', 'pak-choi'),
  ('chou pak choi', 'pak-choi'),
  ('pousses de soja', 'pousse-soja'),
  ('pousse de soja', 'pousse-soja'),
  ('germes de soja', 'pousse-soja'),
  ('pousses de haricot mungo', 'pousse-soja'),
  ('haricots mungo germes', 'pousse-soja')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, v.allergen from (values
  ('sauce-huitre', 'molluscs'),
  ('sauce-huitre', 'gluten'),
  ('nuoc-mam', 'fish'),
  ('miso', 'soy'),
  ('nouilles-oeufs', 'gluten'),
  ('nouilles-oeufs', 'eggs')
) as v(slug, allergen) join public.ingredients i on i.slug = v.slug;

insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)
select i.id, v.diet from (values
  ('sauce-huitre', 'vegan'),
  ('sauce-huitre', 'vegetarian'),
  ('nuoc-mam', 'vegan'),
  ('nuoc-mam', 'vegetarian'),
  ('nouilles-oeufs', 'vegan')
) as v(slug, diet) join public.ingredients i on i.slug = v.slug;

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select id, 'none', array[]::text[], false from public.ingredients
where slug in ('sauce-huitre', 'nuoc-mam', 'miso', 'nouilles-oeufs', 'pak-choi', 'pousse-soja');

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values
  ('sauce-huitre', 11223, 'Sauce d''huître, préemballée', 50.7, 1.35, 10.6, 0, 0.25, 0.043, 0.3, 6.83),
  ('nuoc-mam', 11194, 'Sauce nuoc mâm ou sauce au poisson, préemballée', 81.2, 9.3, 10.9, 8.34, 0, 0, 0.2, 22.2),
  ('miso', 20916, 'Miso', 188, 11.7, 18.1, 6.2, 6.01, 1.14, 5.4, 9.32),
  ('nouilles-oeufs', 9863, 'Pâtes ou nouilles asiatiques sèches, au blé et aux oeufs, nature, crues', 371, 11.9, 71, 0.5, 3, 1, 4, 0.99),
  ('pak-choi', 20340, 'Chou chinois pak choï ou pak choy (feuilles vertes ressemblant à des blettes), cru', 14.6, 1.5, 1.2, 1.18, 0.2, 0.027, 1, 0.16),
  ('pousse-soja', 20183, 'Graine germée de haricot mungo ou pousse de "soja", crue', 28.3, 2.57, 3.4, 3.4, 0, 0, 1.7, 0.043)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;

do $$
begin
  if (select count(*) from public.ingredient_nutrition n join public.ingredients i on i.id = n.ingredient_id
      where i.slug in ('sauce-huitre', 'nuoc-mam', 'miso', 'nouilles-oeufs', 'pak-choi', 'pousse-soja')) <> 6 then
    raise exception 'Épicerie asiatique incomplète.';
  end if;
end;
$$;
