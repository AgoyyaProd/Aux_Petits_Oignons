import { describe, expect, it } from "vitest";
import { isPublicPath, safeRedirectPath } from "@/lib/routes";

describe("safeRedirectPath (protection contre les redirections ouvertes)", () => {
  it.each([
    ["/planner", "/planner"],
    ["/planner?week=2026-10-12", "/planner?week=2026-10-12"],
    ["/recipes/abc#steps", "/recipes/abc#steps"],
    ["/a/../dashboard", "/dashboard"],
  ])("accepte le chemin interne %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    ["URL absolue", "https://evil.example/phish"],
    ["URL sans schéma", "//evil.example"],
    ["barre oblique inverse", "/\\evil.example"],
    ["schéma javascript", "javascript:alert(1)"],
    ["chemin relatif", "dashboard"],
    ["caractère de contrôle", "/dash\nboard"],
    ["chaîne vide", ""],
    ["valeur non textuelle", ["/dashboard"]],
    ["undefined", undefined],
  ])("refuse : %s", (_label, input) => {
    expect(safeRedirectPath(input)).toBe("/dashboard");
  });

  it("utilise le repli fourni", () => {
    expect(safeRedirectPath("https://x.y", "/login")).toBe("/login");
  });
});

describe("isPublicPath", () => {
  it.each(["/", "/login", "/signup", "/auth/callback"])("%s est public", (p) => {
    expect(isPublicPath(p)).toBe(true);
  });
  it.each(["/dashboard", "/pantry", "/loginx", "/authx", "/api/ai/suggest"])(
    "%s est protégé",
    (p) => {
      expect(isPublicPath(p)).toBe(false);
    },
  );
});
