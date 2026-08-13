import { describe, expect, it } from "vitest";
import { resolveCategory } from "../shared/category";

describe("resolveCategory", () => {
  it("classifies an adult male black belt in the -77 kg division", () => {
    expect(resolveCategory({ age: 24, gender: "male", belt: "Black", weight: 76.8, sport: "BJJ" })).toMatchObject({ ageGroup: "Adult", weightLimit: 77, name: "Adult / Male / Black / -77 KG" });
  });
  it("classifies juvenile and female divisions", () => {
    expect(resolveCategory({ age: 16, gender: "female", belt: "Blue", weight: 61, sport: "No-Gi" })).toMatchObject({ ageGroup: "Juvenile", weightLimit: 63 });
  });
});
