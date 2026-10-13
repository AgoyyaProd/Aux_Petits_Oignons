"use client";

import { useEffect } from "react";

/**
 * Panneaux « Modifier » du menu (éléments <details name="…">) : un clic en dehors ou la touche
 * Échap les referme. Le navigateur n'en garde déjà qu'un ouvert à la fois (attribut `name`).
 */
export function CloseOpenPanels({ name }: { name: string }) {
  useEffect(() => {
    const selector = `details[name="${name}"][open]`;
    const closeAll = (except?: Element | null) => {
      document.querySelectorAll<HTMLDetailsElement>(selector).forEach((d) => {
        if (d !== except) d.open = false;
      });
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      closeAll(target?.closest(selector));
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const open = document.querySelector<HTMLDetailsElement>(selector);
      if (!open) return;
      open.open = false;
      open.querySelector("summary")?.focus();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [name]);
  return null;
}
