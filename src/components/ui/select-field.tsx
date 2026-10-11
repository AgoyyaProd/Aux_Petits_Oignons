import { useId, type SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly { value: string; label: string }[];
  error?: string;
};

export function SelectField({ label, options, error, id, className = "", ...select }: Props) {
  const generated = useId();
  const selectId = id ?? generated;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={selectId} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={[
          "bg-surface min-h-11 w-full min-w-0 rounded-lg border px-3.5 text-base transition-colors outline-none",
          "hover:border-border-strong focus-visible:border-brand focus-visible:ring-brand/25 focus-visible:ring-2 focus-visible:outline-none",
          error ? "border-danger" : "border-border",
        ].join(" ")}
        {...select}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="text-danger text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
