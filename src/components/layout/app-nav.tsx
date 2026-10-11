"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  BasketIcon,
  BookIcon,
  CalendarIcon,
  HomeIcon,
  PantryIcon,
  SettingsIcon,
  UserIcon,
  WalletIcon,
} from "@/components/ui/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
interface NavItem {
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

/** Onglets (téléphone) : cinq entrées à portée de pouce. */
const TABS: readonly NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: HomeIcon },
  { href: "/recipes", label: "Recettes", icon: BookIcon, also: ["/ingredients"] },
  { href: "/planner", label: "Menu", icon: CalendarIcon },
  { href: "/shopping", label: "Courses", icon: BasketIcon },
  {
    href: "/settings",
    label: "Profil",
    icon: UserIcon,
    also: ["/pantry", "/budget", "/prices"],
  },
];

function isActive(pathname: string | null, item: NavItem) {
  if (pathname === null) return false;
  return [item.href, ...(item.also ?? [])].some(
    (href) => pathname === href || pathname.startsWith(`${href}/`),
  );
}

/**
 * usePathname() lit l'URL de la requête : avec les Cache Components, ces composants sont
 * rendus dans un <Suspense> dont le repli est la version « Shell » (sans entrée active).
 */
export function SideNav() {
  return <SideNavShell pathname={usePathname()} />;
}
export function TabBar() {
  return <TabBarShell pathname={usePathname()} />;
}

/** Rubriques de la barre latérale : l'entrée active est sur fond vert pâle, icône terracotta. */
export function SideNavShell({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Navigation principale">
      <ul className="flex flex-col gap-1">
        {SIDEBAR.map((it) => {
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
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map((it) => {
          const active = isActive(pathname, it);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold",
                  active ? "text-accent-strong" : "text-muted",
                ].join(" ")}
              >
                <Icon size={23} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
