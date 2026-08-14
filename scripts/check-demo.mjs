const { getTournamentDashboard } = await import("../server/db.ts");
const dashboard = await getTournamentDashboard();
console.log(JSON.stringify({ tournaments: dashboard.tournaments.map(t => ({ id: t.id, name: t.name, slug: t.registrationSlug })), athletes: dashboard.athletes.length, registrations: dashboard.registrations.length, matches: dashboard.matches.length }));
