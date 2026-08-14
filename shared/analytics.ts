export type AnalyticsRegistration = {
  categoryName?: string | null;
  categoryWeightLimit?: string | number | null;
  categoryCompetitionMode?: string | null;
  createdAt?: Date | string | number | null;
  status?: string | null;
  weighInStatus?: string | null;
  paymentStatus?: string | null;
  pool?: string | null;
};

export type AnalyticsAthlete = { belt?: string | null };
export type AnalyticsMatch = { status?: string | null; matId?: number | null };
export type AnalyticsWindow = "all" | "7d" | "30d" | "90d";

export function countByLabel(values: Array<string | number | null | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const label = value == null || String(value).trim() === "" ? "Unassigned" : String(value);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function withinWindow(value: AnalyticsRegistration["createdAt"], window: AnalyticsWindow, now: number) {
  if (window === "all" || value == null) return true;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return true;
  return timestamp >= now - Number(window.replace("d", "")) * 24 * 60 * 60 * 1000;
}

export function buildTournamentAnalytics(registrations: AnalyticsRegistration[], athletes: AnalyticsAthlete[], matches: AnalyticsMatch[], mats: unknown[], window: AnalyticsWindow = "all", now = Date.now()) {
  const filteredRegistrations = registrations.filter(row => withinWindow(row.createdAt, window, now));
  const modeRows = ["gi", "nogi", "both"].map(mode => ({ label: mode === "gi" ? "GI" : mode === "nogi" ? "No-Gi" : "Both", count: filteredRegistrations.filter(row => row.categoryCompetitionMode === mode).length }));
  return {
    totalRegistrations: filteredRegistrations.length,
    approved: filteredRegistrations.filter(row => row.status === "approved").length,
    checkedIn: filteredRegistrations.filter(row => row.status === "approved" && row.weighInStatus !== "pending").length,
    passedWeighIn: filteredRegistrations.filter(row => row.weighInStatus === "passed").length,
    overweight: filteredRegistrations.filter(row => row.weighInStatus === "overweight").length,
    paid: filteredRegistrations.filter(row => row.paymentStatus === "paid").length,
    weightCategories: countByLabel(filteredRegistrations.map(row => row.categoryName ?? row.categoryWeightLimit)),
    belts: countByLabel(athletes.map(athlete => athlete.belt)),
    competitionModes: modeRows,
    matches: { total: matches.length, live: matches.filter(match => match.status === "live").length, finished: matches.filter(match => match.status === "finished").length, queued: matches.filter(match => match.status === "queued").length },
    mats: mats.length,
  };
}
