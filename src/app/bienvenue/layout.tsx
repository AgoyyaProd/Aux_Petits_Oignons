import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/** Questionnaire de bienvenue : plein écran, sans la navigation de l'application. */
export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Logo size={40} />
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-16 sm:px-6">
        <div className="bg-surface border-border flex flex-col rounded-2xl border p-5 sm:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
