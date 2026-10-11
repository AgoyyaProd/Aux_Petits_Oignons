import type { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInvitationForm } from "@/components/households/accept-invitation-form";
import { Alert } from "@/components/ui/alert";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/server/modules/auth/session";
import { invitationTokenSchema } from "@/server/modules/households/schema";

export const metadata: Metadata = { title: "Invitation" };

export default function InvitationPage({ params }: PageProps<"/invitation/[token]">) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <h1 className="type-page">Rejoindre un foyer</h1>
      <Suspense fallback={<PageSkeleton />}>
        <Invitation params={params} />
      </Suspense>
    </div>
  );
}

/**
 * L'invitation n'est acceptée qu'au clic (jamais à l'affichage : un aperçu de lien ou un
 * préchargement ne doit pas la consommer).
 */
async function Invitation({ params }: Pick<PageProps<"/invitation/[token]">, "params">) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!invitationTokenSchema.safeParse(token).success) {
    return <Alert tone="error">Ce lien d&apos;invitation est invalide.</Alert>;
  }
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-4">
      <p className="text-sm">
        On t&apos;a invité à partager un foyer : garde-manger, menus, liste de courses et prix
        seront communs.
      </p>
      <p className="text-muted text-sm">
        Tu es connecté en tant que <strong>{user?.email}</strong>. L&apos;invitation doit avoir été
        envoyée à cette adresse. Ton foyer actuel reste accessible depuis les paramètres.
      </p>
      <AcceptInvitationForm token={token} />
    </section>
  );
}
