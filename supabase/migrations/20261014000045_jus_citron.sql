-- 0045 — Jus de citron et jus de citron vert (en bouteille ou pressés), en volume.
--
-- Le citron frais se compte à la pièce ; un jus en bouteille se mesure en volume. Sans
-- conversion silencieuse possible entre les deux, les recettes qui n'utilisent QUE le jus
-- demandent désormais du jus (en cuillères à soupe ou en centilitres) : un garde-manger
-- avec une bouteille de 20 cl couvre ces recettes. Les recettes qui utilisent le zeste, des
-- rondelles ou des quartiers gardent le citron frais (deux recettes gardent les deux).
--
-- Équivalence retenue (repère culinaire courant) : le jus d'un citron jaune moyen = 3 c. à
-- soupe (45 ml), celui d'un citron vert = 2 c. à soupe (30 ml).
-- Valeurs nutritionnelles pour 100 g : Anses, table Ciqual 2025 (licence ouverte Etalab),
-- 2028 « Jus de citron, pur jus » et 2031 « Jus de citron vert, pur jus ».
-- Prix : pas de catégorie Open Prices vérifiée ; saisie du foyer ou tickets de caisse.

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple)
values
  ('jus-citron', 'Jus de citron', 'condiments', 'volume', 1.03, null, true, false),
  ('jus-citron-vert', 'Jus de citron vert', 'condiments', 'volume', 1.03, null, true, false);

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('jus de citron', 'jus-citron'),
  ('jus de citron jaune', 'jus-citron'),
  ('jus citron', 'jus-citron'),
  ('citron en bouteille', 'jus-citron'),
  ('citron presse', 'jus-citron'),
  ('pur jus de citron', 'jus-citron'),
  ('jus de citron vert', 'jus-citron-vert'),
  ('jus citron vert', 'jus-citron-vert'),
  ('jus de lime', 'jus-citron-vert'),
  ('citron vert en bouteille', 'jus-citron-vert'),
  ('pur jus de citron vert', 'jus-citron-vert')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select id, 'none', array[]::text[], false from public.ingredients
where slug in ('jus-citron', 'jus-citron-vert');

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values
  ('jus-citron', 2028, 'Jus de citron, pur jus', 29.4, 0.4, 6.1, 2.4, 0.29, 0.038, 0.4, 0.053),
  ('jus-citron-vert', 2031, 'Jus de citron vert, pur jus', 25.7, 0.25, 1.69, 1.69, 0.23, 0.026, 0.45, 0.026)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;

-- Recettes qui n'utilisent que le jus : la ligne « citron » devient « jus de citron ».
-- (recette, fruit, quantité de jus, unité) ; le facultatif et la position sont conservés.
update public.recipe_ingredients ri
set ingredient_id = j.id, quantity = v.qty, unit_code = v.unit, preparation_note = null
from (values
  ('blanquette-veau', 'citron', 3, 'tbsp'),
  ('buddha-bowl-quinoa', 'citron', 3, 'tbsp'),
  ('cabillaud-poireaux', 'citron', 3, 'tbsp'),
  ('cabillaud-sauce-vierge-quinoa', 'citron', 3, 'tbsp'),
  ('chou-fleur-roti-curry', 'citron', 3, 'tbsp'),
  ('compote-pommes-poires', 'citron', 1.5, 'tbsp'),
  ('falafels-four', 'citron', 3, 'tbsp'),
  ('patates-douces-feta-pois-chiches', 'citron', 3, 'tbsp'),
  ('salade-boulgour-legumes-rotis', 'citron', 3, 'tbsp'),
  ('salade-cesar-poulet', 'citron', 3, 'tbsp'),
  ('souvlaki-poulet-tzatziki', 'citron', 3, 'tbsp'),
  ('taboule', 'citron', 9, 'cl'),
  ('tartines-avocat-oeuf', 'citron', 1.5, 'tbsp'),
  ('wraps-thon-crudites', 'citron', 3, 'tbsp'),
  ('yassa-poulet', 'citron', 13.5, 'cl'),
  ('bo-bun-boeuf', 'citron-vert', 6, 'cl'),
  ('bowl-saumon-fume-avocat', 'citron-vert', 2, 'tbsp'),
  ('crevettes-curry-coco', 'citron-vert', 2, 'tbsp'),
  ('curry-cabillaud-coco-epinards', 'citron-vert', 2, 'tbsp'),
  ('fajitas-poulet', 'citron-vert', 2, 'tbsp'),
  ('lentilles-corail-dahl', 'citron-vert', 2, 'tbsp'),
  ('quesadillas-haricots-rouges', 'citron-vert', 2, 'tbsp'),
  ('salade-poulet-mangue-avocat', 'citron-vert', 6, 'cl'),
  ('salade-quinoa-avocat-mais', 'citron-vert', 6, 'cl'),
  ('soupe-thai-poulet-coco', 'citron-vert', 2, 'tbsp'),
  ('tacos-poulet', 'citron-vert', 2, 'tbsp')
) as v(recipe, fruit, qty, unit)
join public.recipes r on r.slug = v.recipe
join public.ingredients f on f.slug = v.fruit
join public.ingredients j on j.slug = case v.fruit when 'citron' then 'jus-citron' else 'jus-citron-vert' end
where ri.recipe_id = r.id and ri.ingredient_id = f.id;

