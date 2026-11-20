-- 0093 — Nouvelles variantes d'ingrédients (voir 0017) : pour une recette qui demande le
-- parent, le stock de la variante compte (couverture du menu, liste de courses, décompte en
-- cuisinant). Une recette qui demande la variante précise n'accepte toujours qu'elle.
--   Oignon rouge          → Oignon
--   Haricots verts surgelés → Haricots verts
--   Épinards en galets surgelés → Épinards (recettes cuites, sauf une salade : 1 sur 40)
--   Pâtes complètes       → Pâtes

update public.ingredients c
set parent_id = p.id
from (values
  ('oignon-rouge', 'oignon'),
  ('haricot-vert-surgele', 'haricot-vert'),
  ('epinard-galets', 'epinard'),
  ('pates-completes', 'pates')
) as v(child, parent)
join public.ingredients p on p.slug = v.parent
where c.slug = v.child;

do $$
begin
  if (select count(*) from public.ingredients
      where slug in ('oignon-rouge', 'haricot-vert-surgele', 'epinard-galets', 'pates-completes')
        and parent_id is not null) <> 4 then
    raise exception 'Variantes non rattachées.';
  end if;
end;
$$;
