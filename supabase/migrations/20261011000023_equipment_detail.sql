-- 0023 — Matériel de cuisine plus précis : poêle, casserole, faitout, plat allant au four,
-- plat à gratin, moule, friteuse sans huile.
--
-- Règles de déduction (fixes, sans IA), uniquement sur ce que disent les étapes :
--   poêle        : « poêle », « sauteuse », « wok » ;
--   casserole    : « casserole », eau bouillante / ébullition / faire bouillir, béchamel,
--                  cuisson des pâtes, du riz, des lentilles, des pommes de terre… ;
--   faitout      : « faitout », « cocotte », « marmite » ;
--   plat au four : un plat (« dans un plat », « le plat »…) ET une cuisson au four ;
--   moule        : « dans un moule », « sur un moule » (pas « les moules », le coquillage).
-- Le plat à gratin et la friteuse sans huile ne sont exigés par aucune règle : le plat à
-- gratin compte comme plat allant au four, et le faitout comme casserole (équivalences
-- appliquées par l'application, voir domain/recipes/compatibility).
--
-- Foyers ayant déjà renseigné leur matériel : « Plaques de cuisson » couvrait jusqu'ici
-- poêle, casserole et faitout, et « Four » couvrait plat et moule. On les ajoute donc à
-- ces foyers pour qu'aucune recette ne disparaisse sans qu'ils l'aient décidé.

insert into public.equipment (code, label, position) values
  ('poele', 'Poêle', 3),
  ('casserole', 'Casserole', 4),
  ('faitout', 'Faitout ou cocotte', 5),
  ('plat_four', 'Plat allant au four', 6),
  ('plat_gratin', 'Plat à gratin', 7),
  ('moule', 'Moule (tarte, cake)', 8),
  ('airfryer', 'Friteuse sans huile (air fryer)', 11);
update public.equipment set position = 9 where code = 'mixeur';
update public.equipment set position = 10 where code = 'micro_ondes';

alter table public.household_food_profile
  drop constraint household_food_profile_equipment_check;
alter table public.household_food_profile
  add constraint household_food_profile_equipment_check
  check (equipment is null or equipment <@ array[
    'plaques', 'four', 'poele', 'casserole', 'faitout', 'plat_four', 'plat_gratin', 'moule',
    'mixeur', 'micro_ondes', 'airfryer']::text[]);

update public.household_food_profile p
set equipment = (
  select array_agg(distinct e order by e) from unnest(
    p.equipment
    || case when 'plaques' = any(p.equipment)
            then array['poele', 'casserole', 'faitout'] else '{}'::text[] end
    || case when 'four' = any(p.equipment)
            then array['plat_four', 'plat_gratin', 'moule'] else '{}'::text[] end
  ) e)
where p.equipment is not null and (p.equipment && array['plaques', 'four']);

create or replace function public._recipe_equipment_compute(p_recipe_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tags text[];
  v_text text;
  v_oven boolean;
begin
  select r.tags into v_tags from public.recipes r where r.id = p_recipe_id;
  if not found then
    return;
  end if;
  select coalesce(string_agg(s.instruction, ' '), '') into v_text
  from public.recipe_steps s where s.recipe_id = p_recipe_id;
  v_oven := 'four' = any(v_tags) or v_text ~* '(\mfour\M|°\s?C|enfourn)';

  delete from public.recipe_equipment where recipe_id = p_recipe_id;
  insert into public.recipe_equipment (recipe_id, equipment_code)
  select p_recipe_id, code from (
    select 'four' as code where v_oven
    union all
    select 'plaques'
    where 'poele' = any(v_tags) or 'mijote' = any(v_tags)
       or v_text ~* '(po[êe]le|casserole|cocotte|sauteuse|\mwok|faire (revenir|cuire|fondre|bouillir|dorer|sauter)|[ée]bullition|bain-marie|mijot|saisi|\mfrire|blanchir|\mcuire\M)'
    union all
    select 'poele' where v_text ~* '(po[êe]le|sauteuse|\mwok\M)'
    union all
    select 'casserole'
    where v_text ~* '(casserole|eau bouillante|[ée]bullition|faire bouillir|b[ée]chamel|(cuire|cuisson)\s+(les|des|du|la)\s+(p[âa]tes|spaghetti|tagliatelles|penne|macaronis|coquillettes|nouilles|riz|quinoa|lentilles|pois chiches|pommes de terre))'
    union all
    select 'faitout' where v_text ~* '(fait-?tout|cocotte|marmite)'
    union all
    select 'plat_four'
    where v_oven and v_text ~* '\m(dans un|dans le|un grand|le|un) plat\M'
    union all
    select 'moule' where v_text ~* '\m(dans|sur) (un|le) moule\M'
    union all
    select 'mixeur' where v_text ~* '\mmix(er|ez|é|ée|eur)'
    union all
    select 'micro_ondes' where v_text ~* 'micro-?ondes'
  ) t;
end;
$$;
revoke execute on function public._recipe_equipment_compute(uuid) from public, anon, authenticated;

do $$
begin
  perform public._recipe_equipment_compute(r.id) from public.recipes r;
end;
$$;
