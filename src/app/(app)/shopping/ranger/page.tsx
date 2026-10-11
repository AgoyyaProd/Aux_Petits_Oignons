import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PutAwayForm, type PutAwayLine } from "@/components/shopping/put-away-form";
import { PageSkeleton } from "@/components/ui/skeleton";
import { suggestPutAway } from "@/lib/format-quantity";
import { defaultLocation, getShoppingPage } from "@/server/modules/shopping/queries";

export const metadata: Metadata = { title: "Finir les courses" };
export const maxDuration = 30;

export default function PutAwayRoute({ searchParams }: PageProps<"/shopping/ranger">) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="type-page">Finir les courses</h1>
        <p className="text-muted text-sm">
          Les produits cochés sont rangés au garde-manger : ajuste les quantités réellement achetées
          (un paquet de 500 g plutôt que les 375 g nécessaires, par exemple), l&apos;emplacement et,
          si tu veux, la date limite. Ensuite, tu pourras marquer tes plats « Cuisiné ».
        </p>
      </div>
      <Suspense fallback={<PageSkeleton rows={4} />}>
        <PutAwayContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PutAwayContent({
  searchParams,
}: Pick<PageProps<"/shopping/ranger">, "searchParams">) {
  const sp = await searchParams;
  const page = await getShoppingPage(typeof sp.semaine === "string" ? sp.semaine : undefined);
  if (!page) return <p className="text-muted">Aucun foyer actif.</p>;
  const back = (
    <Link href={`/shopping?semaine=${page.weekStart}`} className="text-brand text-sm font-medium">
      ← Liste de courses
    </Link>
  );
  if (!("aisles" in page)) {
    return (
      <>
        {back}
        <p className="text-muted text-sm">Aucun menu pour cette semaine.</p>
      </>
    );
  }
  const all = page.aisles.flatMap((a) => a.lines);
  const anyChecked = all.some((l) => l.checked);
  const lines: PutAwayLine[] = all
    .sort((a, b) => Number(b.checked) - Number(a.checked))
    .map((l) => {
      const { value, unit } = suggestPutAway(l.toBuy);
      return {
        ingredientId: l.ingredientId,
        name: l.name,
        dimension: l.dimension,
        value,
        unit,
        location: defaultLocation(l.category),
        include: anyChecked ? l.checked : true,
      };
    });
  return (
    <>
      {back}
      <PutAwayForm week={page.weekStart} formKey={page.newKey()} lines={lines} />
    </>
  );
}
