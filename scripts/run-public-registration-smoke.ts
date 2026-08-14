import { createPublicRegistration, getTournamentBySlug } from "../server/db";
const tournament = await getTournamentBySlug("demo-live");
if (!tournament) throw new Error("demo-live not found");
const result = await createPublicRegistration({ tournamentId: tournament.id, fullName: "QA Supabase Athlete Local", email: "qa-supabase-local@example.test", phone: "01000000888", dateOfBirth: "2010-05-10", gender: "male", belt: "White", expectedWeight: "30.00" });
console.log(JSON.stringify(result));
