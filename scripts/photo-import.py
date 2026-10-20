#!/usr/bin/env python3
"""Importe des photos du Drive (dossiers « Plats » et « Aliments ») dans le site.

Entrées : des fichiers image, ou les JSON {title, content (base64)} renvoyés par le
téléchargement Drive. Le nom du fichier donne la recette ou l'ingrédient : il est comparé aux
slugs connus (migrations), sans accents ni majuscules, au singulier, avec quelques alias
(« citron-jaune » -> citron, « cube-boeuf » -> bouillon-boeuf…). Un nom inconnu n'est jamais
deviné : il est signalé et ignoré.

Sortie : public/images/<recettes|aliments>/<slug>.webp (1200×900) et <slug>-600.webp,
puis l'index des versions (scripts/photo-index.py). Une planche contact est écrite si
--sheet est donné.

Usage : python3 -I scripts/photo-import.py <plats|aliments> [--sheet planche.jpg] FICHIER...
"""
import base64
import io
import json
import pathlib
import re
import subprocess
import sys
import unicodedata

from PIL import Image, ImageDraw, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
MIGRATIONS = ROOT / "supabase/migrations"
TARGET = {"plats": ROOT / "public/images/recettes", "aliments": ROOT / "public/images/aliments"}
TABLE = {"plats": "recipes", "aliments": "ingredients"}

# Noms de fichiers déjà rencontrés dans le Drive -> slug.
ALIASES = {
    "aliments": {
        "citron-jaune": "citron",
        "cube-boeuf": "bouillon-boeuf",
        "cube-volaille": "bouillon-volaille",
        "cube-legumes": "bouillon-legumes",
        "cacahuete-nature": "cacahuete",
        "levure-boulanger": "levure-boulangere",
        "ail-gousse": "ail",
        "tomates-grappe": "tomate",
        "tomate-concasse": "tomate-concassee",
        "sardine": "sardine-boite",
        "jambon-blanc": "jambon",
        "compote-pommes": "compote",
        "creme-fraiche-liquide": "creme-liquide",
        "petits-pois": "petit-pois",
        "curr": "curry",
        "canelle": "cannelle",
        "pesto-vert": "pesto",
        "pesto-verde": "pesto",
        "pesto-rouge": "pesto-rosso",
        "grain-sesame": "graine-sesame",
    },
    "plats": {},
}


def known_slugs(kind: str) -> set[str]:
    """Slugs des lignes « insert into public.<table> (…) values/select … » des migrations."""
    table = TABLE[kind]
    slugs: set[str] = set()
    for sql in sorted(MIGRATIONS.glob("*.sql")):
        for block in sql.read_text(encoding="utf-8").split("insert into public.")[1:]:
            if not re.match(rf"{table}\s*\(", block):
                continue
            body = block.split(";\n")[0]
            slugs.update(re.findall(r"\(\s*'([a-z0-9]+(?:-[a-z0-9]+)*)',\s*'(?:[^']|'')+'", body))
    return slugs


def normalize(name: str) -> str:
    text = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    text = text.lower().replace("œ", "oe")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def resolve(kind: str, filename: str, slugs: set[str]) -> str | None:
    base = normalize(pathlib.Path(filename).stem)
    candidates = [base, ALIASES[kind].get(base, "")]
    words = base.split("-")
    # Pluriels : dernier mot seul (« pois-chiches »), puis tous les mots (« tomates-cerises »).
    last = "-".join(words[:-1] + [words[-1][:-1] if words[-1].endswith("s") else words[-1]])
    every = "-".join(w[:-1] if len(w) > 3 and w.endswith("s") else w for w in words)
    for form in (last, every):
        candidates += [form, ALIASES[kind].get(form, "")]
    for c in candidates:
        if c and c in slugs:
            return c
    return None


def load(path: pathlib.Path) -> tuple[str, bytes]:
    """(nom d'origine, octets de l'image) d'un fichier image ou d'un JSON Drive."""
    raw = path.read_bytes()
    if raw[:1] == b"{":
        data = json.loads(raw)
        return data["title"], base64.b64decode(data["content"])
    return path.name, raw


def main() -> None:
    args = sys.argv[1:]
    if not args or args[0] not in TARGET:
        sys.exit(__doc__)
    kind, rest = args[0], args[1:]
    sheet_path = None
    if rest[:1] == ["--sheet"]:
        sheet_path, rest = rest[1], rest[2:]
    slugs = known_slugs(kind)
    out = TARGET[kind]
    done: list[tuple[str, str, Image.Image]] = []
    unknown: list[str] = []
    for arg in rest:
        title, data = load(pathlib.Path(arg))
        slug = resolve(kind, title, slugs)
        if not slug:
            unknown.append(title)
            continue
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
        big = ImageOps.fit(im, (1200, 900), Image.LANCZOS)
        big.save(out / f"{slug}.webp", "WEBP", quality=80, method=6)
        ImageOps.fit(im, (600, 450), Image.LANCZOS).save(
            out / f"{slug}-600.webp", "WEBP", quality=80, method=6
        )
        done.append((title, slug, big))

    if sheet_path and done:
        cols = 6
        rows = (len(done) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 240, rows * 200), "white")
        draw = ImageDraw.Draw(sheet)
        for i, (_, slug, big) in enumerate(done):
            x, y = (i % cols) * 240, (i // cols) * 200
            sheet.paste(big.resize((240, 180)), (x, y))
            draw.text((x + 3, y + 184), slug[:38], fill="black")
        sheet.save(sheet_path, quality=75)

    if done:
        subprocess.run([sys.executable, "-I", str(ROOT / "scripts/photo-index.py")], check=True)
    for title, slug, _ in done:
        print(f"importée : {title} -> {slug}")
    for title in unknown:
        print(f"NOM INCONNU (ignorée) : {title}")


main()
