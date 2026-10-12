"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { AISLES, orderedAisles } from "@/lib/categories";
import { saveAisleOrderAction } from "@/server/modules/households/actions";

/**
 * Ordre des rayons de mon magasin : la liste de courses « par rayon » suit cet ordre.
 * Monter / descendre au clavier ou au toucher (pas de glisser-déposer, inaccessible).
 */
export function AisleOrderForm({
  householdId,
  order,
  isOwner,
}: {
  householdId: string;
  order: string[] | null;
  isOwner: boolean;
}) {
  const [items, setItems] = useState(() => orderedAisles(order).map((a) => a.category));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const label = new Map(AISLES.map((a) => [a.category, a.label]));
  const isDefault = items.every((c, i) => c === AISLES[i]!.category);

  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setItems(next);
    setMessage(null);
  }

  function save(next: string[] | null) {
    start(async () => {
      const res = await saveAisleOrderAction(householdId, next);
      setMessage({ ok: res.ok, text: res.message });
      if (res.ok && next === null) setItems(AISLES.map((a) => a.category));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm">
        Range les rayons dans l&apos;ordre où tu les parcours : la liste de courses « par rayon »
        suivra ce chemin.
      </p>
      <ol className="border-border divide-border flex flex-col divide-y rounded-xl border">
        {items.map((c, i) => (
          <li key={c} className="flex min-h-12 items-center gap-3 px-3 py-1.5">
            <span className="text-muted w-6 text-right text-sm tabular-nums">{i + 1}</span>
            <span className="flex-1 text-sm font-medium">{label.get(c)}</span>
            {isOwner ? (
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || pending}
                  aria-label={`Monter ${label.get(c)}`}
                  className="hover:bg-surface-muted flex size-10 items-center justify-center rounded-full disabled:opacity-30"
                >
                  <ChevronDownIcon size={18} className="rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1 || pending}
                  aria-label={`Descendre ${label.get(c)}`}
                  className="hover:bg-surface-muted flex size-10 items-center justify-center rounded-full disabled:opacity-30"
                >
                  <ChevronDownIcon size={18} />
                </button>
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      {isOwner ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => save(items)} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer l'ordre"}
          </Button>
          {!isDefault || order ? (
            <Button type="button" variant="secondary" onClick={() => save(null)} disabled={pending}>
              Ordre par défaut
            </Button>
          ) : null}
          {message ? (
            <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
              {message.text}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-muted text-xs">Seul le propriétaire du foyer peut modifier cet ordre.</p>
      )}
    </div>
  );
}
