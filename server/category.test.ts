import { describe, expect, it } from "vitest";
import { calculateAge, poolLabel, resolveCategory, splitIntoPools } from "../shared/category";

describe("resolveCategory", () => {
  it("classifies an adult male black belt in the -77 kg division", () => {
    expect(resolveCategory({ age: 24, gender: "male", belt: "Black", weight: 76.8, sport: "BJJ" })).toMatchObject({ ageGroup: "Adult", weightLimit: 77, name: "Adult / Male / Black / -77 KG" });
  });
  it("classifies juvenile and female divisions", () => {
    expect(resolveCategory({ age: 16, gender: "female", belt: "Blue", weight: 61, sport: "No-Gi" })).toMatchObject({ ageGroup: "Juvenile", weightLimit: 63 });
  });
  it("calculates age at the event date", () => {
    expect(calculateAge("2010-08-14", new Date("2026-08-13T00:00:00Z"))).toBe(15);
    expect(calculateAge("2010-08-13", new Date("2026-08-13T00:00:00Z"))).toBe(16);
  });
  it("splits a category into deterministic pools of four", () => {
    const pools = splitIntoPools([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(pools.map(pool => [pool.name, pool.rows])).toEqual([["Pool A", [1, 2, 3, 4]], ["Pool B", [5, 6, 7, 8]], ["Pool C", [9]]]);
    expect(poolLabel(26)).toBe("Pool AA");
  });
});
