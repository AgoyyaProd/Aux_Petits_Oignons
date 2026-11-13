import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { BrandElement } from "@/components/brand/shapes";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/** Questionnaire de bienvenue : plein écran, sans la navigation de l'application. */
export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <BrandElement
        name="leaf"
        priority
        sizes="224px"
        className="absolute bottom-10 -left-14 hidden w-56 rotate-12 lg:block"
      />
      <header className="bg-forest text-cream relative pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Logo size={40} tone="inverse" />
          <ThemeToggle className="text-cream! border-white/20! hover:bg-white/10!" />
        </div>
      </header>
      <main className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-6 pb-16 sm:px-6 lg:pt-10">
        <div className="bg-surface border-border flex flex-col overflow-hidden rounded-2xl border p-5 sm:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
