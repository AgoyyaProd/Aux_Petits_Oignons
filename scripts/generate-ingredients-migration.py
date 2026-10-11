"""Génère la migration du catalogue d'ingrédients à partir d'une spécification compacte.

Usage : python3 scripts/generate-ingredients-migration.py > supabase/migrations/<horodatage>_<nom>.sql
Une migration appliquée n'est jamais réécrite : pour modifier le catalogue, écrire une
nouvelle migration (insert/update ciblés) plutôt que régénérer celle-ci.

Format d'une ligne :
  slug | nom | catégorie | dimension | densité g/ml | poids pièce g | allergènes | nature | alias
nature : M viande, P porc, F poisson/fruits de mer, A produit animal (lait, œuf, miel), vide = végétal
"""
import sys, unicodedata, re

SPEC = """
# --- Légumes
pomme-de-terre|Pomme de terre|legumes|mass||150|||pdt, patate, patates, pommes de terre
carotte|Carotte|legumes|count||125|||carottes
oignon|Oignon|legumes|count||150|||oignons, oignon jaune
oignon-rouge|Oignon rouge|legumes|count||150|||oignons rouges
echalote|Échalote|legumes|count||30|||echalotes
ail|Ail (gousse)|legumes|count||5|||ail, gousse d ail, gousses d ail
poireau|Poireau|legumes|count||200|||poireaux
courgette|Courgette|legumes|count||200|||courgettes
aubergine|Aubergine|legumes|count||250|||aubergines
poivron|Poivron|legumes|count||150|||poivrons, poivron rouge, poivron vert, poivron jaune
tomate|Tomate|legumes|count||120|||tomates
tomate-cerise|Tomate cerise|legumes|mass||15|||tomates cerises
concombre|Concombre|legumes|count||300|||concombres
brocoli|Brocoli|legumes|mass|||||brocolis
chou-fleur|Chou-fleur|legumes|mass|||||choux fleurs
chou-vert|Chou vert|legumes|mass|||||chou
chou-rouge|Chou rouge|legumes|mass|||||
epinard|Épinards|legumes|mass|||||epinard, pousses d epinard
salade|Salade verte|legumes|count||300|||laitue, batavia, salade
mache|Mâche|legumes|mass|||||
haricot-vert|Haricots verts|legumes|mass|||||haricot vert
petit-pois|Petits pois|legumes|mass|||||petit pois
champignon|Champignons de Paris|legumes|mass|||||champignon, champignons, champignon de paris
patate-douce|Patate douce|legumes|mass||300|||patates douces
potiron|Potiron|legumes|mass|||||citrouille, potimarron, courge
butternut|Courge butternut|legumes|mass|||||butternut
navet|Navet|legumes|mass|||||navets
radis|Radis|legumes|mass|||||
celeri-branche|Céleri branche|legumes|mass|||celery||celeri
celeri-rave|Céleri-rave|legumes|mass|||celery||
fenouil|Fenouil|legumes|mass|||||
betterave|Betterave cuite|legumes|mass|||||betteraves, betterave
mais|Maïs doux|legumes|mass|||||mais en boite
endive|Endive|legumes|count||120|||endives
asperge|Asperges|legumes|mass|||||asperge
artichaut|Artichaut|legumes|count||300|||artichauts
# --- Fruits
pomme|Pomme|fruits|count||150|||pommes
poire|Poire|fruits|count||160|||poires
banane|Banane|fruits|count||120|||bananes
citron|Citron|fruits|count||120|||citrons, citron jaune
citron-vert|Citron vert|fruits|count||70|||citrons verts, lime
orange|Orange|fruits|count||180|||oranges
fraise|Fraises|fruits|mass|||||fraise
framboise|Framboises|fruits|mass|||||framboise
myrtille|Myrtilles|fruits|mass|||||myrtille
raisin|Raisin|fruits|mass|||||raisins
kiwi|Kiwi|fruits|count||80|||kiwis
mangue|Mangue|fruits|count||350|||mangues
ananas|Ananas|fruits|count||1200|||
avocat|Avocat|fruits|count||170|||avocats
peche|Pêche|fruits|count||150|||peches
abricot|Abricot|fruits|count||45|||abricots
raisin-sec|Raisins secs|fruits|mass|||sulphites||raisin sec
# --- Féculents et céréales
riz|Riz|feculents|mass|0.850||||riz blanc, riz long, riz basmati, riz thai
riz-complet|Riz complet|feculents|mass|0.850||||
riz-rond|Riz rond (risotto)|feculents|mass|0.850||||riz arborio, riz a risotto
pates|Pâtes|feculents|mass|||gluten||pate, spaghetti, spaghettis, penne, coquillettes, fusilli, tagliatelles
pates-completes|Pâtes complètes|feculents|mass|||gluten||
semoule|Semoule de blé|feculents|mass|0.700||gluten||semoule, couscous
boulgour|Boulgour|feculents|mass|0.700||gluten||bulgur
quinoa|Quinoa|feculents|mass|0.750||||
pain|Pain|feculents|mass|||gluten||baguette
pain-de-mie|Pain de mie|feculents|mass|||gluten, milk|A|
farine|Farine de blé|feculents|mass|0.530||gluten||farine, farine t55, farine t45
fecule-mais|Fécule de maïs|feculents|mass|0.540||||maizena
flocon-avoine|Flocons d'avoine|feculents|mass|0.400||gluten||flocons d avoine, avoine
chapelure|Chapelure|feculents|mass|0.450||gluten||
tortilla|Tortillas de blé|feculents|count||40|gluten||tortillas, wrap, wraps
pate-feuilletee|Pâte feuilletée|feculents|count||230|gluten||pate feuilletee
pate-brisee|Pâte brisée|feculents|count||230|gluten||pate brisee
nouilles-riz|Nouilles de riz|feculents|mass|||||vermicelles de riz
gnocchi|Gnocchis|feculents|mass|||gluten||gnocchi
# --- Légumineuses
lentille-verte|Lentilles vertes|legumineuses|mass|0.800||||lentilles, lentille
lentille-corail|Lentilles corail|legumineuses|mass|0.800||||lentille corail
pois-chiche|Pois chiches cuits|legumineuses|mass|||||pois chiches, pois chiche
haricot-rouge|Haricots rouges cuits|legumineuses|mass|||||haricots rouges
haricot-blanc|Haricots blancs cuits|legumineuses|mass|||||haricots blancs, flageolets
tofu|Tofu ferme|legumineuses|mass|||soy||tofu
# --- Viandes
poulet-filet|Filet de poulet|viandes|mass||150||M|blanc de poulet, escalope de poulet, filets de poulet
poulet-cuisse|Cuisse de poulet|viandes|count||250||M|cuisses de poulet, pilons de poulet
poulet-entier|Poulet entier|viandes|mass||||M|poulet
dinde-escalope|Escalope de dinde|viandes|mass||130||M|dinde, escalopes de dinde
boeuf-hache|Bœuf haché|viandes|mass||||M|viande hachee, steak hache, boeuf hache
boeuf-steak|Steak de bœuf|viandes|mass||||M|steak, boeuf, bavette, rumsteck
boeuf-bourguignon|Bœuf à mijoter|viandes|mass||||M|boeuf bourguignon, paleron, gite
veau|Veau|viandes|mass||||M|escalope de veau, blanquette de veau
agneau|Agneau|viandes|mass||||M|gigot, epaule d agneau
porc-filet|Filet mignon de porc|viandes|mass||||M,P|filet mignon, porc
porc-cote|Côte de porc|viandes|count||200||M,P|cotes de porc
lardon|Lardons|viandes|mass||||M,P|lardons fumes, lardon
jambon|Jambon blanc|viandes|count||45||M,P|jambon, tranche de jambon
jambon-cru|Jambon cru|viandes|mass||||M,P|
saucisse|Saucisse|viandes|count||100||M,P|saucisses, chipolata, chipolatas
chorizo|Chorizo|viandes|mass||||M,P|
merguez|Merguez|viandes|count||60||M|
# --- Poissons et fruits de mer
saumon|Pavé de saumon|poissons|mass||130|fish|F|saumon, paves de saumon
saumon-fume|Saumon fumé|poissons|mass|||fish|F|
cabillaud|Cabillaud|poissons|mass||130|fish|F|dos de cabillaud, colin, lieu
thon-boite|Thon en boîte|poissons|mass|||fish|F|thon, thon au naturel
sardine-boite|Sardines en boîte|poissons|mass|||fish|F|sardines
crevette|Crevettes|poissons|mass|||crustaceans|F|crevettes decortiquees, crevette
moule|Moules|poissons|mass|||molluscs|F|moules
# --- Œufs et produits laitiers
oeuf|Œuf|oeufs_laitiers|count||55|eggs|A|oeufs, oeuf
lait|Lait|oeufs_laitiers|volume|1.030||milk|A|lait demi ecreme, lait entier
lait-vegetal|Boisson végétale (avoine)|oeufs_laitiers|volume|1.030||gluten||lait d avoine, lait vegetal
lait-coco|Lait de coco|oeufs_laitiers|volume|1.000||||
creme-fraiche|Crème fraîche épaisse|oeufs_laitiers|volume|1.000||milk|A|creme fraiche
creme-liquide|Crème liquide|oeufs_laitiers|volume|1.000||milk|A|creme liquide, creme entiere
yaourt|Yaourt nature|oeufs_laitiers|count||125|milk|A|yaourts, yogourt
fromage-blanc|Fromage blanc|oeufs_laitiers|mass|||milk|A|
beurre|Beurre|matieres_grasses|mass|0.910||milk|A|beurre doux
# --- Fromages
emmental|Emmental râpé|fromages|mass|||milk|A|gruyere rape, fromage rape, emmental
comte|Comté|fromages|mass|||milk|A|
parmesan|Parmesan|fromages|mass|||milk|A|parmigiano
mozzarella|Mozzarella|fromages|count||125|milk|A|
feta|Feta|fromages|mass|||milk|A|
chevre|Fromage de chèvre|fromages|mass|||milk|A|chevre, buche de chevre
ricotta|Ricotta|fromages|mass|||milk|A|
cheddar|Cheddar|fromages|mass|||milk|A|
# --- Matières grasses
huile-olive|Huile d'olive|matieres_grasses|volume|0.920||||huile d olive
huile-tournesol|Huile de tournesol|matieres_grasses|volume|0.920||||huile, huile neutre, huile vegetale
huile-sesame|Huile de sésame|matieres_grasses|volume|0.920||sesame||
# --- Épicerie salée
sel|Sel|epicerie_salee|mass|1.200||||sel fin, gros sel
bouillon-legumes|Bouillon cube de légumes|epicerie_salee|count||10|celery||bouillon cube, cube de bouillon, bouillon de legumes
bouillon-volaille|Bouillon cube de volaille|epicerie_salee|count||10|celery|M|bouillon de volaille, bouillon de poulet
tomate-concassee|Tomates concassées en boîte|epicerie_salee|mass|||||tomates concassees, tomates pelees
coulis-tomate|Coulis de tomate|epicerie_salee|mass|||||passata, sauce tomate
concentre-tomate|Concentré de tomate|epicerie_salee|mass|||||
olive|Olives|epicerie_salee|mass|||||olives noires, olives vertes
capre|Câpres|epicerie_salee|mass|||||capres
cornichon|Cornichons|epicerie_salee|mass|||||
pesto|Pesto|epicerie_salee|mass|||milk, tree_nuts|A|pesto basilic
noix|Noix|epicerie_salee|mass|||tree_nuts||cerneaux de noix
amande|Amandes|epicerie_salee|mass|||tree_nuts||amandes effilees, poudre d amande
cacahuete|Cacahuètes|epicerie_salee|mass|||peanuts||arachides
graine-sesame|Graines de sésame|epicerie_salee|mass|||sesame||sesame
# --- Condiments
moutarde|Moutarde|condiments|mass|1.100||mustard||moutarde de dijon
mayonnaise|Mayonnaise|condiments|mass|0.910||eggs, mustard|A|
ketchup|Ketchup|condiments|mass|1.150||||
sauce-soja|Sauce soja|condiments|volume|1.150||soy, gluten||sauce soja salee
vinaigre-balsamique|Vinaigre balsamique|condiments|volume|1.050||sulphites||balsamique
vinaigre|Vinaigre de vin|condiments|volume|1.010||sulphites||vinaigre
vin-blanc|Vin blanc|condiments|volume|0.990||sulphites||
vin-rouge|Vin rouge|condiments|volume|0.990||sulphites||
pate-curry|Pâte de curry|condiments|mass|||||pate de curry rouge, pate de curry vert
harissa|Harissa|condiments|mass|||||
# --- Épices et herbes
poivre|Poivre noir|epices_herbes|mass|0.500||||poivre
paprika|Paprika|epices_herbes|mass|0.450||||paprika fume
cumin|Cumin|epices_herbes|mass|0.400||||
curry|Curry en poudre|epices_herbes|mass|0.400||||curry
curcuma|Curcuma|epices_herbes|mass|0.500||||
cannelle|Cannelle|epices_herbes|mass|0.500||||
muscade|Noix de muscade|epices_herbes|mass|0.500||||muscade
herbes-provence|Herbes de Provence|epices_herbes|mass|0.150||||
thym|Thym|epices_herbes|mass|||||
laurier|Laurier|epices_herbes|count||1|||feuille de laurier, feuilles de laurier
basilic|Basilic frais|epices_herbes|mass|||||basilic
persil|Persil frais|epices_herbes|mass|||||persil
coriandre|Coriandre fraîche|epices_herbes|mass|||||coriandre
ciboulette|Ciboulette|epices_herbes|mass|||||
menthe|Menthe fraîche|epices_herbes|mass|||||menthe
gingembre|Gingembre frais|epices_herbes|mass|||||gingembre
piment|Piment|epices_herbes|mass|||||piment d espelette, piment de cayenne
# --- Épicerie sucrée
sucre|Sucre|epicerie_sucree|mass|0.850||||sucre en poudre, sucre blanc
sucre-roux|Sucre roux|epicerie_sucree|mass|0.850||||cassonade, vergeoise
sucre-glace|Sucre glace|epicerie_sucree|mass|0.560||||
miel|Miel|epicerie_sucree|mass|1.420|||A|
sirop-erable|Sirop d'érable|epicerie_sucree|volume|1.330||||sirop d erable
chocolat-noir|Chocolat noir|epicerie_sucree|mass|||soy||chocolat, chocolat patissier
cacao|Cacao en poudre|epicerie_sucree|mass|0.450||||cacao non sucre
levure-chimique|Levure chimique|epicerie_sucree|mass|0.900||||levure, sachet de levure
sucre-vanille|Sucre vanillé|epicerie_sucree|mass|0.850||||
extrait-vanille|Extrait de vanille|epicerie_sucree|volume|1.000||||vanille
confiture|Confiture|epicerie_sucree|mass|||||
compote|Compote de pommes|epicerie_sucree|mass|||||compote
# --- Boissons et liquides de base
eau|Eau|boissons|volume|1.000||||
jus-orange|Jus d'orange|boissons|volume|1.040||||jus d orange
"""

