"""Régénère l'index des photos de recettes dans src/lib/images.ts.

Chaque photo (public/images/recettes/<slug>.webp et <slug>-600.webp) reçoit une version :
les 8 premiers caractères du SHA-1 de son contenu. L'adresse de l'image change donc dès que
la photo est remplacée, ce qui contourne les caches (navigateur, service worker, CDN).

Usage : python3 scripts/photo-index.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PHOTOS = ROOT / "public/images/recettes"
TARGET = ROOT / "src/lib/images.ts"

entries = []
for big in sorted(PHOTOS.glob("*.webp")):
    if big.stem.endswith("-600"):
        continue
    small = PHOTOS / f"{big.stem}-600.webp"
    assert small.exists(), f"vignette manquante : {small.name}"
    digest = hashlib.sha1(big.read_bytes() + small.read_bytes()).hexdigest()[:8]
    entries.append((big.stem, digest))

block = (
    "const RECIPE_PHOTO_VERSIONS: Readonly<Record<string, string>> = {\n"
    + "".join(f'  "{slug}": "{v}",\n' for slug, v in entries)
    + "};"
)
src = TARGET.read_text(encoding="utf-8")
src, n = re.subn(
    r"const (RECIPES_WITH_PHOTO: readonly string\[\] = \[|RECIPE_PHOTO_VERSIONS: Readonly<Record<string, string>> = \{).*?\n(\]|\});",
    block,
    src,
    count=1,
    flags=re.S,
)
assert n == 1, "bloc de l'index introuvable dans images.ts"
TARGET.write_text(src, encoding="utf-8")
print(f"{len(entries)} photos indexées")
