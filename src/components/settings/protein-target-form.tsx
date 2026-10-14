"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveProteinTargetAction } from "@/server/modules/households/actions";

const PRESETS = [20, 25, 30, 35, 40];

/**
 * Objectif de protéines par part. Une préférence, pas un filtre : les plats qui l'atteignent
 * sortent plus souvent au menu, et le menu affiche la jauge de chaque plat.
 */
export function ProteinTargetForm({
  householdId,
  value,
}: {
  householdId: string;
  value: number | null;
}) {
  const [enabled, setEnabled] = useState(value !== null);
  const [grams, setGrams] = useState(String(value ?? 30));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function save() {
    const n = Number(grams);
    start(async () => {
      const res = await saveProteinTargetAction(householdId, enabled ? n : null);
      setMessage({ ok: res.ok, text: res.message });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm">
        Par exemple 30 g par repas. Les plats qui atteignent l&apos;objectif sortent plus souvent
        dans tes menus (sans être imposés), et chaque plat du menu affiche ses protéines par part.
        Valeurs calculées avec la table Ciqual de l&apos;Anses.
      </p>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            setMessage(null);
          }}
          className="accent-brand size-5"
        />
        J&apos;ai un objectif de protéines par repas
      </label>
      {enabled ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Objectifs courants">
            {PRESETS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={grams === String(g)}
                onClick={() => {
                  setGrams(String(g));
                  setMessage(null);
                }}
                className={[
                  "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                  grams === String(g)
                    ? "border-accent-strong bg-accent-soft text-accent-strong"
                    : "border-border-strong hover:border-accent",
                ].join(" ")}
              >
                {g} g
              </button>
            ))}
          </div>
          <label className="flex max-w-xs flex-col gap-1.5 text-sm font-semibold">
            Grammes de protéines par part
            <input
              type="number"
              inputMode="numeric"
              min={5}
              max={100}
              step={1}
              value={grams}
              onChange={(e) => {
                setGrams(e.target.value);
                setMessage(null);
              }}
              className="bg-surface border-border hover:border-border-strong focus-visible:border-brand focus-visible:ring-brand/25 min-h-11 rounded-lg border px-3.5 text-base font-normal outline-none focus-visible:ring-2"
            />
          </label>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {message ? (
          <p
            role={message.ok ? "status" : "alert"}
            className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}
          >
            {message.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