CONFLICTS = {
    "M": ["vegetarian", "vegan", "pescetarian"],
    "P": ["no_pork"],
    "F": ["vegetarian", "vegan"],
    "A": ["vegan"],
}

def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("œ", "oe").replace("æ", "ae")
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    return s

def q(s): return "'" + s.replace("'", "''") + "'"

rows, aliases, allergens, conflicts = [], [], [], []
seen_slugs, seen_alias = set(), {}
VALID_ALLERGENS = {"gluten","crustaceans","eggs","fish","peanuts","soy","milk","tree_nuts","celery","mustard","sesame","sulphites","lupin","molluscs"}

for line in SPEC.strip().splitlines():
    if not line.strip() or line.startswith("#"):
        continue
    parts = [p.strip() for p in line.split("|")]
    assert len(parts) == 9, line
    slug, name, cat, dim, dens, piece, alls, nature, al = parts
    assert slug not in seen_slugs, slug
    seen_slugs.add(slug)
    assert dim in ("mass", "volume", "count"), line
    if dim == "count":
        assert piece, f"count sans poids : {slug}"
    if dim == "volume":
        assert dens, f"volume sans densité : {slug}"
    rows.append(f"  ({q(slug)}, {q(name)}, {q(cat)}, {q(dim)}, {dens or 'null'}, {piece or 'null'})")
    # nom + alias explicites, dédoublonnés
    for a in [name] + [x for x in al.split(",") if x.strip()]:
        n = norm(a)
        if not n:
            continue
        if n in seen_alias:
            assert seen_alias[n] == slug, f"alias '{n}' partagé par {seen_alias[n]} et {slug}"
            continue
        seen_alias[n] = slug
        if a != name:
            aliases.append(f"  ({q(n)}, {q(slug)})")
    for a in [x.strip() for x in alls.split(",") if x.strip()]:
        assert a in VALID_ALLERGENS, (slug, a)
        allergens.append(f"  ({q(slug)}, {q(a)})")
    diets = set()
    for code in [x.strip() for x in nature.split(",") if x.strip()]:
        diets.update(CONFLICTS[code])
    for d in sorted(diets):
        conflicts.append(f"  ({q(slug)}, {q(d)})")

