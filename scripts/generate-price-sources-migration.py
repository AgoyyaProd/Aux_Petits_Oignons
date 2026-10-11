#!/usr/bin/env python3
"""Génère la migration des correspondances ingrédient -> catégories Open Prices.

Source : scripts/data/price-mappings.txt (une ligne par ingrédient).
Vérifie que chaque ingrédient du référentiel (migration 0004) a exactement une
ligne, et que chaque catégorie a la forme d'un identifiant Open Food Facts.
Usage : python3 scripts/generate-price-sources-migration.py > supabase/migrations/<fichier>.sql
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SPEC = ROOT / "scripts/data/price-mappings.txt"
INGREDIENTS_SQL = ROOT / "supabase/migrations/20261011000004_reference_ingredients.sql"
TAG = re.compile(r"^[a-z]{2}:[a-z0-9]+(-[a-z0-9]+)*$")
KINDS = {"raw", "product", "free", "none"}


def fail(message: str) -> None:
    sys.exit(f"price-mappings.txt : {message}")


known = set(
    re.findall(
        r"^\s*\('([a-z0-9-]+)', '(?:[^']|'')+', '[a-z_]+', '(?:mass|volume|count)'",
        INGREDIENTS_SQL.read_text(encoding="utf-8"),
        re.M,
    )
)
if len(known) != 177:
    fail(f"177 ingrédients attendus dans 0004, {len(known)} trouvés")

rows = []
seen = set()
for number, line in enumerate(SPEC.read_text(encoding="utf-8").splitlines(), 1):
    if not line.strip() or line.startswith("#"):
        continue
    parts = line.split()
    slug, kind, rest = parts[0], parts[1] if len(parts) > 1 else "", parts[2:]
    approximate = "~" in rest
    tags = [t for t in rest if t != "~"]
    if slug not in known:
        fail(f"ligne {number} : ingrédient inconnu « {slug} »")
    if slug in seen:
        fail(f"ligne {number} : « {slug} » en double")
    if kind not in KINDS:
        fail(f"ligne {number} : type « {kind} » invalide")
    if (kind in {"raw", "product"}) != bool(tags):
        fail(f"ligne {number} : catégories requises pour raw/product, interdites sinon")
    for tag in tags:
        if not TAG.match(tag):
            fail(f"ligne {number} : catégorie mal formée « {tag} »")
    seen.add(slug)
    rows.append((slug, kind, tags, approximate))

missing = known - seen
if missing:
    fail(f"ingrédients sans correspondance : {', '.join(sorted(missing))}")


def sql_array(tags: list[str]) -> str:
    return "'{}'::text[]" if not tags else "array[" + ", ".join(f"'{t}'" for t in tags) + "]"


values = ",\n".join(
    f"  ('{slug}', '{kind}', {sql_array(tags)}, {'true' if approx else 'false'})"
    for slug, kind, tags, approx in rows
)
free = [slug for slug, kind, _, _ in rows if kind == "free"]

print(f"""-- 0011 — Correspondance ingrédients -> catégories Open Prices (données de référence).
-- Fichier GÉNÉRÉ par scripts/generate-price-sources-migration.py depuis
-- scripts/data/price-mappings.txt ; ne pas éditer une fois appliqué.
-- Catégories : taxonomie Open Food Facts (https://world.openfoodfacts.org), licence ODbL.

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select i.id, v.kind, v.tags, v.approximate
from (values
{values}
) as v(slug, kind, tags, approximate)
join public.ingredients i on i.slug = v.slug;

-- Ingrédients sans coût par définition (eau du robinet) : prix nul, source « free ».
insert into public.reference_prices (ingredient_id, source, dimension, cents_per_ref, sample_size)
select i.id, 'free', i.default_dimension, 0, 0
from public.ingredients i
where i.slug in ({", ".join(f"'{s}'" for s in free)});

do $$
begin
  if (select count(*) from public.ingredient_price_sources) <> {len(rows)} then
    raise exception 'Correspondances de prix : % lignes attendues', {len(rows)};
  end if;
end;
$$;""")
