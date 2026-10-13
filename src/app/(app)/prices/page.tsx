import type { Metadata } from "next";
import { Suspense } from "react";
import { PriceForm } from "@/components/prices/price-form";
import { StoreForm } from "@/components/prices/store-form";
import { SyncButton } from "@/components/prices/sync-button";
import { buttonClasses } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { centsToInput, formatCents } from "@/domain/money";
import { formatDateTime, formatShortDate } from "@/lib/dates";
import { removeHouseholdPriceAction } from "@/server/modules/prices/actions";
import { getPricesPage, type PriceRow } from "@/server/modules/prices/queries";

export const metadata: Metadata = { title: "Prix" };

// La mise à jour des prix (administrateur) interroge Open Prices pour chaque ingrédient.
export const maxDuration = 60;

export default function PricesPage({ searchParams }: PageProps<"/prices">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="type-page">Prix</h1>
        <p className="text-muted text-sm">
          Les prix servent à estimer le coût de tes menus. Par défaut, ce sont des prix indicatifs :
          les prix relevés sur des tickets de caisse des 12 derniers mois quand il y en a, sinon la
          médiane des relevés publics Open Prices faits en France sur la même période. Ton prix,
          s&apos;il est renseigné, les remplace.
        </p>
      </div>
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <PricesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PricesContent({ searchParams }: Pick<PageProps<"/prices">, "searchParams">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : undefined;
  const page = await getPricesPage(q);
  if (!page) return <p className="text-muted">Aucun foyer actif.</p>;

  return (
    <>
      <section className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-4">
        <StoreForm householdId={page.householdId} store={page.referenceStore} />
        <p className="text-muted text-xs">
          Prix indicatifs disponibles pour {page.coverage.priced} ingrédients sur{" "}
          {page.coverage.total} · {page.coverage.mine} prix saisis par ton foyer.
        </p>
      </section>

      {page.isAdmin ? (
        <section className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-4">
          <h2 className="font-semibold">Administration</h2>
          <p className="text-muted text-xs">
            {page.lastRun
              ? `Dernière mise à jour : ${formatDateTime(page.lastRun.started_at, "Europe/Paris")} (${
                  page.lastRun.status === "succeeded"
                    ? `${page.lastRun.ingredients_priced ?? 0}/${page.lastRun.ingredients_total ?? 0} ingrédients avec un prix`
                    : page.lastRun.status === "running"
                      ? "en cours ou interrompue"
                      : "échec"
                }).`
              : "Aucune mise à jour pour l'instant."}{" "}
            Automatique chaque nuit si la tâche planifiée est configurée.
          </p>
          <SyncButton />
        </section>
      ) : null}

      <form className="flex gap-2" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Chercher un ingrédient"
          aria-label="Chercher un ingrédient"
          className="bg-surface border-border focus-visible:ring-brand min-h-11 w-full min-w-0 rounded-xl border px-3 text-base outline-none focus-visible:ring-2"
        />
        <button type="submit" className={buttonClasses("secondary")}>
          Chercher
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {page.rows.map((row) => (
          <li key={row.ingredientId}>
            <PriceItem row={row} householdId={page.householdId} />
          </li>
        ))}
      </ul>
      {page.rows.length === 0 ? (
        <p className="text-muted text-sm">Aucun ingrédient trouvé.</p>
      ) : null}

      <p className="text-muted text-xs">
        Données de prix :{" "}
        <a
          href="https://prices.openfoodfacts.org"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Open Prices
        </a>{" "}
        par Open Food Facts, sous licence ODbL. Catégories de produits : taxonomie Open Food Facts.
      </p>
    </>
  );
}

function ReferenceLine({ row }: { row: PriceRow }) {
  const ref = row.reference;
  if (ref?.free) return <span>Gratuit (eau du robinet)</span>;
  if (!ref) {
    return (
      <span>
        Sans prix indicatif{row.noSource ? " (aucune catégorie fiable)" : " (pas de relevé récent)"}
      </span>
    );
  }
  return (
    <span>
      Indicatif : {formatCents(ref.cents)} / {row.refLabel} · {ref.sampleSize}{" "}
      {ref.receipts ? "ticket" : "relevé"}
      {ref.sampleSize > 1 ? "s" : ""}
      {ref.receipts ? " de caisse" : ""}
      {ref.observedTo ? ` · jusqu'au ${formatShortDate(ref.observedTo)}` : ""}
      {ref.lowSample ? " · peu de relevés" : ""}
      {row.approximate ? " · catégorie approchante" : ""}
    </span>
  );
}

function PriceItem({ row, householdId }: { row: PriceRow; householdId: string }) {
  return (
    <details className="border-border bg-surface rounded-2xl border">
      <summary className="flex cursor-pointer items-center justify-between gap-3 p-3">
        <span className="flex min-w-0 flex-col">
          <span className="font-medium">{row.name}</span>
          <span className="text-muted text-xs">
            <ReferenceLine row={row} />
          </span>
        </span>
        <span className="shrink-0 text-right text-sm tabular-nums">
          {row.mine ? (
            <span className="text-brand font-semibold">
              {formatCents(row.mine.cents)} / {row.refLabel}
            </span>
          ) : row.reference && !row.reference.free ? (
            <span className="text-muted">≈ {formatCents(row.reference.cents)}</span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </span>
      </summary>
      <div className="border-border flex flex-col gap-3 border-t p-3">
        {row.mine ? (
          <p className="text-muted text-xs">
            Ton prix : {formatCents(row.mine.cents)} / {row.refLabel}
            {row.mine.storeLabel ? ` chez ${row.mine.storeLabel}` : ""}, saisi le{" "}
            {formatShortDate(row.mine.observedOn)}.
            {row.mine.sourceUrl ? (
              <>
                {" "}
                <a
                  href={row.mine.sourceUrl}
                  className="underline"
                  target="_blank"
                  rel="noreferrer nofollow"
                >
                  Voir la fiche
                </a>
              </>
            ) : null}
          </p>
        ) : null}
        <PriceForm
          householdId={householdId}
          ingredientId={row.ingredientId}
          dimension={row.dimension}
          refLabel={row.refLabel}
          defaultPrice={row.mine ? centsToInput(row.mine.cents) : ""}
          defaultUrl={row.mine?.sourceUrl ?? ""}
        />
        {row.mine ? (
          <form action={removeHouseholdPriceAction}>
            <input type="hidden" name="householdId" value={householdId} />
            <input type="hidden" name="ingredientId" value={row.ingredientId} />
            <button type="submit" className="text-danger text-sm underline">
              Retirer mon prix (revenir au prix indicatif)
            </button>
          </form>
        ) : null}
      </div>
    </details>
  );
}
