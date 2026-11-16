-- 0086 — « À côté » : recettes préparées en plus des repas de la semaine.
--
-- Un pain, une brioche, un gâteau, une sauce à congeler… n'importe quelle recette publiée,
-- ajoutée à la main à une semaine, avec son nombre de parts. Ce n'est pas un repas : elle ne
-- compte pas dans le nombre de repas du menu et ne se place pas sur un jour. Ses ingrédients
-- vont sur la liste de courses de la semaine, son coût dans le budget estimé.
--
-- Une semaine sans menu peut en recevoir : la ligne est rattachée au foyer et au lundi, pas
-- au menu, qui peut être proposé, relancé ou validé plus tard sans la toucher.
--
-- La cuisson réutilise recipe_cook_off_menu (même décompte FEFO, même atomicité, même
-- idempotence) puis note la cuisson sur la ligne : une recette « à côté » cuisinée n'a plus
-- besoin de rien sur la liste. Une ligne cuisinée ne se modifie plus ; la supprimer ne
-- touche pas au journal des cuissons ni au registre du stock.

create table public.meal_plan_sides (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  -- Semaine (lundi) à laquelle la recette est ajoutée.
  week_start date not null check (extract(isodow from week_start) = 1),
  recipe_id uuid not null references public.recipes (id) on delete no action,
  servings smallint not null check (servings between 1 and 40),
  -- Cuisson enregistrée (journal meal_cookings) ; null tant que ce n'est pas cuisiné.
  cooking_id uuid references public.meal_cookings (id) on delete no action,
  -- Clé du formulaire : un double envoi n'ajoute qu'une fois.
  idempotency_key uuid not null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (household_id, idempotency_key),
  unique (cooking_id)
);
create index meal_plan_sides_week_idx on public.meal_plan_sides (household_id, week_start);
create index meal_plan_sides_recipe_idx on public.meal_plan_sides (recipe_id);
create index meal_plan_sides_created_by_idx on public.meal_plan_sides (created_by);

revoke all on public.meal_plan_sides from anon, authenticated;
grant select, insert, delete on public.meal_plan_sides to authenticated;
-- Seul le nombre de parts se corrige ; la cuisson passe par meal_side_cook.
grant update (servings) on public.meal_plan_sides to authenticated;

alter table public.meal_plan_sides enable row level security;

create policy meal_plan_sides_select on public.meal_plan_sides
  for select to authenticated
  using (household_id in (select public.my_household_ids()));

create policy meal_plan_sides_insert on public.meal_plan_sides
  for insert to authenticated
  with check (
    household_id in (select public.my_household_ids())
    and cooking_id is null
    and exists (select 1 from public.recipes r where r.id = recipe_id and r.status = 'published')
  );

-- Une ligne déjà cuisinée ne change plus de nombre de parts.
create policy meal_plan_sides_update on public.meal_plan_sides
  for update to authenticated
  using (household_id in (select public.my_household_ids()) and cooking_id is null)
  with check (household_id in (select public.my_household_ids()));

create policy meal_plan_sides_delete on public.meal_plan_sides
  for delete to authenticated
  using (household_id in (select public.my_household_ids()));

-- ---------------------------------------------------------------------------
-- Cuisson d'une recette « à côté » : décompte du stock (recipe_cook_off_menu) et cuisson
-- notée sur la ligne, dans la même transaction. Rejouer la même clé renvoie le résultat
-- enregistré sans rien retirer de plus.
-- Erreurs : AP404 introuvable, AP409 déjà cuisinée ou stock changé, AP422 donnée invalide.
-- ---------------------------------------------------------------------------
create function public.meal_side_cook(
  p_household_id uuid,
  p_side_id uuid,
  p_consumptions jsonb,
  p_missing jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_side public.meal_plan_sides%rowtype;
  v_result jsonb;
  v_cooking uuid;
begin
  if (select auth.uid()) is null or p_household_id is null
     or not public.is_household_member(p_household_id) then
    raise exception 'Foyer introuvable.' using errcode = 'AP404';
  end if;

  select * into v_side from public.meal_plan_sides s
  where s.id = p_side_id and s.household_id = p_household_id
  for update;
  if not found then
    raise exception 'Recette introuvable dans la semaine.' using errcode = 'AP404';
  end if;

  v_result := public.recipe_cook_off_menu(
    p_household_id, v_side.recipe_id, v_side.servings, p_consumptions, p_missing,
    p_idempotency_key
  );
  v_cooking := (v_result ->> 'cooking_id')::uuid;

  if v_side.cooking_id is not null then
    -- Même formulaire renvoyé : la cuisson enregistrée est celle de cette ligne.
    if v_side.cooking_id = v_cooking then
      return v_result;
    end if;
    raise exception 'Cette recette est déjà marquée comme cuisinée.' using errcode = 'AP409';
  end if;

  update public.meal_plan_sides set cooking_id = v_cooking where id = v_side.id;
  return v_result;
end;
$$;

revoke execute on function public.meal_side_cook(uuid, uuid, jsonb, jsonb, uuid) from public, anon;
grant execute on function public.meal_side_cook(uuid, uuid, jsonb, jsonb, uuid) to authenticated;
