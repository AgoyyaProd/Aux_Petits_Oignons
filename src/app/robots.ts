import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { siteUrl } from "@/server/modules/seo/queries";

/**
 * Les moteurs indexent l'accueil et le catalogue de recettes ; les pages du compte, la
 * connexion et les routes techniques restent hors index (elles demandent une session).
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/recipes"],
        disallow: [
          "/api/",
          "/auth/",
          "/apercu",
          "/bienvenue",
          "/hors-ligne",
          "/invitation/",
          "/dashboard",
          "/pantry",
          "/planner",
          "/shopping",
          "/budget",
          "/prices",
          "/settings",
          "/ingredients/",
        ],
      },
    ],
    sitemap: absoluteUrl(base, "/sitemap.xml"),
    host: new URL(base).host,
  };
}
