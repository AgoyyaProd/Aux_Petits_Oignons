import type { MetadataRoute } from "next";
import { ICONS_VERSION } from "@/lib/icons";

/** Appli installable sur l'écran d'accueil du téléphone (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aux Petits Oignons",
    short_name: "Petits Oignons",
    description: "Garde-manger, menus de la semaine, liste de courses et budget.",
    lang: "fr",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8ed",
    theme_color: "#142f26",
    categories: ["food", "lifestyle", "productivity"],
    icons: [
      { src: `/icons/icon-192.png?v=${ICONS_VERSION}`, sizes: "192x192", type: "image/png" },
      { src: `/icons/icon-512.png?v=${ICONS_VERSION}`, sizes: "512x512", type: "image/png" },
      {
        src: `/icons/icon-maskable-512.png?v=${ICONS_VERSION}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Liste de courses", url: "/shopping" },
      { name: "Menu de la semaine", url: "/planner" },
    ],
  };
}
