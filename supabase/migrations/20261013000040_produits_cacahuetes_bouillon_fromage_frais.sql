-- 0040 — Référentiel des produits :
--  * cacahuètes : « nature » (sans sel, Ciqual 15001) et nouvelles « grillées salées » (15002) ;
--  * bouillon cube de bœuf (Ciqual 11001), utilisé par les plats de bœuf et la soupe à l'oignon ;
--  * fromage frais à tartiner, nature (12068) et ail et fines herbes (12070), type Madame Loïk,
--    Saint Môret, Boursin.
-- Valeurs nutritionnelles pour 100 g : Anses, table Ciqual 2025 (licence ouverte Etalab).
-- Prix : catégories Open Prices déjà utilisées et vérifiées, marquées « approchantes » ; aucune
-- pour le fromage frais (saisie manuelle uniquement).

update public.ingredients set name = 'Cacahuètes nature' where slug = 'cacahuete';

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple)
select v.slug, v.name, v.category, v.dimension::public.dimension, null, v.piece::numeric, true, v.staple
from (values
  ('cacahuete-grillee', 'Cacahuètes grillées salées', 'epicerie_salee', 'mass', null, false),
  ('bouillon-boeuf', 'Bouillon cube de bœuf', 'epicerie_salee', 'count', 10, true),
  ('fromage-frais', 'Fromage frais à tartiner', 'fromages', 'mass', null, false),
  ('fromage-frais-ail-fines-herbes', 'Fromage frais ail et fines herbes', 'fromages', 'mass', null, false)
) as v(slug, name, category, dimension, piece, staple);

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('cacahuetes nature', 'cacahuete'),
  ('cacahuetes non salees', 'cacahuete'),
  ('cacahuetes crues', 'cacahuete'),
  ('cacahuetes grillees', 'cacahuete-grillee'),
  ('cacahuetes grillees salees', 'cacahuete-grillee'),
  ('cacahuetes salees', 'cacahuete-grillee'),
  ('cacahuetes aperitif', 'cacahuete-grillee'),
  ('bouillon cube de boeuf', 'bouillon-boeuf'),
  ('bouillon de boeuf', 'bouillon-boeuf'),
  ('bouillon boeuf', 'bouillon-boeuf'),
  ('fromage frais', 'fromage-frais'),
  ('fromage frais a tartiner', 'fromage-frais'),
  ('fromage frais nature', 'fromage-frais'),
  ('madame loik', 'fromage-frais'),
  ('saint moret', 'fromage-frais'),
  ('st moret', 'fromage-frais'),
  ('carre frais', 'fromage-frais'),
  ('philadelphia', 'fromage-frais'),
  ('cream cheese', 'fromage-frais'),
  ('fromage frais ail et fines herbes', 'fromage-frais-ail-fines-herbes'),
  ('fromage ail et fines herbes', 'fromage-frais-ail-fines-herbes'),
  ('madame loik ail et fines herbes', 'fromage-frais-ail-fines-herbes'),
  ('boursin', 'fromage-frais-ail-fines-herbes')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

-- Allergènes (déclaration prudente, identique au bouillon de volaille pour le cube).
insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, v.allergen from (values
  ('cacahuete-grillee', 'peanuts'),
  ('bouillon-boeuf', 'celery'),
  ('fromage-frais', 'milk'),
  ('fromage-frais-ail-fines-herbes', 'milk')
) as v(slug, allergen) join public.ingredients i on i.slug = v.slug;

-- Régimes incompatibles.
insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)
select i.id, v.diet from (values
  ('bouillon-boeuf', 'vegetarian'),
  ('bouillon-boeuf', 'vegan'),
  ('bouillon-boeuf', 'pescetarian'),
  ('fromage-frais', 'vegan'),
  ('fromage-frais-ail-fines-herbes', 'vegan')
) as v(slug, diet) join public.ingredients i on i.slug = v.slug;

-- Sources de prix.
insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, v.kind, v.tags, v.approx from (values
  ('cacahuete-grillee', 'product', array['en:peanuts'], true),
  ('bouillon-boeuf', 'product', array['en:bouillon-cubes'], true),
  ('fromage-frais', 'none', array[]::text[], false),
  ('fromage-frais-ail-fines-herbes', 'none', array[]::text[], false)
) as v(slug, kind, tags, approx) join public.ingredients i on i.slug = v.slug;

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values
  ('cacahuete-grillee', 15002, 'Cacahuète, grillée, salée', 635.0, 22.9, 14.2, 4.25, 50.8, 8.63, 8.08, 1.26),
  ('bouillon-boeuf', 11001, 'Bouillon de boeuf, déshydraté', 232.0, 10.2, 18.0, 2.0, 13.3, 7.03, 0.0, 33.0),
  ('fromage-frais', 12068, 'Fromage frais ou spécialité fromagère non affinée, nature, à tartiner, en barquette, non allégée en matière grasse', 225.0, 6.25, 3.31, 3.31, 20.7, 13.0, 0.0, 0.9),
  ('fromage-frais-ail-fines-herbes', 12070, 'Fromage frais ou spécialité fromagère non affinée, ail et fines herbes, à tartiner, non allégée en matière grasse', 320.0, 8.03, 2.7, 2.34, 30.8, 20.2, 0.0, 1.24)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;

-- Plats de bœuf et soupe à l'oignon : bouillon de bœuf au lieu du bouillon de volaille.
update public.recipe_ingredients ri
set ingredient_id = (select id from public.ingredients where slug = 'bouillon-boeuf')
from public.recipes r
where r.id = ri.recipe_id
  and r.slug in ('boeuf-carottes', 'goulash-boeuf', 'soupe-oignon-gratinee')
  and ri.ingredient_id = (select id from public.ingredients where slug = 'bouillon-volaille');
