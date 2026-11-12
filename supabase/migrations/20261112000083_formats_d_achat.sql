-- 0083 — Formats d'achat : contenance habituelle des produits, pour le coût « en magasin ».
--
-- La liste de courses chiffrait la quantité exacte consommée par les repas ; en magasin, on
-- paie des paquets entiers. Ce tableau donne, par ingrédient vendu en paquet, la contenance
-- la plus courante, pour estimer ce qui sera réellement payé (le surplus rejoint le
-- garde-manger). Il ne change ni le besoin, ni le menu, ni les formats standards (0065).
--
-- Source : Open Prices (Open Food Facts, licence ODbL), relevés de produits faits en France
-- du 01/11/2024 au 12/11/2026 (100 à 200 plus récents par catégorie de prix, celle de
-- ingredient_price_sources). Contenance du produit (product_quantity), dans la dimension
-- de l'ingrédient (g ou ml ; jamais de conversion, les produits comptés à la pièce sont
-- exclus). Règle, appliquée telle quelle :
--   - contenance la plus fréquente, comptée en produits distincts (code-barres) ;
--   - celle des magasins E.Leclerc et U si elle diffère, s'ils ont au moins 10 relevés et
--     au moins la moitié des produits de la contenance nationale (scope 'leclerc_u') ;
--   - au moins 3 produits distincts, sinon pas de format (le coût reste au poids).
-- Données recalculables : scripts/formats-d-achat/ (relevé puis analyse, voir README).
-- Priorité à l'usage : format standard (0065), puis dernier ticket de caisse, puis ce tableau.

create table public.purchase_formats (
  ingredient_id uuid primary key references public.ingredients (id) on delete cascade,
  quantity_base numeric(12,3) not null check (quantity_base > 0),
  label text not null check (char_length(label) between 1 and 40),
  products integer not null check (products >= 3),
  observations integer not null check (observations >= products),
  scope text not null check (scope in ('france', 'leclerc_u')),
  source text not null check (char_length(source) between 1 and 200),
  updated_at timestamptz not null default now()
);

revoke all on public.purchase_formats from anon, authenticated;
grant select on public.purchase_formats to authenticated;
alter table public.purchase_formats enable row level security;
create policy purchase_formats_read on public.purchase_formats
  for select to authenticated using (true);
-- Écriture : par migration seulement (comme les formats standards).

insert into public.purchase_formats (ingredient_id, quantity_base, label, products, observations, scope, source)
select i.id, v.qty, v.label, v.products, v.observations, v.scope,
  'Open Prices (Open Food Facts, ODbL), relevés France 11/2024–11/2026'
