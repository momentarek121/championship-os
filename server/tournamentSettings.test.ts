import { describe, expect, it } from "vitest";
import { normalizeTournamentSettings, setupChecklistReady } from "../shared/tournamentSettings";

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

  it("rejects missing organization names and malformed tolerances", () => {
    expect(() => normalizeTournamentSettings({ organizationName: " ", weighInMode: "custom", weighInTolerance: "0.50", scaleNotes: "" })).toThrow("Organization name is required");
    expect(() => normalizeTournamentSettings({ organizationName: "Event", weighInMode: "custom", weighInTolerance: "half", scaleNotes: "" })).toThrow("Invalid weigh-in tolerance");
  });
});
