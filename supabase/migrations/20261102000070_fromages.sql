-- 0070 — Fromages : 21 fromages de plus au référentiel, pour une série de recettes.
--
-- Pâtes molles (camembert, brie, maroilles, munster, reblochon, mont d'or), persillés
-- (roquefort, fourme d'Ambert, gorgonzola), pâtes pressées (raclette, beaufort, gruyère,
-- cantal, tomme de Savoie, saint-nectaire, morbier, gouda, mimolette, pecorino) et fromages
-- frais italiens (burrata, mascarpone). Tous en masse : un camembert, un reblochon ou une
-- boîte de mont d'or n'ont pas un poids unique, la recette donne donc des grammes.
-- Allergène : lait. Régime : incompatibles avec le régime végétalien (comme les fromages déjà
-- présents ; la présure n'est pas renseignée).
-- Nutrition pour 100 g : Anses, table Ciqual 2025 (licence ouverte Etalab).
-- Prix : pas de catégorie Open Prices vérifiée ; saisie du foyer ou tickets de caisse.
-- « Gruyère râpé » reste au fromage râpé (emmental) ; « gruyère » désigne le gruyère.

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple)
select v.slug, v.name, 'fromages', 'mass', null, null, true, false
from (values
  ('camembert', 'Camembert'),
  ('brie', 'Brie'),
  ('maroilles', 'Maroilles'),
  ('munster', 'Munster'),
  ('reblochon', 'Reblochon'),
  ('mont-d-or', 'Mont d''or'),
  ('roquefort', 'Roquefort'),
  ('fourme-ambert', 'Fourme d''Ambert'),
  ('gorgonzola', 'Gorgonzola'),
  ('raclette', 'Fromage à raclette'),
  ('beaufort', 'Beaufort'),
  ('gruyere', 'Gruyère'),
  ('cantal', 'Cantal'),
  ('tomme-savoie', 'Tomme de Savoie'),
  ('saint-nectaire', 'Saint-nectaire'),
  ('morbier', 'Morbier'),
  ('gouda', 'Gouda'),
  ('mimolette', 'Mimolette'),
  ('pecorino', 'Pecorino'),
  ('burrata', 'Burrata'),
  ('mascarpone', 'Mascarpone')
) as v(slug, name);

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('camembert', 'camembert'),
  ('camembert de normandie', 'camembert'),
  ('brie', 'brie'),
  ('brie de meaux', 'brie'),
  ('brie de melun', 'brie'),
  ('maroilles', 'maroilles'),
  ('maroille', 'maroilles'),
  ('munster', 'munster'),
  ('munster geromé', 'munster'),
  ('reblochon', 'reblochon'),
  ('reblochon de savoie', 'reblochon'),
  ('mont d or', 'mont-d-or'),
  ('vacherin mont d or', 'mont-d-or'),
  ('vacherin du haut doubs', 'mont-d-or'),
  ('roquefort', 'roquefort'),
  ('fourme d ambert', 'fourme-ambert'),
  ('fourme', 'fourme-ambert'),
  ('gorgonzola', 'gorgonzola'),
  ('raclette', 'raclette'),
  ('fromage a raclette', 'raclette'),
  ('fromage raclette', 'raclette'),
  ('raclette de savoie', 'raclette'),
  ('beaufort', 'beaufort'),
  ('gruyere', 'gruyere'),
  ('gruyere suisse', 'gruyere'),
  ('cantal', 'cantal'),
  ('cantal jeune', 'cantal'),
  ('cantal entre deux', 'cantal'),
  ('tomme de savoie', 'tomme-savoie'),
  ('tomme', 'tomme-savoie'),
  ('saint nectaire', 'saint-nectaire'),
  ('st nectaire', 'saint-nectaire'),
  ('morbier', 'morbier'),
  ('gouda', 'gouda'),
  ('mimolette', 'mimolette'),
  ('pecorino', 'pecorino'),
  ('pecorino romano', 'pecorino'),
  ('burrata', 'burrata'),
  ('mascarpone', 'mascarpone')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select i.id, 'milk' from public.ingredients i
where i.slug in ('camembert', 'brie', 'maroilles', 'munster', 'reblochon', 'mont-d-or', 'roquefort',
  'fourme-ambert', 'gorgonzola', 'raclette', 'beaufort', 'gruyere', 'cantal', 'tomme-savoie',
  'saint-nectaire', 'morbier', 'gouda', 'mimolette', 'pecorino', 'burrata', 'mascarpone');

insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)
select i.id, 'vegan' from public.ingredients i
where i.slug in ('camembert', 'brie', 'maroilles', 'munster', 'reblochon', 'mont-d-or', 'roquefort',
  'fourme-ambert', 'gorgonzola', 'raclette', 'beaufort', 'gruyere', 'cantal', 'tomme-savoie',
  'saint-nectaire', 'morbier', 'gouda', 'mimolette', 'pecorino', 'burrata', 'mascarpone');

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'none', array[]::text[], false from public.ingredients i
where i.slug in ('camembert', 'brie', 'maroilles', 'munster', 'reblochon', 'mont-d-or', 'roquefort',
  'fourme-ambert', 'gorgonzola', 'raclette', 'beaufort', 'gruyere', 'cantal', 'tomme-savoie',
  'saint-nectaire', 'morbier', 'gouda', 'mimolette', 'pecorino', 'burrata', 'mascarpone');

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values
  ('camembert', 12001, 'Camembert, sans précision sur le type de lait (pasteurisé ou cru)', 280, 19.5, 0, 0, 22.5, 15.8, 0, 1.45),
  ('brie', 12020, 'Brie, sans précision', 345, 17.6, 0.68, 0.15, 30.4, 21.5, 0.056, 1.43),
  ('maroilles', 12036, 'Maroilles, sans précision', 325, 21.9, 0, 0, 26.4, 18.1, 0, 2.09),
  ('munster', 12039, 'Munster', 324, 20.4, 0.7, 0.56, 26.8, 18.9, 0.19, 2),
  ('reblochon', 12045, 'Reblochon', 322, 20.3, 0, 0, 26.9, 19, 0, 1.38),
  ('mont-d-or', 12051, 'Mont d''or ou vacherin du Haut-Doubs (produit en France) ou vacherin-Mont d''Or (produit en Suisse)', 293, 17.9, 0.54, 0.5, 24.6, 17, 0, 1.43),
  ('roquefort', 12500, 'Roquefort (fromage de brebis)', 384, 19.5, 0, 0, 33.9, 24.9, 0, 3.22),
  ('fourme-ambert', 12522, 'Fourme d''Ambert', 339, 20.6, 0, 0, 28.4, 16.3, 0, 2.2),
  ('gorgonzola', 12524, 'Gorgonzola', 318, 19.5, 0, 0, 26.9, 16.4, 0, 1.89),
  ('beaufort', 12105, 'Beaufort', 404, 26.7, 0.72, 0.1, 33, 21.4, 0.063, 1.06),
  ('gruyere', 12114, 'Gruyère, sans précision (origine France ou Suisse)', 408, 26.3, 0.78, 0, 33.5, 22, 0, 1.3),
  ('pecorino', 12122, 'Pecorino (fromage de brebis)', 383, 25.5, 1, 0, 31, 22, 0, 5.3),
  ('cantal', 12724, 'Cantal', 378, 25.3, 0, 0, 31, 24.2, 0, 2.15),
  ('gouda', 12736, 'Gouda', 369, 24.7, 0, 0, 30.2, 20.1, 0, 1.95),
  ('mimolette', 12740, 'Mimolette, sans précision', 319, 25.8, 0, 0, 24.2, 16.6, 0, 2.17),
  ('morbier', 12743, 'Morbier', 355, 22.8, 0, 0, 29.2, 19.2, 0, 1.41),
  ('raclette', 12749, 'Raclette (fromage)', 342, 23.4, 0, 0, 27.5, 18.5, 0, 1.69),
  ('saint-nectaire', 12752, 'Saint-Nectaire, sans précision', 342, 23.5, 0.5, 0, 27.5, 18, 0, 1.8),
  ('tomme-savoie', 12771, 'Tomme ou tome de Savoie', 361, 23.5, 0.97, 0.058, 29.2, 20.8, 0, 1.31),
  ('burrata', 12072, 'Burrata', 259, 10.8, 0.93, 0.55, 23.4, 15.4, 0, 0.53),
  ('mascarpone', 19584, 'Mascarpone', 369, 6, 3.1, 2.99, 37, 25.9, 0, 0.13)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;

do $$
begin
  if (select count(*) from public.ingredient_nutrition n join public.ingredients i on i.id = n.ingredient_id
      where i.category = 'fromages' and i.slug in ('camembert', 'brie', 'maroilles', 'munster',
        'reblochon', 'mont-d-or', 'roquefort', 'fourme-ambert', 'gorgonzola', 'raclette', 'beaufort',
        'gruyere', 'cantal', 'tomme-savoie', 'saint-nectaire', 'morbier', 'gouda', 'mimolette',
        'pecorino', 'burrata', 'mascarpone')) <> 21 then
    raise exception 'Fromages incomplets.';
  end if;
end;
$$;
