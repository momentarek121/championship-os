import { describe, expect, it } from "vitest";
import { buildRegistrationExportRows, filterRegistrationRows } from "@shared/registrationList";

describe("registration list filters and exports", () => {
  const athletes = [
    { id: 1, fullName: "Ahmed Ali", belt: "Blue", expectedWeight: "76.4", gender: "male" },
    { id: 2, fullName: "Mona Hassan", belt: "White", expectedWeight: "62.0", gender: "female" },
  ];
  const registrations = [
    { id: 10, athleteId: 1, categoryName: "Adult / Male / Blue / -77 KG", pool: "Pool A", status: "approved", paymentStatus: "paid", checkInStatus: "checked_in", accreditationCode: "ATH-1" },
    { id: 11, athleteId: 2, categoryName: "Adult / Female / White / -63 KG", pool: "Pool B", status: "pending", paymentStatus: "unpaid", checkInStatus: "not_checked_in", accreditationCode: "ATH-2" },
  ];

  it("filters by athlete name, belt, weight category, and category", () => {
    expect(filterRegistrationRows(registrations, athletes, { search: "mona" })).toHaveLength(1);
    expect(filterRegistrationRows(registrations, athletes, { belt: "Blue" })[0].athleteId).toBe(1);
    expect(filterRegistrationRows(registrations, athletes, { weightCategory: "Adult / Female / White / -63 KG" })[0].athleteId).toBe(2);
    expect(filterRegistrationRows(registrations, athletes, { category: "Adult / Male / Blue / -77 KG" })[0].athleteId).toBe(1);
  });

  it("normalizes rows for export with athlete and registration fields", () => {
    expect(buildRegistrationExportRows(registrations, athletes)).toEqual([
      expect.objectContaining({ athleteName: "Ahmed Ali", belt: "Blue", weight: "76.4", pool: "Pool A", accreditationCode: "ATH-1" }),
      expect.objectContaining({ athleteName: "Mona Hassan", belt: "White", weight: "62.0", pool: "Pool B", accreditationCode: "ATH-2" }),
    ]);
  });

  it("uses safe fallback values when athlete details are missing", () => {
    const [row] = buildRegistrationExportRows([{ athleteId: 99, categoryWeightLimit: "-70 KG" }], []);
    expect(row).toMatchObject({ athleteName: "Athlete #99", belt: "—", weight: "-70 KG", category: "Unassigned", pool: "Unassigned" });
  });
});
