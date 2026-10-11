import type { ReactNode } from "react";

const tones = {
  error: "border-danger/30 bg-danger-soft text-danger",
  success: "border-success/30 bg-success-soft text-success",
  info: "border-border bg-brand-soft text-foreground",
} as const;

export function Alert({ tone, children }: { tone: keyof typeof tones; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-3 py-2.5 text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
