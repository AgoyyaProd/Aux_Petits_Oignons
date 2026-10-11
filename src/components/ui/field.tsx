import { useId, type InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

/** Champ de formulaire accessible : libellé lié, aide et erreur annoncées. */
export function Field({ label, error, hint, id, className = "", ...input }: FieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={[
          "bg-surface min-h-11 w-full min-w-0 rounded-lg border px-3.5 text-base transition-colors outline-none",
          "hover:border-border-strong focus-visible:border-brand focus-visible:ring-brand/25 focus-visible:ring-2 focus-visible:outline-none",
          error ? "border-danger" : "border-border",
        ].join(" ")}
        {...input}
      />
      {hint && !error ? (
        <p id={hintId} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-danger text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
