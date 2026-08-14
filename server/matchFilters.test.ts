import { describe, expect, it } from "vitest";
import { filterMatches } from "@shared/matchFilters";

describe("advanced match filters", () => {
  const matches = [
    { id: 1, athleteAId: 1, athleteBId: 2 },
    { id: 2, athleteAId: 3, athleteBId: 4 },
  ];
  const athletes = [
    { id: 1, fullName: "Ahmed Ali", belt: "Blue" },
    { id: 2, fullName: "Omar Said", belt: "Blue" },
    { id: 3, fullName: "Youssef Karim", belt: "White" },
    { id: 4, fullName: "Hassan Adel", belt: "White" },
  ];
  const registrations = [
    { athleteId: 1, categoryName: "Adult Blue 76 KG", categoryWeightLimit: "76" },
    { athleteId: 2, categoryName: "Adult Blue 76 KG", categoryWeightLimit: "76" },
    { athleteId: 3, categoryName: "Adult White 70 KG", categoryWeightLimit: "70" },
    { athleteId: 4, categoryName: "Adult White 70 KG", categoryWeightLimit: "70" },
  ];

  it("filters by athlete name", () => expect(filterMatches(matches, athletes, registrations, { athleteQuery: "omar" }).map(match => match.id)).toEqual([1]));
  it("filters by belt", () => expect(filterMatches(matches, athletes, registrations, { belt: "White" }).map(match => match.id)).toEqual([2]));
  it("filters by weight category and combines criteria", () => expect(filterMatches(matches, athletes, registrations, { weightCategory: "76", belt: "Blue" }).map(match => match.id)).toEqual([1]));
});
