import Link from "next/link";
import { TexturedMark } from "@/components/brand/shapes";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <TexturedMark className="w-32" sizes="128px" />
      <h1 className="type-page">Cette page n&apos;existe pas</h1>
      <p className="text-muted">
        Le lien est peut-être ancien, ou la recette a changé d&apos;adresse.
      </p>
      <Link href="/dashboard" className={buttonClasses("primary")}>
        Revenir à l&apos;accueil
      </Link>
    </main>
  );
}