from (values
  ('amande', 125, '125 g', 29, 44, 'france'),
  ('betterave', 500, '500 g', 7, 13, 'france'),
  ('beurre', 250, '250 g', 57, 138, 'france'),
  ('boeuf-hache', 250, '250 g', 19, 28, 'france'),
  ('boeuf-steak', 250, '250 g', 20, 29, 'france'),
  ('boulgour', 400, '400 g', 8, 17, 'france'),
  ('cabillaud', 400, '400 g', 13, 37, 'france'),
  ('cacahuete', 150, '150 g', 5, 13, 'leclerc_u'),
  ('cacahuete-grillee', 150, '150 g', 5, 13, 'leclerc_u'),
  ('cacao', 250, '250 g', 14, 40, 'france'),
  ('cannelle', 35, '35 g', 5, 15, 'france'),
  ('chapelure', 200, '200 g', 5, 6, 'france'),
  ('cheddar', 200, '200 g', 25, 65, 'france'),
  ('chevre', 150, '150 g', 19, 23, 'france'),
  ('chocolat-noir', 100, '100 g', 70, 111, 'france'),
  ('chorizo', 200, '200 g', 8, 20, 'france'),
  ('compote', 400, '400 g', 48, 68, 'france'),
  ('comte', 200, '200 g', 20, 85, 'france'),
  ('concentre-tomate', 200, '200 g', 8, 24, 'france'),
  ('confiture', 370, '370 g', 47, 63, 'france'),
  ('confiture-abricot', 370, '370 g', 47, 63, 'france'),
  ('confiture-cerise', 370, '370 g', 47, 63, 'france'),
  ('confiture-figue', 370, '370 g', 47, 63, 'france'),
  ('confiture-fraise', 370, '370 g', 47, 63, 'france'),
  ('confiture-framboise', 370, '370 g', 47, 63, 'france'),
  ('confiture-mure', 370, '370 g', 47, 63, 'france'),
  ('confiture-myrtille', 370, '370 g', 47, 63, 'france'),
  ('confiture-peche', 370, '370 g', 47, 63, 'france'),
  ('confiture-prune', 370, '370 g', 47, 63, 'france'),
  ('confiture-rhubarbe', 370, '370 g', 47, 63, 'france'),
  ('cornichon', 360, '360 g', 15, 24, 'france'),
  ('coulis-tomate', 500, '500 g', 7, 21, 'france'),
  ('creme', 200, '20 cl', 31, 83, 'france'),
  ('creme-fraiche', 200, '20 cl', 16, 44, 'france'),
  ('creme-liquide', 600, '60 cl', 25, 52, 'france'),
  ('crevette', 100, '100 g', 17, 20, 'france'),
  ('cumin', 40, '40 g', 8, 47, 'france'),
  ('curcuma', 35, '35 g', 3, 8, 'france'),
  ('curry', 100, '100 g', 7, 8, 'france'),
  ('emmental', 200, '200 g', 16, 54, 'france'),
  ('extrait-vanille', 20, '2 cl', 5, 7, 'france'),
  ('farfalle', 500, '500 g', 18, 40, 'france'),
  ('farine', 1000, '1 kg', 78, 156, 'france'),
  ('farine-bise', 1000, '1 kg', 78, 156, 'france'),
  ('farine-complete', 1000, '1 kg', 78, 156, 'france'),
  ('farine-levure', 1000, '1 kg', 78, 156, 'france'),
  ('farine-pain', 1000, '1 kg', 78, 156, 'france'),
  ('farine-semi-complete', 1000, '1 kg', 78, 156, 'france'),
  ('fecule-mais', 400, '400 g', 3, 4, 'leclerc_u'),
  ('feta', 150, '150 g', 14, 34, 'france'),
  ('flocon-avoine', 500, '500 g', 37, 87, 'france'),
  ('fromage-blanc', 400, '400 g', 34, 54, 'france'),
  ('fusilli', 500, '500 g', 25, 78, 'france'),
  ('gelee-groseille', 370, '370 g', 47, 63, 'france'),
  ('gnocchi', 300, '300 g', 19, 54, 'france'),
  ('graine-sesame', 100, '100 g', 6, 9, 'france'),
  ('harissa', 140, '140 g', 6, 24, 'france'),
  ('herbes-provence', 40, '40 g', 3, 20, 'france'),
  ('huile-olive', 750, '75 cl', 40, 75, 'france'),
  ('huile-sesame', 250, '25 cl', 16, 38, 'france'),
  ('huile-tournesol', 1000, '1 L', 23, 62, 'france'),
  ('jambon-cru', 100, '100 g', 35, 80, 'france'),
  ('jus-orange', 1000, '1 L', 58, 103, 'france'),
  ('ketchup', 560, '560 g', 11, 25, 'france'),
  ('lait', 1000, '1 L', 43, 60, 'france'),
  ('lait-coco', 200, '20 cl', 7, 10, 'france'),
  ('lait-vegetal', 1000, '1 L', 95, 134, 'france'),
  ('lardon', 150, '150 g', 27, 65, 'france'),
  ('lentille-corail', 500, '500 g', 18, 35, 'france'),
  ('lentille-verte', 500, '500 g', 37, 106, 'france'),
  ('levure-chimique', 10, '10 g', 3, 3, 'france'),
  ('linguine', 500, '500 g', 14, 52, 'france'),
  ('macaronis', 1000, '1 kg', 10, 25, 'france'),
  ('mache', 125, '125 g', 8, 16, 'france'),
  ('mais', 285, '285 g', 14, 62, 'france'),
  ('marmelade-orange', 370, '370 g', 47, 63, 'france'),
  ('mayonnaise', 235, '235 g', 11, 31, 'france'),
  ('miel', 500, '500 g', 42, 63, 'france'),
  ('moule', 500, '500 g', 9, 15, 'france'),
  ('moutarde', 200, '200 g', 25, 30, 'france'),
  ('muscade', 20, '20 g', 3, 8, 'france'),
  ('noix', 50, '50 g', 8, 14, 'france'),
  ('olive', 120, '120 g', 13, 20, 'leclerc_u'),
  ('pain', 250, '250 g', 33, 143, 'france'),
  ('pain-de-mie', 500, '500 g', 46, 86, 'france'),
  ('paprika', 40, '40 g', 9, 33, 'france'),
  ('parmesan', 60, '60 g', 8, 23, 'france'),
  ('pate-curry', 100, '100 g', 10, 33, 'france'),
  ('pates', 500, '500 g', 120, 143, 'france'),
  ('pates-completes', 500, '500 g', 41, 158, 'france'),
  ('pates-lasagne', 500, '500 g', 10, 54, 'france'),
  ('penne', 500, '500 g', 45, 142, 'france'),
  ('pesto', 190, '190 g', 40, 101, 'france'),
  ('petit-pois', 280, '280 g', 7, 17, 'leclerc_u'),
  ('piment', 40, '40 g', 13, 28, 'france'),
  ('pois-chiche', 265, '265 g', 5, 13, 'leclerc_u'),
  ('poivre', 38, '38 g', 8, 28, 'france'),
  ('poulet-filet', 300, '300 g', 4, 10, 'france'),
  ('quinoa', 400, '400 g', 12, 36, 'france'),
  ('raisin-sec', 500, '500 g', 15, 28, 'france'),
  ('ricotta', 250, '250 g', 16, 44, 'france'),
  ('rigatoni', 500, '500 g', 6, 15, 'france'),
  ('riz', 500, '500 g', 76, 123, 'france'),
  ('riz-arborio', 500, '500 g', 9, 21, 'france'),
  ('riz-basmati', 500, '500 g', 38, 72, 'france'),
  ('riz-complet', 500, '500 g', 25, 37, 'france'),
  ('riz-etuve', 500, '500 g', 7, 10, 'france'),
  ('riz-jasmin', 500, '500 g', 30, 71, 'france'),
  ('riz-rond', 500, '500 g', 15, 28, 'france'),
  ('riz-thai', 500, '500 g', 76, 123, 'france'),
  ('sardine-boite', 135, '135 g', 19, 23, 'leclerc_u'),
  ('sauce-soja', 150, '15 cl', 17, 45, 'france'),
  ('saumon', 250, '250 g', 11, 18, 'france'),
  ('saumon-fume', 120, '120 g', 10, 14, 'leclerc_u'),
  ('sel', 250, '250 g', 10, 32, 'leclerc_u'),
  ('semoule', 500, '500 g', 28, 80, 'france'),
  ('sirop-erable', 250, '25 cl', 4, 8, 'france'),
  ('spaghetti', 500, '500 g', 42, 109, 'france'),
  ('sucre', 1000, '1 kg', 32, 66, 'france'),
  ('sucre-glace', 500, '500 g', 5, 17, 'france'),
  ('sucre-roux', 1000, '1 kg', 13, 27, 'france'),
  ('sucre-vanille', 7, '7 g', 7, 14, 'france'),
  ('tagliatelles', 500, '500 g', 17, 38, 'france'),
  ('thon-boite', 160, '160 g', 24, 34, 'france'),
  ('thym', 15, '15 g', 7, 12, 'france'),
  ('tomate-concassee', 400, '400 g', 38, 92, 'france'),
  ('veau', 200, '200 g', 4, 6, 'france'),
  ('vin-blanc', 750, '75 cl', 26, 32, 'france'),
  ('vin-rouge', 750, '75 cl', 37, 47, 'france'),
  ('vinaigre', 500, '50 cl', 20, 76, 'france'),
  ('vinaigre-balsamique', 500, '50 cl', 30, 85, 'france')
) as v(slug, qty, label, products, observations, scope)
join public.ingredients i on i.slug = v.slug;
