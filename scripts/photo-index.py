"""Régénère l'index des photos (recettes et aliments) dans src/lib/images.ts.

Chaque photo (public/images/<recettes|aliments>/<slug>.webp et <slug>-600.webp, le slug étant
celui de la recette ou de l'ingrédient) reçoit une version :
les 8 premiers caractères du SHA-1 de son contenu. L'adresse de l'image change donc dès que
la photo est remplacée, ce qui contourne les caches (navigateur, service worker, CDN).

Usage : python3 scripts/photo-index.py
"""
import hashlib
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = ROOT / "src/lib/images.ts"
INDEXES = {
    "RECIPE_PHOTO_VERSIONS": ROOT / "public/images/recettes",
    "INGREDIENT_PHOTO_VERSIONS": ROOT / "public/images/aliments",
}


def versions(folder: pathlib.Path) -> list[tuple[str, str]]:
    out = []
    for big in sorted(folder.glob("*.webp")):
        if big.stem.endswith("-600"):
            continue
        small = folder / f"{big.stem}-600.webp"
        assert small.exists(), f"vignette manquante : {small.name}"
        digest = hashlib.sha1(big.read_bytes() + small.read_bytes()).hexdigest()[:8]
        out.append((big.stem, digest))
    return out


src = TARGET.read_text(encoding="utf-8")
for name, folder in INDEXES.items():
    entries = versions(folder)
    block = (
        f"const {name}: Readonly<Record<string, string>> = {{\n"
        + "".join(f'  "{slug}": "{v}",\n' for slug, v in entries)
        + "};"
    )
    src, n = re.subn(
        rf"const {name}: Readonly<Record<string, string>> = \{{.*?\n\}};",
        lambda _m: block,
        src,
        count=1,
        flags=re.S,
    )
    assert n == 1, f"bloc {name} introuvable dans images.ts"
    print(f"{name} : {len(entries)} photos")
TARGET.write_text(src, encoding="utf-8")
# Mise en forme identique à la CI (format:check).
import subprocess  # noqa: E402

subprocess.run(["npx", "prettier", "--write", str(TARGET)], cwd=TARGET.parents[2], check=True,
               stdout=subprocess.DEVNULL)
