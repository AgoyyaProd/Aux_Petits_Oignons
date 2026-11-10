-- Relevés de tickets de caisse : scripts/data/receipts/2026-11-10.txt
-- Généré par scripts/generate-receipts-migration.py ; 22 lignes reprises,
-- 19 lignes hors prix (raisons dans le fichier source).

insert into public.receipt_prices
  (ingredient_id, store_label, purchased_on, receipt_label, pack_quantity, pack_unit, cents)
select i.id, v.store, v.purchased_on::date, v.label, v.qty::numeric, v.unit, v.cents
from (values
  ('spaghetti', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'SPAGHETTI PLAT,PANZANI,500G', 500, 'g', 100),
  ('pain-de-mie', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'PAIN SANDW NATUR,EPI D''OR,550G', 550, 'g', 113),
  ('haricot-rouge', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'HARICOTS RGES 3X125G PNE', 375, 'g', 191),
  ('bouillon-legumes', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'BOUILLON KUB LEGUME-25%SEL,120G', 120, 'g', 145),
  ('tomate-sechee', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'ANTIPASTO TOMA.SECHE,SACLA,280G', 280, 'g', 276),
  ('sauce-teriyaki', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'SCE TERIYAKI POULET,MAGGI,355G', 355, 'g', 352),
  ('pain', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'BAG. TRADIROUGE 3+1 OFR,1KG', 1, 'kg', 276),
  ('graine-sesame', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'GRAINES DE SESAME APIHA 120G', 120, 'g', 205),
  ('tomate', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'TOMATE ECO+ FILET 1 KG', 1, 'kg', 199),
  ('jambon', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'BPARIS JBN ETOUFFEE CSNI 4T 140', 4, 'piece', 218),
  ('mozzarella', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'MOZZARELLA RAPEE 22% MG 150G', 150, 'g', 139),
  ('cheddar', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'KRAFT.CHED.RAPE.150G', 150, 'g', 234),
  ('boeuf-hache', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'HACHE 5%MG 100% VBF,500G', 500, 'g', 809),
  ('poulet-filet', 'E.Leclerc (magasin non indiqué)', '2026-10-05', '2FILET POULET BLANC S/AT,,300G', 300, 'g', 405),
  ('macaronis', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'PATES MACARONI, PANZANI, 500G', 500, 'g', 89),
  ('muscade', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'MUSCADE MOULUE.42G', 42, 'g', 220),
  ('pois-chiche', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'POIS CHICHES 3X130G PNE NJARD', 390, 'g', 165),
  ('nouilles-riz', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'NOUILLES DE RIZ 250G TDM', 250, 'g', 144),
  ('noix', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'CERNEAUX NOIX BRQ,125G', 125, 'g', 191),
  ('patate-douce', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'PATATE DOUCE PDP BARQUETTE 1KG', 1, 'kg', 139),
  ('yaourt', 'E.Leclerc (magasin non indiqué)', '2026-11-02', '4 YAOURTS NATURE,DELISSE,500G', 4, 'piece', 65),
  ('beurre', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'BEURRE BRETAGNE 1/2 SEL 250G', 250, 'g', 265)
) as v(slug, store, purchased_on, label, qty, unit, cents)
join public.ingredients i on i.slug = v.slug
on conflict (store_label, purchased_on, receipt_label) do nothing;
