"use client";

import { useOptimistic, useTransition } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { toggleCheckAction } from "@/server/modules/shopping/actions";

/**
 * Article de la liste : toute la ligne est la zone tactile (mode magasin, une main).
 * La case est mise à jour immédiatement à l'écran puis enregistrée.
 */
export function CheckLine({
  week,
  ingredientId,
  dimension,
  checked,
  children,
}: {
  week: string;
  ingredientId: string;
  dimension: string;
  checked: boolean;
  children: React.ReactNode;
}) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [, startTransition] = useTransition();

  return (
    <label className="flex min-h-16 cursor-pointer items-center gap-4 py-3">
      <input
        type="checkbox"
        checked={optimistic}
        onChange={(e) => {
          const next = e.currentTarget.checked;
          const data = new FormData();
          data.set("week", week);
          data.set("ingredientId", ingredientId);
          data.set("dimension", dimension);
          data.set("checked", String(next));
          startTransition(async () => {
            setOptimistic(next);
            await toggleCheckAction(data);
          });
        }}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={[
          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          "peer-focus-visible:outline-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
          optimistic
            ? "border-brand bg-brand text-brand-foreground"
            : "border-border-strong bg-surface",
        ].join(" ")}
      >
        {optimistic ? <CheckIcon size={16} strokeWidth={2.5} /> : null}
      </span>
      <span
        className={`flex min-w-0 flex-1 flex-col gap-0.5 transition-opacity ${optimistic ? "opacity-50 [&_.item-name]:line-through" : ""}`}
      >
        {children}
      </span>
    </label>
  );
}
