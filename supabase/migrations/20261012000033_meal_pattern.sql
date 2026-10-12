-- 0033 — Semaine type du foyer et nombre de repas par cuisson.
--
-- meal_slots : les repas de la semaine prévus au menu (« lun:midi » = 'mon:lunch', …).
--   Par défaut tous (midi et soir, 7 jours) : rien ne change pour les foyers existants.
-- meals_per_cook : 1 = on cuisine à chaque repas ; 2 ou 3 = un plat cuisiné couvre ce nombre
--   de repas, les restes vont aux repas prévus suivants.
-- Même règle que les autres réglages : la RLS réserve la mise à jour au propriétaire du foyer.

alter table public.households
  add column meal_slots text[] not null default array[
    'mon:lunch', 'mon:dinner', 'tue:lunch', 'tue:dinner', 'wed:lunch', 'wed:dinner',
    'thu:lunch', 'thu:dinner', 'fri:lunch', 'fri:dinner', 'sat:lunch', 'sat:dinner',
    'sun:lunch', 'sun:dinner'
  ]::text[]
    check (
      cardinality(meal_slots) between 1 and 14
      and meal_slots <@ array[
        'mon:lunch', 'mon:dinner', 'tue:lunch', 'tue:dinner', 'wed:lunch', 'wed:dinner',
        'thu:lunch', 'thu:dinner', 'fri:lunch', 'fri:dinner', 'sat:lunch', 'sat:dinner',
        'sun:lunch', 'sun:dinner'
      ]::text[]
      and public.text_array_is_distinct(meal_slots)
    ),
  add column meals_per_cook smallint not null default 1
    check (meals_per_cook between 1 and 3);

grant update (meal_slots, meals_per_cook) on public.households to authenticated;
