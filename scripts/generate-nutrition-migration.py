"""Génère la migration des valeurs nutritionnelles des ingrédients à partir de la table
Ciqual 2025 de l'ANSES (fichier « Table_Ciqual_2025_FR_2025_11_03.xls », non versionné).

    python3 scripts/generate-nutrition-migration.py <chemin du .xls> <migration .sql>

Lecture des valeurs Ciqual :
  - nombre « 12,3 »          -> 12.3
  - « traces »               -> 0
  - « < 0,5 » (sous le seuil de quantification) -> 0
  - « - » (non mesuré)       -> NULL : la valeur reste inconnue, jamais devinée.
"""

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent / "data"))
from ciqual_mapping import MAPPING  # noqa: E402

# Intitulés des colonnes Ciqual, espaces et retours à la ligne normalisés.
COLUMNS = {
    "kcal": "Energie, Règlement UE N° 1169 2011 (kcal 100 g)",
    "proteins": "Protéines, N x facteur de Jones (g 100 g)",
    "carbs": "Glucides (g 100 g)",
    "sugars": "Sucres (g 100 g)",
    "fat": "Lipides (g 100 g)",
    "saturated_fat": "AG saturés (g 100 g)",
    "fiber": "Fibres alimentaires (g 100 g)",
    "salt": "Sel chlorure de sodium (g 100 g)",
}


def parse(raw: object) -> str:
    s = str(raw).strip()
    if s in ("-", "", "nan"):
        return "null"
    if s == "traces" or s.startswith("<"):
        return "0"
    v = float(s.replace(",", "."))
    assert 0 <= v <= 1000, s
    return repr(round(v, 3))


def q(s: str | None) -> str:
    return "null" if s is None else "'" + s.replace("'", "''") + "'"


def main(xls: str, out: str) -> None:
    df = pd.read_excel(xls, sheet_name=0, dtype=str)
    df.columns = [" ".join(str(c).split()) for c in df.columns]
    for c in COLUMNS.values():
        assert c in df.columns, c
    by_code = {int(r["alim_code"]): r for _, r in df.iterrows()}

    rows, unmapped = [], []
    for slug, (code, note) in sorted(MAPPING.items()):
        if code is None:
            unmapped.append((slug, note))
            continue
        r = by_code[code]
        vals = ", ".join(parse(r[c]) for c in COLUMNS.values())
        rows.append(f"  ({q(slug)}, {code}, {q(r['alim_nom_fr'])}, {vals}, {q(note)})")

    sql = f"""-- 0030 — Valeurs nutritionnelles des ingrédients (table Ciqual 2025, ANSES).
-- Fichier GÉNÉRÉ par scripts/generate-nutrition-migration.py depuis
-- scripts/data/ciqual_mapping.py. Ne jamais éditer une fois appliqué.
--
-- Source : Anses. 2025. Table de composition nutritionnelle des aliments Ciqual 2025
-- (https://ciqual.anses.fr), licence ouverte Etalab.
--
-- Valeurs pour 100 g de l'aliment Ciqual retenu. NULL = valeur non mesurée par Ciqual
-- (jamais devinée) ; « traces » et « < seuil » sont comptés 0.
-- {len(rows)} ingrédients reliés ; {len(unmapped)} sans correspondance honnête :
""" + "".join(f"--   {s} : {n}\n" for s, n in unmapped) + f"""
create table public.ingredient_nutrition (
  ingredient_id uuid primary key references public.ingredients (id) on delete cascade,
  ciqual_code integer not null check (ciqual_code > 0),
  ciqual_name text not null check (char_length(ciqual_name) between 1 and 200),
  kcal numeric(7,2) check (kcal >= 0 and kcal <= 1000),
  proteins_g numeric(7,3) check (proteins_g >= 0 and proteins_g <= 100),
  carbs_g numeric(7,3) check (carbs_g >= 0 and carbs_g <= 100),
  sugars_g numeric(7,3) check (sugars_g >= 0 and sugars_g <= 100),
  fat_g numeric(7,3) check (fat_g >= 0 and fat_g <= 100),
  saturated_fat_g numeric(7,3) check (saturated_fat_g >= 0 and saturated_fat_g <= 100),
  fiber_g numeric(7,3) check (fiber_g >= 0 and fiber_g <= 100),
  salt_g numeric(7,3) check (salt_g >= 0 and salt_g <= 100),
  note text check (note is null or char_length(note) <= 200),
  source text not null default 'Ciqual 2025'
);

-- Référentiel partagé : lecture pour tout utilisateur connecté, écriture réservée.
alter table public.ingredient_nutrition enable row level security;
revoke all on public.ingredient_nutrition from anon, authenticated;
grant select on public.ingredient_nutrition to authenticated;
create policy ingredient_nutrition_read on public.ingredient_nutrition
  for select to authenticated using (true);

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g, note)
select i.id, v.code, v.name, v.kcal::numeric, v.p::numeric, v.c::numeric, v.s::numeric,
  v.f::numeric, v.sf::numeric, v.fi::numeric, v.salt::numeric, v.note
from (values
""" + ",\n".join(rows) + """
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt, note)
join public.ingredients i on i.slug = v.slug;
"""
    Path(out).write_text(sql)
    print(f"{len(rows)} reliés, {len(unmapped)} sans correspondance -> {out}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
