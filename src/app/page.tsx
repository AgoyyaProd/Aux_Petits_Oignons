import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

/** Page statique (prérendue). Un utilisateur connecté est redirigé par le proxy. */
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-col gap-3">
        <p className="text-brand text-sm font-semibold">Garde-manger</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Cuisine d&apos;abord ce que tu as déjà.
        </h1>
        <p className="text-muted">
          Renseigne ton frigo, ton congélateur et tes placards. Reçois des repas adaptés et une
          liste de courses qui ne contient que ce qui manque.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/signup" className={buttonClasses("primary")}>
          Créer un compte
        </Link>
        <Link href="/login" className={buttonClasses("secondary")}>
          Se connecter
        </Link>
      </div>
    </main>
  );
}
