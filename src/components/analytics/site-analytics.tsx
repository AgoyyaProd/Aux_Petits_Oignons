"use client";

import { Analytics } from "@vercel/analytics/next";
import { analyticsUrl } from "@/lib/seo";

/**
 * Vercel Web Analytics (sans cookie). Les adresses sont nettoyées avant l'envoi : ni jeton
 * d'invitation, ni code de connexion, ni recherche saisie.
 */
export function SiteAnalytics() {
  return <Analytics beforeSend={(event) => ({ ...event, url: analyticsUrl(event.url) })} />;
}
