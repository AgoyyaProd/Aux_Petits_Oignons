-- 0065 — Formats d'achat standards et durée de conservation après ouverture.
--
-- Pour certains produits vendus en paquet (boîte, brique, pot, barquette), un format
-- standard et une durée à respecter une fois ouvert. Ils servent :
--  - au menu : un plat qui entame un paquet laisse un reste ; les plats suivants qui le
--    finissent avant la date limite sont favorisés ;
--  - aux courses : le besoin exact est accompagné du nombre de paquets standards.
-- Le besoin calculé reste exact : le format n'est qu'une indication, jamais une conversion.
--
-- Quantité exprimée dans l'unité de base de l'ingrédient (g, ml ou pièce). Légumineuses en
-- boîte : poids égoutté, celui des recettes. Durées : au réfrigérateur, valeurs indicatives
-- validées par l'utilisateur (mentions courantes des emballages ; lait de coco : fiche
-- fabricant, « à consommer dans les 3 jours »), à vérifier sur l'étiquette.

create table public.ingredient_packages (
  ingredient_id uuid primary key references public.ingredients (id) on delete cascade,
  -- Format standard ; vide pour un produit fragile sans format (herbes fraîches) : le menu
  -- favorise alors simplement sa réutilisation dans les jours qui suivent.
  quantity_base numeric(12,3) check (quantity_base > 0),
  label text check (char_length(label) between 1 and 60),
  opened_keep_days smallint check (opened_keep_days between 1 and 365),
  source text not null check (char_length(source) between 1 and 200),
  updated_at timestamptz not null default now(),
  check ((quantity_base is null) = (label is null))
);

revoke all on public.ingredient_packages from anon, authenticated;
grant select on public.ingredient_packages to authenticated;
alter table public.ingredient_packages enable row level security;
create policy ingredient_packages_read on public.ingredient_packages
  for select to authenticated using (true);

insert into public.ingredient_packages (ingredient_id, quantity_base, label, opened_keep_days, source)
select i.id, v.qty::numeric, v.label, v.days::smallint, v.source
from (values
  ('lait-coco', 400, 'boîte de 40 cl', 3, 'Fiche fabricant (Thai Kitchen) : à consommer dans les 3 jours'),
  ('coulis-tomate', 500, 'bocal de 500 g', 3, 'Mention courante des emballages, validée par l''utilisateur'),
  ('tomate-concassee', 400, 'boîte de 400 g', 3, 'Mention courante des emballages, validée par l''utilisateur'),
  ('concentre-tomate', 150, 'tube de 150 g', 30, 'Mention courante des emballages, validée par l''utilisateur'),
  ('creme-liquide', 200, 'brique de 20 cl', 3, 'Mention courante des emballages, validée par l''utilisateur'),
  ('creme-fraiche', 200, 'pot de 20 cl', 5, 'Mention courante des emballages, validée par l''utilisateur'),
  ('mozzarella', 1, 'boule de 125 g', 1, 'Mention courante des emballages, validée par l''utilisateur'),
  ('ricotta', 250, 'pot de 250 g', 3, 'Mention courante des emballages, validée par l''utilisateur'),
  ('feta', 200, 'bloc de 200 g', 5, 'Mention courante des emballages, validée par l''utilisateur'),
  ('fromage-blanc', 500, 'pot de 500 g', 3, 'Mention courante des emballages, validée par l''utilisateur'),
  ('lardon', 200, 'barquette de 200 g', 2, 'Mention courante des emballages, validée par l''utilisateur'),
  ('jambon', 4, 'paquet de 4 tranches', 2, 'Mention courante des emballages, validée par l''utilisateur'),
  ('saumon-fume', 120, 'paquet de 4 tranches (120 g)', 2, 'Mention courante des emballages, validée par l''utilisateur'),
  ('pesto', 190, 'pot de 190 g', 5, 'Mention courante des emballages, validée par l''utilisateur'),
  ('pesto-rosso', 190, 'pot de 190 g', 5, 'Mention courante des emballages, validée par l''utilisateur'),
  ('haricot-rouge', 265, 'boîte de 400 g (265 g égouttés)', 2, 'Mention courante des emballages, validée par l''utilisateur'),
  ('pois-chiche', 265, 'boîte de 400 g (265 g égouttés)', 2, 'Mention courante des emballages, validée par l''utilisateur'),
  ('haricot-blanc', 265, 'boîte de 400 g (265 g égouttés)', 2, 'Mention courante des emballages, validée par l''utilisateur'),
  ('tofu', 400, 'bloc de 400 g', 3, 'Mention courante des emballages, validée par l''utilisateur'),
  ('lait', 1000, 'brique de 1 L', 3, 'Mention courante des emballages, validée par l''utilisateur'),
  ('persil', null, null, null, 'Herbe fraîche : à réutiliser vite, sans format défini'),
  ('coriandre', null, null, null, 'Herbe fraîche : à réutiliser vite, sans format défini'),
  ('ciboulette', null, null, null, 'Herbe fraîche : à réutiliser vite, sans format défini'),
  ('basilic', null, null, null, 'Herbe fraîche : à réutiliser vite, sans format défini'),
  ('menthe', null, null, null, 'Herbe fraîche : à réutiliser vite, sans format défini')
) as v(slug, qty, label, days, source)
join public.ingredients i on i.slug = v.slug;

do $$
begin
  if (select count(*) from public.ingredient_packages) <> 25 then
    raise exception 'Formats standards incomplets.';
  end if;
end;
$$;
