export type AnalyticsRegistration = {
  categoryName?: string | null;
  categoryWeightLimit?: string | number | null;
  status?: string | null;
  weighInStatus?: string | null;
  paymentStatus?: string | null;
  pool?: string | null;
};

export type AnalyticsAthlete = { belt?: string | null };
export type AnalyticsMatch = { status?: string | null; matId?: number | null };

export function countByLabel(values: Array<string | number | null | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value == null || String(value).trim() === "" ? "Unassigned" : String(value);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function buildTournamentAnalytics(registrations: AnalyticsRegistration[], athletes: AnalyticsAthlete[], matches: AnalyticsMatch[], mats: unknown[]) {
  return {
    totalRegistrations: registrations.length,
    approved: registrations.filter(row => row.status === "approved").length,
    checkedIn: registrations.filter(row => row.status === "approved" && row.weighInStatus !== "pending").length,
    passedWeighIn: registrations.filter(row => row.weighInStatus === "passed").length,
    overweight: registrations.filter(row => row.weighInStatus === "overweight").length,
    paid: registrations.filter(row => row.paymentStatus === "paid").length,
    weightCategories: countByLabel(registrations.map(row => row.categoryName ?? row.categoryWeightLimit)),
    belts: countByLabel(athletes.map(athlete => athlete.belt)),
    matches: { total: matches.length, live: matches.filter(match => match.status === "live").length, finished: matches.filter(match => match.status === "finished").length, queued: matches.filter(match => match.status === "queued").length },
    mats: mats.length,
  };
}
