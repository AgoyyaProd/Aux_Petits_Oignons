import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PantryItemCard } from "@/components/pantry/pantry-item-card";
import { buttonClasses } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { getPantry, type PantryItemView } from "@/server/modules/pantry/queries";
import { LOCATION_LABEL, LOCATIONS } from "@/server/modules/pantry/schema";

export const metadata: Metadata = { title: "Garde-manger" };

export default function PantryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Garde-manger</h1>
        <div className="flex gap-2">
          <Link href="/pantry/history" className={buttonClasses("secondary", "min-h-10 px-3")}>
            Historique
          </Link>
          <Link href="/pantry/new" className={buttonClasses("primary", "min-h-10 px-3")}>
            Ajouter
          </Link>
        </div>
      </div>
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <PantryContent />
      </Suspense>
    </div>
  );
}

async function PantryContent() {
  const pantry = await getPantry();
  if (!pantry) return <p className="text-muted">Aucun foyer actif.</p>;
  const { items, today } = pantry;

  if (items.length === 0) {
    return (
      <div className="border-border bg-surface flex flex-col items-start gap-3 rounded-2xl border border-dashed p-6">
        <p className="font-semibold">Ton garde-manger est vide.</p>
        <p className="text-muted text-sm">
          Ajoute ce que tu as au réfrigérateur, au congélateur et dans les placards : les repas
          proposés utiliseront ces produits en priorité.
        </p>
        <Link href="/pantry/new" className={buttonClasses("primary")}>
          Ajouter un premier produit
        </Link>
      </div>
    );
  }

  const priority = items.filter((i) => i.priority);
  const rest = items.filter((i) => !i.priority);

  return (
    <div className="flex flex-col gap-8">
      {priority.length > 0 ? (
        <ItemSection
          title="À consommer en priorité"
          subtitle="Date limite dans 3 jours ou moins, ou produit entamé."
          items={priority}
          today={today}
          accent
        />
      ) : null}
      {LOCATIONS.map((location) => {
        const here = rest.filter((i) => i.location === location);
        return here.length > 0 ? (
          <ItemSection key={location} title={LOCATION_LABEL[location]} items={here} today={today} />
        ) : null;
      })}
    </div>
  );
}

function ItemSection({
  title,
  subtitle,
  items,
  today,
  accent = false,
}: {
  title: string;
  subtitle?: string;
  items: PantryItemView[];
  today: string;
  accent?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div>
        <h2 className={`text-lg font-semibold ${accent ? "text-brand" : ""}`}>
          {title} <span className="text-muted text-sm font-normal">({items.length})</span>
        </h2>
        {subtitle ? <p className="text-muted text-xs">{subtitle}</p> : null}
      </div>
      <ul className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
        {items.map((item) => (
          // Clé d'idempotence générée côté serveur pour la prochaine action sur ce produit.
          <PantryItemCard key={item.id} item={item} today={today} initialKey={randomUUID()} />
        ))}
      </ul>
    </section>
  );
}
