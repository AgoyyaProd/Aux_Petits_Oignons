import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Créer un compte</h1>
        <p className="text-muted text-sm">
          Un foyer est créé automatiquement ; tu pourras inviter d&apos;autres membres.
        </p>
      </div>
      <SignUpForm />
      <p className="text-muted text-center text-sm">
        Déjà inscrit ?{" "}
        <Link href="/login" className="text-brand font-semibold underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
