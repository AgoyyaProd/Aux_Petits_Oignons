import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/dates";
import { formatStockQuantity } from "@/lib/format-quantity";
import { getStockHistory } from "@/server/modules/pantry/queries";

export const metadata: Metadata = { title: "Historique du stock" };

const KIND_LABEL: Record<string, string> = {
  initial: "Ajout",
  purchase: "Achat",
  consumption: "Utilisé",
  cooking: "Cuisiné",
  correction: "Correction",
  loss: "Jeté",
  leftover: "Restes",
};

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/pantry" className="text-brand text-sm font-medium">
          ← Garde-manger
        </Link>
        <h1 className="type-page">Historique du stock</h1>
        <p className="text-muted text-sm">
          Les 100 derniers mouvements. L&apos;historique n&apos;est jamais modifié.
        </p>
      </div>
      <Suspense fallback={<PageSkeleton rows={5} />}>
        <HistoryContent />
      </Suspense>
    </div>
  );
}

async function HistoryContent() {
  const history = await getStockHistory();
  if (!history) return <p className="text-muted">Aucun foyer actif.</p>;
  if (history.movements.length === 0) {
    return <p className="text-muted">Aucun mouvement pour l&apos;instant.</p>;
  }

  return (
    <ol className="border-border bg-surface divide-border divide-y rounded-2xl border">
      {history.movements.map((m) => (
        <li key={m.id} className="flex items-start justify-between gap-3 p-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-sm font-semibold">
              {m.ingredientName}{" "}
              <span className="text-muted font-normal">· {KIND_LABEL[m.kind] ?? m.kind}</span>
            </p>
            <p className="text-muted text-xs">
              {formatDateTime(m.createdAt, history.timezone)}
              {m.note ? ` · ${m.note}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-sm">
            <span className="font-medium tabular-nums">
              {m.deltaBase === null
                ? "—"
                : formatStockQuantity(m.deltaBase, m.dimension, m.displayUnit, { signed: true })}
            </span>
            <span className="text-muted text-xs tabular-nums">
              reste {formatStockQuantity(m.quantityAfterBase, m.dimension, m.displayUnit)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
