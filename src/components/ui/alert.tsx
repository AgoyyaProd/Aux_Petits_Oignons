import type { ReactNode } from "react";

const tones = {
  error: "border-danger/25 bg-danger-soft text-danger",
  success: "border-success/25 bg-success-soft text-success",
  info: "border-brand/15 bg-brand-soft/70 text-foreground",
  warning: "border-warning/25 bg-warning-soft text-warning",
} as const;

/** Message en ligne : erreur explicite, succès d'une action, information utile. */
export function Alert({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
