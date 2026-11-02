-- 0073 — Pain bretzel, blanc de dinde en tranches et roquette, pour des sandwichs bretzel.
--
-- Pain bretzel : en masse (un petit pain pèse selon la marque de 80 à 100 g ; la recette
-- donne les grammes et le nombre de pains en note). Allergène : gluten. Le beurre n'est pas
-- systématique dans la pâte : le lait n'est pas signalé, à vérifier sur l'étiquette.
-- Blanc de dinde en tranches : charcuterie de volaille, en masse ; incompatible avec les
-- régimes végétarien, végétalien et pescétarien, comme l'escalope de dinde.
-- Roquette : en masse.
-- Nutrition pour 100 g : Anses, table Ciqual 2025 (licence ouverte Etalab).
-- Prix : pas de catégorie Open Prices vérifiée ; saisie du foyer ou tickets de caisse.

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple)
values
  ('pain-bretzel', 'Pain bretzel', 'feculents', 'mass', null, null, true, false),
  ('blanc-dinde', 'Blanc de dinde (tranches)', 'viandes', 'mass', null, null, true, false),
  ('roquette', 'Roquette', 'legumes', 'mass', null, null, true, false);

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('pain bretzel', 'pain-bretzel'),
  ('pains bretzel', 'pain-bretzel'),
  ('petit pain bretzel', 'pain-bretzel'),
  ('bretzel', 'pain-bretzel'),
  ('bretzels', 'pain-bretzel'),
  ('pretzel', 'pain-bretzel'),
  ('laugenbrot', 'pain-bretzel'),
  ('blanc de dinde', 'blanc-dinde'),
  ('blanc de dinde en tranches', 'blanc-dinde'),
  ('tranches de dinde', 'blanc-dinde'),
  ('jambon de dinde', 'blanc-dinde'),
  ('filet de dinde tranche', 'blanc-dinde'),
  ('roquette', 'roquette'),
  ('salade roquette', 'roquette'),
  ('rucola', 'roquette')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, 'gluten' from public.ingredients i where i.slug = 'pain-bretzel';

insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)
select i.id, v.diet from (values ('vegan'), ('vegetarian'), ('pescetarian')) as v(diet)
cross join public.ingredients i where i.slug = 'blanc-dinde';

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select id, 'none', array[]::text[], false from public.ingredients
where slug in ('pain-bretzel', 'blanc-dinde', 'roquette');

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values
  ('pain-bretzel', 7263, 'Bretzel, pain frais', 330, 9.18, 54.6, 3.58, 7.1, 0.95, 3.8, 3.35),
  ('blanc-dinde', 28964, 'Jambon de dinde ou blanc de dinde en tranche', 99.3, 20.9, 0.023, 0.023, 1.67, 0.54, 0.39, 1.9),
  ('roquette', 20217, 'Roquette, crue', 27.9, 2.58, 2.1, 2.05, 0.66, 0.086, 1.6, 0.068)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;
