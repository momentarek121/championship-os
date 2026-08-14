import { asc, eq } from "drizzle-orm";
import { getDb, createTournament, createPublicRegistration, updateTournamentSettings, updateRegistrationStatus, generateAutomaticBrackets, reassignMatchMat, finishMatch, getPublicParticipants, getAthletePortal } from "../server/db.ts";
import { users, tournaments, registrations, matches, mats } from "../drizzle/schema.ts";

const db = await getDb();
if (!db) throw new Error("Supabase database is unavailable");
const [actor] = await db.select().from(users).orderBy(asc(users.id)).limit(1);
if (!actor) throw new Error("No authenticated owner/admin record is available");

const slug = `qa-live-${Date.now()}`;
const tournamentId = await createTournament({
  name: "QA Live Non-Demo Verification",
  sport: "Brazilian Jiu-Jitsu",
  location: "QA",
  ruleset: "IBJJF Standard",
  organizationName: "Championship OS QA",
  registrationSlug: slug,
  weighInMode: "ibjjf",
  weighInTolerance: "0.00",
  competitionMode: "both",
  scaleNotes: "Production smoke test; synthetic QA records only.",
  createdBy: actor.id,
  status: "registration",
});

await updateTournamentSettings({
  tournamentId,
  organizationName: "Championship OS QA",
  weighInMode: "custom",
  weighInTolerance: "0.50",
  competitionMode: "both",
  scaleNotes: "Production smoke test; synthetic QA records only.",
  beltPolicy: ["No belt", "White", "Grey", "Blue", "Black"],
  actorUserId: actor.id,
});

const first = await createPublicRegistration({ tournamentId, fullName: "QA Live Athlete One", email: "qa-live-one@example.test", dateOfBirth: "2000-01-01", gender: "male", belt: "Blue", expectedWeight: "76.00" });
const second = await createPublicRegistration({ tournamentId, fullName: "QA Live Athlete Two", email: "qa-live-two@example.test", dateOfBirth: "2000-02-02", gender: "male", belt: "Blue", expectedWeight: "76.00" });
await createPublicRegistration({ tournamentId, fullName: "QA Live Athlete Three", email: "qa-live-three@example.test", dateOfBirth: "2000-03-03", gender: "male", belt: "Blue", expectedWeight: "76.00" });
await createPublicRegistration({ tournamentId, fullName: "QA Live Athlete Four", email: "qa-live-four@example.test", dateOfBirth: "2000-04-04", gender: "male", belt: "Blue", expectedWeight: "76.00" });
const registrationsRows = await db.select().from(registrations).where(eq(registrations.tournamentId, tournamentId)).orderBy(asc(registrations.id));
for (const row of registrationsRows) {
  await updateRegistrationStatus(row.id, { status: "approved", checkInStatus: "checked_in", actualWeight: 76, weighInStatus: "passed", weighInNotes: "QA exact measurement: 76.00 KG; custom tolerance 0.50 KG." }, actor.id);
}

await generateAutomaticBrackets(tournamentId, actor.id);
const generated = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId)).orderBy(asc(matches.matchNumber));
const firstMatch = generated.find(match => match.athleteAId && match.athleteBId);
if (!firstMatch || !firstMatch.athleteAId || !firstMatch.athleteBId) throw new Error("Bracket smoke test did not create a two-athlete match");
const tournamentMats = await db.select().from(mats).where(eq(mats.tournamentId, tournamentId)).orderBy(asc(mats.id));
if (tournamentMats[1]) await reassignMatchMat({ matchId: firstMatch.id, matId: tournamentMats[1].id, actorUserId: actor.id });
await finishMatch({ matchId: firstMatch.id, winnerId: firstMatch.athleteAId, scoreA: 4, scoreB: 0, advantageA: 1, penaltyB: 0, evaluation: "QA advancement smoke test", actorUserId: actor.id });

const participants = await getPublicParticipants(slug);
const portal = await getAthletePortal(slug, first.accreditationCode);
const refreshedMatches = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId)).orderBy(asc(matches.matchNumber));
const savedTournament = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
const savedRegistration = await db.select().from(registrations).where(eq(registrations.id, registrationsRows[0].id)).limit(1);

console.log(JSON.stringify({
  tournamentId,
  slug,
  actorUserId: actor.id,
  registrationCodes: [first.accreditationCode, second.accreditationCode],
  persisted: {
    competitionMode: savedTournament[0]?.competitionMode,
    weighInMode: savedTournament[0]?.weighInMode,
    weighInTolerance: savedTournament[0]?.weighInTolerance,
    beltPolicyInNotes: savedTournament[0]?.scaleNotes?.includes("Belt policy: No belt, White, Grey, Blue, Black"),
    exactWeight: savedRegistration[0]?.weighInStatus === "passed" && savedRegistration[0]?.weighInNotes?.includes("76.00 KG"),
    publicParticipantCategories: participants?.categories.length ?? 0,
    athletePortalReadBack: portal?.athlete?.fullName,
    finishedMatch: refreshedMatches.some(match => match.id === firstMatch.id && match.status === "finished" && match.winnerId === firstMatch.athleteAId),
    matOverride: refreshedMatches.find(match => match.id === firstMatch.id)?.matId === tournamentMats[1]?.id,
    nextRoundExists: refreshedMatches.some(match => match.round !== firstMatch.round && (match.athleteAId === firstMatch.athleteAId || match.athleteBId === firstMatch.athleteAId)),
  },
}, null, 2));
