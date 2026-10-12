"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { browserSupabase } from "@/lib/supabase-browser";

/**
 * Liste partagée en direct : écoute le canal privé du foyer et recharge la liste quand un
 * autre membre coche, décoche, ajoute ou retire un article de cette semaine. Le signal ne
 * transporte aucune donnée ; la liste est relue avec les droits habituels (RLS).
 * Au retour sur l'onglet, la liste est aussi relue (signal manqué pendant la veille).
 */
export function ShoppingLiveRefresh({ householdId, week }: { householdId: string; week: string }) {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const supabase = browserSupabase();
    const refresh = () => {
      if (timer.current) window.clearTimeout(timer.current);
      // Regroupe une rafale de coches en une seule relecture.
      timer.current = window.setTimeout(() => router.refresh(), 400);
    };
    let cancelled = false;
    const channel = supabase.channel(`household:${householdId}`, {
      config: { private: true },
    });
    void supabase.realtime.setAuth().then(() => {
      if (cancelled) return;
      channel
        .on("broadcast", { event: "shopping" }, (msg) => {
          const payload = msg.payload as { week?: string } | undefined;
          if (!payload?.week || payload.week === week) refresh();
        })
        .subscribe((status) => setLive(status === "SUBSCRIBED"));
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (timer.current) window.clearTimeout(timer.current);
      void supabase.removeChannel(channel);
    };
  }, [householdId, week, router]);

  return live ? (
    <span className="text-success inline-flex items-center gap-1.5 text-xs font-medium">
      <span aria-hidden="true" className="bg-success size-2 animate-pulse rounded-full" />
      Partagée en direct avec ton foyer
    </span>
  ) : null;
}
