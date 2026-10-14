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
  MoreIcon,
  PlusIcon,
  SearchIcon,
  ShuffleIcon,
} from "@/components/ui/icons";
import { formatCents } from "@/domain/money";
import { formatDay } from "@/lib/week";
import {
  addEntryAction,
  changeEntryAction,
  cookDoubleAction,
  removeEntryAction,
  setServingsAction,
  toggleLockAction,
} from "@/server/modules/planning/actions";
import type { PlannerEntryView, PlannerPage } from "@/server/modules/planning/queries";
import { CloseOpenPanels } from "./close-open-panels";
import { PickButton } from "./recipe-picker";

/** Semaine affichée et version vue (« d3 » brouillon, « p2 » menu validé). */
export type Base = { week: string; version: string };

type Slot = "lunch" | "dinner";
const SLOT_LABEL: Record<Slot, string> = { lunch: "Déjeuner", dinner: "Dîner" };
const EDIT_PANEL = "modifier-plat";

/**
 * La semaine.
 *  - Ordinateur : grille jours × repas, avec seulement les lignes utiles (une semaine « le
 *    soir seulement » n'affiche pas une ligne de midis vides).
 *  - Téléphone : une carte par jour, les repas les uns sous les autres.
 * Chaque plat a un bouton « Changer » (tirage au hasard, à répéter à volonté) et un panneau
 * « Modifier » (jour, portions, restes, garder, retirer).
 */
