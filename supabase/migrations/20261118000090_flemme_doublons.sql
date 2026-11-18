-- 0090 — Retire le tag « flemme » de dix recettes des lots 24 et 25 trop proches d'une recette
-- déjà au catalogue (même plat, à un produit express près). Elles restent publiées comme
-- recettes ordinaires ; seule la sélection « Flemme » (filtre, badge, soirs flemme) les perd.

update public.recipes
set tags = array_remove(tags, 'flemme')
where slug in (
  'pates-fraiches-poulet-epinards-fromage-blanc',  -- ≈ pâtes complètes au poulet et épinards
  'salade-tiede-poulet-pdt-haricots-verts',        -- ≈ poulet moutarde, haricots verts, PDT vapeur
  'wraps-poulet-carottes-fromage-frais-herbes',    -- ≈ wraps au poulet curry, yaourt et carottes
  'tagliatelles-fraiches-thon-tomates-cerises',    -- ≈ pâtes au thon, tomate et câpres
  'steak-hache-pdt-vapeur-poelee-legumes',         -- ≈ steaks hachés et frites au four
  'puree-minute-ail-steak-hache-haricots-verts',   -- ≈ steak et haricots verts
  'gnocchis-epinards-parmesan',                    -- ≈ poêlée de gnocchis, épinards et lardons
  'gnocchis-ratatouille-mozzarella',               -- ≈ gnocchis dorés, tomate et mozzarella
  'salade-pois-chiches-thon-carottes',             -- ≈ bowl thon, pois chiches et concombre
  'wok-legumes-poulet-nouilles'                    -- ≈ wok de légumes, crevettes et nouilles
);

do $$
begin
  if (select count(*) from public.recipes where 'flemme' = any(tags)) <> 31 then
    raise exception 'Nombre inattendu de recettes flemme après retrait des doublons.';
  end if;
end;
$$;
