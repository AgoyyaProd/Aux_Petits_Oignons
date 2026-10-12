-- 0027 — Liste de courses partagée en direct.
--
-- Quand un membre coche, décoche, ajoute ou retire un article, un SIGNAL est diffusé sur le
-- canal privé du foyer (« household:<id> ») ; les autres appareils rechargent alors la liste
-- avec leurs propres droits (RLS habituelle). Le signal ne contient aucune donnée de la liste,
-- seulement la semaine concernée.
--
-- Pourquoi pas l'écoute directe des tables (postgres_changes) : la RLS n'y est pas appliquée
-- aux suppressions, qui seraient diffusées à tous les abonnés. Ici, l'accès au canal est
-- contrôlé par une politique sur realtime.messages : seuls les membres du foyer le reçoivent.
--
-- Sans le schéma realtime (base de test locale), la migration ne fait rien.

do $migration$
begin
  if to_regproc('realtime.send') is null or to_regclass('realtime.messages') is null then
    raise notice 'Schéma realtime absent : diffusion de la liste de courses non installée.';
    return;
  end if;

  execute $fn$
    create or replace function public._shopping_broadcast()
    returns trigger
    language plpgsql
    security definer
    set search_path = ''
    as $body$
    declare
      v_household uuid := coalesce(new.household_id, old.household_id);
      v_week date := coalesce(new.week_start, old.week_start);
    begin
      perform realtime.send(
        jsonb_build_object('week', v_week),
        'shopping',
        'household:' || v_household::text,
        true
      );
      return null;
    end;
    $body$
  $fn$;
  execute 'revoke execute on function public._shopping_broadcast() from public, anon, authenticated';

  execute 'drop trigger if exists shopping_checks_broadcast on public.shopping_checks';
  execute 'create trigger shopping_checks_broadcast after insert or update or delete on public.shopping_checks for each row execute function public._shopping_broadcast()';
  execute 'drop trigger if exists shopping_extras_broadcast on public.shopping_extras';
  execute 'create trigger shopping_extras_broadcast after insert or update or delete on public.shopping_extras for each row execute function public._shopping_broadcast()';

  -- Réception : uniquement le canal de ses propres foyers, en diffusion (broadcast).
  execute 'drop policy if exists household_broadcast_read on realtime.messages';
  execute $pol$
    create policy household_broadcast_read on realtime.messages
      for select to authenticated
      using (
        realtime.messages.extension = 'broadcast'
        and realtime.topic() ~ '^household:[0-9a-f-]{36}$'
        and substring(realtime.topic() from 11)::uuid in (select public.my_household_ids())
      )
  $pol$;
end;
$migration$;
