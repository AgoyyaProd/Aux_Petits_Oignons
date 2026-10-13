import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/** Connexion et inscription : un formulaire court, centré, sur fond crème. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Aux Petits Oignons, accueil">
          <Logo size={40} />
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <div className="bg-surface border-border flex flex-col gap-6 rounded-2xl border p-6 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
