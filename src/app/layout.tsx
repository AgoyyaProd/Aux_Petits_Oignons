import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/inter/index.css";
import "./globals.css";
import { ICONS_VERSION } from "@/lib/icons";
import { THEME_SCRIPT } from "@/lib/theme";
import { ServiceWorkerSetup } from "@/components/pwa/service-worker";

export const metadata: Metadata = {
  title: { default: "Aux Petits Oignons", template: "%s · Aux Petits Oignons" },
  description:
    "La cuisine du quotidien, bien pensée : garde-manger, menus de la semaine, liste de courses et budget au même endroit.",
  applicationName: "Aux Petits Oignons",
  appleWebApp: { capable: true, title: "Petits Oignons", statusBarStyle: "default" },
  // ?v= : les navigateurs gardent l'icône d'onglet très longtemps par adresse ; changer
  // ICONS_VERSION (lib/icons) à chaque nouveau logo force son rechargement.
  icons: {
    icon: [
      { url: `/icon.svg?v=${ICONS_VERSION}`, type: "image/svg+xml" },
      { url: `/icons/icon-32.png?v=${ICONS_VERSION}`, sizes: "32x32", type: "image/png" },
    ],
    shortcut: [{ url: `/favicon.ico?v=${ICONS_VERSION}` }],
    apple: [{ url: `/icons/apple-touch-icon.png?v=${ICONS_VERSION}`, sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1c16" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme est posé par le script avant l'hydratation : écart attendu.
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <ServiceWorkerSetup />
      </body>
    </html>
  );
}
