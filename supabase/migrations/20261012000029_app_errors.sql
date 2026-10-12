-- 0029 — Journal des erreurs de l'application.
--
-- Les erreurs inattendues (rendu serveur, écran qui plante dans le navigateur) sont
-- enregistrées ici pour être consultées dans le tableau de bord Supabase (Table Editor →
-- app_errors). Données minimales et anonymes : type, message tronqué, empreinte (digest)
-- de Next.js, chemin de la page SANS paramètres, version déployée. Ni utilisateur, ni foyer,
-- ni contenu saisi.
--
-- Écriture uniquement via report_app_error (aucun accès direct à la table depuis l'API), avec
-- un plafond global pour qu'un appel abusif ne puisse pas remplir la base.

create table public.app_errors (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  kind text not null check (kind in ('server', 'client')),
  message text not null check (char_length(message) <= 500),
  digest text check (digest is null or char_length(digest) <= 100),
  path text check (path is null or char_length(path) <= 200),
  release text check (release is null or char_length(release) <= 40)
);
create index app_errors_occurred_idx on public.app_errors (occurred_at desc);

revoke all on public.app_errors from anon, authenticated;
alter table public.app_errors enable row level security;
-- Aucune politique : ni lecture ni écriture directes par l'API.

create function public.report_app_error(
  p_kind text,
  p_message text,
  p_digest text default null,
  p_path text default null,
  p_release text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_kind is null or p_kind not in ('server', 'client') then
    return;
  end if;
  -- Plafond global : au-delà de 300 erreurs par heure, on ignore (une rafale suffit à alerter).
  if (select count(*) from public.app_errors where occurred_at > now() - interval '1 hour') >= 300 then
    return;
  end if;
  insert into public.app_errors (kind, message, digest, path, release)
  values (
    p_kind,
    left(coalesce(nullif(btrim(p_message), ''), 'Erreur sans message'), 500),
    left(nullif(btrim(p_digest), ''), 100),
    -- Chemin seul : on retire tout paramètre ou fragment, qui pourrait contenir une saisie.
    left(nullif(split_part(split_part(btrim(p_path), '?', 1), '#', 1), ''), 200),
    left(nullif(btrim(p_release), ''), 40)
  );
end;
$$;
revoke execute on function public.report_app_error(text, text, text, text, text) from public;
grant execute on function public.report_app_error(text, text, text, text, text) to anon, authenticated;
