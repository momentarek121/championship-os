import { describe, expect, it } from "vitest";
import { normalizeAthleteImportRow, previewAthleteImport } from "../shared/athlete-import";

describe("athlete Excel import", () => {
  it("normalizes Arabic headers and previews category and pool placement", () => {
    const row = normalizeAthleteImportRow({ الاسم: "Ahmed Ali", "تاريخ الميلاد": "2010-05-10", النوع: "ذكر", الحزام: "White", الميزان: 30 });
    const preview = previewAthleteImport([row], "gi");
    expect(row).toMatchObject({ fullName: "Ahmed Ali", gender: "male", expectedWeight: 30 });
    expect(preview[0]).toMatchObject({ age: expect.any(Number), categoryName: expect.stringContaining("-77 KG"), pool: "Pool A" });
  });

  it("rejects missing names and non-positive weights", () => {
    expect(() => normalizeAthleteImportRow({ name: "", dob: "2010-01-01", gender: "male", belt: "White", weight: 30 })).toThrow();
    expect(() => normalizeAthleteImportRow({ name: "Valid", dob: "2010-01-01", gender: "male", belt: "White", weight: 0 })).toThrow();
  });
});
