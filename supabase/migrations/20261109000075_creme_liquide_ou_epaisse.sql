-- 0075 — Crème liquide et crème épaisse interchangeables dans les plats salés.
--
-- Les deux crèmes ont la même teneur en matière grasse (30 %) et se remplacent dans une
-- sauce, une soupe, un gratin ou une quiche ; seule une crème à monter (chantilly) exige la
-- crème liquide. Validé par l'utilisateur : interchangeables dans les deux sens, sauf pour
-- les desserts.
--
-- Mise en œuvre avec les variantes existantes (0017), sans nouveau code :
--   - un ingrédient commun « Crème (liquide ou épaisse) » (`creme`) devient le parent des
--     deux crèmes ;
--   - les lignes des recettes salées passent de la crème liquide ou épaisse à `creme` : le
--     stock de l'une ou de l'autre les couvre (couverture, liste de courses, décompte en
--     cuisinant) ;
--   - les desserts gardent la crème liquide précise, qu'aucune crème épaisse ne remplace.
-- Rien n'est supprimé : les produits du garde-manger, l'historique et les mouvements de stock
-- restent sur leur crème précise.
--
-- Données de `creme` : mêmes allergènes et régimes que la crème liquide ; nutrition Ciqual
-- 2025 de la crème liquide (19417, crème 30 % MG fluide, quasi identique à l'épaisse) ;
-- prix sur les deux catégories Open Prices, signalé approchant, avec le prix de référence de
-- la crème épaisse (la moins chère des deux) ; format 20 cl, 3 jours après ouverture (le plus
-- court des deux).

insert into public.ingredients (slug, name, category, default_dimension, density_g_per_ml,
  piece_weight_g, is_validated, is_staple)
select 'creme', 'Crème (liquide ou épaisse)', l.category, l.default_dimension, l.density_g_per_ml,
  null, true, false
from public.ingredients l where l.slug = 'creme-liquide';

update public.ingredients set parent_id = (select id from public.ingredients where slug = 'creme')
where slug in ('creme-liquide', 'creme-fraiche');

insert into public.ingredient_aliases (alias_normalized, ingredient_id)
select public.normalize_alias(v.alias), i.id from (values
  ('creme'),
  ('creme liquide ou epaisse'),
  ('creme de cuisine'),
  ('creme 30')
) as v(alias) cross join public.ingredients i where i.slug = 'creme'
on conflict do nothing;

insert into public.ingredient_allergens (ingredient_id, allergen_code)
select c.id, a.allergen_code
from public.ingredient_allergens a
join public.ingredients l on l.id = a.ingredient_id and l.slug = 'creme-liquide'
cross join public.ingredients c where c.slug = 'creme';

insert into public.ingredient_diet_conflicts (ingredient_id, diet_code)
select c.id, d.diet_code
from public.ingredient_diet_conflicts d
join public.ingredients l on l.id = d.ingredient_id and l.slug = 'creme-liquide'
cross join public.ingredients c where c.slug = 'creme';

insert into public.ingredient_nutrition (ingredient_id, ciqual_code, ciqual_name, kcal,
  proteins_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g)
select c.id, n.ciqual_code, n.ciqual_name, n.kcal, n.proteins_g, n.carbs_g, n.sugars_g,
  n.fat_g, n.saturated_fat_g, n.fiber_g, n.salt_g
from public.ingredient_nutrition n
join public.ingredients l on l.id = n.ingredient_id and l.slug = 'creme-liquide'
cross join public.ingredients c where c.slug = 'creme';

insert into public.ingredient_price_sources (ingredient_id, kind, tags, approximate)
select id, 'product', array['en:fermented-creams', 'en:unfermented-creams'], true
from public.ingredients where slug = 'creme';

insert into public.reference_prices (ingredient_id, source, dimension, cents_per_ref,
  sample_size, observed_from, observed_to, computed_at)
select c.id, rp.source, rp.dimension, rp.cents_per_ref, rp.sample_size, rp.observed_from,
  rp.observed_to, rp.computed_at
from public.reference_prices rp
join public.ingredients f on f.id = rp.ingredient_id and f.slug = 'creme-fraiche'
cross join public.ingredients c where c.slug = 'creme';

insert into public.ingredient_packages (ingredient_id, quantity_base, label, opened_keep_days, source)
select id, 200, 'brique ou pot de 20 cl', 3,
  'Formats de la crème liquide et de la crème épaisse ; conservation la plus courte des deux'
from public.ingredients where slug = 'creme';

-- Plats salés : la crème liquide ou épaisse demandée devient « crème ». Les desserts gardent
-- leur crème précise.
update public.recipe_ingredients ri
set ingredient_id = (select id from public.ingredients where slug = 'creme')
from public.recipes r, public.ingredients i
where r.id = ri.recipe_id and i.id = ri.ingredient_id
  and i.slug in ('creme-liquide', 'creme-fraiche')
  and not ('dessert' = any(r.tags));

do $$
begin
  if exists (
    select 1 from public.recipe_ingredients ri
    join public.recipes r on r.id = ri.recipe_id
    join public.ingredients i on i.id = ri.ingredient_id
    where i.slug in ('creme-liquide', 'creme-fraiche') and not ('dessert' = any(r.tags))
  ) then
    raise exception 'Des plats salés demandent encore une crème précise.';
  end if;
  if (select count(*) from public.ingredients
      where slug in ('creme-liquide', 'creme-fraiche')
        and parent_id = (select id from public.ingredients where slug = 'creme')) <> 2 then
    raise exception 'Les deux crèmes doivent être des variantes de « crème ».';
  end if;
end;
$$;
