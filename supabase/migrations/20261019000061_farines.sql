-- 0061 — Les farines : farine de blé, farine à pain et les autres céréales.
--
-- « Farine » (slug `farine`) reste la farine de blé tout usage, T45 ou T55 : c'est elle que
-- demandent les 57 recettes, pain compris (la T55 est la farine à pain blanc courante en
-- France). Elle est renommée pour la distinguer des autres ; slug, recettes, prix et
-- garde-mangers inchangés.
--
-- Quinze farines s'ajoutent, toutes distinctes et SANS lien de variante (parent_id nul) :
-- un paquet de farine de seigle ne couvre pas une recette à la farine de blé. Aucune
-- recette existante n'est modifiée.
--
-- Valeurs nutritionnelles pour 100 g : Anses, table Ciqual 2025 (licence ouverte Etalab),
-- code indiqué ligne par ligne. Les valeurs « < x » de la table sont enregistrées à 0 (comme
-- pour la farine de blé T55), les valeurs absentes « - » restent vides.
-- Seigle : T130, la plus vendue en grande surface. Épeautre : grand épeautre.
-- Allergènes : gluten pour le blé, le seigle, l'épeautre et l'orge ; soja pour la farine de
-- soja.
-- Prix : les farines de blé (T65 à T150, levure incorporée) reprennent la catégorie Open
-- Prices de la farine de blé (en:wheat-flours), signalée comme approchante ; les autres
-- n'ont pas de catégorie vérifiée : saisie du foyer ou tickets de caisse.

update public.ingredients set name = 'Farine de blé (T45 ou T55)' where slug = 'farine';

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple)
select v.slug, v.name, 'feculents', 'mass', null, null, true, false
from (values
  ('farine-pain', 'Farine à pain (T65)'),
  ('farine-bise', 'Farine de blé bise (T80)'),
  ('farine-semi-complete', 'Farine de blé semi-complète (T110)'),
  ('farine-complete', 'Farine de blé complète (T150)'),
  ('farine-levure', 'Farine à gâteaux (levure incorporée)'),
  ('farine-seigle', 'Farine de seigle'),
  ('farine-epeautre', 'Farine d''épeautre'),
  ('farine-orge', 'Farine d''orge'),
  ('farine-sarrasin', 'Farine de sarrasin'),
  ('farine-mais', 'Farine de maïs'),
  ('farine-riz', 'Farine de riz'),
  ('farine-millet', 'Farine de millet'),
  ('farine-pois-chiche', 'Farine de pois chiche'),
  ('farine-chataigne', 'Farine de châtaigne'),
  ('farine-soja', 'Farine de soja')
) as v(slug, name);

