"use client";

import { useActionState, useOptimistic, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckIcon, CloseIcon, PlusIcon } from "@/components/ui/icons";
import {
  addExtraAction,
  removeExtraAction,
  toggleExtraAction,
  type ExtraState,
} from "@/server/modules/shopping/actions";

/** Article ajouté à la main : coché/décoché tout de suite, supprimable. */
export function ExtraLine({
  id,
  label,
  quantity,
  note,
  checked,
}: {
  id: string;
  label: string;
  quantity: string | null;
  note: string | null;
  checked: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(checked);
  const [, start] = useTransition();
  return (
    <div className="flex min-h-16 items-center gap-4 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={optimistic}
        aria-label={label}
        onClick={() =>
          start(async () => {
            setOptimistic(!optimistic);
            const f = new FormData();
            f.set("id", id);
            f.set("checked", String(!optimistic));
            await toggleExtraAction(f);
          })
        }
        className={[
          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          optimistic ? "border-forest bg-forest text-cream" : "border-border-strong bg-surface",
        ].join(" ")}
      >
        {optimistic ? <CheckIcon size={16} strokeWidth={2.5} /> : null}
      </button>
      <span className={`flex min-w-0 flex-1 flex-col gap-0.5 ${optimistic ? "opacity-50" : ""}`}>
        <span className="flex items-baseline justify-between gap-3">
          <span className={`text-base font-semibold ${optimistic ? "line-through" : ""}`}>
            {label}
          </span>
          {quantity ? <span className="shrink-0 font-semibold">{quantity}</span> : null}
        </span>
        {note ? <span className="text-muted text-sm">{note}</span> : null}
      </span>
      <form action={removeExtraAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          aria-label={`Retirer ${label} de la liste`}
          className="text-muted hover:text-danger flex size-11 items-center justify-center rounded-full"
        >
          <CloseIcon size={18} />
        </button>
      </form>
    </div>
  );
}

const idle: ExtraState = { status: "idle" };

/** Ajout libre (« sacs poubelle », « pain ») : un texte et une quantité facultative. */
export function AddExtraForm() {
  const [state, action, pending] = useActionState(async (prev: ExtraState, f: FormData) => {
    const r = await addExtraAction(prev, f);
    if (r.status === "success") form.current?.reset();
    return r;
  }, idle);
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className="flex flex-col gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_auto] gap-2">
        <label className="sr-only" htmlFor="extra-label">
          Article à ajouter
        </label>
        <input
          id="extra-label"
          name="label"
          required
          maxLength={120}
          placeholder="Ajouter un article"
          className="bg-surface border-border focus-visible:border-forest min-h-11 rounded-full border px-4 text-base outline-none"
        />
        <label className="sr-only" htmlFor="extra-qty">
          Quantité
        </label>
        <input
          id="extra-qty"
          name="quantity"
          maxLength={40}
          placeholder="Qté"
          className="bg-surface border-border focus-visible:border-forest min-h-11 rounded-full border px-4 text-base outline-none"
        />
        <Button type="submit" variant="forest" disabled={pending} aria-label="Ajouter à la liste">
          <PlusIcon size={18} />
        </Button>
      </div>
      <p
        aria-live="polite"
        className={`text-sm ${state.status === "error" ? "text-danger" : "text-muted"}`}
      >
        {state.message ?? ""}
      </p>
    </form>
  );
}

/** Partage la liste (menu de partage du téléphone) ou la copie dans le presse-papiers. */
export function ExportListButton({ text }: { text: string }) {
  const [copied, setCopied] = useOptimistic(false);
  const [, start] = useTransition();
  return (
    <Button
      variant="secondary"
      onClick={() =>
        start(async () => {
          const nav = navigator as Navigator & {
            share?: (d: { text: string; title: string }) => Promise<void>;
          };
          try {
            if (nav.share) {
              await nav.share({ title: "Liste de courses", text });
              return;
            }
            await navigator.clipboard.writeText(text);
            setCopied(true);
            await new Promise((r) => setTimeout(r, 1800));
          } catch {
            // Partage annulé : rien à faire.
          }
        })
      }
    >
      {copied ? "Liste copiée" : "Exporter la liste"}
    </Button>
  );
}
