import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import {
  SideNav,
  SideNavShell,
  SIDEBAR,
  TabBar,
  TabBarShell,
  VISITOR_SIDEBAR,
} from "@/components/layout/app-nav";
import { APP_FOOTER_LINKS, PUBLIC_FOOTER_LINKS, SiteFooter } from "@/components/layout/site-footer";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { buttonClasses } from "@/components/ui/button";
import { UserIcon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getCurrentContext, getCurrentUser } from "@/server/modules/auth/session";

/**
 * Coquille unique du site, la même pour un visiteur et pour un membre connecté :
 *  - ordinateur (lg) : barre latérale (logo et thème, rubriques, compte en bas) ;
 *  - téléphone et tablette : en-tête léger ; cinq onglets en bas pour un membre.
 * Seuls changent les rubriques et le bas de la barre : la carte du compte pour un membre,
 * « Créer un compte » et « Se connecter » pour un visiteur.
 *
 * `member` : true (pages du compte), false (accueil public, connexion), ou absent pour les
 * pages ouvertes à tous (catalogue) : la session est alors lue derrière des frontières
 * Suspense, avec la version visiteur en attendant. La coquille reste prérendue.
 */
export function SiteShell({ member, children }: { member?: boolean; children: ReactNode }) {
  const known = member !== undefined;
  const part = (render: (m: boolean) => ReactNode) =>
    known ? render(member) : <ByViewer render={render} />;

  return (
    <div className="relative isolate flex min-h-full flex-1 flex-col">
      <div className="flex flex-1">
        <aside className="border-border bg-surface sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r px-4 py-6 lg:flex print:hidden">
          <div className="flex items-start justify-between gap-2 px-2">
            {part((m) => (
              <HomeLink member={m} size={52} />
            ))}
            <ThemeToggle />
          </div>
          <div className="flex-1 overflow-y-auto">
            {part((m) => (
              <Nav member={m} />
            ))}
          </div>
          {part((m) => (m ? <AccountLink /> : <VisitorCard />))}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <OfflineBanner />
          <header className="bg-forest text-cream sticky top-0 z-20 pt-[env(safe-area-inset-top)] lg:hidden print:hidden">
            <div className="flex w-full items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
              {part((m) => (
                <HomeLink member={m} size={40} inverse />
              ))}
              <div className="flex items-center gap-2">
                <ThemeToggle className="text-cream! border-white/20! hover:bg-white/10!" />
                {part((m) =>
                  m ? (
                    <Link
                      href="/settings"
                      aria-label="Mon profil"
                      className="bg-accent grid size-11 place-items-center rounded-full text-base font-bold text-white"
                    >
                      <Suspense fallback={<UserIcon size={20} />}>
                        <ProfileInitial />
                      </Suspense>
                    </Link>
                  ) : (
                    <Link href="/login" className={buttonClasses("secondary", "px-4")}>
                      Se connecter
                    </Link>
                  ),
                )}
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[120rem] flex-1 px-4 pt-6 pb-12 sm:px-6 lg:px-12 lg:pt-12 lg:pb-16 xl:px-16 print:p-0">
            {children}
          </main>
        </div>
      </div>

      {/* Toute la largeur, sous la barre latérale. Sur téléphone, la marge du bas laisse la
          place à la barre d'onglets fixe des membres. */}
      {part((m) => (
        <SiteFooter
          links={m ? APP_FOOTER_LINKS : PUBLIC_FOOTER_LINKS}
          className={m ? "pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pb-0" : ""}
        />
      ))}

      {part((m) =>
        m ? (
          <div className="print:hidden">
            <Suspense fallback={<TabBarShell pathname={null} />}>
              <TabBar />
            </Suspense>
          </div>
        ) : null,
      )}
    </div>
  );
}

/** Partie de la coquille qui dépend de la session (pages ouvertes à tous). */
function ByViewer({ render }: { render: (member: boolean) => ReactNode }) {
  return (
    <Suspense fallback={render(false)}>
      <Viewer render={render} />
    </Suspense>
  );
}

async function Viewer({ render }: { render: (member: boolean) => ReactNode }) {
  const user = await getCurrentUser();
  return render(user !== null);
}

function HomeLink({
  member,
  size,
  inverse = false,
}: {
  member: boolean;
  size: number;
  /** Sur l'en-tête vert du téléphone. */
  inverse?: boolean;
}) {
  return (
    <Link
      href={member ? "/dashboard" : "/"}
      aria-label="Aux Petits Oignons, accueil"
      className="shrink-0"
    >
      <Logo size={size} tone={inverse ? "inverse" : "color"} />
    </Link>
  );
}

function Nav({ member }: { member: boolean }) {
  const items = member ? SIDEBAR : VISITOR_SIDEBAR;
  return (
    <Suspense fallback={<SideNavShell pathname={null} items={items} />}>
      <SideNav items={items} />
    </Suspense>
  );
}

function VisitorCard() {
  return (
    <div className="border-border flex flex-col gap-2 rounded-xl border p-3">
      <p className="text-muted px-1 text-sm leading-snug">
        Ton garde-manger, tes menus et tes courses au même endroit.
      </p>
      <Link href="/signup" className={buttonClasses("forest", "w-full")}>
        Créer un compte
      </Link>
      <Link href="/login" className={buttonClasses("secondary", "w-full")}>
        Se connecter
      </Link>
    </div>
  );
}

function AccountLink() {
  return (
    <Link
      href="/settings"
      className="border-border hover:bg-surface-muted flex items-center gap-3 rounded-xl border p-2.5 transition-colors"
    >
      <Suspense fallback={<AccountCardFallback />}>
        <AccountCard />
      </Suspense>
    </Link>
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

/** Initiale du profil, pour le rond « Mon profil » de l'en-tête mobile. */
async function ProfileInitial() {
  const { profile } = await getCurrentContext();
  const name = profile.displayName?.trim();
  return name ? <>{name.charAt(0).toUpperCase()}</> : <UserIcon size={20} />;
}
