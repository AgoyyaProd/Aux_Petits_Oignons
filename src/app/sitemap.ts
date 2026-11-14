import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { recipeImage } from "@/lib/images";
import { absoluteUrl } from "@/lib/seo";
import { listPublicRecipes, siteUrl } from "@/server/modules/seo/queries";

/** Plan du site : accueil, catalogue et chaque recette publiée (avec sa photo). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Lu à la demande (la liste reste en cache une heure) : pas de base de données au build.
  await connection();
  const base = siteUrl();
  const recipes = await listPublicRecipes();
  return [
    { url: absoluteUrl(base, "/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl(base, "/recipes"), changeFrequency: "daily", priority: 0.9 },
    ...recipes.map((r) => {
      const photo = recipeImage(r.slug);
      return {
        url: absoluteUrl(base, `/recipes/${r.slug}`),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        ...(photo ? { images: [absoluteUrl(base, photo)] } : {}),
      };
    }),
  ];
}
