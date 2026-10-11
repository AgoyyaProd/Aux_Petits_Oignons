"use client";

import { useId, useMemo, useState } from "react";
import { searchIngredients, type IngredientChoice } from "@/lib/ingredient-search";

/**
 * Champ « ingrédient » avec suggestions insensibles aux accents et aux synonymes.
 * La valeur envoyée reste le texte saisi ; le serveur la résout par les synonymes.
 */
export function IngredientInput({
  label,
  name,
  choices,
  defaultValue = "",
  placeholder,
  error,
  required,
  exclude,
}: {
  label: string;
  name: string;
  choices: readonly IngredientChoice[];
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  /** Noms à ne pas proposer (déjà choisis). */
  exclude?: ReadonlySet<string>;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const suggestions = useMemo(
    () =>
      searchIngredients(choices, value, 12)
        .filter((n) => !exclude?.has(n))
        .slice(0, 8),
    [choices, value, exclude],
  );
  const show =
    open && suggestions.length > 0 && !(suggestions.length === 1 && suggestions[0] === value);

  const pick = (choice: string) => {
    setValue(choice);
    setOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show ? `${listId}-${active}` : undefined}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(suggestions[active]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={[
          "bg-surface min-h-11 w-full min-w-0 rounded-xl border px-3 text-base outline-none",
          "focus-visible:ring-brand focus-visible:ring-2",
          error ? "border-danger" : "border-border",
        ].join(" ")}
      />
      {show ? (
        <ul
          id={listId}
          role="listbox"
          className="border-border bg-surface absolute top-full z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-brand-soft text-brand" : ""}`}
            >
              {s}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-danger text-xs font-medium">{error}</p> : null}
    </div>
  );
}
