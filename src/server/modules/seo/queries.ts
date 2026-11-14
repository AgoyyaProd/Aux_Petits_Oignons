import "server-only";
import { cacheLife } from "next/cache";
import { publicEnv } from "@/lib/env";
import { recipeImage } from "@/lib/images";
import { absoluteUrl, metaDescription, SITE } from "@/lib/seo";
import { fetchAll } from "@/server/supabase/fetch-all";
import { createSupabasePublicClient } from "@/server/supabase/public";

/** Adresse publique du site (production : NEXT_PUBLIC_SITE_URL ou l'adresse Vercel). */
export function siteUrl(): string {
  return publicEnv().NEXT_PUBLIC_SITE_URL;
}

/** Recettes publiées, pour le plan du site. Lecture anonyme, en cache une heure. */
export async function listPublicRecipes(): Promise<{ slug: string }[]> {
  "use cache";
  cacheLife("hours");
  const supabase = createSupabasePublicClient();
  const rows = await fetchAll(
    (from, to) =>
      supabase
        .from("recipes")
        .select("slug")
        .eq("status", "published")
        .order("slug")
        .range(from, to),
    "des recettes publiées",
  );
  return rows.map((r) => ({ slug: r.slug }));
}

export interface RecipeSeo {
  title: string;
  description: string;
  /** Photo de la recette, adresse absolue, ou null. */
  image: string | null;
}

/** Titre, description et photo d'une recette publiée, pour les métadonnées de sa page. */
export async function getRecipeSeo(slug: string): Promise<RecipeSeo | null> {
  "use cache";
  cacheLife("hours");
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("title, description, servings, prep_minutes, cook_minutes, rest_minutes")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Lecture de la recette impossible : ${error.message}`);
  if (!data) return null;
  const total = data.prep_minutes + data.cook_minutes + data.rest_minutes;
  const facts = `Recette pour ${data.servings} personne${data.servings > 1 ? "s" : ""}, prête en ${total} min, ingrédients et étapes détaillés.`;
  const photo = recipeImage(slug);
  return {
    title: data.title,
    description: metaDescription(
      data.description ? `${data.description} ${facts}` : `${data.title}. ${facts} ${SITE.name}.`,
    ),
    image: photo ? absoluteUrl(siteUrl(), photo) : null,
  };
}
