"use client";

import { useSyncExternalStore } from "react";
import type { ThemeChoice } from "@/lib/theme";
import { chooseTheme, readThemeChoice, subscribeTheme } from "@/lib/theme-client";

const OPTIONS: { value: ThemeChoice; label: string; hint: string }[] = [
  { value: "light", label: "Clair", hint: "Fond crème" },
  { value: "dark", label: "Sombre", hint: "Fond vert foncé" },
  { value: "auto", label: "Automatique", hint: "Comme l'appareil" },
];

/** Choix de l'apparence, appliqué immédiatement et mémorisé sur cet appareil. */
export function ThemeSelect() {
  const value = useSyncExternalStore(subscribeTheme, readThemeChoice, () => "auto" as ThemeChoice);

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
              onChange={() => chooseTheme(o.value)}
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
