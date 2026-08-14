export type MatchFilterInput = {
  athleteQuery?: string;
  belt?: string;
  weightCategory?: string;
};

export function filterMatches<T extends { athleteAId: number | null; athleteBId: number | null }>(matches: T[], athletes: Array<{ id: number; fullName?: string | null; belt?: string | null }>, registrations: Array<{ athleteId: number; categoryName?: string | null; categoryWeightLimit?: number | string | null }>, filters: MatchFilterInput) {
  const athleteById = new Map(athletes.map(athlete => [athlete.id, athlete]));
  const registrationByAthlete = new Map(registrations.map(registration => [registration.athleteId, registration]));
  const query = filters.athleteQuery?.trim().toLowerCase() ?? "";
  return matches.filter(match => {
    const athleteA = athleteById.get(match.athleteAId ?? -1);
    const athleteB = athleteById.get(match.athleteBId ?? -1);
    const names = `${athleteA?.fullName ?? ""} ${athleteB?.fullName ?? ""}`.toLowerCase();
    const registrationA = registrationByAthlete.get(match.athleteAId ?? -1);
    const registrationB = registrationByAthlete.get(match.athleteBId ?? -1);
    const categories = `${registrationA?.categoryName ?? ""} ${registrationA?.categoryWeightLimit ?? ""} ${registrationB?.categoryName ?? ""} ${registrationB?.categoryWeightLimit ?? ""}`;
    const belts = `${athleteA?.belt ?? ""} ${athleteB?.belt ?? ""}`;
    return (!query || names.includes(query)) && (!filters.belt || filters.belt === "all" || belts.includes(filters.belt)) && (!filters.weightCategory || filters.weightCategory === "all" || categories.includes(filters.weightCategory));
  });
}
