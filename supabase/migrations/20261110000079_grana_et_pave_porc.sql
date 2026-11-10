-- 0079 — Grana padano à la place du parmesan, pavé de porc à la place du filet mignon.
--
-- Demande de l'utilisateur : il achète du grana padano et des pavés de porc en alternative.
-- Mise en œuvre avec les variantes existantes (0017), comme la crème (0075) :
--   - grana padano : nouvel ingrédient, variante de « Parmesan ». Une recette qui demande du
--     parmesan accepte le grana du garde-manger ; le grana garde son propre prix (tickets),
--     sans faire baisser celui du parmesan.
--   - porc : un ingrédient commun « Porc (filet mignon ou pavé) » (`porc`) devient le parent du
--     filet mignon et du nouveau « Pavé de porc sans os » ; les lignes des recettes passent du
--     filet mignon à `porc`. La côte de porc (comptée à la pièce, avec os) n'est pas concernée.
-- Rien n'est supprimé : garde-manger, historique et mouvements restent sur l'ingrédient précis.
--
-- Nutrition pour 100 g : Anses, table Ciqual 2025 (licence ouverte Etalab) ; « traces » = 0.
--   Grana Padano (12123). Pavé de porc : Porc, échine crue (28302), le pavé sans os à griller
--   étant le plus souvent taillé dans l'échine. `porc` : celle du filet mignon (28204).
-- Prix : grana et pavé sans catégorie Open Prices vérifiée (saisie du foyer ou tickets) ;
-- `porc` reprend la catégorie et le prix de référence du filet mignon, signalé approchant.

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple)
values
  ('grana-padano', 'Grana padano', 'fromages', 'mass', null, null, true, false),
  ('porc', 'Porc (filet mignon ou pavé)', 'viandes', 'mass', null, null, true, false),
  ('porc-pave', 'Pavé de porc sans os', 'viandes', 'mass', null, null, true, false);

update public.ingredients set parent_id = (select id from public.ingredients where slug = 'parmesan')
where slug = 'grana-padano';
update public.ingredients set parent_id = (select id from public.ingredients where slug = 'porc')
where slug in ('porc-filet', 'porc-pave');

-- « porc » désignait le filet mignon : il désigne désormais l'ingrédient commun.
update public.ingredient_aliases set ingredient_id = (select id from public.ingredients where slug = 'porc')
where alias_normalized = public.normalize_alias('porc');

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('grana padano', 'grana-padano'),
  ('grana', 'grana-padano'),
  ('grana padano rape', 'grana-padano'),
  ('viande de porc', 'porc'),
  ('pave de porc', 'porc-pave'),
  ('paves de porc', 'porc-pave'),
  ('pave de porc sans os', 'porc-pave'),
  ('echine de porc', 'porc-pave')
) as v(alias, slug) join public.ingredients i on i.slug = v.slug
on conflict do nothing;

-- Allergènes et régimes : ceux du parmesan pour le grana, du filet mignon pour le porc.
insert into public.ingredient_allergens (ingredient_id, allergen_code)
select n.id, a.allergen_code from public.ingredient_allergens a
join public.ingredients src on src.id = a.ingredient_id
join public.ingredients n on (src.slug, n.slug) in (('parmesan', 'grana-padano'),
  ('porc-filet', 'porc'), ('porc-filet', 'porc-pave'));

insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)
select n.id, d.diet_code from public.ingredient_diet_conflicts d
join public.ingredients src on src.id = d.ingredient_id
join public.ingredients n on (src.slug, n.slug) in (('parmesan', 'grana-padano'),
  ('porc-filet', 'porc'), ('porc-filet', 'porc-pave'));

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select i.id, v.code, v.name, v.kcal, v.p, v.c, v.s, v.f, v.sf, v.fi, v.salt from (values
  ('grana-padano', 12123, 'Grana Padano', 399, 33.9, 1.17, 0, 28.5, 17, 0, 1.35),
  ('porc-pave', 28302, 'Porc, échine crue', 238, 17.1, 0.1, 0, 18.8, 5.4, 0, 0.18)
) as v(slug, code, name, kcal, p, c, s, f, sf, fi, salt)
join public.ingredients i on i.slug = v.slug;

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select c.id, n.ciqual_code, n.ciqual_name, n.kcal, n.proteins_g, n.carbs_g, n.sugars_g,
  n.fat_g, n.saturated_fat_g, n.fiber_g, n.salt_g
from public.ingredient_nutrition n
join public.ingredients f on f.id = n.ingredient_id and f.slug = 'porc-filet'
cross join public.ingredients c where c.slug = 'porc';

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select id, 'none', array[]::text[], false from public.ingredients
where slug in ('grana-padano', 'porc-pave');

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select c.id, s.kind, s.tags, true from public.ingredient_price_sources s
join public.ingredients f on f.id = s.ingredient_id and f.slug = 'porc-filet'
cross join public.ingredients c where c.slug = 'porc';

insert into public.reference_prices (ingredient_id, source, dimension, cents_per_ref,
  sample_size, observed_from, observed_to, computed_at)
select c.id, rp.source, rp.dimension, rp.cents_per_ref, rp.sample_size, rp.observed_from,
  rp.observed_to, rp.computed_at
from public.reference_prices rp
join public.ingredients f on f.id = rp.ingredient_id and f.slug = 'porc-filet'
cross join public.ingredients c where c.slug = 'porc';

-- Recettes : le filet mignon demandé devient « porc » (filet mignon ou pavé).
update public.recipe_ingredients ri
set ingredient_id = (select id from public.ingredients where slug = 'porc')
from public.ingredients i
where i.id = ri.ingredient_id and i.slug = 'porc-filet';

do $$
begin
  if exists (
    select 1 from public.recipe_ingredients ri
    join public.ingredients i on i.id = ri.ingredient_id where i.slug = 'porc-filet'
  ) then
    raise exception 'Des recettes demandent encore le filet mignon précis.';
  end if;
  if (select count(*) from public.ingredients
      where (slug in ('porc-filet', 'porc-pave')
             and parent_id = (select id from public.ingredients where slug = 'porc'))
         or (slug = 'grana-padano'
             and parent_id = (select id from public.ingredients where slug = 'parmesan'))) <> 3 then
    raise exception 'Variantes du porc ou du parmesan incomplètes.';
  end if;
end;
$$;