-- Le nom de chaque farine sert aussi d'alias, plus les noms courants des paquets.
insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(i.name), i.id from public.ingredients i
where i.slug = 'farine' or i.slug like 'farine-%'
on conflict do nothing;

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('farine de ble t55', 'farine'),
  ('farine de ble t45', 'farine'),
  ('farine de ble tendre', 'farine'),
  ('farine tout usage', 'farine'),
  ('farine fluide', 'farine'),
  ('farine pour patisserie', 'farine'),
  ('farine a pain', 'farine-pain'),
  ('farine pour pain', 'farine-pain'),
  ('farine de pain', 'farine-pain'),
  ('farine t65', 'farine-pain'),
  ('farine de ble t65', 'farine-pain'),
  ('farine de force', 'farine-pain'),
  ('farine pain de campagne', 'farine-pain'),
  ('farine t80', 'farine-bise'),
  ('farine de ble t80', 'farine-bise'),
  ('farine bise', 'farine-bise'),
  ('farine t110', 'farine-semi-complete'),
  ('farine semi complete', 'farine-semi-complete'),
  ('farine t150', 'farine-complete'),
  ('farine complete', 'farine-complete'),
  ('farine de ble complete', 'farine-complete'),
  ('farine integrale', 'farine-complete'),
  ('farine avec levure incorporee', 'farine-levure'),
  ('farine a levure incorporee', 'farine-levure'),
  ('farine a gateaux', 'farine-levure'),
  ('farine seigle', 'farine-seigle'),
  ('farine de seigle t130', 'farine-seigle'),
  ('farine de seigle t85', 'farine-seigle'),
  ('farine de seigle t170', 'farine-seigle'),
  ('farine epeautre', 'farine-epeautre'),
  ('farine de grand epeautre', 'farine-epeautre'),
  ('farine de ble noir', 'farine-sarrasin'),
  ('farine sarrasin', 'farine-sarrasin'),
  ('farine de riz blanc', 'farine-riz'),
  ('farine de pois chiches', 'farine-pois-chiche'),
  ('besan', 'farine-pois-chiche'),
  ('farine de chataignes', 'farine-chataigne')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, v.allergen from (values
  ('farine-pain', 'gluten'),
  ('farine-bise', 'gluten'),
  ('farine-semi-complete', 'gluten'),
  ('farine-complete', 'gluten'),
  ('farine-levure', 'gluten'),
  ('farine-seigle', 'gluten'),
  ('farine-epeautre', 'gluten'),
  ('farine-orge', 'gluten'),
  ('farine-soja', 'soy')
) as v(slug, allergen) join public.ingredients i on i.slug = v.slug;

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, v.kind, v.tags, v.approximate from (values
  ('farine-pain', 'product', array['en:wheat-flours'], true),
  ('farine-bise', 'product', array['en:wheat-flours'], true),
  ('farine-semi-complete', 'product', array['en:wheat-flours'], true),
  ('farine-complete', 'product', array['en:wheat-flours'], true),
  ('farine-levure', 'product', array['en:wheat-flours'], true),
  ('farine-seigle', 'none', array[]::text[], false),
  ('farine-epeautre', 'none', array[]::text[], false),
  ('farine-orge', 'none', array[]::text[], false),
  ('farine-sarrasin', 'none', array[]::text[], false),
  ('farine-mais', 'none', array[]::text[], false),
  ('farine-riz', 'none', array[]::text[], false),
  ('farine-millet', 'none', array[]::text[], false),
  ('farine-pois-chiche', 'none', array[]::text[], false),
  ('farine-chataigne', 'none', array[]::text[], false),
  ('farine-soja', 'none', array[]::text[], false)
) as v(slug, kind, tags, approximate) join public.ingredients i on i.slug = v.slug;

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values
  ('farine-pain', 9435, 'Farine de blé tendre ou froment T65', 346, 10, 71.5, 1.5, 1, null, 3.5, 0.03),
  ('farine-bise', 9445, 'Farine de blé tendre ou froment T80', 355, 9.95, 73.2, 1.77, 1.18, 0.17, 4.2, 0),
  ('farine-semi-complete', 9410, 'Farine de blé tendre ou froment T110', 343, 9.61, 68.6, 1.6, 1.5, 0.27, 6.8, 0),
  ('farine-complete', 9415, 'Farine de blé tendre ou froment T150', 342, 11.4, 64.9, 1.77, 1.52, 0.22, 10.2, 0.035),
  ('farine-levure', 9437, 'Farine de blé tendre ou froment avec levure incorporée', 350, 9.12, 74, 2.5, 1, 0.5, 2.5, null),
  ('farine-seigle', 9533, 'Farine de seigle T130', 344, 7.24, 70.9, 1.59, 1.12, 0.22, 9.5, 0.0091),
  ('farine-epeautre', 9480, 'Farine d''épeautre (grand épeautre)', 352, 11.4, 64, 1.3, 3, 0.5, 9.3, 0),
  ('farine-orge', 9550, 'Farine d''orge', 337, 10.5, 64.4, 0.8, 1.6, 0.34, 10.1, 0.01),
  ('farine-sarrasin', 9540, 'Farine de sarrasin', 348, 11.5, 68.4, 0.03, 2.19, 0.58, 4.2, 0.06),
  ('farine-mais', 9545, 'Farine de maïs', 362, 5.59, 80.9, 0.64, 1.39, 0.17, 1.9, 0.0025),
  ('farine-riz', 9520, 'Farine de riz', 357, 7.62, 73.9, 0.9, 2.5, 0.46, 3.3, 0),
  ('farine-millet', 9555, 'Farine de millet', 350, 10.2, 63.2, 0.5, 4.1, 0.76, 9.7, 0),
  ('farine-pois-chiche', 9580, 'Farine de pois chiche', 359, 22.4, 47, 10.9, 6.69, 0.69, 10.8, 0.16),
  ('farine-chataigne', 9570, 'Farine de châtaigne', 362, 5.69, 70.4, null, 3.43, 0.52, 12.6, null),
  ('farine-soja', 20915, 'Farine de soja complète', 457, 34.5, 25.7, 7.5, 20.7, 2.99, 9.6, 0.033)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;
