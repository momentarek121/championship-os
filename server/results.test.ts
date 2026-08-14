import { describe, expect, it } from "vitest";
import { selectMedalResults } from "../shared/results";

describe("selectMedalResults", () => {
  it("derives gold, silver, and bronze from finished final and semifinal matches", () => {
    expect(selectMedalResults([
      { categoryId: 1, round: "Semifinal", matchNumber: 1, athleteAId: 1, athleteBId: 2, winnerId: 1, status: "finished" },
      { categoryId: 1, round: "Semifinal", matchNumber: 2, athleteAId: 3, athleteBId: 4, winnerId: 3, status: "finished" },
      { categoryId: 1, round: "Final", matchNumber: 3, athleteAId: 1, athleteBId: 3, winnerId: 1, status: "finished" },
    ])).toEqual([{ categoryId: 1, goldId: 1, silverId: 3, bronzeIds: [2, 4] }]);
  });

  it("derives medals from generated Round N names", () => {
    expect(selectMedalResults([
      { categoryId: 3, round: "Round 1", matchNumber: 1, athleteAId: 10, athleteBId: 11, winnerId: 10, status: "finished" },
      { categoryId: 3, round: "Round 1", matchNumber: 2, athleteAId: 12, athleteBId: 13, winnerId: 12, status: "finished" },
      { categoryId: 3, round: "Round 2", matchNumber: 3, athleteAId: 10, athleteBId: 12, winnerId: 12, status: "finished" },
    ])).toEqual([{ categoryId: 3, goldId: 12, silverId: 10, bronzeIds: [11, 13] }]);
  });

  it("does not publish results from queued or unfinished matches", () => {
    expect(selectMedalResults([{ categoryId: 2, round: "Final", matchNumber: 1, athleteAId: 5, athleteBId: 6, winnerId: null, status: "queued" }])).toEqual([]);
  });
});
