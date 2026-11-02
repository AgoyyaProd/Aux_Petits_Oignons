-- 0064 — Sauce teriyaki et tomates séchées, deux ingrédients qui manquaient au garde-manger.
--
-- Sauce teriyaki : condiment en volume, comme la sauce soja. Nutrition pour 100 g : Anses,
-- table Ciqual 2025 (licence ouverte Etalab), 11301 « Sauce teriyaki, préemballée ». Densité :
-- 1,217 g/ml, d'après l'USDA (FoodData Central, SR Legacy 171167 « Sauce, teriyaki,
-- ready-to-serve » : 1 tasse de 236,6 ml = 288 g). Allergènes : soja et gluten (sauce soja
-- au blé), comme la sauce soja.
-- Tomates séchées : en masse. Aucun aliment Ciqual ne leur correspond : elles ne sont pas
-- comptées dans les valeurs nutritionnelles.
-- Prix : pas de catégorie Open Prices vérifiée ; saisie du foyer ou tickets de caisse.

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple)
values
  ('sauce-teriyaki', 'Sauce teriyaki', 'condiments', 'volume', 1.217, null, true, false),
  ('tomate-sechee', 'Tomates séchées', 'epicerie_salee', 'mass', null, null, true, false);

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('sauce teriyaki', 'sauce-teriyaki'),
  ('teriyaki', 'sauce-teriyaki'),
  ('sauce teriyaki japonaise', 'sauce-teriyaki'),
  ('tomates sechees', 'tomate-sechee'),
  ('tomate sechee', 'tomate-sechee'),
  ('tomates sechees a l huile', 'tomate-sechee'),
  ('tomates sechees marinees', 'tomate-sechee'),
  ('tomates sechees au soleil', 'tomate-sechee')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, v.allergen from (values ('soy'), ('gluten')) as v(allergen)
cross join public.ingredients i where i.slug = 'sauce-teriyaki';

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select id, 'none', array[]::text[], false from public.ingredients
where slug in ('sauce-teriyaki', 'tomate-sechee');

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, 11301, 'Sauce teriyaki, préemballée', 88.1, 5.93, 16, 14.1, 0.02, 0, 0.1, 9.58
from public.ingredients i where i.slug = 'sauce-teriyaki';
