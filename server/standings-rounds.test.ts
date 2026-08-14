import { describe, expect, it } from "vitest";
import { nextRoundLabel, roundLabel } from "@shared/rounds";
import { calculateAcademyStandings } from "@shared/standings";

describe("named tournament rounds", () => {
  it("uses real stage names", () => {
    expect(roundLabel(8)).toBe("Round of 16");
    expect(roundLabel(4)).toBe("Quarterfinal");
    expect(roundLabel(2)).toBe("Semifinal");
    expect(roundLabel(1)).toBe("Final");
    expect(nextRoundLabel("Quarterfinal")).toBe("Semifinal");
  });
});

describe("academy standings", () => {
  it("sorts by medals then wins and uses Unattached safely", () => {
    expect(calculateAcademyStandings([
      { academy: "Alpha", winner: true, medal: "silver" },
      { academy: "Alpha", winner: true, medal: "gold" },
      { academy: "Beta", winner: true, medal: "gold" },
      { academy: null, winner: false, medal: "bronze" },
    ]).map(row => row.academy)).toEqual(["Alpha", "Beta", "Unattached"]);
  });
});
