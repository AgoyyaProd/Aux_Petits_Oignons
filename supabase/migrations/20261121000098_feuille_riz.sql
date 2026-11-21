-- 0098 — Feuilles de riz (pour rouleaux de printemps) : comptées à la feuille.
-- Poids d'une feuille : 10 g, d'après un sachet du commerce « Feuilles de riz x15 150g »
-- (greenweez.com, produit 1SANA0226). Ciqual n'a pas de feuille de riz (ses « galettes de
-- riz » sont du riz soufflé, un autre produit) : pas de valeurs nutritionnelles plutôt que
-- des valeurs inventées. Riz, sel, eau : pas d'allergène réglementaire.

insert into public.ingredients (slug, name, category, default_dimension, piece_weight_g, is_validated)
values ('feuille-riz', 'Feuilles de riz', 'feculents', 'count', 10, true);

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('feuilles de riz'), ('feuille de riz'), ('papier de riz'), ('galettes de riz pour rouleaux'),
  ('galettes pour rouleaux de printemps'), ('rice paper')
) as v(alias) join public.ingredients i on i.slug = 'feuille-riz'
on conflict do nothing;

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, 'none', array[]::text[], false from public.ingredients i where i.slug = 'feuille-riz';
