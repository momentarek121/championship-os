export type FinishedResultMatch = {
  categoryId: number;
  round: string;
  matchNumber: number;
  athleteAId: number | null;
  athleteBId: number | null;
  winnerId: number | null;
  status: string;
};

export type MedalResult = {
  categoryId: number;
  goldId: number | null;
  silverId: number | null;
  bronzeIds: number[];
};

function roundRank(round: string) {
  const match = round.match(/round\s+(\d+)/i);
  if (match) return Number(match[1]);
  if (/final/i.test(round)) return 99;
  if (/semi/i.test(round)) return 98;
  return 0;
}

export function selectMedalResults(matches: FinishedResultMatch[]): MedalResult[] {
  const byCategory = new Map<number, FinishedResultMatch[]>();
  for (const match of matches) {
    if (match.status !== "finished" || !match.winnerId) continue;
    const bucket = byCategory.get(match.categoryId) ?? [];
    bucket.push(match);
    byCategory.set(match.categoryId, bucket);
  }
  return Array.from(byCategory.entries()).sort(([a], [b]) => a - b).map(([categoryId, rows]) => {
    const ordered = [...rows].sort((a, b) => roundRank(b.round) - roundRank(a.round) || b.matchNumber - a.matchNumber);
    const finalRank = roundRank(ordered[0]?.round ?? "");
    const final = ordered.find(row => /final/i.test(row.round)) ?? ordered.find(row => roundRank(row.round) === finalRank) ?? ordered[0];
    if (!final?.winnerId) return { categoryId, goldId: null, silverId: null, bronzeIds: [] };
    const silverId = final.athleteAId === final.winnerId ? final.athleteBId : final.athleteAId;
    const semiLosers = rows.filter((row: FinishedResultMatch) => ((/semi/i.test(row.round) || roundRank(row.round) === finalRank - 1) && row.winnerId)).map((row: FinishedResultMatch) => row.athleteAId === row.winnerId ? row.athleteBId : row.athleteAId).filter((id: number | null): id is number => id !== null && id !== silverId && id !== final.winnerId);
    const uniqueBronze = Array.from(new Set<number>(semiLosers)).slice(0, 2);
    return { categoryId, goldId: final.winnerId, silverId, bronzeIds: uniqueBronze };
  });
}
