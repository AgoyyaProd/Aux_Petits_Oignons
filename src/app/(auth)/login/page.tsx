import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Alert } from "@/components/ui/alert";
import { safeRedirectPath } from "@/lib/routes";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
        <p className="text-muted text-sm">Retrouve ton garde-manger et ton planning.</p>
      </div>
      {/* searchParams est une donnée de requête : lue derrière une frontière Suspense. */}
      <Suspense fallback={<SignInForm />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
      <p className="text-muted text-center text-sm">
        Pas encore de compte ?{" "}
        <Link
          href="/signup"
          className="text-brand font-semibold underline-offset-4 hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);

  return (
    <>
      {params.error === "link" ? (
        <Alert tone="error">
          Ce lien de connexion est invalide ou a expiré. Demandes-en un nouveau.
        </Alert>
      ) : null}
      <SignInForm next={next} />
    </>
  );
}
