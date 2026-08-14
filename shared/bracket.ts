export type BracketCandidate = {
  athleteId: number;
  categoryId: number | null;
  seed?: number | null;
};

export type BracketSlot = "athleteAId" | "athleteBId";

export type BracketMatchSlot = {
  id: number;
  round: string;
  matchNumber: number;
  athleteAId: number | null;
  athleteBId: number | null;
  status: "queued" | "called" | "live" | "finished" | "no_show";
};

export function buildBracketPairs<T extends BracketCandidate>(rows: T[]) {
  const grouped = new Map<number, T[]>();
  rows.forEach(row => {
    if (row.categoryId == null) return;
    grouped.set(row.categoryId, [...(grouped.get(row.categoryId) ?? []), row]);
  });
  const pairs: Array<{ categoryId: number; athleteAId: number; athleteBId: number }> = [];
  Array.from(grouped.entries()).forEach(([categoryId, categoryRows]) => {
    categoryRows.sort((a, b) => (a.seed ?? 999999) - (b.seed ?? 999999) || a.athleteId - b.athleteId);
    for (let index = 0; index < categoryRows.length - 1; index += 2) {
      pairs.push({ categoryId, athleteAId: categoryRows[index].athleteId, athleteBId: categoryRows[index + 1].athleteId });
    }
  });
  return pairs;
}

export function nextRoundMatchCount(firstRoundMatches: number) {
  return firstRoundMatches > 1 ? Math.ceil(firstRoundMatches / 2) : 0;
}

export function applyWinnerToNextMatch<T extends BracketMatchSlot>(matches: T[], feeder: Pick<T, "round" | "matchNumber">, winnerId: number) {
  const slot = nextBracketSlot(feeder.round, feeder.matchNumber);
  if (!slot) return { matches, advancedTo: null as number | null };
  const next = matches.find(match => match.round === slot.round && match.matchNumber === slot.matchNumber && match.status !== "finished");
  if (!next) return { matches, advancedTo: null as number | null };
  const updated = matches.map(match => match.id === next.id ? { ...match, [slot.slot]: winnerId } as T : match);
  return { matches: updated, advancedTo: next.id };
}

export function nextBracketSlot(round: string, matchNumber: number): { round: string; matchNumber: number; slot: BracketSlot } | null {
  const roundNumber = Number(round.match(/\d+/)?.[0] ?? 0);
  if (!roundNumber || matchNumber < 1) return null;
  return {
    round: `Round ${roundNumber + 1}`,
    matchNumber: Math.ceil(matchNumber / 2),
    slot: matchNumber % 2 === 1 ? "athleteAId" : "athleteBId",
  };
}
