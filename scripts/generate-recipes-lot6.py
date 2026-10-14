"""Sixième lot de recettes originales (D7) : génère la migration 0047.

20 plats équilibrés et riches en protéines (au moins 30 g par part pour les plats, calcul
Ciqual vérifié par tests/db), avec conseils de conservation. Aucun nouvel ingrédient.
Usage : python3 scripts/generate-recipes-lot6.py > supabase/migrations/20261014000047_recipes_lot6.sql
"""
import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


lot1 = load("lot1", "scripts/generate-recipes-migration.py")
lot2 = load("lot2", "scripts/generate-recipes-lot2.py")
lot3 = load("lot3", "scripts/generate-recipes-lot3.py")
lot4 = load("lot4", "scripts/generate-recipes-lot4.py")
lot5 = load("lot5", "scripts/generate-recipes-lot5.py")
EXISTING = ({r["slug"] for r in lot1.R} | {r["slug"] for r in lot2.R} | {r["slug"] for r in lot3.R}
            | {r["slug"] for r in lot4.R} | {r["slug"] for r in lot5.R})
TAGS = lot1.TAGS | {"boulangerie", "monde"}

# Ingrédients ajoutés après les lots précédents (migrations 0040 à 0045) et utilisés ici.
LATER = {
    "jus-citron": {"dim": "volume", "density": True, "piece": False},
    "jus-citron-vert": {"dim": "volume", "density": True, "piece": False},
}
NEW_INGREDIENTS = {}

R = []


def recipe(slug, title, description, servings, prep, cook, tags, ingredients, steps, storage):
    R.append(dict(slug=slug, title=title, description=description, servings=servings, prep=prep,
                  cook=cook, tags=tags, ingredients=ingredients, steps=steps, storage=storage))


exec((ROOT / "scripts/data/recipes-lot6.py").read_text(encoding="utf-8"))


def num(v):
    return "null" if v is None else repr(v)


def new_ingredient_sql(q):
    ings, aliases, allergens, sources, nutrition = [], [], [], [], []
    for slug, n in NEW_INGREDIENTS.items():
        ings.append(f"  ({q(slug)}, {q(n['name'])}, {q(n['category'])}, {q(n['dim'])}, {num(n['density'])}, {num(n['piece'])})")
        aliases += [f"  ({q(a)}, {q(slug)})" for a in n["aliases"]]
        allergens += [f"  ({q(slug)}, {q(a)})" for a in n["allergens"]]
        sources.append(f"  ({q(slug)})")
        code, name, *vals = n["ciqual"]
        nutrition.append(f"  ({q(slug)}, {code}, {q(name)}, " + ", ".join(num(v) for v in vals) + ")")
    out = [
        "-- Nouveaux ingrédients du référentiel.",
        "insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,",
        "  piece_weight_g, is_validated)",
        "select v.slug, v.name, v.category, v.dimension::public.dimension, v.density::numeric, v.piece::numeric, true",
        "from (values",
        ",\n".join(ings),
        ") as v(slug, name, category, dimension, density, piece);",
        "",
        "insert into public.ingredient_aliases (alias_normalized, ingredient_id)",
        "select public.normalize_alias(v.alias), i.id from (values",
        ",\n".join(aliases),
        ") as v(alias, slug) join public.ingredients i on i.slug = v.slug",
        "on conflict do nothing;",
        "",
    ]
    if allergens:
        out += [
            "insert into public.ingredient_allergens (ingredient_id, allergen_code)",
            "select i.id, v.allergen from (values",
            ",\n".join(allergens),
            ") as v(slug, allergen) join public.ingredients i on i.slug = v.slug;",
            "",
        ]
    out += [
        "-- Prix : pas de catégorie Open Prices vérifiée, saisie manuelle uniquement.",
        "insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)",
        "select i.id, 'none', array[]::text[], false from (values",
        ",\n".join(sources),
        ") as v(slug) join public.ingredients i on i.slug = v.slug;",
        "",
        "-- Valeurs nutritionnelles pour 100 g (Anses, table Ciqual 2025, licence ouverte Etalab).",
        "insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,",
        "  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)",
        "select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values",
        ",\n".join(nutrition),
        ") as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)",
        "join public.ingredients i on i.slug = v.slug;",
    ]
    return out


def main():
    ingredients = {**lot1.load_ingredients(), **lot2.VARIANTS, **LATER}
    for slug, n in lot5.NEW_INGREDIENTS.items():
        ingredients[slug] = {"dim": n["dim"], "density": n["density"] is not None,
                             "piece": n["piece"] is not None}
    for slug, n in NEW_INGREDIENTS.items():
        assert slug not in ingredients, slug
        ingredients[slug] = {"dim": n["dim"], "density": n["density"] is not None,
                             "piece": n["piece"] is not None}
    q = lot1.q
    seen = set(EXISTING)
    recipe_rows, ing_rows, step_rows = [], [], []
    for r in R:
        if r["slug"] in seen:
            raise SystemExit(f"recette en double : {r['slug']}")
        seen.add(r["slug"])
        if not set(r["tags"]) <= TAGS:
            raise SystemExit(f"[{r['slug']}] tags inconnus : {set(r['tags']) - TAGS}")
        if not (3 <= len(r["title"]) <= 120 and len(r["description"]) <= 500 and r["steps"]):
            raise SystemExit(f"[{r['slug']}] titre, description ou étapes invalides")
        if not (3 <= len(r["storage"]) <= 500):
            raise SystemExit(f"[{r['slug']}] conseil de conservation invalide")
        if any(not (3 <= len(s) <= 1000) for s in r["steps"]):
            raise SystemExit(f"[{r['slug']}] étape trop courte ou trop longue")
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
        recipe_rows.append(f"  ({q(r['slug'])}, {q(r['title'])}, {q(r['description'])}, {q(r['storage'])}, "
                           f"{r['servings']}, {r['prep']}, {r['cook']}, {tags})")
        for i, step in enumerate(r["steps"], start=1):
            step_rows.append(f"  ({q(r['slug'])}, {i}, {q(step)})")

    slugs = ", ".join(q(r["slug"]) for r in R)
    out = [
        "-- 0047 — Sixième lot de recettes du catalogue (publiées et validées) :",
        "-- plats équilibrés et riches en protéines (au moins 30 g par part, calcul Ciqual).",
        "-- Fichier GÉNÉRÉ par scripts/generate-recipes-lot6.py depuis scripts/data/recipes-lot6.py.",
        "-- Recettes originales (D7). Ne jamais éditer une fois appliqué.",
        f"-- {len(recipe_rows)} recettes, {len(ing_rows)} lignes d'ingrédients, {len(step_rows)} étapes.",
        "",
        *(new_ingredient_sql(q) + [""] if NEW_INGREDIENTS else []),
        "insert into public.recipes (slug, title, description, storage_note, servings, prep_minutes,",
        "  cook_minutes, tags, status, source, source_ref, validated_at)",
        "select v.slug, v.title, v.description, v.storage, v.servings, v.prep, v.cook, v.tags,",
        "  'published', 'curated', 'Aux Petits Oignons — recette originale', now()",
        "from (values",
        ",\n".join(recipe_rows),
        ") as v(slug, title, description, storage, servings, prep, cook, tags);",
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
        "    raise exception 'Lignes d''ingrédients manquantes dans le sixième lot de recettes.';",
        "  end if;",
        "end;",
        "$$;",
        "",
    ]
    sys.stdout.write("\n".join(out))
    print(f"{len(recipe_rows)} recettes, {len(ing_rows)} ingrédients, {len(step_rows)} étapes", file=sys.stderr)


if __name__ == "__main__":
    main()
