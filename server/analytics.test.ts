import { describe, expect, it } from "vitest";
import { buildTournamentAnalytics, countByLabel } from "@shared/analytics";

describe("tournament analytics", () => {
  it("counts labels and keeps the largest groups first", () => {
    expect(countByLabel(["-77 KG", "-77 KG", "-70 KG", null])).toEqual([
      { label: "-77 KG", count: 2 },
      { label: "-70 KG", count: 1 },
      { label: "Unassigned", count: 1 },
    ]);
  });

  it("derives registration, belt, match, and mat KPIs from rows", () => {
    const result = buildTournamentAnalytics(
      [
        { categoryName: "Adult · Black · -77 KG", status: "approved", weighInStatus: "passed", paymentStatus: "paid" },
        { categoryName: "Adult · Blue · -77 KG", status: "pending", weighInStatus: "overweight", paymentStatus: "unpaid" },
      ],
      [{ belt: "Black" }, { belt: "Blue" }],
      [{ status: "queued" }, { status: "live" }, { status: "finished" }],
      [{}, {}],
    );
    expect(result.totalRegistrations).toBe(2);
    expect(result.approved).toBe(1);
    expect(result.passedWeighIn).toBe(1);
    expect(result.overweight).toBe(1);
    expect(result.paid).toBe(1);
    expect(result.matches).toEqual({ total: 3, live: 1, finished: 1, queued: 1 });
    expect(result.mats).toBe(2);
    expect(result.belts).toEqual([{ label: "Black", count: 1 }, { label: "Blue", count: 1 }]);
  });
});
