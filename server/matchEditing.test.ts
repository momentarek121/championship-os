import { describe, expect, it } from "vitest";
import { canEditMatchSlots, validateMatchSlots } from "../shared/matchEditing";

describe("match slot editing", () => {
  it("allows queued, called, live, and no-show slots to be adjusted", () => {
    expect(canEditMatchSlots("queued")).toBe(true);
    expect(canEditMatchSlots("called")).toBe(true);
    expect(canEditMatchSlots("live")).toBe(true);
    expect(canEditMatchSlots("no_show")).toBe(true);
    expect(canEditMatchSlots("finished")).toBe(false);
  });

  it("allows empty placeholders and distinct athletes", () => {
    expect(validateMatchSlots(null, 12).ok).toBe(true);
    expect(validateMatchSlots(12, null).ok).toBe(true);
    expect(validateMatchSlots(12, 13).ok).toBe(true);
  });

  it("rejects the same athlete in both slots", () => {
    expect(validateMatchSlots(12, 12)).toEqual({ ok: false, reason: "A match cannot contain the same athlete twice" });
  });

  it("rejects an athlete outside the match category or mode", () => {
    expect(validateMatchSlots(12, 13, new Set([12, 14]))).toEqual({ ok: false, reason: "Athlete must belong to the match category and competition mode" });
    expect(validateMatchSlots(12, 14, new Set([12, 14])).ok).toBe(true);
  });
});
