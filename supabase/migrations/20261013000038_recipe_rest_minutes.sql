-- 0038 — Temps d'attente des recettes (levée, marinade, réfrigération), séparé du travail.
--
-- prep_minutes = temps de travail actif ; rest_minutes = attente sans rien faire ;
-- cook_minutes = cuisson. Durée totale = les trois. La difficulté ne dépend que du travail
-- actif : une pâte qui lève 2 heures n'est pas plus difficile pour autant.
-- Valeurs reprises des étapes de chaque recette (attentes de 15 minutes ou plus).

alter table public.recipes
  add column rest_minutes smallint not null default 0 check (rest_minutes between 0 and 2880);

update public.recipes r
set prep_minutes = v.prep, rest_minutes = v.rest, updated_at = now()
from (values
  -- Pains et pâtes : temps de levée sortis de la préparation.
  ('pain-maison', 20, 135),
  ('pain-de-mie-maison', 20, 135),
  ('brioche-maison', 40, 690),
  ('brioches-roulees-cannelle', 30, 100),
  ('focaccia-tomates-cerises', 15, 120),
  ('naans-ail', 20, 60),
  ('pains-burger', 25, 100),
  ('pains-pita', 20, 70),
  ('pate-pizza-maison', 15, 90),
  ('pizza-margherita', 20, 90),
  ('pate-brisee-maison', 10, 30),
  -- Marinades comptées jusqu'ici dans la préparation.
  ('butter-chicken', 15, 20),
  ('biryani-poulet', 20, 20),
  ('souvlaki-poulet-tzatziki', 15, 20),
  ('yassa-poulet', 15, 30),
  -- Attentes qui n'étaient pas comptées du tout (la durée affichée était trop courte).
  ('poulet-yaourt-epices-basmati', 15, 15),
  ('flan-patissier', 20, 240),
  ('mousse-chocolat', 20, 240),
  ('creme-chocolat', 5, 120),
  ('overnight-oats-fruits-rouges', 10, 240),
  ('gaspacho', 15, 60),
  ('salade-fruits-oranges', 20, 30),
  ('taboule', 20, 30)
) as v(slug, prep, rest)
where r.slug = v.slug;

do $$
begin
  if (select count(*) from public.recipes where rest_minutes > 0) <> 23 then
    raise exception 'Temps d''attente : 23 recettes attendues.';
  end if;
end;
$$;
