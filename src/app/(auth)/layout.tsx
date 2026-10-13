import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BrandElement } from "@/components/brand/shapes";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/** Connexion et inscription : un formulaire court, centré, sur fond crème. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Décor : les trois formes du logo autour du formulaire. */}
      <BrandElement
        name="leaf"
        priority
        sizes="256px"
        className="absolute top-24 -left-16 hidden w-64 -rotate-12 md:block"
      />
      <BrandElement
        name="dot"
        priority
        sizes="176px"
        className="absolute top-1/3 -right-12 hidden w-44 md:block"
      />
      <BrandElement
        name="slice"
        priority
        sizes="320px"
        className="absolute -bottom-16 left-[12%] hidden w-80 rotate-3 md:block"
      />
      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Aux Petits Oignons, accueil">
          <Logo size={40} />
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <div className="bg-surface border-border flex flex-col gap-6 rounded-2xl border p-6 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
