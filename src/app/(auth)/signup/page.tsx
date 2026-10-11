import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { safeRedirectPath } from "@/lib/routes";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignUpPage({ searchParams }: PageProps<"/signup">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Créer un compte</h1>
        <p className="text-muted text-sm">
          Un foyer est créé automatiquement ; tu pourras inviter d&apos;autres membres ou en
          rejoindre un.
        </p>
      </div>
      <Suspense fallback={<SignUpForm />}>
        <SignUpWithNext searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/** searchParams est une donnée de requête : lue derrière une frontière Suspense. */
async function SignUpWithNext({ searchParams }: Pick<PageProps<"/signup">, "searchParams">) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  const loginHref = next === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(next)}`;
  return (
    <>
      <SignUpForm next={next} />
      <p className="text-muted text-center text-sm">
        Déjà inscrit ?{" "}
        <Link
          href={loginHref}
          className="text-brand font-semibold underline-offset-4 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </>
  );
}
