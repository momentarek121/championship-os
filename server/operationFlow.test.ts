import { describe, expect, it } from "vitest";
import { selectBracketEligible, selectWeighInQueue } from "../shared/operationFlow";

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