-- Jus ET quartiers : un fruit frais pour les quartiers, le jus à part.
update public.recipe_ingredients ri set quantity = 1
from public.recipes r, public.ingredients f
where ri.recipe_id = r.id and ri.ingredient_id = f.id
  and ((r.slug = 'poulet-citron-olives' and f.slug = 'citron')
    or (r.slug = 'pad-thai-crevettes' and f.slug = 'citron-vert'));

insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit_code, is_optional,
  preparation_note, position)
select r.id, j.id, v.qty, v.unit, false, null,
  (select max(position) + 1 from public.recipe_ingredients x where x.recipe_id = r.id)
from (values
  ('poulet-citron-olives', 'jus-citron', 3, 'tbsp'),
  ('pad-thai-crevettes', 'jus-citron-vert', 2, 'tbsp')
) as v(recipe, juice, qty, unit)
join public.recipes r on r.slug = v.recipe
join public.ingredients j on j.slug = v.juice;

-- Étapes : plus de citron à presser quand le jus est déjà prêt.
update public.recipe_steps s set instruction = v.text
from (values
  ('cabillaud-sauce-vierge-quinoa', 3, 'Ciseler le basilic.'),
  ('compote-pommes-poires', 2, 'Mettre les fruits dans une casserole avec le jus de citron, la cannelle, la vanille et un fond d''eau.'),
  ('taboule', 1, 'Dans un saladier, mélanger la semoule avec le jus de citron, l''huile et 20 cl d''eau froide.'),
  ('yassa-poulet', 1, 'Éplucher et émincer finement les oignons et hacher l''ail.'),
  ('bo-bun-boeuf', 5, 'Pour la sauce, mélanger le jus de citron vert avec le reste de la sauce soja, le sucre, le piment et quelques cuillerées d''eau, jusqu''à ce que le sucre soit dissous.'),
  ('salade-poulet-mangue-avocat', 5, 'Dans un bol, mélanger le jus de citron vert, la sauce soja, l''huile de sésame et le reste de l''huile de tournesol.'),
  ('salade-quinoa-avocat-mais', 7, 'Assaisonner avec le jus de citron vert, l''huile, la coriandre ciselée et le sel.'),
  ('poulet-citron-olives', 2, 'Couper le citron en quartiers.'),
  ('poulet-citron-olives', 6, 'Remettre le poulet, ajouter l''eau, le cube émietté, le jus de citron et les quartiers de citron.'),
  ('pad-thai-crevettes', 4, 'Dans un bol, mélanger le jus de citron vert avec la sauce soja et le sucre roux, jusqu''à ce que le sucre soit dissous.'),
  ('pad-thai-crevettes', 9, 'Servir parsemé de cacahuètes, de coriandre ciselée et de piment, avec le citron vert en quartiers.')
) as v(recipe, pos, text)
join public.recipes r on r.slug = v.recipe
where s.recipe_id = r.id and s.position = v.pos;

do $$
begin
  if (select count(*) from public.recipe_ingredients ri join public.ingredients i on i.id = ri.ingredient_id
      where i.slug in ('jus-citron', 'jus-citron-vert')) <> 28 then
    raise exception 'Lignes de jus de citron inattendues.';
  end if;
end;
$$;
