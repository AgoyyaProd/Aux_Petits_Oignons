import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Alert } from "@/components/ui/alert";
import { memberAreaLabel, safeRedirectPath } from "@/lib/routes";
import { Hero } from "@/components/ui/hero";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex flex-col gap-6">
      <Hero
        inCard
        title="Connexion"
        description={<>Retrouve ton garde-manger et ton planning.</>}
        decor="circle"
      />
      {/* searchParams est une donnée de requête : lue derrière une frontière Suspense. */}
      <Suspense fallback={<SignInForm />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  const area = memberAreaLabel(next);

  return (
    <>
      {area ? (
        <Alert tone="info">Pour accéder à {area}, connecte-toi ou crée un compte gratuit.</Alert>
      ) : null}
      {params.error === "link" ? (
        <Alert tone="error">
          Ce lien de connexion est invalide ou a expiré. Demandes-en un nouveau.
        </Alert>
      ) : null}
      <SignInForm next={next} />
      <p className="text-muted text-center text-sm">
        Pas encore de compte ?{" "}
        <Link
          href={next === "/dashboard" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`}
          className="text-brand font-semibold underline-offset-4 hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </>
  );
}
