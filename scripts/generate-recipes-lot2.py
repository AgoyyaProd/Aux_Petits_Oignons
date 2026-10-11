"""Deuxième lot de recettes originales (D7) : génère la migration 0018.

Réutilise la validation de scripts/generate-recipes-migration.py (slugs du catalogue,
unités connues, conversions possibles) et ajoute les ingrédients de la migration 0017
(types de pâtes, de riz, grenaille, pâtes à lasagne).
Usage : python3 scripts/generate-recipes-lot2.py > supabase/migrations/20261011000018_recipes_lot2.sql
"""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("lot1", ROOT / "scripts/generate-recipes-migration.py")
lot1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lot1)
EXISTING = {r["slug"] for r in lot1.R}

# Ingrédients ajoutés par 0017 : masse, sans densité ; grenaille avec poids unitaire.
VARIANTS = {s: {"dim": "mass", "density": False, "piece": s == "pomme-de-terre-grenaille"} for s in [
    "spaghetti", "penne", "farfalle", "coquillettes", "fusilli", "tagliatelles", "macaronis",
    "linguine", "rigatoni", "riz-basmati", "riz-thai", "riz-etuve", "riz-arborio",
    "pomme-de-terre-grenaille", "pates-lasagne"]}

R = []


def recipe(slug, title, description, servings, prep, cook, tags, ingredients, steps):
    R.append(dict(slug=slug, title=title, description=description, servings=servings,
                  prep=prep, cook=cook, tags=tags, ingredients=ingredients, steps=steps))


exec((ROOT / "scripts/data/recipes-lot2.py").read_text(encoding="utf-8"))


def main():
    ingredients = {**lot1.load_ingredients(), **VARIANTS}
    q = lot1.q
    seen = set(EXISTING)
    recipe_rows, ing_rows, step_rows = [], [], []
    for r in R:
        if r["slug"] in seen:
            raise SystemExit(f"recette en double : {r['slug']}")
        seen.add(r["slug"])
        if not set(r["tags"]) <= lot1.TAGS:
            raise SystemExit(f"[{r['slug']}] tags inconnus : {set(r['tags']) - lot1.TAGS}")
        if not (3 <= len(r["title"]) <= 120 and len(r["description"]) <= 500 and r["steps"]):
            raise SystemExit(f"[{r['slug']}] titre, description ou étapes invalides")
        # Les mots « végétarien / végétalien » sont réservés : le régime se déduit des ingrédients.
        if "végéta" in r["description"].lower():
            raise SystemExit(f"[{r['slug']}] description : ne pas affirmer de régime")
        used, required = set(), 0
        for pos, line in enumerate(r["ingredients"]):
            slug, qty, unit, note, optional = lot1.parse_line(line, ingredients, r["slug"])
            if slug in used:
                raise SystemExit(f"[{r['slug']}] {slug} présent deux fois")
            used.add(slug)
            required += 0 if optional else 1
            ing_rows.append(f"  ({q(r['slug'])}, {q(slug)}, {qty or 'null'}, {q(unit) if unit else 'null'}, "
                            f"{'true' if optional else 'false'}, {q(note) if note else 'null'}, {pos})")
        if required == 0:
            raise SystemExit(f"[{r['slug']}] aucun ingrédient obligatoire")
        tags = "array[" + ", ".join(q(t) for t in r["tags"]) + "]::text[]"
        recipe_rows.append(f"  ({q(r['slug'])}, {q(r['title'])}, {q(r['description'])}, {r['servings']}, "
                           f"{r['prep']}, {r['cook']}, {tags})")
        for i, step in enumerate(r["steps"], start=1):
            step_rows.append(f"  ({q(r['slug'])}, {i}, {q(step)})")

    slugs = ", ".join(q(r["slug"]) for r in R)
    out = [
        "-- 0018 — Deuxième lot de recettes du catalogue (publiées et validées).",
        "-- Fichier GÉNÉRÉ par scripts/generate-recipes-lot2.py depuis scripts/data/recipes-lot2.py.",
        "-- Recettes originales (D7). Ne jamais éditer une fois appliqué.",
        f"-- {len(recipe_rows)} recettes, {len(ing_rows)} lignes d'ingrédients, {len(step_rows)} étapes.",
        "",
        "insert into public.recipes (slug, title, description, servings, prep_minutes, cook_minutes, tags,",
        "  status, source, source_ref, validated_at)",
        "select v.slug, v.title, v.description, v.servings, v.prep, v.cook, v.tags,",
        "  'published', 'curated', 'Aux Petits Oignons — recette originale', now()",
        "from (values",
        ",\n".join(recipe_rows),
        ") as v(slug, title, description, servings, prep, cook, tags);",
        "",
        "insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, is_optional,",
        "  preparation_note, position)",
        "select r.id, i.id, v.qty, v.unit, v.optional, v.note, v.pos",
        "from (values",
        ",\n".join(ing_rows),
        ") as v(recipe, ingredient, qty, unit, optional, note, pos)",
        "join public.recipes r on r.slug = v.recipe",
        "join public.ingredients i on i.slug = v.ingredient;",
        "",
        "insert into public.recipe_steps (recipe_id, position, instruction)",
        "select r.id, v.pos, v.instruction",
        "from (values",
        ",\n".join(step_rows),
        ") as v(recipe, pos, instruction)",
        "join public.recipes r on r.slug = v.recipe;",
        "",
        "-- Garde-fou : une jointure silencieusement vide (slug introuvable) fait échouer la migration.",
        "do $$",
        "begin",
        "  if (select count(*) from public.recipe_ingredients ri join public.recipes r on r.id = ri.recipe_id",
        f"      where r.slug in ({slugs})) <> {len(ing_rows)} then",
        "    raise exception 'Lignes d''ingrédients manquantes dans le deuxième lot de recettes.';",
        "  end if;",
        "end;",
        "$$;",
        "",
    ]
    sys.stdout.write("\n".join(out))
    print(f"{len(recipe_rows)} recettes, {len(ing_rows)} ingrédients, {len(step_rows)} étapes", file=sys.stderr)


if __name__ == "__main__":
    main()
