import { describe, expect, it } from "vitest";
import { buildBracketSvg } from "../client/src/components/BracketTreeExport";

describe("bracket tree export", () => {
  it("renders filtered match data into a safe SVG", () => {
    const svg = buildBracketSvg({
      tournamentName: "Port Said <Open>",
      mode: "gi",
      matches: [{ id: 1, round: "Semifinal", matchNumber: 1, athleteAId: 10, athleteBId: 11, status: "queued" }],
      athleteName: id => id === 10 ? "Ahmed & Omar" : id === 11 ? "Player B" : "Open slot",
    });
    expect(svg).toContain("Port Said &lt;Open&gt;");
    expect(svg).toContain("Ahmed &amp; Omar");
    expect(svg).toContain("Semifinal");
    expect(svg).toContain("Match 1");
  });
});
