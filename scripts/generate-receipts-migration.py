#!/usr/bin/env python3
"""Génère la migration d'un lot de tickets de caisse (table receipt_prices).

Source : scripts/data/receipts/<lot>.txt (format décrit en tête de fichier).
Vérifie chaque ligne : date, prix, nombre d'articles, ingrédient connu, contenance imprimée.
Les lignes sans ingrédient (« - ») sont gardées dans le fichier mais pas dans la base.
Usage : python3 scripts/generate-receipts-migration.py scripts/data/receipts/<lot>.txt \
          > supabase/migrations/<fichier>.sql
"""
import datetime
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MIGRATIONS = ROOT / "supabase/migrations"
UNITS = {"g": "g", "kg": "kg", "ml": "ml", "cl": "cl", "l": "l", "pièce": "piece", "pièces": "piece"}
PRICE = re.compile(r"^\d{1,4}\.\d{2}$")
QTY = re.compile(r"^(\d+(?:\.\d+)?)\s+(\S+)$")


def fail(path: pathlib.Path, number: int, message: str) -> None:
    sys.exit(f"{path.name} ligne {number} : {message}")


def known_slugs() -> set[str]:
    """Slugs créés par les migrations (référentiel, variantes, nouveaux produits)."""
    slugs: set[str] = set()
    for sql in sorted(MIGRATIONS.glob("*.sql")):
        text = sql.read_text(encoding="utf-8")
        if "into public.ingredients" not in text:
            continue
        slugs.update(re.findall(r"\(\s*'([a-z0-9]+(?:-[a-z0-9]+)*)',\s*'(?:[^']|'')+'", text))
    return slugs


def sql_text(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    path = pathlib.Path(sys.argv[1]).resolve()
    slugs = known_slugs()
    store = date = None
    rows = []
    skipped = 0
    seen = set()
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("@"):
            parts = [p.strip() for p in line[1:].split("|")]
            if len(parts) != 2:
                fail(path, number, "en-tête attendu : @ <date> | <magasin>")
            try:
                date = datetime.date.fromisoformat(parts[0])
            except ValueError:
                fail(path, number, f"date invalide « {parts[0]} »")
            if not 1 <= len(parts[1]) <= 60:
                fail(path, number, "nom de magasin vide ou trop long")
            store = parts[1]
            continue
        if store is None:
            fail(path, number, "ligne d'article avant le premier en-tête @")
        body = line.split(" # ")[0] if " # " in line else line
        parts = [p.strip() for p in body.split("|")]
        if len(parts) < 4:
            fail(path, number, "5 champs attendus")
        label, count, price, slug = parts[:4]
        quantity = parts[4] if len(parts) > 4 else ""
        if not count.isdigit() or not 1 <= int(count) <= 50:
            fail(path, number, f"nombre d'articles invalide « {count} »")
        if not PRICE.match(price):
            fail(path, number, f"prix invalide « {price} »")
        if not 1 <= len(label) <= 120:
            fail(path, number, "libellé vide ou trop long")
        if slug == "-":
            if "#" not in line:
                fail(path, number, "ligne non reprise sans raison (« # … »)")
            skipped += 1
            continue
        if slug not in slugs:
            fail(path, number, f"ingrédient inconnu « {slug} »")
        match = QTY.match(quantity)
        if not match or match.group(2) not in UNITS:
            fail(path, number, f"contenance invalide « {quantity} »")
        key = (store, date, label)
        if key in seen:
            fail(path, number, "ligne en double pour ce ticket")
        seen.add(key)
        cents = round(float(price) * 100)
        rows.append((slug, store, date, label, match.group(1), UNITS[match.group(2)], cents))

    print(f"-- Relevés de tickets de caisse : {path.relative_to(ROOT)}")
    print(f"-- Généré par scripts/generate-receipts-migration.py ; {len(rows)} lignes reprises,")
    print(f"-- {skipped} lignes hors prix (raisons dans le fichier source).")
    print()
    print("insert into public.receipt_prices")
    print("  (ingredient_id, store_label, purchased_on, receipt_label, pack_quantity, pack_unit, cents)")
    print("select i.id, v.store, v.purchased_on::date, v.label, v.qty::numeric, v.unit, v.cents")
    print("from (values")
    values = [
        f"  ({sql_text(slug)}, {sql_text(store)}, '{day.isoformat()}', {sql_text(label)}, "
        f"{qty}, '{unit}', {cents})"
        for slug, store, day, label, qty, unit, cents in rows
    ]
    print(",\n".join(values))
    print(") as v(slug, store, purchased_on, label, qty, unit, cents)")
    print("join public.ingredients i on i.slug = v.slug")
    print("on conflict (store_label, purchased_on, receipt_label) do nothing;")


main()
