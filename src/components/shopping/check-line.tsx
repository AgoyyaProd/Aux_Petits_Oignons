"use client";

import { useOptimistic, useTransition } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { toggleCheckAction } from "@/server/modules/shopping/actions";
import { ImageSlot } from "@/components/ui/image-slot";

/**
 * Article de la liste : toute la ligne est la zone tactile (mode magasin, une main).
 * La case est mise à jour immédiatement à l'écran puis enregistrée.
 */
/** Case cochée tout de suite à l'écran, puis enregistrée (partagé par la ligne et la tuile). */
function useCheck(week: string, ingredientId: string, dimension: string, checked: boolean) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [, startTransition] = useTransition();
  const toggle = (next: boolean) => {
    const data = new FormData();
    data.set("week", week);
    data.set("ingredientId", ingredientId);
    data.set("dimension", dimension);
    data.set("checked", String(next));
    startTransition(async () => {
      setOptimistic(next);
      await toggleCheckAction(data);
    });
  };
  return [optimistic, toggle] as const;
}

/** Rond de la case : vide, ou plein avec la coche. */
function CheckDot({ on, className = "" }: { on: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        "peer-focus-visible:outline-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
        on ? "border-brand bg-brand text-brand-foreground" : "border-border-strong bg-surface",
        className,
      ].join(" ")}
    >
      {on ? <CheckIcon size={16} strokeWidth={2.5} /> : null}
    </span>
  );
}

/**
 * Tuile « marché » de la liste sur téléphone : photo ronde, nom, nombre de plats, grosse
 * quantité, puis format et prix. Toute la tuile est la zone tactile.
 */
export function CheckTile({
  week,
  ingredientId,
  dimension,
  checked,
  image,
  tone,
  aisle,
  name,
  meta,
  quantity,
  pack,
  price,
}: {
  week: string;
  ingredientId: string;
  dimension: string;
  checked: boolean;
  image?: string | null;
  /** Fond doux de la tuile (couleur du rayon). */
  tone: string;
  /** Rayon, en petit au-dessus du nom (vue par rayon, tuiles à la suite). */
  aisle?: string;
  name: string;
  /** « pour 2 plats · 200 ml chez toi ». */
  meta: string;
  quantity: string;
  pack: string | null;
  price: string;
}) {
  const [optimistic, toggle] = useCheck(week, ingredientId, dimension, checked);
  return (
    <label
      className={`${tone} relative flex min-h-44 w-full cursor-pointer flex-col rounded-[1.375rem] p-3 transition-opacity ${optimistic ? "opacity-55" : ""}`}
    >
      <input
        type="checkbox"
        checked={optimistic}
        onChange={(e) => toggle(e.currentTarget.checked)}
        className="peer sr-only"
      />
      <CheckDot on={optimistic} className="absolute top-3 right-3" />
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo locale, vignette fixe
        <img
          src={image.replace(/\.webp(\?|$)/, "-600.webp$1")}
          alt=""
          loading="lazy"
          decoding="async"
          className="border-surface size-14 rounded-full border-[3px] object-cover"
        />
      ) : (
        <ImageSlot
          alt=""
          seed={ingredientId}
          className="border-surface size-14 rounded-full border-[3px]"
        />
      )}
      {aisle ? (
        <span className="text-muted mt-2.5 truncate text-[0.65rem] font-semibold tracking-wide uppercase">
          {aisle}
        </span>
      ) : null}
      <span
        className={`${aisle ? "mt-0.5" : "mt-2.5"} line-clamp-2 text-[0.95rem] leading-tight font-semibold ${optimistic ? "line-through" : ""}`}
      >
        {name}
      </span>
      <span className="text-muted mt-1 text-xs font-semibold">{meta}</span>
      <span className="font-display mt-auto pt-1.5 text-2xl leading-none font-semibold tabular-nums">
        {quantity}
      </span>
      <span className="text-muted mt-1 flex justify-between gap-2 text-[0.7rem] tabular-nums">
        <span className="min-w-0 truncate">{pack ?? ""}</span>
        <span className="shrink-0">{price}</span>
      </span>
    </label>
  );
}

export function CheckLine({
  week,
  ingredientId,
  dimension,
  checked,
  image,
  name,
  children,
}: {
  week: string;
  ingredientId: string;
  dimension: string;
  checked: boolean;
  /** Photo de l'aliment, s'il en a une (vignette à côté de la case). */
  image?: string | null;
  /** Nom de l'aliment : vignette illustrée quand il n'a pas de photo. */
  name?: string;
  children: React.ReactNode;
}) {
  const [optimistic, toggle] = useCheck(week, ingredientId, dimension, checked);

  return (
    <label className="flex min-h-16 cursor-pointer items-start gap-3 py-3 sm:gap-4 lg:items-center">
      <input
        type="checkbox"
        checked={optimistic}
        onChange={(e) => toggle(e.currentTarget.checked)}
        className="peer sr-only"
      />
      <CheckDot on={optimistic} className="mt-2 lg:mt-0" />
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo locale, vignette fixe
        <img
          src={image.replace(/\.webp(\?|$)/, "-600.webp$1")}
          alt=""
          loading="lazy"
          decoding="async"
          className={`size-11 shrink-0 rounded-lg object-cover transition-opacity ${optimistic ? "opacity-50" : ""}`}
        />
      ) : name ? (
        <ImageSlot
          alt=""
          seed={ingredientId}
          className={`size-11 shrink-0 rounded-lg transition-opacity ${optimistic ? "opacity-50" : ""}`}
        />
      ) : null}
      <span
        className={`flex min-w-0 flex-1 flex-col gap-0.5 transition-opacity ${optimistic ? "opacity-50 [&_.item-name]:line-through" : ""}`}
      >
        {children}
      </span>
    </label>
  );
}
