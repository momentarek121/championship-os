import { describe, expect, it } from "vitest";
import { buildAutomaticBracketPlan, bracketRoundLabel } from "../shared/automaticBrackets";

const row = (athleteId: number, categoryId: number, seed?: number) => ({ athleteId, categoryId, seed });

describe("automatic bracket planning", () => {
  it("keeps weight/belt/mode categories separate and orders by seed", () => {
    const plan = buildAutomaticBracketPlan([
      row(30, 2, 2), row(20, 2, 1), row(40, 2, 3), row(50, 2, 4),
      row(60, 9, 1), row(70, 9, 2),
    ]);
    expect(plan.map(group => group.categoryId)).toEqual([2, 9]);
    expect(plan[0].matches[0]).toMatchObject({ athleteAId: 20, athleteBId: 40 });
    expect(plan[0].byes).toBe(0);
    expect(plan[1].firstRoundMatchCount).toBe(1);
  });

  it("keeps an odd athlete as a bye slot instead of dropping the athlete", () => {
    const plan = buildAutomaticBracketPlan([row(1, 4, 1), row(2, 4, 2), row(3, 4, 3)]);
    expect(plan[0]).toMatchObject({ athleteCount: 3, slotCount: 4, byes: 1 });
    expect(plan[0].matches).toHaveLength(2);
    expect(plan[0].matches.some(match => match.isBye && match.athleteAId !== null)).toBe(true);
  });

  it("uses competition-ready round labels", () => {
    expect(bracketRoundLabel(8)).toBe("Round of 16");
    expect(bracketRoundLabel(4)).toBe("Quarterfinal");
    expect(bracketRoundLabel(2)).toBe("Semifinal");
  });
});
