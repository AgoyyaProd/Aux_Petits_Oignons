import { describe, expect, it } from "vitest";
import {
  invitationTokenSchema,
  inviteSchema,
  memberSchema,
} from "@/server/modules/households/schema";

const householdId = "6f1c1c5e-3b9a-4a43-9d5e-0b7b8f1d2c3a";

describe("invitations", () => {
  it("normalise l'adresse e-mail invitée", () => {
    const parsed = inviteSchema.parse({ householdId, email: "  Alice@Exemple.FR " });
    expect(parsed.email).toBe("alice@exemple.fr");
  });

  it("refuse une adresse invalide", () => {
    const parsed = inviteSchema.safeParse({ householdId, email: "alice" });
    expect(parsed.success).toBe(false);
  });

  it("n'accepte qu'un jeton de 64 caractères hexadécimaux", () => {
    expect(invitationTokenSchema.safeParse("a".repeat(64)).success).toBe(true);
    expect(invitationTokenSchema.safeParse("A".repeat(64)).success).toBe(false);
    expect(invitationTokenSchema.safeParse("a".repeat(63)).success).toBe(false);
    expect(invitationTokenSchema.safeParse("../" + "a".repeat(61)).success).toBe(false);
  });

  it("exige des identifiants valides pour retirer un membre", () => {
    expect(memberSchema.safeParse({ householdId, userId: "x" }).success).toBe(false);
    expect(memberSchema.safeParse({ householdId, userId: householdId }).success).toBe(true);
  });
});