export function WeekGrid({ page, base }: { page: PlannerPage; base: Base }) {
  const days = [...new Set(page.slots.map((s) => s.day))];
  const rows = (["lunch", "dinner"] as const).filter(
    (slot) =>
      page.entries.some((e) => e.slot === slot) ||
      page.slots.some((s) => s.planned && s.value.endsWith(`:${slot}`)),
  );
  const shown: Slot[] = rows.length ? rows : ["dinner"];
  const unplaced = page.entries.filter((e) => !e.day);
  const hiddenLunch = !shown.includes("lunch");

  return (
    <section aria-label="Repas de la semaine" className="flex flex-col gap-5">
      <CloseOpenPanels name={EDIT_PANEL} />

      {/* Ordinateur */}
      <div
        className="hidden gap-3 lg:grid"
        style={{ gridTemplateColumns: `5.5rem repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div />
        {days.map((day) => (
          <DayHeader key={day} day={day} today={page.today} />
        ))}
        {shown.map((slot) => (
          <Row key={slot} slot={slot} days={days} page={page} base={base} />
        ))}
      </div>

      {/* Téléphone */}
      <ol className="flex flex-col gap-3 lg:hidden">
        {days.map((day) => (
          <MobileDay key={day} day={day} slots={shown} page={page} base={base} />
        ))}
      </ol>

      {hiddenLunch ? (
        <p className="text-muted text-xs">
          Les midis ne sont pas prévus dans ta semaine type.{" "}
          <Link href="/settings#semaine" className="text-brand font-semibold underline">
            Modifier ma semaine de repas
          </Link>
        </p>
      ) : null}

      {unplaced.length ? (
        <section aria-labelledby="non-places" className="flex flex-col gap-3">
          <h2 id="non-places" className="type-section">
            Pas encore placés
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {unplaced.map((m) => (
              <li key={m.position}>
                <EntryCard entry={m} page={page} base={base} layout="row" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function DayHeader({ day, today }: { day: string; today: string }) {
  const isToday = day === today;
  const past = day < today;
  return (
    <h2
      className={[
        "flex flex-col items-center rounded-xl py-2",
        isToday ? "bg-accent-soft text-accent-strong" : past ? "text-muted" : "",
      ].join(" ")}
    >
      <span className="text-xs font-semibold tracking-wide uppercase">
        {formatDay(day).split(" ")[0]!.slice(0, 3)}
      </span>
      <span className="font-display text-2xl leading-none font-semibold">
        {day.slice(8).replace(/^0/, "")}
      </span>
    </h2>
  );
}

function Row({
  slot,
  days,
  page,
  base,
}: {
  slot: Slot;
  days: string[];
  page: PlannerPage;
  base: Base;
}) {
  return (
    <>
      <div className="text-muted pt-3 text-sm font-semibold">{SLOT_LABEL[slot]}</div>
      {days.map((day, column) => {
        const meals = page.entries.filter((e) => e.day === day && e.slot === slot);
        return (
          <div key={day} className="flex min-w-0 flex-col gap-2">
            {meals.length ? (
              meals.map((m) => (
                <EntryCard
                  key={m.position}
                  entry={m}
                  page={page}
                  base={base}
                  layout="tile"
                  alignEnd={column >= 4}
                />
              ))
            ) : (
              <EmptySlot day={day} slot={slot} page={page} base={base} />
            )}
          </div>
        );
      })}
    </>
  );
}

function MobileDay({
  day,
  slots,
  page,
  base,
}: {
  day: string;
  slots: Slot[];
  page: PlannerPage;
  base: Base;
}) {
  const isToday = day === page.today;
  const past = day < page.today;
  const [weekday, ...rest] = formatDay(day).split(" ");
  return (
    <li
      id={`jour-${day}`}
      className={[
        "bg-surface flex scroll-mt-20 flex-col gap-3 rounded-2xl border p-3",
        isToday ? "border-accent" : "border-border",
        past && !isToday ? "opacity-80" : "",
      ].join(" ")}
    >
      <h2 className="flex items-baseline gap-2">
        <span className={`font-semibold ${isToday ? "text-accent-strong" : ""}`}>{weekday}</span>
        <span className="text-muted text-sm">{rest.join(" ")}</span>
        {isToday ? (
          <span className="bg-accent-soft text-accent-strong ml-auto rounded-full px-2 py-0.5 text-xs font-semibold">
            Aujourd&apos;hui
          </span>
        ) : null}
      </h2>
      {slots.map((slot) => {
        const meals = page.entries.filter((e) => e.day === day && e.slot === slot);
        const planned = page.slots.find((s) => s.value === `${day}:${slot}`)?.planned ?? true;
        if (!meals.length && !planned) return null;
        return (
          <div key={slot} className="flex flex-col gap-1.5">
            {slots.length > 1 ? (
              <span className="text-muted text-xs font-semibold">{SLOT_LABEL[slot]}</span>
            ) : null}
            {meals.length ? (
              meals.map((m) => (
                <EntryCard key={m.position} entry={m} page={page} base={base} layout="row" />
              ))
            ) : (
              <EmptySlot day={day} slot={slot} page={page} base={base} />
            )}
          </div>
        );
      })}
    </li>
  );
}

/**
 * Case vide d'un repas prévu : un plat au hasard, ou « Chercher » pour le choisir soi-même.
 * Repas non prévu : un « Ajouter » discret.
 */
function EmptySlot({
  day,
  slot,
  page,
  base,
}: {
  day: string;
  slot: Slot;
  page: PlannerPage;
  base: Base;
}) {
  const planned = page.slots.find((s) => s.value === `${day}:${slot}`)?.planned ?? true;
  const when = `${formatDay(day)} ${slot === "lunch" ? "midi" : "soir"}`;
  const random = (
    <PlanActionButton
      action={addEntryAction}
      fields={{ ...base, key: page.newKey(), slot: `${day}:${slot}` }}
      label={`Proposer un plat au hasard pour ${when}`}
      pendingLabel="Tirage…"
      className={
        planned
          ? "hover:text-accent-strong flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium"
          : "text-muted hover:text-accent-strong hover:border-border-strong focus-visible:border-border-strong flex min-h-12 w-full items-center justify-center gap-1 rounded-xl border border-transparent text-xs opacity-0 transition hover:opacity-100 focus-visible:opacity-100 lg:min-h-40"
      }
    >
      {planned ? <ShuffleIcon size={17} /> : <PlusIcon size={14} />}
      {planned ? "Au hasard" : "Ajouter"}
    </PlanActionButton>
  );
  if (!planned) return random;
  return (
    <div className="border-border-strong text-muted flex min-h-12 w-full items-center justify-center gap-1 rounded-xl border border-dashed text-sm lg:min-h-40 lg:flex-col">
      {random}
      <PickButton
        target={{ mode: "add", slot: `${day}:${slot}`, label: when }}
        label={`Chercher un plat pour ${when}`}
        className="hover:text-brand flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium"
      >
        <SearchIcon size={17} />
        Chercher
      </PickButton>
    </div>
  );
}

/** Bouton « Changer » : un autre plat tiré au hasard, à répéter tant qu'on veut. */
function ChangeButton({
  entry,
  page,
  base,
  compact,
}: {
  entry: PlannerEntryView;
  page: PlannerPage;
  base: Base;
  compact?: boolean;
}) {
  return (
    <PlanActionButton
      action={changeEntryAction}
      fields={{ ...base, position: entry.position, key: page.newKey() }}
      label={`Changer « ${entry.title} » : un autre plat au hasard`}
      pendingLabel={compact ? "…" : "Tirage…"}
      className={
        compact
          ? iconButtonClasses("text-accent-strong hover:border-accent")
          : "bg-surface/95 text-accent-strong hover:bg-surface inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold shadow-sm backdrop-blur"
      }
    >
      <ShuffleIcon size={compact ? 19 : 16} />
      {compact ? null : "Changer"}
    </PlanActionButton>
  );
}

/** Bouton « Chercher » : choisir soi-même le plat qui remplace celui-ci. */
function SearchButton({ entry, compact }: { entry: PlannerEntryView; compact?: boolean }) {
  return (
    <PickButton
      target={{ mode: "replace", position: entry.position, title: entry.title }}
      label={`Chercher un plat pour remplacer « ${entry.title} »`}
      className={
        compact
          ? iconButtonClasses("text-brand hover:border-brand")
          : "text-brand inline-flex min-h-8 items-center gap-1 text-xs font-semibold hover:underline"
      }
    >
      <SearchIcon size={compact ? 19 : 13} />
      {compact ? null : "Chercher"}
    </PickButton>
  );
}

function EntryCard({
  entry,
  page,
  base,
  layout,
  alignEnd = false,
}: {
  entry: PlannerEntryView;
  page: PlannerPage;
  base: Base;
  /** tile : vignette de la grille (ordinateur) ; row : ligne (téléphone, non placés). */
  layout: "tile" | "row";
  /** Ouvrir le panneau « Modifier » vers la gauche (colonnes de fin de semaine). */
  alignEnd?: boolean;
}) {
  const canChange = !entry.cooked && !entry.leftover;
  const tile = layout === "tile";
  return (
    <article
      className={[
        "relative flex min-w-0 rounded-xl border",
        tile ? "flex-col" : "items-center gap-3 p-2",
        entry.cooked
          ? "bg-leaf-soft border-transparent"
          : entry.locked
            ? "bg-surface border-brand"
            : "bg-surface border-border",
      ].join(" ")}
    >
      <div
        className={
          tile
            ? "relative aspect-[4/3] w-full overflow-hidden rounded-t-xl"
            : "relative size-16 shrink-0 overflow-hidden rounded-lg"
        }
      >
        <RecipeVisual slug={entry.slug ?? entry.title} title={entry.title} tags={entry.tags} />
        {tile && canChange ? (
          <div className="absolute top-1.5 right-1.5">
            <ChangeButton entry={entry} page={page} base={base} />
          </div>
        ) : null}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col gap-1 ${tile ? "p-2.5" : ""}`}>
        {entry.slug ? (
          <Link
            href={`/recipes/${entry.slug}`}
            className="line-clamp-2 text-sm leading-snug font-semibold hover:underline"
          >
            {entry.favorite ? (
              <HeartIcon size={13} filled className="text-accent-strong mr-1 inline align-[-1px]" />
            ) : null}
            {entry.title}
          </Link>
        ) : (
          <span className="text-muted text-sm font-semibold">{entry.title}</span>
        )}
        <span className="text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          {entry.totalMinutes !== null ? (
            <span className="inline-flex items-center gap-1">
              <ClockIcon size={12} /> {entry.totalMinutes} min
            </span>
          ) : null}
          <span>{entry.servings} p.</span>
          {entry.leftover ? null : (
            <span>
              {entry.missingNames.length ? "≥ " : "≈ "}
              {formatCents(entry.cents)}
            </span>
          )}
        </span>
        <EntryBadges entry={entry} short={tile} />
        {!entry.cooked && !entry.available ? (
          <p className="text-danger text-xs font-medium">
            Ne correspond plus à tes préférences : change-le.
          </p>
        ) : null}
        {tile && !entry.cooked ? (
          <div className="mt-auto flex flex-wrap items-start gap-x-3 pt-1">
            <EditPanel entry={entry} page={page} base={base} alignEnd={alignEnd} />
            {canChange ? <SearchButton entry={entry} /> : null}
          </div>
        ) : null}
      </div>

      {!tile && !entry.cooked ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {canChange ? <SearchButton entry={entry} compact /> : null}
          {canChange ? <ChangeButton entry={entry} page={page} base={base} compact /> : null}
          <EditPanel entry={entry} page={page} base={base} compact alignEnd />
        </div>
      ) : null}
    </article>
  );
}

