-- 0082 — Catalogue de recettes consultable sans compte.
--
-- Demande de l'utilisateur : le catalogue et les fiches recettes sont ouverts à tous. Un
-- visiteur (rôle anon) peut LIRE, et seulement lire, les données de référence nécessaires :
--   - les recettes publiées du catalogue commun (household_id nul) ; jamais celles d'un foyer
--     ni les brouillons ; colonnes limitées (pas validated_by, identifiant d'un compte, ni la
--     provenance IA) ;
--   - leurs ingrédients, étapes et matériel (via la visibilité de la recette) ;
--   - le référentiel des ingrédients, allergènes, régimes, matériel, nutrition (Ciqual) et prix
--     indicatifs (Open Prices et tickets agrégés : aucune donnée personnelle).
-- Rien d'autre : foyers, garde-manger, menus, avis, prix des foyers et relevés de tickets
-- restent inaccessibles à anon (aucun privilège, inchangé).

grant select (id, household_id, slug, title, description, image_path, servings, prep_minutes,
  cook_minutes, rest_minutes, tags, status, storage_note) on public.recipes to anon;
grant select on public.recipe_ingredients, public.recipe_steps, public.recipe_equipment,
  public.recipe_allergens, public.recipe_diet_conflicts,
  public.ingredients, public.ingredient_allergens, public.ingredient_diet_conflicts,
  public.allergens, public.diets, public.equipment,
  public.ingredient_nutrition, public.ingredient_price_sources, public.reference_prices
  to anon;

create policy recipes_select_anon on public.recipes
  for select to anon
  using (household_id is null and status = 'published');

-- Les lignes enfants suivent la visibilité de leur recette (sous-requête soumise à sa RLS).
create policy recipe_ingredients_select_anon on public.recipe_ingredients
  for select to anon using (recipe_id in (select r.id from public.recipes r));
create policy recipe_steps_select_anon on public.recipe_steps
  for select to anon using (recipe_id in (select r.id from public.recipes r));
create policy recipe_equipment_select_anon on public.recipe_equipment
  for select to anon using (recipe_id in (select r.id from public.recipes r));

create policy ingredients_select_anon on public.ingredients for select to anon using (true);
create policy ingredient_allergens_select_anon on public.ingredient_allergens
  for select to anon using (true);
create policy ingredient_diet_conflicts_select_anon on public.ingredient_diet_conflicts
  for select to anon using (true);
create policy allergens_select_anon on public.allergens for select to anon using (true);
create policy diets_select_anon on public.diets for select to anon using (true);
create policy equipment_select_anon on public.equipment for select to anon using (true);
create policy ingredient_nutrition_select_anon on public.ingredient_nutrition
  for select to anon using (true);
create policy ingredient_price_sources_select_anon on public.ingredient_price_sources
  for select to anon using (true);
create policy reference_prices_select_anon on public.reference_prices
  for select to anon using (true);
