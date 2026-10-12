import Link from "next/link";
import { PrintActions } from "@/components/planner/print-actions";
import { ChevronLeftIcon } from "@/components/ui/icons";
import type { Quantity } from "@/domain/units";
import { formatShoppingQuantity } from "@/lib/format-quantity";
import { formatDay, formatWeek } from "@/lib/week";

export interface SheetEntry {
  position: number;
  title: string;
  servings: number;
  day: string | null;
  slot: "lunch" | "dinner" | null;
}
export interface SheetAisle {
  category: string;
  label: string;
  lines: { key: string; name: string; toBuy: Quantity }[];
}
export interface SheetExtra {
  id: string;
  label: string;
  quantity: string | null;
}

/**
 * Feuille de la semaine : le menu jour par jour et la liste de courses par rayon, mise en page
 * pour une feuille A4 (navigation masquée, encre foncée sur fond blanc).
 */
export function WeekSheet({
  weekStart,
  days,
  people,
  hasPlan,
  entries,
  aisles,
  extras,
}: {
  weekStart: string;
  days: string[];
  people: number | null;
  hasPlan: boolean;
  entries: SheetEntry[];
  aisles: SheetAisle[];
  extras: SheetExtra[];
}) {
  const entriesAt = (day: string, slot: "lunch" | "dinner") =>
    entries.filter((e) => e.day === day && e.slot === slot);
  const unplaced = entries.filter((e) => !e.day);
  // Version texte, pour un message ou une note.
  const text: string[] = [`Menu — ${formatWeek(weekStart)}`];
  for (const day of days) {
    const meals = (["lunch", "dinner"] as const).flatMap((slot) =>
      entriesAt(day, slot).map((e) => `${slot === "lunch" ? "midi" : "soir"} : ${e.title}`),
    );
    if (meals.length) text.push("", formatDay(day), ...meals.map((m) => `- ${m}`));
  }
  if (unplaced.length) text.push("", "À placer", ...unplaced.map((e) => `- ${e.title}`));
  if (aisles.length || extras.length) {
    text.push("", "Courses");
    for (const a of aisles) {
      text.push("", a.label);
      for (const l of a.lines) text.push(`- ${l.name} : ${formatShoppingQuantity(l.toBuy)}`);
    }
    if (extras.length) {
      text.push("", "Ajouts");
      for (const e of extras) text.push(`- ${e.label}${e.quantity ? ` : ${e.quantity}` : ""}`);
    }
  }

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-8 print:max-w-none print:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/planner?semaine=${weekStart}`}
          className="text-muted hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeftIcon size={16} /> Retour au menu
        </Link>
        <PrintActions shareText={text.join("\n")} />
      </div>

      <header className="border-border flex flex-col gap-1 border-b pb-4">
        <p className="text-muted text-sm">Aux Petits Oignons</p>
        <h1 className="type-page">{formatWeek(weekStart)}</h1>
        {people !== null ? (
          <p className="text-muted text-sm">
            {entries.length} repas · {people} personne
            {people > 1 ? "s" : ""}
          </p>
        ) : null}
      </header>

      {!hasPlan ? (
        <p className="text-muted">Pas encore de menu pour cette semaine.</p>
      ) : (
        <section aria-labelledby="menu-titre" className="flex break-inside-avoid flex-col gap-3">
          <h2 id="menu-titre" className="type-section">
            Menu
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-muted text-left text-xs tracking-wide uppercase">
                <th scope="col" className="border-border w-36 border-b py-2 pr-3 font-semibold">
                  Jour
                </th>
                <th scope="col" className="border-border border-b py-2 pr-3 font-semibold">
                  Midi
                </th>
                <th scope="col" className="border-border border-b py-2 font-semibold">
                  Soir
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day} className="align-top">
                  <th
                    scope="row"
                    className="border-border border-b py-2.5 pr-3 text-left font-semibold"
                  >
                    {formatDay(day)}
                  </th>
                  {(["lunch", "dinner"] as const).map((slot) => (
                    <td key={slot} className="border-border border-b py-2.5 pr-3">
                      {entriesAt(day, slot).map((e) => (
                        <span key={e.position} className="block">
                          {e.title}
                          <span className="text-muted"> · {e.servings} pers.</span>
                        </span>
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {unplaced.length ? (
            <p className="text-sm">
              <span className="font-semibold">À placer : </span>
              {unplaced.map((e) => e.title).join(", ")}
            </p>
          ) : null}
        </section>
      )}

      {aisles.length || extras.length ? (
        <section aria-labelledby="courses-titre" className="flex flex-col gap-3">
          <h2 id="courses-titre" className="type-section">
            Courses
          </h2>
          <div className="columns-1 gap-8 sm:columns-2 print:columns-2">
            {aisles.map((a) => (
              <div key={a.category} className="mb-4 break-inside-avoid">
                <h3 className="mb-1 text-sm font-semibold">{a.label}</h3>
                <ul className="flex flex-col">
                  {a.lines.map((l) => (
                    <PrintLine
                      key={l.key}
                      name={l.name}
                      quantity={formatShoppingQuantity(l.toBuy)}
                    />
                  ))}
                </ul>
              </div>
            ))}
            {extras.length ? (
              <div className="mb-4 break-inside-avoid">
                <h3 className="mb-1 text-sm font-semibold">Ajouts</h3>
                <ul className="flex flex-col">
                  {extras.map((e) => (
                    <PrintLine key={e.id} name={e.label} quantity={e.quantity} />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <p className="text-muted text-xs">
            Quantités nécessaires pour le menu, déduction faite du garde-manger.
          </p>
        </section>
      ) : hasPlan ? (
        <p className="text-muted text-sm">Rien à acheter : le garde-manger couvre tout le menu.</p>
      ) : null}
    </article>
  );
}

function PrintLine({ name, quantity }: { name: string; quantity: string | null }) {
  return (
    <li className="border-border flex items-baseline gap-2.5 border-b border-dotted py-1.5 text-sm">
      <span
        aria-hidden="true"
        className="border-border-strong size-3.5 shrink-0 translate-y-0.5 rounded-sm border"
      />
      <span className="flex-1">{name}</span>
      {quantity ? <span className="text-muted tabular-nums">{quantity}</span> : null}
    </li>
  );
}
