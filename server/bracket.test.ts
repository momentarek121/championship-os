import { describe, expect, it } from "vitest";
import { applyWinnerToNextMatch, nextBracketSlot, nextRoundMatchCount } from "../shared/bracket";

describe("bracket advancement", () => {
  it("maps the first feeder to side A of the next match", () => {
    expect(nextBracketSlot("Round 1", 1)).toEqual({ round: "Round 2", matchNumber: 1, slot: "athleteAId" });
  });

  it("maps the second feeder to side B of the next match", () => {
    expect(nextBracketSlot("Round 1", 2)).toEqual({ round: "Round 2", matchNumber: 1, slot: "athleteBId" });
  });

  it("plans the next round for generated feeder matches", () => {
    expect(nextRoundMatchCount(2)).toBe(1);
    expect(nextRoundMatchCount(3)).toBe(2);
    expect(nextRoundMatchCount(1)).toBe(0);
  });

  it("advances a finished feeder winner into the queued next-round record", () => {
    const result = applyWinnerToNextMatch([
      { id: 10, round: "Round 1", matchNumber: 1, athleteAId: 101, athleteBId: 102, status: "finished" },
      { id: 11, round: "Round 1", matchNumber: 2, athleteAId: 103, athleteBId: 104, status: "finished" },
      { id: 12, round: "Round 2", matchNumber: 1, athleteAId: null, athleteBId: null, status: "queued" },
    ], { round: "Round 1", matchNumber: 1 }, 101);
    expect(result.advancedTo).toBe(12);
    expect(result.matches.find(match => match.id === 12)?.athleteAId).toBe(101);
  });

  it("does not advance malformed or final-round labels", () => {
    expect(nextBracketSlot("Final", 1)).toBeNull();
    expect(nextBracketSlot("Round 2", 0)).toBeNull();
  });
});
