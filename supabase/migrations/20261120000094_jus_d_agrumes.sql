-- 0094 — Le jus d'un agrume en stock compte pour le jus demandé par une recette.
--
-- Convention des recettes : le fruit frais (citron, citron vert) n'est demandé que pour ce
-- qu'on ne tire pas d'une bouteille (zeste, quartiers, rondelles) ; le jus est demandé comme
-- « jus de citron ». Un citron en stock peut donc couvrir un besoin de jus — l'inverse jamais.
-- La correspondance est explicite et documentée (pas de conversion devinée) : ml de jus par
-- fruit, d'après la table USDA SR Legacy (« 1 lemon yields » 48 g, « 1 lime yields » 44 g),
-- divisé par la densité du jus au référentiel (1,03 g/ml), arrondi au ml :
--   citron 48 / 1,03 = 46,6 → 47 ml ; citron vert 44 / 1,03 = 42,7 → 43 ml.
-- Si la recette demande aussi le fruit lui-même (zeste et jus), les fruits en stock restent
-- réservés au fruit : prudence, on ne promet pas deux fois le même citron.

create table public.ingredient_juice_sources (
  product_id uuid primary key references public.ingredients (id) on delete cascade,
  source_id uuid not null unique references public.ingredients (id) on delete cascade,
  ml_per_piece numeric(6,1) not null check (ml_per_piece > 0 and ml_per_piece <= 500),
  source_note text not null check (char_length(source_note) between 1 and 300),
  check (product_id <> source_id)
);

alter table public.ingredient_juice_sources enable row level security;
revoke all on public.ingredient_juice_sources from public, anon, authenticated;
grant select on public.ingredient_juice_sources to anon, authenticated;
create policy ingredient_juice_sources_read on public.ingredient_juice_sources
  for select to anon, authenticated using (true);

insert into public.ingredient_juice_sources (product_id, source_id, ml_per_piece, source_note)
select p.id, s.id, v.ml, v.note
from (values
  ('jus-citron', 'citron', 47.0,
   'USDA SR Legacy, Lemon juice, raw : 1 lemon yields 48 g ; densité 1,03 g/ml'),
  ('jus-citron-vert', 'citron-vert', 43.0,
   'USDA SR Legacy, Lime juice, raw : 1 lime yields 44 g ; densité 1,03 g/ml')
) as v(product, source, ml, note)
join public.ingredients p on p.slug = v.product
join public.ingredients s on s.slug = v.source;

do $$
begin
  if (select count(*) from public.ingredient_juice_sources j
      join public.ingredients p on p.id = j.product_id and p.default_dimension = 'volume'
      join public.ingredients s on s.id = j.source_id and s.default_dimension = 'count') <> 2 then
    raise exception 'Sources de jus incomplètes.';
  end if;
end;
$$;