function EntryBadges({ entry, short }: { entry: PlannerEntryView; short?: boolean }) {
  const badges = [
    entry.cooked ? (
      <Badge key="c" tone="leaf">
        Cuisiné
      </Badge>
    ) : null,
    entry.leftover ? (
      <Badge key="r" tone="soon">
        {short || !entry.leftoverOf ? "Reste" : `Reste du ${entry.leftoverOf.toLowerCase()}`}
      </Badge>
    ) : null,
    entry.hasLeftovers && !entry.cooked ? (
      <Badge key="d" tone="soon">
        {short ? "En double" : "Cuisiné en double"}
      </Badge>
    ) : null,
    entry.locked && !entry.cooked && !entry.leftover ? (
      <Badge key="g" tone="neutral">
        <LockIcon size={12} /> Gardé
      </Badge>
    ) : null,
  ].filter(Boolean);
  return badges.length ? <span className="flex flex-wrap gap-1">{badges}</span> : null;
}

/** Panneau « Modifier » : jour, portions, restes, garder, retirer. */
function EditPanel({
  entry,
  page,
  base,
  alignEnd,
  compact,
}: {
  entry: PlannerEntryView;
  page: PlannerPage;
  base: Base;
  alignEnd: boolean;
  compact?: boolean;
}) {
  const fields = { ...base, position: entry.position };
  const small =
    "border-border bg-surface hover:border-brand inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-medium";
  return (
    <details name={EDIT_PANEL} className="group">
      <summary
        aria-label={`Modifier ${entry.title}`}
        className={
          compact
            ? `${iconButtonClasses()} cursor-pointer list-none [&::-webkit-details-marker]:hidden`
            : "text-brand flex min-h-8 cursor-pointer list-none items-center gap-1 text-xs font-semibold hover:underline [&::-webkit-details-marker]:hidden"
        }
      >
        {compact ? (
          <>
            <MoreIcon size={18} className="group-open:hidden" />
            <CloseIcon size={18} className="hidden group-open:block" />
          </>
        ) : (
          <>
            <span className="group-open:hidden">Modifier</span>
            <span className="hidden items-center gap-1 group-open:inline-flex">
              <CloseIcon size={14} /> Fermer
            </span>
          </>
        )}
      </summary>
      <div
        className={[
          "bg-surface border-border absolute top-full z-30 mt-2 flex w-[min(18rem,calc(100vw-2rem))] flex-col gap-3 rounded-2xl border p-4 shadow-xl",
          alignEnd ? "right-0" : "left-0",
        ].join(" ")}
      >
        <p className="text-sm font-semibold">{entry.title}</p>
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
        {entry.leftover ? (
          <p className="text-muted text-xs">
            Ses portions sont comptées dans le plat cuisiné en double : rien de plus à acheter.
          </p>
        ) : (
          <>
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
            <PlanActionButton
              action={cookDoubleAction}
              fields={{ ...fields, key: page.newKey() }}
              label={`Cuisiner double : ${entry.title} une fois de plus en restes, au repas libre suivant`}
              className={`${small} justify-start`}
            >
              <PlusIcon size={15} />
              Cuisiner double (restes)
            </PlanActionButton>
          </>
        )}
        <div className="flex flex-wrap gap-2">
          {entry.leftover ? null : (
            <PlanActionButton
              action={toggleLockAction}
              fields={{ ...fields, key: page.newKey() }}
              label={
                entry.locked ? "Ne plus garder ce plat" : "Garder ce plat si je génère à nouveau"
              }
              className={`${small} ${entry.locked ? "border-brand bg-brand-soft" : ""}`}
            >
              <LockIcon size={15} />
              {entry.locked ? "Gardé" : "Garder"}
            </PlanActionButton>
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
  );
}
