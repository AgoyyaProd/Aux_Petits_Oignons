import { jsonLdScript } from "@/lib/seo";

/** Données structurées schema.org (lues par les moteurs de recherche). */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Contenu généré par le site, « < » échappé (voir jsonLdScript).
      dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
    />
  );
}
