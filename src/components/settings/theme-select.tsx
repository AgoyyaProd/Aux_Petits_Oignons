"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY, type ThemeChoice } from "@/lib/theme";

const OPTIONS: { value: ThemeChoice; label: string; hint: string }[] = [
  { value: "light", label: "Clair", hint: "Fond crème" },
  { value: "dark", label: "Sombre", hint: "Fond vert foncé" },
  { value: "auto", label: "Automatique", hint: "Comme l'appareil" },
];

const listeners = new Set<() => void>();
function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Choix de l'apparence, appliqué immédiatement et mémorisé sur cet appareil. */
export function ThemeSelect() {
  const value = useSyncExternalStore(subscribe, read, () => "auto" as ThemeChoice);

  function choose(next: ThemeChoice) {
    try {
      if (next === "auto") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la page en cours.
    }
    const apply = (window as Window & { __apoApplyTheme?: () => void }).__apoApplyTheme;
    if (apply) apply();
    else if (next !== "auto") document.documentElement.setAttribute("data-theme", next);
    listeners.forEach((fn) => fn());
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">Apparence</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className={[
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
              value === o.value
                ? "border-brand bg-brand-soft"
                : "border-border hover:border-border-strong",
            ].join(" ")}
          >
            <input
              type="radio"
              name="theme"
              value={o.value}
              checked={value === o.value}
              onChange={() => choose(o.value)}
              className="accent-brand size-4"
            />
            <span
              aria-hidden="true"
              className={[
                "size-6 shrink-0 rounded-full border",
                o.value === "light"
                  ? "border-[#d8cab3] bg-[#fff8ef]"
                  : o.value === "dark"
                    ? "border-[#31554b] bg-[#0b1c16]"
                    : "border-border-strong bg-[linear-gradient(135deg,#fff8ef_50%,#0b1c16_50%)]",
              ].join(" ")}
            />
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{o.label}</span>
              <span className="text-muted text-xs">{o.hint}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="text-muted text-xs">Ce choix est mémorisé sur cet appareil.</p>
    </fieldset>
  );
}
