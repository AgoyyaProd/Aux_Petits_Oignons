-- 0060 — Pesto verde et pesto rosso, deux ingrédients distincts.
--
-- « Pesto » désignait jusqu'ici le pesto au basilic. Il devient « Pesto verde » ; son slug
-- `pesto` est conservé, si bien que les recettes, les tickets de caisse, les prix et le
-- garde-manger qui le référencent restent valides (rien n'est supprimé ni déplacé). Les six
-- recettes qui l'utilisent sont toutes au basilic et le gardent.
--
-- Nouvel ingrédient « Pesto rosso » (tomates séchées), non interchangeable avec le verde :
-- ce n'est PAS une variante (parent_id nul), un pot de rosso ne couvre pas une recette au
-- pesto verde. Allergènes et régime identiques au verde (fromage, fruits à coque).
-- Valeurs nutritionnelles pour 100 g : Anses, table Ciqual 2025 (licence ouverte Etalab),
-- 11210 « Sauce pesto rosso, préemballée ».
-- Prix : pas de catégorie Open Prices vérifiée pour le rosso ; saisie du foyer ou tickets.
-- La catégorie Open Prices du verde (en:pestos) mêle les deux pestos : elle est désormais
-- signalée comme approchante.

update public.ingredients set name = 'Pesto verde' where slug = 'pesto';

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple)
values ('pesto-rosso', 'Pesto rosso', 'epicerie_salee', 'mass', null, null, true, false);

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('pesto verde', 'pesto'),
  ('pesto vert', 'pesto'),
  ('pesto genovese', 'pesto'),
  ('pesto alla genovese', 'pesto'),
  ('pesto au basilic', 'pesto'),
  ('pesto rosso', 'pesto-rosso'),
  ('pesto rouge', 'pesto-rosso'),
  ('pesto aux tomates sechees', 'pesto-rosso'),
  ('pesto tomates sechees', 'pesto-rosso'),
  ('pesto alla rossa', 'pesto-rosso')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, v.allergen from (values ('milk'), ('tree_nuts')) as v(allergen)
cross join public.ingredients i where i.slug = 'pesto-rosso';

insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)
select i.id, 'vegan' from public.ingredients i where i.slug = 'pesto-rosso';

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select id, 'none', array[]::text[], false from public.ingredients where slug = 'pesto-rosso';

update public.ingredient_price_sources set approximate = true
where ingredient_id = (select id from public.ingredients where slug = 'pesto');

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, 11210, 'Sauce pesto rosso, préemballée', 305, 4.8, 8.58, 2.75, 27, 3.95, 4.15, 1.99
from public.ingredients i where i.slug = 'pesto-rosso';
