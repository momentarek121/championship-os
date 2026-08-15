import { describe, expect, it } from "vitest";
import { importedAthleteRowSchema, importedAthleteRowsSchema } from "@shared/athleteImport";

describe("athlete import contract", () => {
  it("accepts a bracket-ready athlete row", () => {
    const result = importedAthleteRowSchema.safeParse({ fullName: "Ahmed Ali", email: "", phone: "+2010", dateOfBirth: "2012-04-05", gender: "male", belt: "Grey", expectedWeight: 42.5 });
    expect(result.success).toBe(true);
  });
  it("rejects invalid weight and missing birth date", () => {
    const result = importedAthleteRowSchema.safeParse({ fullName: "A", dateOfBirth: "", gender: "male", belt: "White", expectedWeight: 0 });
    expect(result.success).toBe(false);
  });
  it("limits one import to 500 rows", () => {
    const row = { fullName: "Athlete", email: "", phone: "", dateOfBirth: "2010-01-01", gender: "male" as const, belt: "White", expectedWeight: 50 };
    expect(importedAthleteRowsSchema.safeParse(Array.from({ length: 500 }, () => row)).success).toBe(true);
    expect(importedAthleteRowsSchema.safeParse(Array.from({ length: 501 }, () => row)).success).toBe(false);
  });
});
