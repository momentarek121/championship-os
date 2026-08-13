import { describe, expect, it } from "vitest";
import { selectBracketEligible, selectWeighInQueue } from "../shared/operationFlow";
import { buildBracketPairs } from "../shared/bracket";

describe("organizer operation flow", () => {
  it("moves only approved registrations into the selected weigh-in queue", () => {
    const rows = [
      { id: 1, status: "pending" as const, categoryName: "Adult / Male / White / 76 KG" },
      { id: 2, status: "approved" as const, categoryName: "Adult / Male / White / 76 KG" },
      { id: 3, status: "approved" as const, categoryName: "Adult / Female / White / 64 KG" },
    ];
    expect(selectWeighInQueue(rows, "Adult / Male / White / 76 KG").map(row => row.id)).toEqual([2]);
    expect(selectWeighInQueue(rows).map(row => row.id)).toEqual([2, 3]);
  });

  it("filters mixed registrations before pairing so only passed athletes enter brackets", () => {
    const mixed = [
      { id: 1, athleteId: 101, categoryId: 10, status: "pending" as const, weighInStatus: "pending" as const, seed: 1 },
      { id: 2, athleteId: 102, categoryId: 10, status: "approved" as const, weighInStatus: "passed" as const, seed: 2 },
      { id: 3, athleteId: 103, categoryId: 10, status: "approved" as const, weighInStatus: "overweight" as const, seed: 3 },
      { id: 4, athleteId: 104, categoryId: 10, status: "approved" as const, weighInStatus: "passed" as const, seed: 4 },
    ];
    expect(buildBracketPairs(selectBracketEligible(mixed))).toEqual([{ categoryId: 10, athleteAId: 102, athleteBId: 104 }]);
  });

  it("pairs eligible bracket candidates by category and seed", () => {
    const pairs = buildBracketPairs([
      { athleteId: 4, categoryId: 10, seed: 2 },
      { athleteId: 1, categoryId: 10, seed: 1 },
      { athleteId: 7, categoryId: 20, seed: 1 },
      { athleteId: 8, categoryId: 20, seed: 2 },
      { athleteId: 9, categoryId: 30, seed: 1 },
    ]);
    expect(pairs).toEqual([
      { categoryId: 10, athleteAId: 1, athleteBId: 4 },
      { categoryId: 20, athleteAId: 7, athleteBId: 8 },
    ]);
  });

  it("makes only approved athletes who passed weigh-in eligible for brackets", () => {
    const rows = [
      { id: 1, status: "pending" as const, weighInStatus: "pending" as const },
      { id: 2, status: "approved" as const, weighInStatus: "pending" as const },
      { id: 3, status: "approved" as const, weighInStatus: "passed" as const },
      { id: 4, status: "approved" as const, weighInStatus: "overweight" as const },
    ];
    expect(selectBracketEligible(rows).map(row => row.id)).toEqual([3]);
  });
});
