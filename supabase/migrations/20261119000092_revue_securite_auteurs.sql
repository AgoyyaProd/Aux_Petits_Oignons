-- 0092 — Revue de sécurité du 19/11.
--
-- 1. Auteur des lignes : created_by / checked_by valent auth.uid() par défaut, mais la
--    colonne restait modifiable par l'API, si bien qu'un membre pouvait attribuer un ajout
--    à n'importe quel autre utilisateur (même hors foyer, l'UUID suffisant). On retire le
--    droit d'écrire ces colonnes : le défaut s'applique toujours. L'application ne les envoie
--    jamais. Même chose pour created_at du prix d'un foyer, qui ne se modifie plus.
-- 2. meal_cookings.missing : liste libre envoyée par le client (ingrédients manquants au
--    moment de cuisiner), sans borne de taille. Bornée à 200 éléments et 32 Ko.

revoke insert on public.shopping_extras from authenticated;
grant insert (id, household_id, week_start, ingredient_id, label, quantity_text,
  source_recipe_id, checked, created_at) on public.shopping_extras to authenticated;

revoke insert on public.shopping_checks from authenticated;
grant insert (household_id, week_start, ingredient_id, dimension, checked_at)
  on public.shopping_checks to authenticated;

revoke insert on public.household_staples from authenticated;
grant insert (household_id, ingredient_id, created_at) on public.household_staples to authenticated;

revoke insert on public.household_expenses from authenticated;
grant insert (id, household_id, idempotency_key, week_start, spent_on, store_label, amount_cents,
  non_food_cents, estimated_store_cents, estimated_meals_cents, estimate_is_minimum, source,
  created_at, updated_at) on public.household_expenses to authenticated;

revoke insert on public.meal_plan_sides from authenticated;
grant insert (id, household_id, week_start, recipe_id, servings, cooking_id, idempotency_key,
  created_at) on public.meal_plan_sides to authenticated;

-- Prix du foyer : enregistré par upsert (insert … on conflict do update), qui réécrit les
-- colonnes envoyées par l'application ; ni l'auteur ni la date de création n'en font partie.
revoke insert, update on public.household_prices from authenticated;
grant insert (household_id, ingredient_id, dimension, cents_per_ref, store_label, source_url,
  observed_on, created_at, updated_at) on public.household_prices to authenticated;
grant update (household_id, ingredient_id, dimension, cents_per_ref, store_label, source_url,
  observed_on, updated_at) on public.household_prices to authenticated;

alter table public.meal_cookings
  add constraint meal_cookings_missing_bounded check (
    jsonb_typeof(missing) = 'array'
    and jsonb_array_length(missing) <= 200
    and pg_column_size(missing) <= 32768
  );
