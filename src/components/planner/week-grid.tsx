import Link from "next/link";
import { PlanActionButton } from "@/components/planner/entry-action";
import { SlotSelect } from "@/components/planner/slot-select";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { Badge } from "@/components/ui/badge";
import { iconButtonClasses } from "@/components/ui/button";
import {
  ClockIcon,
  CloseIcon,
  HeartIcon,
  LockIcon,
  MinusIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { formatCents } from "@/domain/money";
import { formatDay } from "@/lib/week";
import {
  addEntryAction,
  cookDoubleAction,
  removeEntryAction,
  setServingsAction,
  toggleLockAction,
} from "@/server/modules/planning/actions";
import type { PlannerEntryView, PlannerPage } from "@/server/modules/planning/queries";
import { CloseOpenPanels } from "./close-open-panels";

export type Base = { week: string; version: number };

const EDIT_PANEL = "modifier-plat";

/**
 * La semaine : sur ordinateur, une grille « Déjeuner / Dîner × 7 jours » ; sur téléphone,
 * une liste chronologique précédée de pastilles de jours. Un seul DOM, deux mises en page :
 * chaque jour devient `display: contents` sur ordinateur et ses cases se rangent dans la
 * colonne du jour.
 */
export function WeekGrid({ page, base }: { page: PlannerPage; base: Base }) {
  const days = [...new Set(page.slots.map((s) => s.day))];
  // Une ligne (midi ou soir) sans aucun plat de la semaine reste basse sur ordinateur.
  const emptyRows = new Set(
    (["lunch", "dinner"] as const).filter((slot) => !page.entries.some((e) => e.slot === slot)),
  );
  const unplaced = page.entries.filter((e) => !e.day);
  return (
    <section aria-label="Repas de la semaine" className="flex flex-col gap-6">
      <CloseOpenPanels name={EDIT_PANEL} />
      <nav aria-label="Aller au jour" className="lg:hidden">
        <ul className="grid grid-cols-7 gap-1.5">
          {days.map((day) => {
            const isToday = day === page.today;
            return (
              <li key={day}>
                <a
                  href={`#jour-${day}`}
                  className={[
                    "flex min-h-14 flex-col items-center justify-center rounded-xl border text-xs font-semibold",
                    isToday
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-border bg-surface",
                  ].join(" ")}
                >
                  {formatDay(day).split(" ")[0]!.slice(0, 3)}
                  <span className="font-display text-lg leading-none">
                    {day.slice(8).replace(/^0/, "")}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <ol className="grid gap-6 lg:grid-cols-[5.5rem_repeat(7,minmax(0,1fr))] lg:gap-x-3 lg:gap-y-3">
        <li aria-hidden="true" className="hidden lg:col-start-1 lg:row-start-1 lg:block" />
        {(["lunch", "dinner"] as const).map((slot, i) => (
          <li
            key={slot}
            aria-hidden="true"
            className={`text-muted hidden pt-2 text-sm font-semibold lg:col-start-1 lg:block ${i === 0 ? "lg:row-start-2" : "lg:row-start-3"}`}
          >
            {slot === "lunch" ? "Déjeuner" : "Dîner"}
          </li>
        ))}
        {days.map((day, column) => {
          const isToday = day === page.today;
          const past = day < page.today;
          const col = { gridColumnStart: column + 2 };
          return (
            <li
              key={day}
              id={`jour-${day}`}
              className="flex scroll-mt-20 flex-col gap-2.5 lg:contents"
            >
              <h2
                style={col}
                className={[
                  "flex items-baseline gap-2 lg:row-start-1 lg:flex-col lg:items-center lg:gap-0 lg:rounded-xl lg:px-3 lg:py-2",
                  isToday ? "text-accent-strong lg:bg-accent-soft" : "",
                  past && !isToday ? "text-muted" : "",
                ].join(" ")}
              >
                <span className="text-sm font-semibold">
                  {formatDay(day).split(" ")[0]}
                  {isToday ? <span className="lg:hidden"> · aujourd&apos;hui</span> : null}
                </span>
                <span className="font-display text-2xl leading-none font-semibold">
                  {day.slice(8).replace(/^0/, "")}
                </span>
              </h2>
              {(["lunch", "dinner"] as const).map((slot) => {
                const meals = page.entries.filter((e) => e.day === day && e.slot === slot);
                const rowEmpty = emptyRows.has(slot);
                const planned =
                  page.slots.find((s) => s.value === `${day}:${slot}`)?.planned ?? true;
                return (
                  <div
                    key={slot}
                    style={col}
                    className={`flex flex-col gap-1.5 ${slot === "lunch" ? "lg:row-start-2" : "lg:row-start-3"}`}
                  >
                    <span className="text-muted text-xs font-semibold lg:sr-only">
                      {slot === "lunch" ? "Déjeuner" : "Dîner"}
                    </span>
                    {meals.length ? (
                      meals.map((m) => (
                        <EntryTile
                          key={m.position}
                          entry={m}
                          page={page}
                          base={base}
                          alignEnd={column >= 4}
                        />
                      ))
                    ) : (
                      <PlanActionButton
                        action={addEntryAction}
                        fields={{ ...base, key: page.newKey(), slot: `${day}:${slot}` }}
                        label={`Proposer un plat pour ${formatDay(day)} ${slot === "lunch" ? "midi" : "soir"}`}
                        pendingLabel="…"
                        className={
                          planned
                            ? `border-border-strong text-muted hover:border-accent hover:text-accent-strong hover:bg-surface flex w-full ${rowEmpty ? "min-h-11" : "min-h-14"} items-center justify-center gap-1.5 rounded-xl border border-dashed text-sm font-medium transition-colors lg:flex-1 ${rowEmpty ? "lg:min-h-12" : "lg:min-h-24"}`
                            : `text-muted/80 hover:text-accent-strong hover:border-border-strong flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-transparent text-xs transition-colors lg:flex-1 ${rowEmpty ? "lg:min-h-12" : "lg:min-h-24"}`
                        }
                      >
                        {planned ? (
                          <>
                            <PlusIcon size={20} />
                            <span className="lg:sr-only">Ajouter</span>
                          </>
                        ) : (
                          <>
                            <span>Pas prévu</span>
                            <PlusIcon size={14} />
                          </>
                        )}
                      </PlanActionButton>
                    )}
                  </div>
                );
              })}
            </li>
          );
        })}
      </ol>
      {unplaced.length ? (
        <section aria-labelledby="non-places" className="flex flex-col gap-3">
          <h2 id="non-places" className="type-section">
            Pas encore placés
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {unplaced.map((m) => (
              <li key={m.position}>
                <EntryTile entry={m} page={page} base={base} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function EntryTile({
  entry,
  page,
  base,
  alignEnd = false,
}: {
  entry: PlannerEntryView;
  page: PlannerPage;
  base: Base;
  /** Sur ordinateur, ouvrir le panneau « Modifier » vers la gauche (colonnes de fin de semaine). */
  alignEnd?: boolean;
}) {
  const fields = { ...base, position: entry.position };
  const replacing = page.replace === entry.position;
  const small =
    "border-border bg-surface hover:border-brand inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-medium";

  return (
    <article
      className={[
        "relative flex flex-col gap-2 rounded-xl border p-3 lg:flex-1",
        entry.cooked
          ? "bg-leaf-soft border-transparent"
          : replacing
            ? "bg-surface border-accent"
            : entry.locked
              ? "bg-surface border-brand"
              : "bg-surface border-border",
      ].join(" ")}
    >
      <div className="flex gap-3 lg:flex-col lg:gap-2">
        <div className="size-14 shrink-0 overflow-hidden rounded-lg lg:aspect-[4/3] lg:size-auto lg:w-full">
          <RecipeVisual slug={entry.slug ?? entry.title} title={entry.title} tags={entry.tags} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          {entry.slug ? (
            <Link
              href={`/recipes/${entry.slug}`}
              className="text-[0.9375rem] leading-snug font-semibold hover:underline lg:line-clamp-2 lg:text-sm"
            >
              {entry.favorite ? (
                <HeartIcon
                  size={14}
                  filled
                  className="text-accent-strong mr-1 inline align-[-1px]"
                />
              ) : null}
              {entry.title}
            </Link>
          ) : (
            <span className="text-muted text-sm font-semibold">{entry.title}</span>
          )}
          <span className="text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            {entry.totalMinutes !== null ? (
              <span className="inline-flex items-center gap-1">
                <ClockIcon size={13} /> {entry.totalMinutes} min
              </span>
            ) : null}
            <span>{entry.servings} p.</span>
            {entry.leftover ? (
              <span>déjà compté</span>
            ) : (
              <span>
                {entry.missingNames.length ? "≥ " : "≈ "}
                {formatCents(entry.cents)}
              </span>
            )}
          </span>
          <span className="flex flex-wrap gap-1">
            {entry.cooked ? <Badge tone="leaf">Cuisiné</Badge> : null}
            {entry.leftover ? (
              <Badge tone="soon">
                Reste{entry.leftoverOf ? ` du ${entry.leftoverOf.toLowerCase()}` : ""}
              </Badge>
            ) : null}
            {entry.hasLeftovers && !entry.cooked ? (
              <Badge tone="soon">Cuisiné en double</Badge>
            ) : null}
            {entry.locked && !entry.cooked && !entry.leftover ? (
              <Badge tone="neutral">
                <LockIcon size={12} /> Gardé
              </Badge>
            ) : null}
          </span>
        </div>
      </div>

      {!entry.cooked && !entry.available ? (
        <p className="text-danger text-xs font-medium">
          Ne correspond plus à tes préférences : remplace-le.
        </p>
      ) : null}

      {!entry.cooked ? (
        <details name={EDIT_PANEL} className="group lg:mt-auto">
          <summary className="text-brand flex min-h-9 cursor-pointer list-none items-center gap-1.5 text-sm font-semibold hover:underline [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Modifier</span>
            <span className="hidden items-center gap-1 group-open:inline-flex">
              <CloseIcon size={15} /> Fermer
            </span>
          </summary>
          <div
            className={[
              "flex flex-col gap-3 pt-2",
              // Sur ordinateur : panneau flottant au-dessus de la grille, sans l'étirer.
              "lg:bg-surface lg:border-border lg:absolute lg:top-full lg:z-30 lg:-mt-2 lg:w-72 lg:rounded-2xl lg:border lg:p-4 lg:shadow-xl",
              alignEnd ? "lg:right-0" : "lg:left-0",
            ].join(" ")}
          >
            <p className="hidden text-sm font-semibold lg:block">{entry.title}</p>
            <SlotSelect
              week={base.week}
              version={base.version}
              formKey={page.newKey()}
              position={entry.position}
              value={entry.day && entry.slot ? `${entry.day}:${entry.slot}` : ""}
              title={entry.title}
              options={page.slots.map((s) => ({
                value: s.value,
                label: s.label,
                taken:
                  page.entries.find((e) => e.day && e.slot && `${e.day}:${e.slot}` === s.value)
                    ?.title ?? null,
              }))}
            />
            {entry.leftover ? null : (
              <div
                className="flex items-center justify-between gap-2"
                role="group"
                aria-label="Portions"
              >
                <PlanActionButton
                  action={setServingsAction}
                  fields={{
                    ...fields,
                    servings: Math.max(1, entry.servings - 1),
                    key: page.newKey(),
                  }}
                  label="Une portion de moins"
                  className={iconButtonClasses()}
                >
                  <MinusIcon size={18} />
                </PlanActionButton>
                <span className="text-sm font-semibold tabular-nums">
                  {entry.servings} portion{entry.servings > 1 ? "s" : ""}
                </span>
                <PlanActionButton
                  action={setServingsAction}
                  fields={{
                    ...fields,
                    servings: Math.min(40, entry.servings + 1),
                    key: page.newKey(),
                  }}
                  label="Une portion de plus"
                  className={iconButtonClasses()}
                >
                  <PlusIcon size={18} />
                </PlanActionButton>
              </div>
            )}
            {entry.leftover ? (
              <p className="text-muted text-xs">
                Ses portions sont comptées dans le plat cuisiné en double : rien de plus à acheter.
              </p>
            ) : (
              <PlanActionButton
                action={cookDoubleAction}
                fields={{ ...fields, key: page.newKey() }}
                label={`Cuisiner double : ${entry.title} une fois de plus en restes, au repas libre suivant`}
                className={`${small} justify-start`}
              >
                <PlusIcon size={15} />
                Cuisiner double (restes)
              </PlanActionButton>
            )}
            <div className="flex flex-wrap gap-2">
              {entry.leftover ? null : (
                <PlanActionButton
                  action={toggleLockAction}
                  fields={{ ...fields, key: page.newKey() }}
                  label={
                    entry.locked
                      ? "Ne plus garder ce plat"
                      : "Garder ce plat si je génère à nouveau"
                  }
                  className={`${small} ${entry.locked ? "border-brand bg-brand-soft" : ""}`}
                >
                  <LockIcon size={15} />
                  {entry.locked ? "Gardé" : "Garder"}
                </PlanActionButton>
              )}
              {entry.leftover ? null : (
                <Link
                  href={
                    replacing
                      ? `/planner?semaine=${page.weekStart}`
                      : `/planner?semaine=${page.weekStart}&remplacer=${entry.position}#remplacer`
                  }
                  className={small}
                >
                  {replacing ? "Annuler" : "Remplacer"}
                </Link>
              )}
              <PlanActionButton
                action={removeEntryAction}
                fields={{ ...fields, key: page.newKey() }}
                label={`Retirer ${entry.title} du menu`}
                className={`${small} text-danger`}
              >
                Retirer
              </PlanActionButton>
            </div>
          </div>
        </details>
      ) : null}
    </article>
  );
}
