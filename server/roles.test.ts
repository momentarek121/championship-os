import { describe, expect, it } from "vitest";
import { canUpdateRegistrationFields } from "../shared/registrationPermissions";
import { canRole, roleCapabilities } from "../shared/roles";

describe("tournament role matrix", () => {
  it("grants each operational staff role only its intended capabilities", () => {
    expect(canRole("registration_staff", "registration")).toBe(true);
    expect(canRole("registration_staff", "scoring")).toBe(false);
    expect(canRole("weighin_staff", "weigh_in")).toBe(true);
    expect(canRole("weighin_staff", "brackets")).toBe(false);
    expect(canRole("referee", "scoring")).toBe(true);
    expect(canRole("referee", "registration")).toBe(false);
    expect(canRole("mat_manager", "brackets")).toBe(true);
  });

  it("keeps athletes outside staff procedures while allowing the code-based portal capability", () => {
    expect(canRole("athlete", "athlete_portal")).toBe(true);
    expect(canRole("athlete", "dashboard")).toBe(false);
    expect(roleCapabilities("athlete")).toEqual(["athlete_portal"]);
  });

  it("restricts registration updates by staff function", () => {
    expect(canUpdateRegistrationFields("registration_staff", { paymentStatus: "paid", checkInStatus: "checked_in" })).toBe(true);
    expect(canUpdateRegistrationFields("registration_staff", { weighInStatus: "passed" })).toBe(false);
    expect(canUpdateRegistrationFields("weighin_staff", { weighInStatus: "passed", weighInNotes: "Scale 1" })).toBe(true);
    expect(canUpdateRegistrationFields("weighin_staff", { paymentStatus: "paid" })).toBe(false);
    expect(canUpdateRegistrationFields("referee", { status: "approved" })).toBe(false);
  });

  it("treats unknown roles as having no capability", () => {
    expect(canRole("unknown", "dashboard")).toBe(false);
    expect(roleCapabilities(null)).toEqual([]);
  });
});
