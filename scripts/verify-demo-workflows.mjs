const { getTournamentDashboard, getAthletePortal } = await import("../server/db.ts");
const dashboard = await getTournamentDashboard();
const tournament = dashboard.tournaments.find(item => item.registrationSlug === "demo-live");
if (!tournament) throw new Error("demo-live tournament missing");
const demoRows = dashboard.registrations.filter(row => row.tournamentId === tournament.id);
const sample = demoRows[0];
const portal = await getAthletePortal("demo-live", sample.accreditationCode);
console.log(JSON.stringify({
  tournament: { id: tournament.id, name: tournament.name, slug: tournament.registrationSlug },
  counts: { athletes: dashboard.athletes.filter(row => demoRows.some(registration => registration.athleteId === row.id)).length, registrations: demoRows.length, matches: dashboard.matches.filter(row => row.tournamentId === tournament.id).length },
  statuses: demoRows.reduce((result, row) => { result[row.weighInStatus] = (result[row.weighInStatus] ?? 0) + 1; return result; }, {}),
  samplePortal: portal ? { athlete: portal.athlete.fullName, category: portal.registration.categoryName, accreditationCode: sample.accreditationCode, nextMatch: portal.nextMatch?.round ?? null } : null,
}));
