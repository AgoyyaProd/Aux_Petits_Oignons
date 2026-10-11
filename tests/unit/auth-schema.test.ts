import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema, toFieldErrors } from "@/server/modules/auth/schema";

describe("signUpSchema", () => {
  it("normalise l'e-mail et ignore un pseudo vide", () => {
    const parsed = signUpSchema.parse({
      email: "  Alice@Example.FR ",
      password: "motdepasse1",
      displayName: "  ",
    });
    expect(parsed).toEqual({
      email: "alice@example.fr",
      password: "motdepasse1",
      displayName: undefined,
    });
  });

  it.each([
    ["trop court", "abc123"],
    ["sans chiffre", "motdepasse"],
    ["sans lettre", "12345678"],
  ])("refuse un mot de passe %s", (_label, password) => {
    const result = signUpSchema.safeParse({ email: "a@b.fr", password });
    expect(result.success).toBe(false);
    if (!result.success) expect(toFieldErrors(result.error)?.password).toBeDefined();
  });

  it("refuse une adresse invalide avec un message en français", () => {
    const result = signUpSchema.safeParse({ email: "pas-un-mail", password: "motdepasse1" });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(toFieldErrors(result.error)?.email).toBe("Adresse e-mail invalide.");
  });

  it("limite le pseudo à 80 caractères", () => {
    const result = signUpSchema.safeParse({
      email: "a@b.fr",
      password: "motdepasse1",
      displayName: "x".repeat(81),
    });
    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("n'impose pas les règles de complexité à la connexion", () => {
    expect(signInSchema.safeParse({ email: "a@b.fr", password: "ancien" }).success).toBe(true);
  });
  it("exige un mot de passe", () => {
    expect(signInSchema.safeParse({ email: "a@b.fr", password: "" }).success).toBe(false);
  });
});
