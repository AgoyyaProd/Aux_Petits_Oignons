import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { getCurrentContext } from "@/server/modules/auth/session";

/**
 * Coquille de l'application : la coquille commune du site (voir SiteShell), version membre.
 * Chaque page vérifie elle-même la session via getCurrentContext() (le proxy n'est qu'un
 * confort).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell
      member
      account={
        <Link
          href="/settings"
          className="border-border hover:bg-surface-muted flex items-center gap-3 rounded-xl border p-2.5 transition-colors"
        >
          <Suspense fallback={<AccountCardFallback />}>
            <AccountCard />
          </Suspense>
        </Link>
      }
    >
      {children}
    </SiteShell>
  );
}

function Initial({ letter }: { letter: string }) {
  return (
    <span
      aria-hidden="true"
      className="bg-forest text-cream grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold"
    >
      {letter}
    </span>
  );
}

function AccountCardFallback() {
  return (
    <>
      <Initial letter="·" />
      <span className="text-sm font-semibold">Mon compte</span>
    </>
  );
}

async function AccountCard() {
  const { profile, household } = await getCurrentContext();
  const name = profile.displayName?.trim() || "Mon compte";
  return (
    <>
      <Initial letter={name.charAt(0).toUpperCase()} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{name}</span>
        {household ? <span className="text-muted truncate text-xs">{household.name}</span> : null}
      </span>
    </>
  );
}
