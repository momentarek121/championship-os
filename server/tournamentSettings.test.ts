import { describe, expect, it } from "vitest";
import { formatBeltPolicyNote, normalizeTournamentSettings, setupChecklistReady } from "../shared/tournamentSettings";
import { resolveCategory } from "../shared/category";

describe("tournament settings", () => {
  it("normalizes persisted organizer settings and scale notes", () => {
    const settings = normalizeTournamentSettings({
      organizationName: "  Egypt BJJ  ",
      weighInMode: "ibjjf",
      weighInTolerance: "",
      scaleNotes: "  Scale 1 beside registration desk  ",
    });
    expect(settings).toEqual({
      organizationName: "Egypt BJJ",
      weighInMode: "ibjjf",
      weighInTolerance: "0.00",
      scaleNotes: "Scale 1 beside registration desk",
    });
    expect(setupChecklistReady(settings)).toBe(true);
  });

  it("formats selected belt policy notes, including children bands", () => {
    expect(formatBeltPolicyNote(["No belt", "White", "Grey", "Black"])).toBe("Belt policy: No belt, White, Grey, Black; children may use organization-defined belt bands.");
    expect(formatBeltPolicyNote()).toContain("No belt, White, Blue, Purple, Brown, Black");
  });

  it("separates GI, No-Gi, and Both category labels", () => {
    const input = { age: 24, gender: "male" as const, belt: "Blue", weight: 76, sport: "BJJ" };
    expect(resolveCategory({ ...input, competitionMode: "gi" }).name).toContain("/ GI /");
    expect(resolveCategory({ ...input, competitionMode: "nogi" }).name).toContain("/ No-Gi /");
    expect(resolveCategory({ ...input, competitionMode: "both" }).name).toContain("/ GI + No-Gi /");
  });

  it("rejects missing organization names and malformed tolerances", () => {
    expect(() => normalizeTournamentSettings({ organizationName: " ", weighInMode: "custom", weighInTolerance: "0.50", scaleNotes: "" })).toThrow("Organization name is required");
    expect(() => normalizeTournamentSettings({ organizationName: "Event", weighInMode: "custom", weighInTolerance: "half", scaleNotes: "" })).toThrow("Invalid weigh-in tolerance");
  });
});
