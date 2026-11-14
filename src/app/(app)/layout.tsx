import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/site-shell";

/**
 * Pages du compte : la coquille commune du site (voir SiteShell), version membre. Chaque page
 * vérifie elle-même la session via getCurrentContext() (le proxy n'est qu'un confort).
 */
/** Pages du compte : jamais indexées (elles demandent une session). */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }: { children: ReactNode }) {
  return <SiteShell member>{children}</SiteShell>;
}
