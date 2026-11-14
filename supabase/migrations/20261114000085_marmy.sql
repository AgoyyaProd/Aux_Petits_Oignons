-- 0085 — Le projet s'appelle désormais « Marmy » : mention de source des recettes originales.
update public.recipes
set source_ref = 'Marmy — recette originale'
where source_ref = 'Aux Petits Oignons — recette originale';
