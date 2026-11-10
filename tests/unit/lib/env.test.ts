import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "@/lib/env";

describe("adresse publique du site", () => {
  it("prend la variable explicite en priorité", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://site.fr", VERCEL_ENV: "production" }),
    ).toBe("https://site.fr");
  });

  it("sur Vercel sans variable : l'adresse de production, puis celle de l'aperçu", () => {
    expect(
      resolveSiteUrl({
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "app.vercel.app",
        VERCEL_URL: "app-abc.vercel.app",
      }),
    ).toBe("https://app.vercel.app");
    expect(resolveSiteUrl({ VERCEL_ENV: "preview", VERCEL_URL: "app-abc.vercel.app" })).toBe(
      "https://app-abc.vercel.app",
    );
  });

  it("jamais localhost en silence sur Vercel ; localhost seulement en local", () => {
    expect(resolveSiteUrl({ VERCEL_ENV: "production" })).toBeUndefined();
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});
