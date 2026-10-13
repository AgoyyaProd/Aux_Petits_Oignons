-- 0043 — Prix relevés sur des tickets de caisse.
--
-- Chaque ligne est un article réellement payé : magasin, date, libellé imprimé, contenance
-- imprimée, prix d'un article. Aucune donnée personnelle (ni acheteur, ni paiement).
-- Les lignes sont un registre : jamais modifiées ni supprimées. Une erreur se corrige par une
-- nouvelle migration qui ajoute la bonne ligne et en retire l'usage (pas de suppression).
--
-- Les prix indicatifs (reference_prices) gagnent la source « receipts » : quand un ingrédient
-- a des relevés de ticket récents, leur médiane remplace le prix Open Prices (prix réels des
-- magasins où l'on fait ses courses). La saisie du foyer reste prioritaire.

create table public.receipt_prices (
  id bigint generated always as identity primary key,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  store_label text not null check (char_length(btrim(store_label)) between 1 and 60),
  purchased_on date not null,
  receipt_label text not null check (char_length(btrim(receipt_label)) between 1 and 120),
  pack_quantity numeric(10, 3) not null check (pack_quantity > 0),
  pack_unit text not null check (pack_unit in ('g', 'kg', 'ml', 'cl', 'l', 'piece')),
  -- Prix d'un article, en centimes.
  cents integer not null check (cents between 1 and 100000),
  created_at timestamptz not null default now(),
  unique (store_label, purchased_on, receipt_label)
);
create index receipt_prices_ingredient_idx on public.receipt_prices (ingredient_id, purchased_on desc);

revoke all on public.receipt_prices from anon, authenticated;
grant select, insert on public.receipt_prices to authenticated;
alter table public.receipt_prices enable row level security;

create policy receipt_prices_read on public.receipt_prices
  for select to authenticated using (true);
create policy receipt_prices_admin_insert on public.receipt_prices
  for insert to authenticated with check ((select public.is_app_admin()));

-- Registre : même le service ne modifie ni ne supprime une ligne.
create function public.receipt_prices_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Les relevés de ticket ne se modifient pas et ne se suppriment pas.'
    using errcode = 'AP403';
end;
$$;
create trigger receipt_prices_no_update_delete
  before update or delete on public.receipt_prices
  for each row execute function public.receipt_prices_immutable();

alter table public.reference_prices drop constraint reference_prices_source_check;
alter table public.reference_prices add constraint reference_prices_source_check
  check (source in ('open_prices', 'receipts', 'free'));
