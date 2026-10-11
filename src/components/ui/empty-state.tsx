import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";

/** État vide : dit ce qui manque et propose l'action qui le remplit. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-border-strong flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center">
      <LogoMark size={40} tone="mono" className="text-border-strong" />
      <p className="type-section">{title}</p>
      {children ? <div className="text-muted max-w-sm text-sm">{children}</div> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
