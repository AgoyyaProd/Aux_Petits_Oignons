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
  TagIcon,
  WalletIcon,
} from "@/components/ui/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: Icon;
}

/** Navigation principale : mêmes rubriques, même ordre sur ordinateur et téléphone. */
export const PRIMARY: readonly NavItem[] = [
  { href: "/dashboard", label: "Accueil", short: "Accueil", icon: HomeIcon },
  { href: "/planner", label: "Menu de la semaine", short: "Menu", icon: CalendarIcon },
  { href: "/shopping", label: "Liste de courses", short: "Courses", icon: BasketIcon },
  { href: "/pantry", label: "Garde-manger", short: "Stock", icon: PantryIcon },
  { href: "/recipes", label: "Recettes", short: "Recettes", icon: BookIcon },
];

/** Rubriques secondaires : barre latérale sur ordinateur, accueil et paramètres sur téléphone. */
export const SECONDARY: readonly NavItem[] = [
  { href: "/budget", label: "Budget", short: "Budget", icon: WalletIcon },
  { href: "/prices", label: "Prix", short: "Prix", icon: TagIcon },
  { href: "/settings", label: "Paramètres", short: "Réglages", icon: SettingsIcon },
];

function isActive(pathname: string | null, href: string) {
  return pathname !== null && (pathname === href || pathname.startsWith(`${href}/`));
}

/**
 * usePathname() lit l'URL de la requête : avec les Cache Components, ces composants sont
 * rendus dans un <Suspense> dont le repli est la version « Shell » (sans onglet actif).
 */
export function SideNav() {
  return <SideNavShell pathname={usePathname()} />;
}
export function TabBar() {
  return <TabBarShell pathname={usePathname()} />;
}

/** Barre latérale (ordinateur) : fond vert forêt, l'onglet actif en crème. */
export function SideNavShell({ pathname }: { pathname: string | null }) {
  const item = (it: NavItem) => {
    const active = isActive(pathname, it.href);
    const Icon = it.icon;
    return (
      <li key={it.href}>
        <Link
          href={it.href}
          aria-current={active ? "page" : undefined}
          className={[
            "flex min-h-11 items-center gap-3 rounded-full px-4 text-[0.9375rem] font-medium transition-colors",
            active
              ? "bg-cream text-forest dark:bg-brand dark:text-brand-foreground"
              : "text-nav-foreground hover:bg-white/8",
          ].join(" ")}
        >
          <Icon size={20} />
          {it.label}
        </Link>
      </li>
    );
  };
  return (
    <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-8">
      <ul className="flex flex-col gap-1">{PRIMARY.map(item)}</ul>
      <ul className="border-nav-muted/25 flex flex-col gap-1 border-t pt-6">
        {SECONDARY.map(item)}
      </ul>
    </nav>
  );
}

/** Barre d'onglets (téléphone) : en bas, à portée de pouce, icône + libellé court. */
export function TabBarShell({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {PRIMARY.map((it) => {
          const active = isActive(pathname, it.href);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold",
                  active ? "text-brand" : "text-muted",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active ? "bg-brand-soft" : "",
                  ].join(" ")}
                >
                  <Icon size={22} />
                </span>
                {it.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
