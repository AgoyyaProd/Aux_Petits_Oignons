-- 0042 — Variantes de confiture (fraise, abricot, framboise, cerise, mûre, figue, myrtille,
-- prune, pêche, rhubarbe, marmelade d'orange, gelée de groseille).
-- Variantes de « Confiture » (migration 0017) : une recette qui demande « Confiture » accepte
-- le stock de n'importe laquelle ; au garde-manger, on garde le parfum précis.
-- Valeurs nutritionnelles pour 100 g : Anses, table Ciqual 2025 (licence ouverte Etalab).
-- Prix : catégorie Open Prices des confitures (en:jams), marquée « approchante ».

insert into public.ingredients (slug, name, category, default_dimension, is_validated, parent_id)
select v.slug, v.name, p.category, p.default_dimension, true, p.id from (values
  ('confiture-fraise', 'Confiture de fraise'),
  ('confiture-abricot', 'Confiture d''abricot'),
  ('confiture-framboise', 'Confiture de framboise'),
  ('confiture-cerise', 'Confiture de cerise'),
  ('confiture-mure', 'Confiture de mûre'),
  ('confiture-figue', 'Confiture de figue'),
  ('confiture-myrtille', 'Confiture de myrtille'),
  ('confiture-prune', 'Confiture de prune (mirabelle, quetsche…)'),
  ('confiture-peche', 'Confiture de pêche'),
  ('confiture-rhubarbe', 'Confiture de rhubarbe'),
  ('marmelade-orange', 'Marmelade d''orange'),
  ('gelee-groseille', 'Gelée de groseille')
) as v(slug, name) join public.ingredients p on p.slug = 'confiture';

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('confiture de fraise', 'confiture-fraise'),
  ('confiture de fraises', 'confiture-fraise'),
  ('confiture fraise', 'confiture-fraise'),
  ('confiture d abricot', 'confiture-abricot'),
  ('confiture d abricots', 'confiture-abricot'),
  ('confiture abricot', 'confiture-abricot'),
  ('confiture de framboise', 'confiture-framboise'),
  ('confiture de framboises', 'confiture-framboise'),
  ('confiture framboise', 'confiture-framboise'),
  ('confiture de cerise', 'confiture-cerise'),
  ('confiture de cerises', 'confiture-cerise'),
  ('confiture cerise', 'confiture-cerise'),
  ('confiture de mure', 'confiture-mure'),
  ('confiture de mures', 'confiture-mure'),
  ('confiture mure', 'confiture-mure'),
  ('confiture de mures sauvages', 'confiture-mure'),
  ('confiture de figue', 'confiture-figue'),
  ('confiture de figues', 'confiture-figue'),
  ('confiture figue', 'confiture-figue'),
  ('confiture de myrtille', 'confiture-myrtille'),
  ('confiture de myrtilles', 'confiture-myrtille'),
  ('confiture myrtille', 'confiture-myrtille'),
  ('confiture de prune', 'confiture-prune'),
  ('confiture de prunes', 'confiture-prune'),
  ('confiture de mirabelle', 'confiture-prune'),
  ('confiture de mirabelles', 'confiture-prune'),
  ('confiture de quetsche', 'confiture-prune'),
  ('confiture de quetsches', 'confiture-prune'),
  ('confiture de reine claude', 'confiture-prune'),
  ('confiture de peche', 'confiture-peche'),
  ('confiture de peches', 'confiture-peche'),
  ('confiture peche', 'confiture-peche'),
  ('confiture de rhubarbe', 'confiture-rhubarbe'),
  ('confiture rhubarbe', 'confiture-rhubarbe'),
  ('marmelade d orange', 'marmelade-orange'),
  ('marmelade d oranges', 'marmelade-orange'),
  ('marmelade orange', 'marmelade-orange'),
  ('confiture d orange', 'marmelade-orange'),
  ('confiture d oranges', 'marmelade-orange'),
  ('gelee de groseille', 'gelee-groseille'),
  ('gelee de groseilles', 'gelee-groseille'),
  ('gelee groseille', 'gelee-groseille')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'product', array['en:jams'], true from public.ingredients i
where i.slug in ('confiture-fraise', 'confiture-abricot', 'confiture-framboise', 'confiture-cerise', 'confiture-mure', 'confiture-figue', 'confiture-myrtille', 'confiture-prune', 'confiture-peche', 'confiture-rhubarbe', 'marmelade-orange', 'gelee-groseille');

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal::numeric, v.p::numeric, v.c::numeric, v.s::numeric, v.f::numeric, v.sf::numeric, v.fi::numeric, v.salt::numeric from (values
  ('confiture-fraise', 31024, 'Confiture de fraise (extra ou classique)', 248.0, 0.25, 60.5, 60.1, 0.5, 0.11, 0.7, 0.018),
  ('confiture-abricot', 31037, 'Confiture d''abricot (extra ou classique)', 246.0, 0.25, 59.7, 56.8, 0.3, 0.029, 1.1, 0.013),
  ('confiture-framboise', 31062, 'Confiture de framboise (extra ou classique)', 232.0, 0.56, 55.2, 55.2, 0.17, 0.071, 2.69, 0.013),
  ('confiture-cerise', 31038, 'Confiture de cerise (extra ou classique)', 238.0, 0.48, 58.1, 57.5, 0.19, 0.0, 1.1, 0.013),
  ('confiture-mure', 30990, 'Confiture de mûre (extra ou classique)', 245.0, 0.44, 58.3, 56.9, 0.63, 0.31, 1.3, 0.0075),
  ('confiture-figue', 30994, 'Confiture de figue (extra ou classique)', 243.0, 0.63, 59.1, 56.8, 0.17, 0.033, 1.31, 0.012),
  ('confiture-myrtille', 31068, 'Confiture de myrtille (extra ou classique)', 245.0, 0.25, 58.9, 58.9, 0.4, 0.047, 2.1, 0),
  ('confiture-prune', 31053, 'Confiture de prune, par ex. mirabelle, quetsche, reine-claude (extra ou classique)', 240.0, 0.28, 58.9, 58.0, 0.089, 0.029, 1.27, 0.011),
  ('confiture-peche', 30993, 'Confiture de pêche (extra ou classique)', 242.0, 0.27, 59.5, 57.4, 0.075, 0.0013, 1.16, 0.0083),
  ('confiture-rhubarbe', 30992, 'Confiture de rhubarbe (extra ou classique)', 239.0, 0.26, 58.6, 57.7, 0.057, 0.0015, 1.53, 0.01),
  ('marmelade-orange', 31039, 'Marmelade d''orange ou confiture d''orange (extra ou classique)', 245.0, 0.25, 59.3, 56.9, 0.4, 0.14, 1.5, 0.015),
  ('gelee-groseille', 31095, 'Gelée de groseille (extra ou classique)', 244.0, 0.25, 59.7, 58.7, 0.044, 0.0, 0, 0)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;
