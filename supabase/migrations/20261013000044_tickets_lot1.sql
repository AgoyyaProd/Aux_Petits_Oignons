-- Relevés de tickets de caisse : scripts/data/receipts/2026-10-13.txt
-- Généré par scripts/generate-receipts-migration.py ; 26 lignes reprises,
-- 43 lignes hors prix (raisons dans le fichier source).

insert into public.receipt_prices
  (ingredient_id, store_label, purchased_on, receipt_label, pack_quantity, pack_unit, cents)
select i.id, v.store, v.purchased_on::date, v.label, v.qty::numeric, v.unit, v.cents
from (values
  ('poulet-filet', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Filet de poulet blanc - Le Gaulois 720g', 720, 'g', 953),
  ('saumon-fume', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Saumon fumé Eco+ - Norvège - 200g', 200, 'g', 443),
  ('tomate-cerise', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Tomate cerise Eco+ - Barquette 250g', 250, 'g', 99),
  ('concombre', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Concombre Bio Bio Village - x1', 1, 'piece', 129),
  ('pomme-de-terre-grenaille', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Pommes de terre Grenailles - Panier du Primeur - 1kg', 1, 'kg', 199),
  ('creme-fraiche', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Crème fraîche légère Délisse - Epaisse - 15% MG - 20cl', 20, 'cl', 65),
  ('comte', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Fromage en Tranches Entremont - Comté AOP - 120g', 120, 'g', 242),
  ('chorizo', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Chorizo Doux Saint Azay - 225g', 225, 'g', 189),
  ('jambon-cru', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Jambon Italien Saint Azay - x6 - 100g', 100, 'g', 169),
  ('pesto', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Sauce Pesto Turini - Basilic - 185g', 185, 'g', 129),
  ('cacahuete-grillee', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Cacahuètes Eco+ - Grillées à sec - 150g', 150, 'g', 44),
  ('beurre-cacahuete', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Beurre Bio Ethiquable - 100% cacahuètes - 350g', 350, 'g', 384),
  ('nouilles-riz', 'E.Leclerc Drive Noyal-sur-Vilaine', '2026-09-28', 'Nouilles de riz Table du monde - 250g', 250, 'g', 144),
  ('emmental', 'E.Leclerc Ancenis', '2026-09-18', 'EMMENTAL RAPE 30%MG 3X70G MR', 210, 'g', 189),
  ('fromage-blanc', 'E.Leclerc Ancenis', '2026-09-18', 'FROM BLANC NAT DELISSE 4X100G', 400, 'g', 96),
  ('oeuf', 'E.Leclerc Ancenis', '2026-09-18', '10 OEUF FRAIS MOY,BIO VILLA,10P', 10, 'piece', 341),
  ('poulet-filet', 'E.Leclerc Ancenis', '2026-09-18', 'FILET POULET JNE NEUTRE.720G', 720, 'g', 1274),
  ('carotte', 'E.Leclerc Ancenis', '2026-09-18', 'CAROTTE PDP CAT1 BARQUETTE 1 KG', 1, 'kg', 133),
  ('pomme-de-terre', 'E.Leclerc Ancenis', '2026-09-18', 'PDT PDP FOUR PUREE POTAG 2KG FI', 2, 'kg', 299),
  ('boeuf-steak', 'E.Leclerc Drive Ancenis', '2026-07-17', 'BAVETTE X2 CHARAL,DRIVE,260 G', 260, 'g', 993),
  ('saumon', 'E.Leclerc Drive Ancenis', '2026-07-17', '4PAV SAUM 500G PECHE OCEAN', 500, 'g', 1099),
  ('pois-chiche', 'E.Leclerc Drive Ancenis', '2026-07-17', 'POIS CHICHES,NOTRE JARDIN,265G', 265, 'g', 75),
  ('thon-boite', 'E.Leclerc Drive Ancenis', '2026-07-17', 'THON ENT NAT 1/6 X3 279G NE MR', 279, 'g', 399),
  ('semoule', 'E.Leclerc Drive Ancenis', '2026-07-17', 'COUSCOUS MOYEN,ETUI REGIA,1KG', 1, 'kg', 213),
  ('huile-olive', 'E.Leclerc Drive Ancenis', '2026-07-17', 'HOVE TERRA DELYSSA ZRP 0.75L PE', 0.75, 'l', 747),
  ('lait-coco', 'E.Leclerc Drive Ancenis', '2026-07-17', 'LAIT DE COCO BRIQUE 200ML ECO', 200, 'ml', 67)
) as v(slug, store, purchased_on, label, qty, unit, cents)
join public.ingredients i on i.slug = v.slug
on conflict (store_label, purchased_on, receipt_label) do nothing;
