"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { ALL_PATTERN_SLOTS, PATTERN_PRESETS } from "@/domain/planning/pattern";
import { WEEKDAY_CODES } from "@/domain/planning/schedule";
import { saveMealPatternAction } from "@/server/modules/households/actions";

const DAY_LABELS: Record<(typeof WEEKDAY_CODES)[number], string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

const PRESETS: { id: keyof typeof PATTERN_PRESETS; label: string }[] = [
  { id: "midi_et_soir", label: "Midi et soir" },
  { id: "soir", label: "Le soir seulement" },
  { id: "semaine_soir", label: "Soir en semaine, midi et soir le week-end" },
];

const PER_COOK = [
  { n: 1, label: "1 repas", hint: "On cuisine à chaque repas." },
  { n: 2, label: "2 repas", hint: "On cuisine pour le repas et le suivant (restes)." },
  { n: 3, label: "3 repas", hint: "Cuisine en avance : un plat pour trois repas." },
];

function sameSet(a: ReadonlySet<string>, b: readonly string[]) {
  return a.size === b.length && b.every((s) => a.has(s));
}

/**
 * Semaine type du foyer : quels repas le menu prévoit, et combien de repas couvre une cuisson.
 * Les repas non cochés (cantine, restaurant…) ne reçoivent pas de plat automatiquement.
 */
export function MealPatternForm({
  householdId,
  slots,
  mealsPerCook,
  isOwner,
}: {
  householdId: string;
  slots: string[];
  mealsPerCook: number;
  isOwner: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(slots));
  const [perCook, setPerCook] = useState(mealsPerCook);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const disabled = !isOwner || pending;
  const meals = selected.size;
  const cooks = Math.ceil(meals / perCook);

  function toggle(code: string) {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
    setMessage(null);
  }

  function save() {
    start(async () => {
      const res = await saveMealPatternAction(
        householdId,
        ALL_PATTERN_SLOTS.filter((s) => selected.has(s)),
        perCook,
      );
      setMessage({ ok: res.ok, text: res.message });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-muted text-sm">
        Coche les repas que ton menu doit prévoir. Les autres (cantine, restaurant…) restent vides ;
        tu peux toujours y ajouter un plat à la main.
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Raccourcis">
        {PRESETS.map((p) => {
          const active = sameSet(selected, PATTERN_PRESETS[p.id]);
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => {
                setSelected(new Set(PATTERN_PRESETS[p.id]));
                setMessage(null);
              }}
              className={[
                "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors disabled:opacity-60",
                active
                  ? "border-accent-strong bg-accent-soft text-accent-strong"
                  : "border-border-strong hover:border-accent",
              ].join(" ")}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <table className="w-full max-w-md border-separate border-spacing-y-1 text-sm">
        <caption className="sr-only">Repas prévus au menu, jour par jour</caption>
        <thead>
          <tr className="text-muted text-xs">
            <th scope="col" className="text-left font-semibold">
              Jour
            </th>
            <th scope="col" className="w-24 font-semibold">
              Midi
            </th>
            <th scope="col" className="w-24 font-semibold">
              Soir
            </th>
          </tr>
        </thead>
        <tbody>
          {WEEKDAY_CODES.map((d) => (
            <tr key={d}>
              <th scope="row" className="text-left font-medium">
                {DAY_LABELS[d]}
              </th>
              {(["lunch", "dinner"] as const).map((slot) => {
                const code = `${d}:${slot}`;
                const on = selected.has(code);
                return (
                  <td key={slot} className="text-center">
                    <label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={disabled}
                        onChange={() => toggle(code)}
                        className="peer sr-only"
                        aria-label={`${DAY_LABELS[d]} ${slot === "lunch" ? "midi" : "soir"}`}
                      />
                      <span
                        aria-hidden="true"
                        className="border-border-strong peer-checked:border-accent-strong peer-checked:bg-accent-strong peer-focus-visible:ring-accent flex size-6 items-center justify-center rounded-md border-2 text-white peer-focus-visible:ring-2 peer-disabled:opacity-60"
                      >
                        {on ? <CheckIcon size={15} strokeWidth={3} /> : null}
                      </span>
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Un plat cuisiné couvre…</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PER_COOK.map((o) => (
            <label
              key={o.n}
              className="border-border has-[:checked]:border-accent-strong has-[:checked]:bg-accent-soft flex cursor-pointer flex-col gap-0.5 rounded-xl border px-4 py-3 has-[:disabled]:cursor-default has-[:focus-visible]:ring-2"
            >
              <input
                type="radio"
                name="mealsPerCook"
                value={o.n}
                checked={perCook === o.n}
                disabled={disabled}
                onChange={() => {
                  setPerCook(o.n);
                  setMessage(null);
                }}
                className="sr-only"
              />
              <span className="text-sm font-semibold">{o.label}</span>
              <span className="text-muted text-xs">{o.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="text-sm" aria-live="polite">
        {meals === 0 ? (
          <span className="text-danger">Coche au moins un repas.</span>
        ) : (
          <>
            <strong className="tabular-nums">{meals}</strong> repas par semaine
            {perCook > 1 ? (
              <>
                , soit <strong className="tabular-nums">{cooks}</strong> fois en cuisine
              </>
            ) : null}
            .
          </>
        )}
      </p>

      {isOwner ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={save} disabled={pending || meals === 0}>
            {pending ? "Enregistrement…" : "Enregistrer ma semaine"}
          </Button>
          {message ? (
            <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>
              {message.text}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-muted text-xs">
          Seul le propriétaire du foyer peut modifier ce réglage.
        </p>
      )}
    </div>
  );
}
