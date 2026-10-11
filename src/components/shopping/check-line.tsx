"use client";

import { useOptimistic, useTransition } from "react";
import { toggleCheckAction } from "@/server/modules/shopping/actions";

/** Case « dans le panier », mise à jour immédiatement à l'écran puis enregistrée. */
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
    <label className="flex min-h-12 cursor-pointer items-start gap-3 py-2">
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
        className="accent-brand mt-0.5 size-5 shrink-0"
      />
      <span
        className={`flex min-w-0 flex-1 flex-col ${optimistic ? "text-muted line-through" : ""}`}
      >
        {children}
      </span>
    </label>
  );
}
