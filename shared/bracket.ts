export type BracketCandidate = {
  athleteId: number;
  categoryId: number | null;
  seed?: number | null;
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
