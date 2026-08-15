export type AutomaticBracketRow = {
  athleteId: number;
  categoryId: number | null;
  seed?: number | null;
};

export type PlannedFirstRoundMatch = {
  categoryId: number;
  matchNumber: number;
  athleteAId: number | null;
  athleteBId: number | null;
  isBye: boolean;
};

export type AutomaticBracketGroup = {
  categoryId: number;
  athleteCount: number;
  slotCount: number;
  firstRoundMatchCount: number;
  byes: number;
  matches: PlannedFirstRoundMatch[];
};

function nextPowerOfTwo(value: number) {
  let result = 1;
  while (result < value) result *= 2;
  return result;
}

export function buildAutomaticBracketPlan<T extends AutomaticBracketRow>(rows: T[]): AutomaticBracketGroup[] {
  const grouped = new Map<number, T[]>();
  for (const row of rows) {
    if (row.categoryId == null) continue;
    grouped.set(row.categoryId, [...(grouped.get(row.categoryId) ?? []), row]);
  }

  return Array.from(grouped.entries()).sort(([left], [right]) => left - right).flatMap(([categoryId, categoryRows]) => {
    const ordered = [...categoryRows].sort((a, b) => (a.seed ?? Number.MAX_SAFE_INTEGER) - (b.seed ?? Number.MAX_SAFE_INTEGER) || a.athleteId - b.athleteId);
    if (ordered.length < 2) return [];
    const slotCount = nextPowerOfTwo(ordered.length);
    const firstRoundMatchCount = slotCount / 2;
    const matches: PlannedFirstRoundMatch[] = [];
    for (let index = 0; index < firstRoundMatchCount; index += 1) {
      const athleteAId = ordered[index]?.athleteId ?? null;
      const athleteBId = ordered[index + firstRoundMatchCount]?.athleteId ?? null;
      matches.push({ categoryId, matchNumber: index + 1, athleteAId, athleteBId, isBye: athleteAId == null || athleteBId == null });
    }
    return [{ categoryId, athleteCount: ordered.length, slotCount, firstRoundMatchCount, byes: slotCount - ordered.length, matches }];
  });
}

export function bracketRoundLabel(firstRoundMatchCount: number) {
  if (firstRoundMatchCount >= 8) return "Round of 16";
  if (firstRoundMatchCount >= 4) return "Quarterfinal";
  if (firstRoundMatchCount >= 2) return "Semifinal";
  return "Final";
}
