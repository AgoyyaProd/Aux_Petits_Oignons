import Link from "next/link";
import type { ReactNode } from "react";
import { PickButton } from "@/components/planner/recipe-picker";
import { SideCookButton } from "@/components/planner/side-cook-button";
import { RecipeVisual } from "@/components/recipes/recipe-visual";
import { Badge } from "@/components/ui/badge";
import { buttonClasses, iconButtonClasses } from "@/components/ui/button";
import { ClockIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { formatCents } from "@/domain/money";
import {
  removeSideAction,
  updateSideServingsAction,
} from "@/server/modules/planning/sides-actions";
import type { PlannerPage, PlannerSideView } from "@/server/modules/planning/queries";

/**
 * « À côté » : pain, brioche, gâteau… préparés en plus des repas. Ils ne comptent pas dans les
 * repas du menu ; leurs ingrédients partent sur la liste de courses avec ceux des plats.
 */
export function SidesSection({ page }: { page: PlannerPage }) {
  const { sides } = page;
  const toCook = sides.filter((s) => !s.cooked);
  const missing = sides.some((s) => s.missingNames.length > 0);
  const validated = page.plan?.hasValidated ?? false;

  return (
    <section aria-labelledby="a-cote-titre" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="a-cote-titre" className="type-section">
            À côté
          </h2>
          <p className="text-muted text-sm">
            {sides.length
              ? `${sides.length} recette${sides.length > 1 ? "s" : ""} en plus des repas · ${missing ? "≥ " : "≈ "}${formatCents(page.totals.sidesCents)}`
              : "Un pain, une brioche, un gâteau… à préparer en plus des repas de la semaine."}
          </p>
        </div>
        <PickButton
          target={{ mode: "side" }}
          label="Ajouter une recette à côté des repas"
          className={buttonClasses("secondary", "min-h-10 px-4")}
        >
          <PlusIcon size={18} />
          Ajouter
        </PickButton>
      </div>

      {sides.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sides.map((s) => (
            <li key={s.id}>
              <SideRow side={s} formKey={page.newKey()} />
            </li>
          ))}
        </ul>
      ) : null}

      {toCook.length && !validated ? (
        <p className="text-muted text-xs">
          Ces recettes arriveront sur ta liste de courses dès que le menu de la semaine sera validé.
        </p>
      ) : null}
    </section>
  );
}

function SideRow({ side, formKey }: { side: PlannerSideView; formKey: string }) {
  return (
    <article
      className={[
        "flex min-w-0 items-start gap-3 rounded-xl border p-2",
        side.cooked ? "bg-leaf-soft border-transparent" : "bg-surface border-border",
      ].join(" ")}
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg">
        <RecipeVisual slug={side.slug ?? side.title} title={side.title} tags={side.tags} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {side.slug ? (
          <Link
            href={`/recipes/${side.slug}`}
            className="line-clamp-2 text-sm leading-snug font-semibold hover:underline"
          >
            {side.title}
          </Link>
        ) : (
          <span className="text-muted text-sm font-semibold">{side.title}</span>
        )}
        <span className="text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          {side.totalMinutes !== null ? (
            <span className="inline-flex items-center gap-1">
              <ClockIcon size={12} /> {duration(side.totalMinutes)}
            </span>
          ) : null}
          {side.cooked ? <span>{side.servings} p.</span> : null}
          <span>
            {side.missingNames.length ? "≥ " : "≈ "}
            {formatCents(side.cents)}
          </span>
        </span>
        {side.cooked ? (
          <span>
            <Badge tone="leaf">Prêt</Badge>
          </span>
        ) : (
          <>
            <Servings side={side} />
            <SideCookButton sideId={side.id} servings={side.servings} formKey={formKey} />
          </>
        )}
      </div>
      <form action={removeSideAction} className="shrink-0">
        <input type="hidden" name="id" value={side.id} />
        <button
          type="submit"
          aria-label={`Retirer « ${side.title} »`}
          title="Retirer"
          className={iconButtonClasses("text-muted hover:text-danger size-9!")}
        >
          <TrashIcon size={16} />
        </button>
      </form>
    </article>
  );
}

/** Nombre de parts, à l'unité (1 à 40). */
function Servings({ side }: { side: PlannerSideView }) {
  const step = (n: number, label: string, icon: ReactNode) => (
    <form action={updateSideServingsAction}>
      <input type="hidden" name="id" value={side.id} />
      <input type="hidden" name="servings" value={n} />
      <button
        type="submit"
        disabled={n < 1 || n > 40}
        aria-label={label}
        className={iconButtonClasses("size-7!")}
      >
        {icon}
      </button>
    </form>
  );
  return (
    <div className="flex items-center gap-2 text-xs">
      {step(side.servings - 1, "Une part de moins", <MinusIcon size={12} />)}
      <span className="min-w-12 text-center font-semibold tabular-nums">
        {side.servings} part{side.servings > 1 ? "s" : ""}
      </span>
      {step(side.servings + 1, "Une part de plus", <PlusIcon size={12} />)}
    </div>
  );
}

/** « 45 min », « 3 h 10 » : une brioche repose toute une nuit. */
function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${String(minutes % 60).padStart(2, "0")}` : ""}`;
}
