-- 0013 — Corrections de correspondances après la première synchronisation (11/10/2026).
-- Source : scripts/data/price-mappings.txt.
--   sel : « en:salts » inclut fleur de sel et sels de spécialité (27 €/kg) ;
--         on se limite au sel fin, de table et au gros sel.
--   butternut : aucune donnée produit ; prix des courges brutes, marqué approchant.
--   bouillon de volaille : aucune donnée ; ajout des bouillons en cubes, marqué approchant.

update public.ingredient_price_sources s
set tags = v.tags, kind = v.kind, approximate = v.approximate
from (values
  ('sel', 'product', array['en:fine-grained-salts', 'en:table-salts', 'en:coarse-grained-salts'], false),
  ('butternut', 'raw', array['en:pumpkins'], true),
  ('bouillon-volaille', 'product', array['en:dehydrated-poultry-broth-stock', 'en:bouillon-cubes'], true)
) as v(slug, kind, tags, approximate)
join public.ingredients i on i.slug = v.slug
where s.ingredient_id = i.id;

-- Le prix du sel calculé avec l'ancienne catégorie sera remplacé (ou retiré, faute de
-- relevés suffisants) à la prochaine synchronisation.
