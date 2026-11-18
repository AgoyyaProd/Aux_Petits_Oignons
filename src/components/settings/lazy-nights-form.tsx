"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveLazyNightsAction } from "@/server/modules/households/actions";

const CHOICES = [0, 1, 2, 3];

/**
 * Soirs « flemme » par semaine : ces soirs-là, le menu propose en priorité une recette de la
 * flemme (15 minutes, peu d'ingrédients, mais légumes et protéines au rendez-vous).
 */
export function LazyNightsForm({ householdId, value }: { householdId: string; value: number }) {
  const [count, setCount] = useState(value);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const res = await saveLazyNightsAction(householdId, count);
      setMessage({ ok: res.ok, text: res.message });
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm">
        Les recettes de la flemme se font en 15 minutes au plus, avec 5 courses au maximum, mais
        apportent au moins 80 g de légumes et 20 g de protéines par part. Le menu les place en
        priorité sur les soirs de semaine.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Soirs flemme par semaine">
        {CHOICES.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={count === n}
            onClick={() => {
              setCount(n);
              setMessage(null);
            }}
            className={[
              "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors",
              count === n
                ? "border-accent-strong bg-accent-soft text-accent-strong"
                : "border-border-strong hover:border-accent",
            ].join(" ")}
          >
            {n === 0 ? "Aucun" : `${n} soir${n > 1 ? "s" : ""}`}
          </button>
        ))}
      </div>
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
