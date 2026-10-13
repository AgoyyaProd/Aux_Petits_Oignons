import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Hors ligne" };

/** Page de secours, gardée par le service worker : affichée sans réseau pour une page jamais ouverte. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-start justify-center gap-5 px-4 py-16">
      <Logo size={52} />
      <h1 className="type-page">Pas de réseau</h1>
      <p className="text-muted leading-relaxed">
        Cette page n&apos;a pas encore été enregistrée sur ton appareil. Ta liste de courses, ton
        menu de la semaine et les recettes que tu as déjà ouvertes restent consultables hors ligne.
      </p>
      <div className="flex flex-wrap gap-2">
        <a href="/shopping" className={buttonClasses("primary")}>
          Ma liste de courses
        </a>
        <Link href="/planner" className={buttonClasses("secondary")}>
          Mon menu
        </Link>
      </div>
    </main>
  );
}
