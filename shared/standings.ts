export type StandingsRow = { academy: string; wins: number; gold: number; silver: number; bronze: number; matches: number };

export function calculateAcademyStandings(rows: Array<{ academy?: string | null; winner?: boolean; medal?: "gold" | "silver" | "bronze" | null }>) {
  const grouped = new Map<string, StandingsRow>();
  for (const row of rows) {
    const academy = row.academy?.trim() || "Unattached";
    const current = grouped.get(academy) ?? { academy, wins: 0, gold: 0, silver: 0, bronze: 0, matches: 0 };
    current.matches += 1;
    if (row.winner) current.wins += 1;
    if (row.medal === "gold") current.gold += 1;
    if (row.medal === "silver") current.silver += 1;
    if (row.medal === "bronze") current.bronze += 1;
    grouped.set(academy, current);
  }
  return Array.from(grouped.values()).sort((a, b) => (b.gold - a.gold) || (b.silver - a.silver) || (b.bronze - a.bronze) || (b.wins - a.wins) || (a.academy.localeCompare(b.academy)));
}
