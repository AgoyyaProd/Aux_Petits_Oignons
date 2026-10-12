-- 0034 — Légumineuses en conserve : nom de produit clair et repère pour les légumineuses sèches.
--
-- Les quantités des recettes sont des poids égouttés de conserve (déjà cuites : on les égoutte
-- et on les rince). « Cuits » dans le nom de produit prêtait à confusion en magasin.
-- Le repère « en sec » (≈ 40 % du poids égoutté, arrondi à 10 g) est une indication affichée
-- sous l'ingrédient : ni le stock ni la liste de courses ne sont convertis.

update public.ingredients set name = 'Pois chiches (conserve)', updated_at = now()
where slug = 'pois-chiche';
update public.ingredients set name = 'Haricots rouges (conserve)', updated_at = now()
where slug = 'haricot-rouge';
update public.ingredients set name = 'Haricots blancs (conserve)', updated_at = now()
where slug = 'haricot-blanc';

update public.recipe_ingredients ri
set preparation_note = format(
  'égouttés · en sec : env. %s g, %s',
  (round(ri.quantity * 0.4 / 10) * 10)::int,
  case i.slug
    when 'haricot-rouge' then 'trempés 12 h, bouillis 10 min à feu vif puis cuits 1 h'
    else 'trempés 12 h puis cuits 1 h 30'
  end
)
from public.ingredients i
where i.id = ri.ingredient_id
  and i.slug in ('pois-chiche', 'haricot-rouge', 'haricot-blanc')
  and ri.unit_code = 'g';

-- Étapes : toujours « égoutter et rincer » avant d'utiliser la conserve.
update public.recipe_steps s
set instruction = regexp_replace(
  s.instruction,
  '^Rincer les (pois chiches|haricots)',
  'Égoutter et rincer les \1'
)
from public.recipes r
where r.id = s.recipe_id
  and r.slug in (
    'couscous-legumes', 'merguez-semoule-legumes', 'soupe-tomate-pois-chiches',
    'minestrone', 'riz-haricots-rouges'
  )
  and s.instruction ~ '^Rincer les (pois chiches|haricots)';
