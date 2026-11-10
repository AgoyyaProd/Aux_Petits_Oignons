-- Relevés de tickets de caisse : scripts/data/receipts/2026-11-10.txt
-- Généré par scripts/generate-receipts-migration.py ; 34 lignes reprises,
-- 7 lignes hors prix (raisons dans le fichier source).
-- Complète 0077 à 0080 avec le potimarron ; les lignes déjà chargées sont ignorées (on conflict).

insert into public.receipt_prices
  (ingredient_id, store_label, purchased_on, receipt_label, pack_quantity, pack_unit, cents)
select i.id, v.store, v.purchased_on::date, v.label, v.qty::numeric, v.unit, v.cents
from (values
  ('spaghetti', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'SPAGHETTI PLAT,PANZANI,500G', 500, 'g', 100),
  ('pain-de-mie', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'PAIN SANDW NATUR,EPI D''OR,550G', 550, 'g', 113),
  ('haricot-rouge', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'HARICOTS RGES 3X125G PNE', 375, 'g', 191),
  ('bouillon-volaille', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'MAGGI BOUIL VOLAILLE DEGRAISSE', 120, 'g', 147),
  ('bouillon-legumes', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'BOUILLON KUB LEGUME-25%SEL,120G', 120, 'g', 145),
  ('tomate-sechee', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'ANTIPASTO TOMA.SECHE,SACLA,280G', 280, 'g', 276),
  ('sauce-teriyaki', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'SCE TERIYAKI POULET,MAGGI,355G', 355, 'g', 352),
  ('pain', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'BAG. TRADIROUGE 3+1 OFR,1KG', 1, 'kg', 276),
  ('potiron', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'POTIMARRON BIO', 1.6, 'kg', 219),
  ('patate-douce', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'PATATE DOUCE', 1, 'kg', 171),
  ('graine-sesame', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'GRAINES DE SESAME APIHA 120G', 120, 'g', 205),
  ('tomate', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'TOMATE ECO+ FILET 1 KG', 1, 'kg', 199),
  ('salade', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'SUCRINE BICOLORE 3 PIECES CAT 1', 3, 'piece', 149),
  ('jambon', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'BPARIS JBN ETOUFFEE CSNI 4T 140', 4, 'piece', 218),
  ('fromage-blanc', 'E.Leclerc (magasin non indiqué)', '2026-10-05', '8 DELIDOUX NATURE 20%MG,800G', 800, 'g', 179),
  ('grana-padano', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'GRANA PADANO RAPE LES CROISES', 130, 'g', 149),
  ('mozzarella', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'MOZZARELLA RAPEE 22% MG 150G', 150, 'g', 139),
  ('cheddar', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'KRAFT.CHED.RAPE.150G', 150, 'g', 234),
  ('boeuf-hache', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'HACHE 5%MG 100% VBF,500G', 500, 'g', 809),
  ('poulet-filet', 'E.Leclerc (magasin non indiqué)', '2026-10-05', '2FILET POULET BLANC S/AT,,300G', 300, 'g', 405),
  ('saumon', 'E.Leclerc (magasin non indiqué)', '2026-10-05', 'FILET SAUMON', 500, 'g', 648),
  ('macaronis', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'PATES MACARONI, PANZANI, 500G', 500, 'g', 89),
  ('muscade', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'MUSCADE MOULUE.42G', 42, 'g', 220),
  ('pois-chiche', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'POIS CHICHES 3X130G PNE NJARD', 390, 'g', 165),
  ('nouilles-riz', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'NOUILLES DE RIZ 250G TDM', 250, 'g', 144),
  ('chou-rouge', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'CHOU ROUGE', 650, 'g', 132),
  ('noix', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'CERNEAUX NOIX BRQ,125G', 125, 'g', 191),
  ('patate-douce', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'PATATE DOUCE PDP BARQUETTE 1KG', 1, 'kg', 139),
  ('salade', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'SUCRINE BICOLORE 3 PIECES CAT 1', 3, 'piece', 149),
  ('butternut', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'COURGE BUTTERNUT', 1.2, 'kg', 199),
  ('yaourt', 'E.Leclerc (magasin non indiqué)', '2026-11-02', '4 YAOURTS NATURE,DELISSE,500G', 4, 'piece', 65),
  ('beurre', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'BEURRE BRETAGNE 1/2 SEL 250G', 250, 'g', 265),
  ('porc-pave', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'PAVE DE PORC SANS OS A GRILLER', 700, 'g', 543),
  ('saumon', 'E.Leclerc (magasin non indiqué)', '2026-11-02', 'FILET SAUMON', 500, 'g', 720)
) as v(slug, store, purchased_on, label, qty, unit, cents)
join public.ingredients i on i.slug = v.slug
on conflict (store_label, purchased_on, receipt_label) do nothing;
