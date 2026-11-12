"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  BasketIcon,
  BookIcon,
  CalendarIcon,
  HomeIcon,
  LeafIcon,
  PantryIcon,
  SettingsIcon,
  WalletIcon,
} from "@/components/ui/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  /** Autres chemins qui activent l'entrée (ex. le garde-manger sous « Profil » sur téléphone). */
  also?: readonly string[];
}

/** Barre latérale (ordinateur) : toutes les rubriques, dans l'ordre d'usage. */
export const SIDEBAR: readonly NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: HomeIcon },
  { href: "/recipes", label: "Recettes", icon: BookIcon, also: ["/ingredients"] },
  { href: "/planner", label: "Mon menu", icon: CalendarIcon },
  { href: "/shopping", label: "Ma liste de courses", icon: BasketIcon },
  { href: "/pantry", label: "Mon garde-manger", icon: PantryIcon },
  { href: "/budget", label: "Mon budget", icon: WalletIcon, also: ["/prices"] },
  { href: "/settings", label: "Mes préférences", icon: SettingsIcon },
];

/**
 * Barre latérale des visiteurs (non connectés) : la même barre, avec les rubriques de la page
 * d'accueil publique. Les rubriques du compte exigent une connexion.
 */
export const VISITOR_SIDEBAR: readonly NavItem[] = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/recipes", label: "Nos recettes", icon: BookIcon },
  { href: "/#fonctionnement", label: "Comment ça marche", icon: CalendarIcon },
  { href: "/#engagements", label: "Nos engagements", icon: LeafIcon },
];

/** Onglets (téléphone) : cinq entrées à portée de pouce. */
const TABS: readonly NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: HomeIcon },
  { href: "/recipes", label: "Recettes", icon: BookIcon, also: ["/ingredients"] },
  // Au centre, mis en avant : le garde-manger, d'où partent menus et courses.
  { href: "/pantry", label: "Garde-manger", icon: PantryIcon },
  { href: "/planner", label: "Menu", icon: CalendarIcon },
  { href: "/shopping", label: "Courses", icon: BasketIcon },
];
const CENTER_TAB = "/pantry";

function isActive(pathname: string | null, item: NavItem) {
  if (pathname === null) return false;
  // Ancre de la page d'accueil : jamais « active » (on ne suit pas le défilement).
  if (item.href.includes("#")) return false;
  if (item.href === "/") return pathname === "/";
  return [item.href, ...(item.also ?? [])].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

/**
 * usePathname() lit l'URL de la requête : avec les Cache Components, ces composants sont
 * rendus dans un <Suspense> dont le repli est la version « Shell » (sans entrée active).
 */
export function SideNav({ items = SIDEBAR }: { items?: readonly NavItem[] }) {
  return <SideNavShell pathname={usePathname()} items={items} />;
}
export function TabBar() {
  return <TabBarShell pathname={usePathname()} />;
}

/** Rubriques de la barre latérale : l'entrée active est sur fond vert pâle, icône terracotta. */
export function SideNavShell({
  pathname,
  items = SIDEBAR,
}: {
  pathname: string | null;
  items?: readonly NavItem[];
}) {
  return (
    <nav aria-label="Navigation principale">
      <ul className="flex flex-col gap-1">
        {items.map((it) => {
          const active = isActive(pathname, it);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-medium transition-colors",
                  active
                    ? "bg-brand-soft text-brand font-semibold"
                    : "text-muted hover:bg-surface-muted hover:text-foreground",
                ].join(" ")}
              >
                <Icon size={20} className={active ? "text-accent-strong" : undefined} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barre d'onglets (téléphone) : en bas, icône + libellé, l'onglet actif en terracotta. */
export function TabBarShell({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 lg:hidden"
    >
      <ul className="bg-forest mx-auto grid max-w-xl grid-cols-5 items-end rounded-[1.75rem] px-1 py-2 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.45)] ring-1 ring-white/10">
        {TABS.map((it) => {
          const active = isActive(pathname, it);
          const Icon = it.icon;
          if (it.href === CENTER_TAB) {
            return (
              <li key={it.href} className="flex justify-center">
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "-mt-7 flex flex-col items-center gap-1 text-[0.6875rem] font-bold whitespace-nowrap",
                    active ? "text-highlight" : "text-cream",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "border-background grid size-[3.6rem] place-items-center rounded-full border-4 shadow-[0_6px_16px_-6px_rgb(20_47_38/0.5)]",
                      active ? "bg-highlight text-forest" : "bg-accent text-white",
                    ].join(" ")}
                  >
                    <Icon size={24} />
                  </span>
                  {it.label}
                </Link>
              </li>
            );
          }
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-12 flex-col items-center justify-end gap-1 text-[0.6875rem]",
                  active ? "text-highlight font-bold" : "text-cream/75 font-medium",
                ].join(" ")}
              >
                <Icon size={22} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
