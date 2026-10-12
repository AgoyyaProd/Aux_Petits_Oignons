-- 0031 — Ordre des rayons du magasin du foyer, pour la liste de courses « par rayon ».
-- NULL = ordre par défaut de l'application. Seules les catégories du référentiel sont
-- acceptées, sans doublon. Même règle que les autres réglages : la RLS réserve la mise à jour
-- au propriétaire du foyer.

-- Une contrainte CHECK ne peut pas contenir de sous-requête : vérification déportée ici.
create function public.text_array_is_distinct(a text[])
returns boolean
language sql
immutable
set search_path = ''
as $$ select cardinality(a) = (select count(distinct x) from unnest(a) as x) $$;

alter table public.households
  add column aisle_order text[]
    check (
      aisle_order is null or (
        cardinality(aisle_order) between 1 and 14
        and aisle_order <@ array[
          'fruits', 'legumes', 'viandes', 'poissons', 'oeufs_laitiers', 'fromages',
          'feculents', 'legumineuses', 'epicerie_salee', 'epicerie_sucree', 'condiments',
          'epices_herbes', 'matieres_grasses', 'boissons'
        ]::text[]
        and public.text_array_is_distinct(aisle_order)
      )
    );

grant update (aisle_order) on public.households to authenticated;
