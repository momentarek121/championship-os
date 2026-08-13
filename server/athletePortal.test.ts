import { describe, expect, it } from "vitest";
import { selectNextMatch } from "../shared/athletePortal";

describe("athlete portal next match", () => {
  it("selects the lowest-numbered unfinished match", () => {
    const result = selectNextMatch([
      { matchNumber: 3, status: "queued" },
      { matchNumber: 1, status: "finished" },
      { matchNumber: 2, status: "called" },
    ]);
    expect(result?.matchNumber).toBe(2);
  });

  it("returns undefined when all matches are complete or no-show", () => {
    expect(selectNextMatch([{ matchNumber: 1, status: "finished" }, { matchNumber: 2, status: "no_show" }])).toBeUndefined();
  });
});
