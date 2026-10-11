import { describe, expect, it } from "vitest";
import { addDays, formatWeek, isIsoDate, isMonday, mondayOf } from "@/lib/week";

describe("semaines", () => {
  it.each([
    ["2026-10-11", "2026-10-05"], // dimanche
    ["2026-10-12", "2026-10-12"], // lundi
    ["2026-10-14", "2026-10-12"],
    ["2027-01-01", "2026-12-28"], // à cheval sur deux années
  ])("lundi de %s = %s", (day, monday) => {
    expect(mondayOf(day)).toBe(monday);
  });

  it("valide les dates et les lundis", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-10-12")).toBe(true);
    expect(isMonday("2026-10-12")).toBe(true);
    expect(isMonday("2026-10-13")).toBe(false);
    expect(addDays("2026-10-26", 7)).toBe("2026-11-02");
  });

  it("libellé lisible", () => {
    expect(formatWeek("2026-10-12")).toBe("Semaine du 12 au 18 octobre");
    expect(formatWeek("2026-10-26")).toBe("Semaine du 26 octobre au 1er novembre");
    expect(formatWeek("2026-06-01")).toBe("Semaine du 1er au 7 juin");
  });
});
