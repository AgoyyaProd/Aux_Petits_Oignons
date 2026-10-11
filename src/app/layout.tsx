import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/plus-jakarta-sans/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aux Petits Oignons", template: "%s · Aux Petits Oignons" },
  description:
    "La cuisine du quotidien, bien pensée : garde-manger, menus de la semaine, liste de courses et budget au même endroit.",
  applicationName: "Aux Petits Oignons",
  appleWebApp: { capable: true, title: "Petits Oignons", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1c16" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
