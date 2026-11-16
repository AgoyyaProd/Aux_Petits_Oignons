import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ICONS_VERSION } from "@/lib/icons";
import { THEME_SCRIPT } from "@/lib/theme";
import { SiteAnalytics } from "@/components/analytics/site-analytics";
import { ViewportFix } from "@/components/pwa/viewport-fix";
import { ServiceWorkerSetup } from "@/components/pwa/service-worker";
import { siteUrlFromEnv } from "@/lib/env";
import { SITE } from "@/lib/seo";

const TYPEKIT_CSS = "https://use.typekit.net/pks6mdg.css";

/** Adresse publique, lue au build (les liens absolus des métadonnées en dépendent). */
const SITE_URL = siteUrlFromEnv();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "recettes",
    "recettes du quotidien",
    "menu de la semaine",
    "planning repas",
    "liste de courses",
    "garde-manger",
    "anti-gaspi",
    "budget courses",
    "batch cooking",
  ],
  category: "food",
  creator: SITE.name,
  publisher: SITE.name,
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "default" },
  // ?v= : les navigateurs gardent l'icône d'onglet très longtemps par adresse ; changer
  // ICONS_VERSION (lib/icons) à chaque nouveau logo force son rechargement.
  icons: {
    icon: [
      { url: `/icon.svg?v=${ICONS_VERSION}`, type: "image/svg+xml" },
      // Repli PNG (navigateurs sans icône SVG) : noir sur thème clair, blanc sur thème sombre.
      {
        url: `/icons/icon-32.png?v=${ICONS_VERSION}`,
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: `/icons/icon-32-dark.png?v=${ICONS_VERSION}`,
        sizes: "32x32",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
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
    { media: "(prefers-color-scheme: light)", color: "#142f26" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1c16" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme est posé par le script avant l'hydratation : écart attendu.
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* Polices de la charte (Adobe Fonts) : New Cordial pour les titres, Finder pour le
            texte. Autorisées dans la CSP (next.config.ts). */}
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={TYPEKIT_CSS} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <ServiceWorkerSetup />
        <ViewportFix />
        <SiteAnalytics />
      </body>
    </html>
  );
}
