-- 0037 — Compote pommes-poires : le mixeur n'est qu'une option, pas un matériel requis.
-- Le matériel d'une recette est déduit de ses étapes (trigger) : « ou mixer » rendait la
-- recette invisible aux foyers sans mixeur.
update public.recipe_steps s
set instruction = 'Écraser les fruits à la fourchette : la compote reste rustique, avec quelques morceaux.'
from public.recipes r
where r.id = s.recipe_id
  and r.slug = 'compote-pommes-poires'
  and s.instruction = 'Écraser à la fourchette pour une compote rustique, ou mixer pour une compote lisse.';
