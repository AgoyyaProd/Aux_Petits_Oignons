"use client";

import { useState } from "react";
import { formatRecipeQuantity } from "@/lib/format-quantity";
import type { RecipeDetail } from "@/server/modules/recipes/queries";

/** Liste des ingrédients avec ajustement des portions (calcul exact côté domaine). */
export function RecipeIngredients({
  ingredients,
  baseServings,
}: {
  ingredients: RecipeDetail["ingredients"];
  baseServings: number;
}) {
  const [servings, setServings] = useState(baseServings);
  const required = ingredients.filter((i) => !i.optional);
  const optional = ingredients.filter((i) => i.optional);
  const have = required.filter((i) => i.inStock).length;

  return (
    <section aria-labelledby="ingredients-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="ingredients-title" className="type-section">
            Ingrédients
          </h2>
          <p className="text-muted text-sm">
            {have === required.length
              ? "Tout est chez toi."
              : `${have} sur ${required.length} chez toi, ${required.length - have} à acheter.`}
          </p>
        </div>
        <div className="flex items-center gap-2" role="group" aria-label="Nombre de portions">
          <StepButton
            label="Une portion de moins"
            disabled={servings <= 1}
            onClick={() => setServings((s) => Math.max(1, s - 1))}
          >
            −
          </StepButton>
          <output
            aria-live="polite"
            className="min-w-24 text-center text-sm font-semibold tabular-nums"
          >
            {servings} portion{servings > 1 ? "s" : ""}
          </output>
          <StepButton
            label="Une portion de plus"
            disabled={servings >= 20}
            onClick={() => setServings((s) => Math.min(20, s + 1))}
          >
            +
          </StepButton>
        </div>
      </div>

      <IngredientList items={required} servings={servings} baseServings={baseServings} />
      {optional.length > 0 ? (
        <>
          <h3 className="text-muted mt-1 text-sm font-semibold">Facultatif</h3>
          <IngredientList items={optional} servings={servings} baseServings={baseServings} />
        </>
      ) : null}
    </section>
  );
}

function IngredientList({
  items,
  servings,
  baseServings,
}: {
  items: RecipeDetail["ingredients"];
  servings: number;
  baseServings: number;
}) {
  return (
    <ul className="border-border bg-surface divide-border divide-y rounded-2xl border">
      {items.map((item) => (
        <li key={item.ingredientId} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className={[
                "size-2.5 shrink-0 rounded-full",
                item.inStock ? "bg-leaf" : item.optional ? "bg-border-strong" : "bg-accent",
              ].join(" ")}
            />
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{item.name}</span>
              {item.note ? <span className="text-muted text-xs">{item.note}</span> : null}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold tabular-nums">
              {item.quantity && item.unit
                ? formatRecipeQuantity(item.quantity, item.unit, servings, baseServings)
                : "au goût"}
            </span>
            <span
              className={[
                "w-16 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold",
                item.inStock
                  ? "bg-leaf-soft text-success"
                  : item.optional
                    ? "text-muted"
                    : "bg-accent-soft text-accent-strong",
              ].join(" ")}
              title={item.inCupboard ? "Coché dans ton placard" : undefined}
            >
              {item.inStock
                ? item.inCupboard
                  ? "placard"
                  : "chez toi"
                : item.optional
                  ? ""
                  : "à acheter"}
            </span>
          </div>
        </li>
      ))}
    </ul>
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
      className="border-border bg-surface hover:border-brand flex size-11 items-center justify-center rounded-full border text-lg disabled:opacity-40"
    >
      {children}
    </button>
  );
}
