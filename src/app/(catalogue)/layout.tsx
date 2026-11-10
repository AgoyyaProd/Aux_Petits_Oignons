import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/site-shell";

/**
 * Catalogue de recettes, ouvert à tous : la coquille commune du site, version membre ou
 * visiteur selon la session (lue derrière des frontières Suspense).
 */
export default function CatalogueLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