out = []
out.append("""-- 0004 — Catalogue initial d'ingrédients (données de référence, requises en production).
-- Fichier GÉNÉRÉ par scripts/generate-ingredients-migration.py : modifier la spécification
-- du script puis régénérer une NOUVELLE migration ; ne jamais éditer celle-ci une fois appliquée.
--
-- Densités (g/ml) et poids unitaires (g) : valeurs culinaires moyennes, utilisées
-- uniquement pour convertir une recette exprimée dans une autre unité que le stock.
-- Une conversion absente (NULL) est interdite, jamais devinée.
""")
out.append(f"-- {len(rows)} ingrédients, {len(aliases)} alias supplémentaires, "
           f"{len(allergens)} liens allergènes, {len(conflicts)} incompatibilités de régime.\n")
out.append("insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml, piece_weight_g, is_validated)\nselect v.slug, v.name, v.category, v.dimension::public.dimension, v.density, v.piece, true\nfrom (values\n" + ",\n".join(rows) + "\n) as v(slug, name, category, dimension, density, piece);\n")
out.append("insert into public.ingredient_aliases (alias_normalized, ingredient_id)\nselect v.alias, i.id\nfrom (values\n" + ",\n".join(aliases) + "\n) as v(alias, slug)\njoin public.ingredients i on i.slug = v.slug;\n")
out.append("insert into public.ingredient_allergens (ingredient_id, allergen_code)\nselect i.id, v.allergen\nfrom (values\n" + ",\n".join(allergens) + "\n) as v(slug, allergen)\njoin public.ingredients i on i.slug = v.slug;\n")
out.append("insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)\nselect i.id, v.diet\nfrom (values\n" + ",\n".join(conflicts) + "\n) as v(slug, diet)\njoin public.ingredients i on i.slug = v.slug;\n")
sys.stdout.write("\n".join(out))
print(f"{len(rows)} ingrédients, {len(aliases)} alias, {len(allergens)} allergènes, {len(conflicts)} conflits", file=sys.stderr)
