import type { Metadata } from "next";
import { Suspense } from "react";
import { getCurrentContext } from "@/server/modules/auth/session";

export const metadata: Metadata = { title: "Accueil" };

const NEXT_STEPS = [
  {
    title: "Renseigne ton garde-manger",
    body: "Ajoute ce que tu as au réfrigérateur, au congélateur et dans les placards.",
  },
  { title: "Planifie ta semaine", body: "Des repas qui utilisent d'abord ce que tu possèdes." },
  { title: "Fais tes courses", body: "Une liste qui ne contient que ce qui manque vraiment." },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<GreetingSkeleton />}>
        <Greeting />
      </Suspense>

      <section aria-labelledby="next-steps" className="flex flex-col gap-3">
        <h2 id="next-steps" className="text-muted text-sm font-semibold tracking-wide uppercase">
          Pour commencer
        </h2>
        <ol className="flex flex-col gap-3">
          {NEXT_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="border-border bg-surface flex gap-3 rounded-2xl border p-4"
            >
              <span
                aria-hidden="true"
                className="bg-brand-soft text-brand flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              >
                {index + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold">{step.title}</p>
                <p className="text-muted text-sm">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-muted text-xs">Ces modules arrivent dans les prochaines phases.</p>
      </section>
    </div>
  );
}

/** Lit la session : vérifie l'utilisateur et redirige vers /login s'il n'est pas connecté. */
async function Greeting() {
  const { profile, household } = await getCurrentContext();
  const people = household?.people_count ?? 0;

  return (
    <section className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight">
        Bonjour {profile.displayName ?? "et bienvenue"}
      </h1>
      <p className="text-muted text-sm">
        {household
          ? `${household.name} · ${people} personne${people > 1 ? "s" : ""}`
          : "Aucun foyer actif."}
      </p>
    </section>
  );
}

function GreetingSkeleton() {
  return (
    <section aria-hidden="true" className="flex flex-col gap-2">
      <div className="bg-border h-8 w-48 animate-pulse rounded-lg" />
      <div className="bg-border h-4 w-32 animate-pulse rounded" />
    </section>
  );
}
