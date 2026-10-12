"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { formatRecipeQuantity } from "@/lib/format-quantity";
import { StepTimerButtons, useKitchen } from "@/components/recipes/kitchen";
import {
  addExtraAction,
  addManyExtrasAction,
  type ExtraState,
} from "@/server/modules/shopping/actions";
import type { RecipeDetail } from "@/server/modules/recipes/queries";

type Ingredient = RecipeDetail["ingredients"][number];
const idle: ExtraState = { status: "idle" };

export function qty(item: Ingredient, servings: number, base: number) {
  return item.quantity && item.unit
    ? formatRecipeQuantity(item.quantity, item.unit, servings, base)
    : "au goût";
}

/**
 * Corps de la fiche recette : onglets Ingrédients / Étapes, portions ajustables (calcul exact
 * côté domaine), « + » pour ajouter un ingrédient manquant à la liste de courses, et
 * « Tout ajouter ». Les ajouts sont des articles à part : jamais fusionnés avec la liste
 * calculée du menu.
 */
export function RecipeBody({
  recipeId,
  ingredients,
  steps,
  stepDetails,
  baseServings,
  inMenu,
}: {
  recipeId: string;
  ingredients: Ingredient[];
  steps: string[];
  stepDetails: RecipeDetail["stepDetails"];
  baseServings: number;
  /** La recette est au menu : ses ingrédients sont déjà dans la liste calculée. */
  inMenu: boolean;
}) {
  const [tab, setTab] = useState<"ingredients" | "steps">("ingredients");
  // Portions partagées avec le mode cuisine et les étapes (voir KitchenProvider).
  const { servings, setServings } = useKitchen();
  const required = ingredients.filter((i) => !i.optional);
  const optional = ingredients.filter((i) => i.optional);
  const missing = required.filter((i) => !i.inStock);
  const [allState, addAll, addingAll] = useActionState(addManyExtrasAction, idle);

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Recette" className="border-border flex gap-6 border-b">
        {(
          [
            ["ingredients", "Ingrédients"],
            ["steps", "Étapes"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={[
              "-mb-px min-h-12 border-b-2 text-[0.9375rem] font-semibold transition-colors",
              tab === id
                ? "border-accent text-accent-strong"
                : "text-muted hover:text-foreground border-transparent",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "ingredients" ? (
        <div
          role="tabpanel"
          id="panel-ingredients"
          aria-labelledby="tab-ingredients"
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
        >
          <section className="flex flex-col gap-4" aria-label="Ingrédients">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted text-sm">
                {missing.length === 0
                  ? "Tout est chez toi."
                  : `${required.length - missing.length} sur ${required.length} chez toi.`}
              </p>
              <div className="flex items-center gap-2" role="group" aria-label="Nombre de portions">
                <StepButton
                  label="Une portion de moins"
                  disabled={servings <= 1}
                  onClick={() => setServings(Math.max(1, servings - 1))}
                >
                  <MinusIcon size={18} />
                </StepButton>
                <output aria-live="polite" className="min-w-28 text-center text-sm font-semibold">
                  {servings} personne{servings > 1 ? "s" : ""}
                </output>
                <StepButton
                  label="Une portion de plus"
                  disabled={servings >= 20}
                  onClick={() => setServings(Math.min(20, servings + 1))}
                >
                  <PlusIcon size={18} />
                </StepButton>
              </div>
            </div>
            <IngredientRows
              items={required}
              servings={servings}
              base={baseServings}
              recipeId={recipeId}
              canAdd={!inMenu}
            />
            {optional.length ? (
              <>
                <h3 className="text-muted text-sm font-semibold">Facultatif</h3>
                <IngredientRows
                  items={optional}
                  servings={servings}
                  base={baseServings}
                  recipeId={recipeId}
                  canAdd={!inMenu}
                />
              </>
            ) : null}
          </section>

          <aside className="bg-surface-muted flex flex-col gap-3 rounded-2xl p-5">
            <p className="font-display text-lg font-semibold">Ajouter à ma liste de courses</p>
            {inMenu ? (
              <p className="text-muted text-sm leading-relaxed">
                Cette recette est au menu : ses ingrédients manquants sont déjà dans ta liste de
                courses.
              </p>
            ) : missing.length === 0 ? (
              <p className="text-muted text-sm">Rien à acheter : tout est chez toi.</p>
            ) : (
              <form action={addAll} className="flex flex-col gap-3">
                <input type="hidden" name="recipeId" value={recipeId} />
                <input
                  type="hidden"
                  name="items"
                  value={JSON.stringify(
                    missing.map((i) => ({
                      ingredientId: i.ingredientId,
                      label: i.name,
                      quantity: qty(i, servings, baseServings).slice(0, 40),
                    })),
                  )}
                />
                <p className="text-muted text-sm">
                  {missing.length} ingrédient{missing.length > 1 ? "s" : ""} manquant
                  {missing.length > 1 ? "s" : ""} pour {servings} personne
                  {servings > 1 ? "s" : ""}.
                </p>
                <Button type="submit" variant="forest" disabled={addingAll}>
                  {addingAll ? "Ajout…" : "Tout ajouter"}
                </Button>
                <p aria-live="polite" className="text-sm font-medium">
                  {allState.message ?? ""}
                </p>
              </form>
            )}
            <Link
              href="/shopping"
              className="text-accent-strong text-sm font-semibold hover:underline"
            >
              Voir ma liste
            </Link>
          </aside>
        </div>
      ) : (
        <section role="tabpanel" id="panel-steps" aria-labelledby="tab-steps" className="max-w-3xl">
          <p className="text-muted mb-5 text-sm">
            Quantités pour {servings} personne{servings > 1 ? "s" : ""}. Touche une durée pour
            lancer un minuteur.
          </p>
          <ol className="flex flex-col gap-7">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="bg-accent-soft text-accent-strong flex size-9 shrink-0 items-center justify-center rounded-full font-semibold"
                >
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-3 pt-1.5">
                  <p className="leading-relaxed">{step}</p>
                  <StepIngredients
                    ids={stepDetails[i]?.ingredientIds ?? []}
                    ingredients={ingredients}
                    servings={servings}
                    base={baseServings}
                  />
                  <StepTimerButtons step={i + 1} timers={stepDetails[i]?.timers ?? []} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/** Ingrédients utilisés à une étape, avec leur quantité pour le nombre de portions choisi. */
export function StepIngredients({
  ids,
  ingredients,
  servings,
  base,
  size = "md",
}: {
  ids: string[];
  ingredients: Ingredient[];
  servings: number;
  base: number;
  size?: "md" | "lg";
}) {
  const items = ids.flatMap((id) => {
    const item = ingredients.find((x) => x.ingredientId === id);
    return item ? [item] : [];
  });
  if (!items.length) return null;
  return (
    <ul aria-label="Ingrédients de l'étape" className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item.ingredientId}
          className={[
            "bg-surface-muted inline-flex items-baseline gap-1.5 rounded-lg",
            size === "lg" ? "px-3.5 py-2 text-base" : "px-2.5 py-1 text-sm",
          ].join(" ")}
        >
          <span className="font-semibold tabular-nums">{qty(item, servings, base)}</span>
          <span className="text-muted">{item.name}</span>
        </li>
      ))}
    </ul>
  );
}

function IngredientRows({
  items,
  servings,
  base,
  recipeId,
  canAdd,
}: {
  items: Ingredient[];
  servings: number;
  base: number;
  recipeId: string;
  canAdd: boolean;
}) {
  return (
    <ul className="border-border bg-surface divide-border divide-y rounded-2xl border">
      {items.map((item) => (
        <li key={item.ingredientId} className="flex min-h-14 items-center gap-3 px-4 py-2">
          <span
            aria-hidden="true"
            className={[
              "flex size-7 shrink-0 items-center justify-center rounded-full",
              item.inStock ? "bg-leaf-soft text-success" : "bg-accent-soft text-accent-strong",
            ].join(" ")}
          >
            {item.inStock ? (
              <CheckIcon size={15} strokeWidth={2.4} />
            ) : (
              <span className="bg-accent size-2.5 rounded-full" />
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <Link
              href={`/ingredients/${item.ingredientId}`}
              className="font-medium hover:underline"
            >
              {item.name}
            </Link>
            <span className="text-muted text-xs">
              {item.inStock ? (item.inCupboard ? "Dans ton placard" : "Chez toi") : "À acheter"}
              {item.note ? `, ${item.note}` : ""}
            </span>
          </span>
          <span className="shrink-0 text-sm font-semibold tabular-nums">
            {qty(item, servings, base)}
          </span>
          {canAdd && !item.inStock ? (
            <AddOne item={item} quantity={qty(item, servings, base)} recipeId={recipeId} />
          ) : (
            <span className="size-11 shrink-0" aria-hidden="true" />
          )}
        </li>
      ))}
    </ul>
  );
}

function AddOne({
  item,
  quantity,
  recipeId,
}: {
  item: Ingredient;
  quantity: string;
  recipeId: string;
}) {
  const [state, action, pending] = useActionState(addExtraAction, idle);
  const done = state.status === "success";
  return (
    <form action={action}>
      <input type="hidden" name="label" value={item.name} />
      <input type="hidden" name="quantity" value={quantity.slice(0, 40)} />
      <input type="hidden" name="ingredientId" value={item.ingredientId} />
      <input type="hidden" name="recipeId" value={recipeId} />
      <button
        type="submit"
        disabled={pending || done}
        aria-label={
          done ? `${item.name} est sur la liste` : `Ajouter ${item.name} à la liste de courses`
        }
        title={state.message}
        className={[
          "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
          done ? "bg-leaf-soft text-success" : "bg-forest text-cream hover:bg-forest/90",
        ].join(" ")}
      >
        {done ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
      </button>
    </form>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="border-border bg-surface hover:border-forest flex size-11 items-center justify-center rounded-full border disabled:opacity-40"
    >
      {children}
    </button>
  );
}
