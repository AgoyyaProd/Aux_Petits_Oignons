"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  createInvitationAction,
  leaveHouseholdAction,
  removeMemberAction,
  revokeInvitationAction,
  switchHouseholdAction,
} from "@/server/modules/households/members-actions";
import type { InviteState } from "@/server/modules/households/schema";

interface Member {
  userId: string;
  name: string | null;
  role: "owner" | "member";
  isMe: boolean;
}

interface Props {
  householdId: string;
  isOwner: boolean;
  members: Member[];
  invitations: { id: string; email: string; expiresAt: string }[];
  households: { id: string; name: string }[];
}

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

export function MembersSection({ householdId, isOwner, members, invitations, households }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-border flex flex-col divide-y text-sm" aria-label="Membres du foyer">
        {members.map((m) => (
          <li key={m.userId} className="flex min-h-12 items-center justify-between gap-3 py-2">
            <span>
              <span className="font-medium">{m.name ?? "Membre sans nom"}</span>
              {m.isMe ? <span className="text-muted"> (toi)</span> : null}
              <span className="text-muted block text-xs">
                {m.role === "owner" ? "Propriétaire" : "Membre"}
              </span>
            </span>
            {isOwner && !m.isMe ? (
              <form
                action={removeMemberAction}
                onSubmit={(e) => {
                  if (!confirm(`Retirer ${m.name ?? "ce membre"} du foyer ?`)) e.preventDefault();
                }}
              >
                <input type="hidden" name="householdId" value={householdId} />
                <input type="hidden" name="userId" value={m.userId} />
                <SubmitButton label="Retirer" pendingLabel="Retrait…" />
              </form>
            ) : null}
            {!isOwner && m.isMe ? (
              <form
                action={leaveHouseholdAction}
                onSubmit={(e) => {
                  if (!confirm("Quitter ce foyer ? Tu n'auras plus accès à son garde-manger.")) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="householdId" value={householdId} />
                <SubmitButton label="Quitter le foyer" pendingLabel="Départ…" />
              </form>
            ) : null}
          </li>
        ))}
      </ul>

      {isOwner ? <InviteForm householdId={householdId} /> : null}

      {isOwner && invitations.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Invitations en attente</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">
                  {inv.email}
                  <span className="text-muted text-xs">
                    {" "}
                    · expire le {dateFormat.format(new Date(inv.expiresAt))}
                  </span>
                </span>
                <form action={revokeInvitationAction}>
                  <input type="hidden" name="householdId" value={householdId} />
                  <input type="hidden" name="invitationId" value={inv.id} />
                  <SubmitButton label="Annuler" pendingLabel="…" />
                </form>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {households.length > 1 ? (
        <form action={switchHouseholdAction} className="flex flex-col gap-2">
          <label htmlFor="switch-household" className="text-sm font-semibold">
            Changer de foyer
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <select
              id="switch-household"
              name="householdId"
              defaultValue={householdId}
              className="border-border bg-surface min-h-11 rounded-xl border px-3 text-sm"
            >
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            <SubmitButton label="Ouvrir" pendingLabel="…" />
          </div>
        </form>
      ) : null}
    </div>
  );
}

const idle: InviteState = { status: "idle" };

function InviteForm({ householdId }: { householdId: string }) {
  const [state, action, pending] = useActionState(createInvitationAction, idle);
  return (
    <div className="flex flex-col gap-3">
      <form action={action} className="flex flex-col gap-3" noValidate>
        <input type="hidden" name="householdId" value={householdId} />
        {state.status === "error" && state.message ? (
          <Alert tone="error">{state.message}</Alert>
        ) : null}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <Field
            label="Inviter quelqu'un"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="son.adresse@exemple.fr"
            hint="Il devra se connecter avec cette adresse pour rejoindre le foyer."
            error={state.fieldErrors?.email}
          />
          <Button type="submit" variant="secondary" disabled={pending} className="mt-[1.625rem]">
            {pending ? "Création…" : "Inviter"}
          </Button>
        </div>
      </form>
      {state.status === "success" && state.token ? (
        <InviteLink token={state.token} email={state.email ?? ""} />
      ) : null}
    </div>
  );
}

function InviteLink({ token, email }: { token: string; email: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/invitation/${token}`;
  return (
    <Alert tone="success">
      <p>
        Invitation créée pour <strong>{email}</strong>. Envoie-lui ce lien (valable 7 jours, un seul
        usage) ; il ne sera plus affiché ensuite.
      </p>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input
          readOnly
          value={link}
          aria-label="Lien d'invitation"
          onFocus={(e) => e.currentTarget.select()}
          className="border-border bg-surface text-foreground min-h-10 rounded-lg border px-2 text-xs"
        />
        <Button
          variant="secondary"
          className="min-h-10"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copié ✓" : "Copier"}
        </Button>
      </div>
    </Alert>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" disabled={pending} className="min-h-9 px-3 text-xs">
      {pending ? pendingLabel : label}
    </Button>
  );
}
