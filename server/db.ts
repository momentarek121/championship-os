import { and, asc, desc, eq } from "drizzle-orm";
import { calculateAge, expandCompetitionModes, poolLabel, resolveCategory } from "../shared/category";
import { selectBracketEligible } from "../shared/operationFlow";
import { nextBracketSlot, nextRoundMatchCount } from "../shared/bracket";
import { nextRoundLabel } from "../shared/rounds";
import { buildAutomaticBracketPlan, bracketRoundLabel } from "../shared/automaticBrackets";
import { buildMatSchedule } from "../shared/scheduler";
import { calculateAcademyStandings } from "../shared/standings";
import { selectMedalResults } from "../shared/results";
import { formatBeltPolicyNote, normalizeTournamentSettings } from "../shared/tournamentSettings";
import { selectNextMatch } from "../shared/athletePortal";
import { canEditMatchSlots, validateMatchSlots } from "../shared/matchEditing";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, tournaments, athletes, clubs, registrations, categories, matches, mats, auditLogs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

async function safeRows<T>(label: string, query: () => Promise<T[]>): Promise<T[]> {
  try { return await query(); } catch (error) { console.warn(`[Database] ${label} unavailable; continuing with an empty view`, error); return []; }
}

// Lazily create the Drizzle instance so local tooling can run without a DB.
export async function getDb() {
  const rawDatabaseUrl = process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL;
  const databaseUrl = rawDatabaseUrl?.replace(/^['"]|['"]$/g, "");
  if (!_db && databaseUrl) {
    try {
      _db = drizzle(new Pool({ connectionString: databaseUrl, max: 10 }));
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function updateUserRole(input: { userId: number; role: "user" | "admin" | "organizer" | "registration_staff" | "weighin_staff" | "referee" | "mat_manager" | "athlete"; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!existing[0]) throw new Error("User not found");
  if (existing[0].openId === ENV.ownerOpenId && input.role !== "admin") throw new Error("The project owner must remain an admin");
  await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "user", entityId: input.userId, action: "role_change", beforeValue: { role: existing[0].role }, afterValue: { role: input.role } });
  return { success: true } as const;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getTournamentDashboard() {
  try {
  const db = await getDb();
  if (!db) return { tournaments: [], athletes: [], registrations: [], matches: [], mats: [], standings: [], metrics: { registered: 0, paid: 0, checkedIn: 0, liveMatches: 0 } };
  const [tournamentRows, athleteRows, registrationRows, matchRows, categoryRows, matRows, clubRows] = await Promise.all([
    safeRows("tournaments", () => db.select().from(tournaments).orderBy(desc(tournaments.id))),
    safeRows("athletes", () => db.select().from(athletes)),
    safeRows("registrations", () => db.select().from(registrations).orderBy(asc(registrations.id))),
    safeRows("matches", () => db.select().from(matches)),
    safeRows("categories", () => db.select().from(categories).orderBy(asc(categories.id))),
    safeRows("mats", () => db.select().from(mats).orderBy(asc(mats.id))),
    safeRows("clubs", () => db.select().from(clubs).orderBy(asc(clubs.id))),
  ]);
  const categoryPositions = new Map<number, number>();
  const clubNames = new Map(clubRows.map(club => [club.id, club.name]));
  const athleteClubs = new Map(athleteRows.map(athlete => [athlete.id, athlete.clubId ? clubNames.get(athlete.clubId) ?? null : null]));
  const finishedMatches = matchRows.filter(match => match.status === "finished" && match.winnerId != null);
  const medalResults = selectMedalResults(matchRows);
  const medalByAthlete = new Map<number, "gold" | "silver" | "bronze">();
  medalResults.forEach(result => {
    if (result.goldId != null) medalByAthlete.set(result.goldId, "gold");
    if (result.silverId != null) medalByAthlete.set(result.silverId, "silver");
    result.bronzeIds.forEach(id => medalByAthlete.set(id, "bronze"));
  });
  const standings = calculateAcademyStandings(finishedMatches.map(match => ({ academy: athleteClubs.get(match.winnerId!) ?? "Unattached", winner: true, medal: medalByAthlete.get(match.winnerId!) ?? null })));

  const enrichedRegistrations = registrationRows.map(row => {
    const position = categoryPositions.get(row.categoryId ?? -1) ?? 0;
    categoryPositions.set(row.categoryId ?? -1, position + 1);
    const category = categoryRows.find(category => category.id === row.categoryId);
    return { ...row, categoryName: category?.name ?? "Unassigned", categoryWeightLimit: category?.weightLimit ?? null, categoryCompetitionMode: category?.competitionMode ?? "gi", pool: row.categoryId ? poolLabel(Math.floor(position / 4)) : "Unassigned" };
  });
  return {
    tournaments: tournamentRows,
    athletes: athleteRows,
    registrations: enrichedRegistrations,
    matches: matchRows,
    mats: matRows,
    clubs: clubRows,
    standings,
    metrics: {
      registered: registrationRows.length,
      paid: registrationRows.filter(row => row.paymentStatus === "paid").length,
      checkedIn: registrationRows.filter(row => row.checkInStatus === "checked_in").length,
      liveMatches: matchRows.filter(row => row.status === "live").length,
    },
  };
  } catch (error) {
    console.warn("[Database] dashboard unavailable; returning empty operations view", error);
    return { tournaments: [], athletes: [], registrations: [], matches: [], mats: [], clubs: [], standings: [], metrics: { registered: 0, paid: 0, checkedIn: 0, liveMatches: 0 } };
  }
}

export async function createTournament(input: typeof tournaments.$inferInsert & { matCount?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const { matCount = 4, ...tournamentValues } = input;
  const [result] = await db.insert(tournaments).values(tournamentValues).returning({ id: tournaments.id });
  await db.insert(mats).values(Array.from({ length: Math.max(1, Math.min(32, matCount)) }, (_, index) => ({ tournamentId: result.id, name: `Mat ${index + 1}`, status: index === 0 ? "active" as const : "idle" as const })));
  return result.id;
}

export async function createAthleteRegistration(input: { athlete: typeof athletes.$inferInsert; registration: Omit<typeof registrations.$inferInsert, "athleteId">; sport?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const tournament = await db.select().from(tournaments).where(eq(tournaments.id, input.registration.tournamentId)).limit(1);
  const sport = input.sport ?? tournament[0]?.sport ?? "Brazilian Jiu-Jitsu";
  if (!input.athlete.dateOfBirth) throw new Error("Date of birth is required for category assignment");
  const competitionMode = tournament[0]?.competitionMode ?? "gi";
  const categoryValue = resolveCategory({ age: calculateAge(input.athlete.dateOfBirth), gender: input.athlete.gender, belt: input.athlete.belt, weight: Number(input.athlete.expectedWeight), sport, competitionMode });
  const existingCategory = await db.select().from(categories).where(and(eq(categories.tournamentId, input.registration.tournamentId), eq(categories.name, categoryValue.name))).limit(1);
  let categoryId = existingCategory[0]?.id;
  if (!categoryId) { const [createdCategory] = await db.insert(categories).values({ tournamentId: input.registration.tournamentId, name: categoryValue.name, ageGroup: categoryValue.ageGroup, gender: categoryValue.gender, belt: categoryValue.belt, weightLimit: categoryValue.weightLimit.toFixed(2), sport: categoryValue.sport, competitionMode: categoryValue.competitionMode }).returning({ id: categories.id }); categoryId = createdCategory.id; }
  const [createdAthlete] = await db.insert(athletes).values(input.athlete).returning({ id: athletes.id });
  const athleteId = createdAthlete.id;
  await db.insert(registrations).values({ ...input.registration, athleteId, categoryId });
  return { athleteId, categoryId };
}

export async function updateAthleteProfile(input: { athleteId: number; fullName?: string; email?: string | null; phone?: string | null; dateOfBirth?: Date | null; gender?: "male" | "female"; belt?: string; expectedWeight?: string | null; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(athletes).where(eq(athletes.id, input.athleteId)).limit(1);
  if (!existing[0]) throw new Error("Athlete not found");
  const { athleteId, actorUserId, ...values } = input;
  await db.update(athletes).set(values).where(eq(athletes.id, athleteId));
  await db.insert(auditLogs).values({ actorUserId, entityType: "athlete", entityId: athleteId, action: "profile_update", beforeValue: existing[0], afterValue: values });
  return { success: true } as const;
}

export async function updateRegistrationStatus(id: number, values: Partial<typeof registrations.$inferInsert>, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  const { actualWeight, ...registrationValues } = values as Partial<typeof registrations.$inferInsert> & { actualWeight?: number };
  if (Object.keys(registrationValues).length > 0) await db.update(registrations).set(registrationValues).where(eq(registrations.id, id));
  if (actualWeight !== undefined && existing[0]?.athleteId) await db.update(athletes).set({ actualWeight: actualWeight.toFixed(2) }).where(eq(athletes.id, existing[0].athleteId));
  await db.insert(auditLogs).values({ actorUserId, entityType: "registration", entityId: id, action: "update", beforeValue: existing[0] ?? null, afterValue: values });
  return { success: true } as const;
}

export async function updateTournamentWeighIn(tournamentId: number, weighInMode: "ibjjf" | "custom", weighInTolerance: string, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(tournaments).set({ weighInMode, weighInTolerance }).where(eq(tournaments.id, tournamentId));
  await db.insert(auditLogs).values({ actorUserId, entityType: "tournament", entityId: tournamentId, action: "weigh_in_settings", afterValue: { weighInMode, weighInTolerance } });
  return { success: true } as const;
}

export async function updateTournamentSettings(input: { tournamentId: number; organizationName: string; weighInMode: "ibjjf" | "custom"; weighInTolerance: string; competitionMode: "gi" | "nogi" | "both"; scaleNotes: string; beltPolicy?: string[]; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
  if (!existing[0]) throw new Error("Tournament not found");
  const settings = normalizeTournamentSettings(input);
  const beltPolicyNote = formatBeltPolicyNote(input.beltPolicy);
  const notes = [settings.scaleNotes, beltPolicyNote, `Competition mode: ${input.competitionMode === "nogi" ? "No-Gi" : input.competitionMode === "both" ? "GI + No-Gi" : "GI"}`].filter(Boolean).join(" · ");
  await db.update(tournaments).set({ organizationName: settings.organizationName, weighInMode: settings.weighInMode, weighInTolerance: settings.weighInTolerance, competitionMode: input.competitionMode, scaleNotes: notes || null }).where(eq(tournaments.id, input.tournamentId));
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "tournament", entityId: input.tournamentId, action: "settings", beforeValue: existing[0], afterValue: settings });
  return { success: true } as const;
}

export async function getClubs() {
  const db = await getDb();
  return db ? db.select().from(clubs) : [];
}

export async function getAthletePortal(slug: string, accreditationCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const tournament = await db.select().from(tournaments).where(eq(tournaments.registrationSlug, slug)).limit(1);
  if (!tournament[0]) return undefined;
  const registration = await db.select().from(registrations).where(and(eq(registrations.tournamentId, tournament[0].id), eq(registrations.accreditationCode, accreditationCode))).limit(1);
  if (!registration[0]) return undefined;
  const athlete = await db.select().from(athletes).where(eq(athletes.id, registration[0].athleteId)).limit(1);
  const category = registration[0].categoryId ? await db.select().from(categories).where(eq(categories.id, registration[0].categoryId)).limit(1) : [];
  const athleteMatches = await db.select().from(matches).where(and(eq(matches.tournamentId, tournament[0].id), eq(matches.athleteAId, registration[0].athleteId)));
  const opponentMatches = await db.select().from(matches).where(and(eq(matches.tournamentId, tournament[0].id), eq(matches.athleteBId, registration[0].athleteId)));
  const tournamentMats = await db.select().from(mats).where(eq(mats.tournamentId, tournament[0].id));
  const allMatches = [...athleteMatches, ...opponentMatches].sort((a, b) => a.matchNumber - b.matchNumber);
  const matchesWithMats = allMatches.map(match => ({ ...match, matName: tournamentMats.find(mat => mat.id === match.matId)?.name ?? "TBA" }));
  const nextMatch = selectNextMatch(matchesWithMats);
  return { tournament: tournament[0], registration: registration[0], athlete: athlete[0], category: category[0], nextMatch, matches: matchesWithMats };
}

export async function getTournamentBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tournaments).where(eq(tournaments.registrationSlug, slug)).limit(1);
  if (result[0]) return result[0];
  // The live legacy record was created before the slug column was normalized.
  // Keep the production event link stable while older rows are migrated.
  const legacyTournamentId = slug === "portsaid-bjj-championship" ? 1 : slug === "demo-live" ? 30001 : null;
  if (legacyTournamentId == null) return undefined;
  const legacy = await db.select().from(tournaments).where(eq(tournaments.id, legacyTournamentId)).limit(1);
  return legacy[0];
}

export async function getPublicParticipants(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const tournament = await getTournamentBySlug(slug);
  if (!tournament) return undefined;
  const [categoryRows, registrationRows, athleteRows] = await Promise.all([
    safeRows("public categories", () => db.select().from(categories).where(eq(categories.tournamentId, tournament.id)).orderBy(asc(categories.id))),
    safeRows("public registrations", () => db.select().from(registrations).where(eq(registrations.tournamentId, tournament.id)).orderBy(asc(registrations.id))),
    safeRows("public athletes", () => db.select().from(athletes).orderBy(asc(athletes.id))),
  ]);
  const athleteById = new Map(athleteRows.map(athlete => [athlete.id, athlete]));
  const grouped = categoryRows.map(category => {
    const rows = registrationRows.filter(row => row.categoryId === category.id);
    const approved = rows.filter(row => row.status === "approved");
    const unapproved = rows.filter(row => row.status !== "approved");
    return {
      category,
      approvedCount: approved.length,
      unapprovedCount: unapproved.length,
      approved: approved.map(row => ({ id: row.id, athleteId: row.athleteId, name: athleteById.get(row.athleteId)?.fullName ?? `Athlete #${row.athleteId}`, pool: poolLabel(Math.floor(rows.indexOf(row) / 4)) })),
      unapproved: unapproved.map(row => ({ id: row.id, athleteId: row.athleteId, name: athleteById.get(row.athleteId)?.fullName ?? `Athlete #${row.athleteId}` })),
    };
  });
  return { tournament, categories: grouped };
}

export async function createPublicRegistration(input: { tournamentId: number; fullName: string; email?: string; phone?: string; dateOfBirth: string; gender: "male" | "female"; belt: string; expectedWeight: string; competitionMode: "gi" | "nogi" | "both" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const tournament = await db.select().from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
  if (!input.dateOfBirth) throw new Error("Date of birth is required for category assignment");
  const modes = expandCompetitionModes(input.competitionMode);
  const [createdAthlete] = await db.insert(athletes).values({ fullName: input.fullName, email: input.email || null, phone: input.phone || null, dateOfBirth: new Date(`${input.dateOfBirth}T00:00:00Z`), gender: input.gender, belt: input.belt, expectedWeight: input.expectedWeight }).returning({ id: athletes.id });
  const athleteId = createdAthlete.id;
  const code = `ATH-${String(athleteId).padStart(5, "0")}`;
  const created = [] as Array<{ categoryId: number; categoryName: string; competitionMode: "gi" | "nogi"; pool: string }>;
  for (const competitionMode of modes) {
    const categoryValue = resolveCategory({ age: calculateAge(input.dateOfBirth), gender: input.gender, belt: input.belt, weight: Number(input.expectedWeight), sport: tournament[0]?.sport ?? "Brazilian Jiu-Jitsu", competitionMode });
    const existingCategory = await db.select().from(categories).where(and(eq(categories.tournamentId, input.tournamentId), eq(categories.name, categoryValue.name))).limit(1);
    let categoryId = existingCategory[0]?.id;
    if (!categoryId) { const [createdCategory] = await db.insert(categories).values({ tournamentId: input.tournamentId, name: categoryValue.name, ageGroup: categoryValue.ageGroup, gender: categoryValue.gender, belt: categoryValue.belt, weightLimit: categoryValue.weightLimit.toFixed(2), sport: categoryValue.sport, competitionMode: categoryValue.competitionMode }).returning({ id: categories.id }); categoryId = createdCategory.id; }
    const categoryRegistrations = await db.select().from(registrations).where(and(eq(registrations.tournamentId, input.tournamentId), eq(registrations.categoryId, categoryId)));
    const pool = poolLabel(Math.floor(categoryRegistrations.length / 4));
    const registrationCode = modes.length > 1 ? `${code}-${competitionMode.toUpperCase()}` : code;
    await db.insert(registrations).values({ tournamentId: input.tournamentId, athleteId, categoryId, status: "pending", paymentStatus: "unpaid", checkInStatus: "not_checked_in", weighInStatus: "pending", accreditationCode: registrationCode });
    created.push({ categoryId, categoryName: categoryValue.name, competitionMode, pool });
  }
  return { athleteId, categoryId: created[0].categoryId, accreditationCode: code, registrations: created };
}


export async function finishMatch(input: { matchId: number; winnerId: number; scoreA: number; scoreB: number; advantageA?: number; advantageB?: number; penaltyA?: number; penaltyB?: number; evaluation?: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
  if (!existing[0]) throw new Error("Match not found");
  if (![existing[0].athleteAId, existing[0].athleteBId].includes(input.winnerId)) throw new Error("Winner must be one of the match athletes");
  await db.update(matches).set({ winnerId: input.winnerId, scoreA: input.scoreA, scoreB: input.scoreB, advantageA: input.advantageA ?? 0, advantageB: input.advantageB ?? 0, penaltyA: input.penaltyA ?? 0, penaltyB: input.penaltyB ?? 0, evaluation: input.evaluation ?? null, status: "finished", finishedAt: new Date() }).where(eq(matches.id, input.matchId));
  const slot = nextBracketSlot(existing[0].round, existing[0].matchNumber);
  let advancedTo: number | null = null;
  if (slot) {
    const next = await db.select().from(matches).where(and(eq(matches.tournamentId, existing[0].tournamentId), eq(matches.categoryId, existing[0].categoryId), eq(matches.round, slot.round), eq(matches.matchNumber, slot.matchNumber))).limit(1);
    if (next[0] && next[0].status !== "finished") {
      await db.update(matches).set({ [slot.slot]: input.winnerId }).where(eq(matches.id, next[0].id));
      advancedTo = next[0].id;
    }
  }
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "match", entityId: input.matchId, action: "finish", beforeValue: existing[0], afterValue: { ...input, advancedTo } });
  return { success: true, advancedTo } as const;
}

export async function updateMatchStatus(matchId: number, status: "queued" | "called" | "live" | "no_show", actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(matches).set({ status }).where(eq(matches.id, matchId));
  await db.insert(auditLogs).values({ actorUserId, entityType: "match", entityId: matchId, action: "status", afterValue: { status } });
  return { success: true } as const;
}

export async function generateAutomaticBrackets(tournamentId: number, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existingMatches = await db.select({ id: matches.id }).from(matches).where(eq(matches.tournamentId, tournamentId));
  if (existingMatches.length > 0) return { success: true, created: 0, alreadyGenerated: true, groups: [], skipped: ["Matches already exist for this tournament"] } as const;

  const rows = await db.select().from(registrations).where(eq(registrations.tournamentId, tournamentId));
  const eligibleRows = selectBracketEligible(rows as Array<typeof rows[number] & { status: "pending" | "approved" | "rejected"; weighInStatus: "pending" | "passed" | "overweight" }>);
  const plan = buildAutomaticBracketPlan(eligibleRows);
  const skipped = eligibleRows.filter(row => row.categoryId == null).map(row => `Registration ${row.id} has no category`);
  const groups = plan.map(group => ({ categoryId: group.categoryId, athleteCount: group.athleteCount, byes: group.byes, firstRoundMatches: group.firstRoundMatchCount }));
  let created = 0;
  for (const group of plan) {
    const firstRound = bracketRoundLabel(group.firstRoundMatchCount);
    for (const planned of group.matches) {
      await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, round: firstRound, matchNumber: planned.matchNumber, athleteAId: planned.athleteAId, athleteBId: planned.athleteBId, status: "queued", durationMinutes: 6, delayMinutes: 0 });
      created += 1;
    }
    let currentRoundMatches = group.firstRoundMatchCount;
    let currentRound = firstRound;
    while (currentRoundMatches > 1) {
      const nextRoundMatches = nextRoundMatchCount(currentRoundMatches);
      const nextRound = nextRoundLabel(currentRound) ?? "Final";
      for (let matchNumber = 1; matchNumber <= nextRoundMatches; matchNumber += 1) {
        await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, round: nextRound, matchNumber, athleteAId: null, athleteBId: null, status: "queued", durationMinutes: 6, delayMinutes: 0 });
        created += 1;
      }
      currentRoundMatches = nextRoundMatches;
      currentRound = nextRound;
    }
  }
  const availableMats = await db.select().from(mats).where(eq(mats.tournamentId, tournamentId));
  if (availableMats.length === 0 && created > 0) throw new Error("No mats are configured for this tournament. Add at least one mat before generating the schedule.");
  const generatedMatches = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId));
  if (generatedMatches.length > 0) {
    const scheduled = buildMatSchedule(generatedMatches, { matCount: availableMats.length || 1, startAt: new Date(), durationMinutes: 6, transitionMinutes: 2 });
    for (const scheduledMatch of scheduled) {
      await db.update(matches).set({ matId: availableMats[scheduledMatch.matIndex - 1]?.id ?? null, scheduledAt: scheduledMatch.scheduledAt, durationMinutes: scheduledMatch.durationMinutes, delayMinutes: scheduledMatch.delayMinutes, schedulerOrder: scheduledMatch.schedulerOrder }).where(eq(matches.id, scheduledMatch.id));
    }
  }
  await db.insert(auditLogs).values({ actorUserId, entityType: "tournament", entityId: tournamentId, action: "generate_brackets", afterValue: { created, groups, skipped, scheduled: true } });
  return { success: true, created, alreadyGenerated: false, groups, skipped } as const;
}

export async function createManualMatch(input: { tournamentId: number; categoryId: number; athleteAId: number; athleteBId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (input.athleteAId === input.athleteBId) throw new Error("A match needs two different athletes");
  const existing = await db.select().from(matches).where(and(eq(matches.tournamentId, input.tournamentId), eq(matches.athleteAId, input.athleteAId), eq(matches.athleteBId, input.athleteBId))).limit(1);
  if (existing[0]) return existing[0].id;
  const count = await db.select().from(matches).where(eq(matches.tournamentId, input.tournamentId));
  const [result] = await db.insert(matches).values({ tournamentId: input.tournamentId, categoryId: input.categoryId, round: "Manual", matchNumber: count.length + 1, athleteAId: input.athleteAId, athleteBId: input.athleteBId, status: "queued" }).returning({ id: matches.id });
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "tournament", entityId: input.tournamentId, action: "manual_match", afterValue: input });
  return result.id;
}


export async function seedDemoTournament(actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(tournaments).where(eq(tournaments.registrationSlug, "demo-live")).limit(1);
  const divisions = [
    { name: "Kids · Boys · White · -30 KG", ageGroup: "Kids", gender: "male" as const, belt: "White", weightLimit: "30.00", count: 4 },
    { name: "Girls · Youth · White · -45 KG", ageGroup: "Youth", gender: "female" as const, belt: "White", weightLimit: "45.00", count: 4 },
    { name: "Boys · Teens · Blue · -60 KG", ageGroup: "Teens", gender: "male" as const, belt: "Blue", weightLimit: "60.00", count: 4 },
    { name: "Women · Adult · Blue · -65 KG", ageGroup: "Adult", gender: "female" as const, belt: "Blue", weightLimit: "65.00", count: 4 },
    { name: "Men · Adult · All belts · -76 KG", ageGroup: "Adult", gender: "male" as const, belt: "Purple", weightLimit: "76.00", count: 4 },
  ];
  const names = ["Adam Demo", "Omar Demo", "Youssef Demo", "Karim Demo", "Lina Demo", "Mariam Demo", "Nada Demo", "Salma Demo", "Ziad Demo", "Hassan Demo", "Seif Demo", "Ali Demo", "Hana Demo", "Jana Demo", "Mira Demo", "Dina Demo", "Mostafa Demo", "Amr Demo", "Tarek Demo", "Khaled Demo"];
  let tournamentId = existing[0]?.id;
  let created = false;
  if (!tournamentId) {
    const [createdTournament] = await db.insert(tournaments).values({ name: "Championship OS Demo Open", sport: "Brazilian Jiu-Jitsu", location: "Demo Arena", status: "live", ruleset: "IBJJF Standard", organizationName: "Championship OS Demo", registrationSlug: "demo-live", weighInMode: "ibjjf", weighInTolerance: "0.00", scaleNotes: "DEMO ONLY · Use the digital scale at Mat 1", createdBy: actorUserId }).returning({ id: tournaments.id });
    tournamentId = createdTournament.id;
    created = true;
  }
  const athletesByCategory: Array<{ categoryId: number; athleteIds: number[] }> = [];
  const existingCategories = await db.select().from(categories).where(eq(categories.tournamentId, tournamentId)).orderBy(asc(categories.id));
  const existingRegistrations = await db.select().from(registrations).where(eq(registrations.tournamentId, tournamentId)).orderBy(asc(registrations.id));
  let nameIndex = existingRegistrations.length;
  for (const [divisionIndex, division] of Array.from(divisions.entries())) {
    let categoryId = existingCategories.find(category => category.name === division.name)?.id;
    if (!categoryId) {
      const [createdCategory] = await db.insert(categories).values({ tournamentId, name: division.name, ageGroup: division.ageGroup, gender: division.gender, belt: division.belt, weightLimit: division.weightLimit, sport: "Brazilian Jiu-Jitsu" }).returning({ id: categories.id });
      categoryId = createdCategory.id;
    }
    let athleteIds = existingRegistrations.filter(row => row.categoryId === categoryId).sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999)).map(row => row.athleteId);
    for (let index = athleteIds.length; index < division.count; index += 1) {
      const dateOfBirth = new Date(Date.UTC(2015 - divisionIndex * 3, 4, 10 + index));
      const [createdAthlete] = await db.insert(athletes).values({ fullName: names[nameIndex++], email: `demo${nameIndex}@example.test`, phone: `01000000${String(nameIndex).padStart(3, "0")}`, dateOfBirth, gender: division.gender, belt: division.belt, expectedWeight: division.weightLimit, actualWeight: index === 3 ? String(Number(division.weightLimit) + 1.2) : division.weightLimit }).returning({ id: athletes.id });
      const athleteId = createdAthlete.id;
      athleteIds.push(athleteId);
      const isOverweight = index === 3;
      const isApproved = index < 3;
      await db.insert(registrations).values({ tournamentId, athleteId, categoryId, seed: index + 1, status: isApproved ? "approved" : "pending", paymentStatus: index === 2 ? "unpaid" : "paid", checkInStatus: isApproved ? "checked_in" : "not_checked_in", weighInStatus: isOverweight ? "overweight" : (isApproved ? "passed" : "pending"), weighInNotes: isOverweight ? "DEMO · Over class limit" : "DEMO · Verified", accreditationCode: `DEMO-${String(athleteId).padStart(5, "0")}` });
    }
    athletesByCategory.push({ categoryId, athleteIds });
  }
  const existingMats = await db.select().from(mats).where(eq(mats.tournamentId, tournamentId)).orderBy(asc(mats.id));
  const matIds = existingMats.map(mat => mat.id);
  for (const name of ["Mat 1", "Mat 2", "Mat 3", "Mat 4"].slice(matIds.length)) {
    const [createdMat] = await db.insert(mats).values({ tournamentId, name, status: name === "Mat 1" ? "active" : "idle" }).returning({ id: mats.id });
    matIds.push(createdMat.id);
  }
  const existingMatches = await db.select({ id: matches.id }).from(matches).where(eq(matches.tournamentId, tournamentId));
  if (existingMatches.length === 0) {
    let matchNumber = 1;
    for (const [index, group] of Array.from(athletesByCategory.entries())) {
      const [a, b, c] = group.athleteIds;
      await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, matId: matIds[index % matIds.length], round: "Round 1", matchNumber: matchNumber++, athleteAId: a, athleteBId: b, scoreA: 4, scoreB: 0, winnerId: a, status: "finished", finishedAt: new Date() });
      await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, matId: matIds[(index + 1) % matIds.length], round: "Round 1", matchNumber: matchNumber++, athleteAId: c, athleteBId: null, scoreA: 0, scoreB: 0, status: index === 0 ? "live" : "queued" });
      await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, matId: matIds[index % matIds.length], round: "Round 2", matchNumber: matchNumber++, athleteAId: a, athleteBId: c, scoreA: index === 0 ? 2 : 8, scoreB: index === 0 ? 0 : 6, winnerId: index === 0 ? null : a, status: index === 0 ? "queued" : "finished", finishedAt: index === 0 ? null : new Date() });
    }
  }
  const demoMatches = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId));
  for (const match of demoMatches) {
    const namedRound = match.round === "Round 1" ? "Semifinal" : match.round === "Round 2" ? "Final" : match.round;
    if (namedRound !== match.round) await db.update(matches).set({ round: namedRound }).where(eq(matches.id, match.id));
  }
  const refreshedDemoMatches = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId));
  const scheduledDemoMatches = buildMatSchedule(refreshedDemoMatches, { matCount: Math.max(1, matIds.length), startAt: new Date(), durationMinutes: 6, transitionMinutes: 2 });
  for (const scheduledMatch of scheduledDemoMatches) {
    await db.update(matches).set({ matId: matIds[scheduledMatch.matIndex - 1] ?? null, scheduledAt: scheduledMatch.scheduledAt, durationMinutes: scheduledMatch.durationMinutes, delayMinutes: scheduledMatch.delayMinutes, schedulerOrder: scheduledMatch.schedulerOrder }).where(eq(matches.id, scheduledMatch.id));
  }
  await db.insert(auditLogs).values({ actorUserId, entityType: "tournament", entityId: tournamentId, action: "seed_demo", afterValue: { demo: true, divisions: divisions.map(division => division.name), athletes: names.length, recovered: !created, scheduled: true } });
  return { tournamentId, created, message: created ? "Demo tournament seeded" : "Demo tournament completed" } as const;
}


export async function reassignMatchMat(input: { matchId: number; matId: number | null; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
  if (!existing[0]) throw new Error("Match not found");
  if (existing[0].status === "finished") throw new Error("Finished matches cannot be reassigned");
  await db.update(matches).set({ matId: input.matId }).where(eq(matches.id, input.matchId));
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "match", entityId: input.matchId, action: "reassign_mat", beforeValue: { matId: existing[0].matId }, afterValue: { matId: input.matId } });
  return { success: true } as const;
}

export async function updateMatchSlots(input: { matchId: number; athleteAId: number | null; athleteBId: number | null; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const slotValidation = validateMatchSlots(input.athleteAId, input.athleteBId);
  if (!slotValidation.ok) throw new Error(slotValidation.reason);
  const existing = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
  if (!existing[0]) throw new Error("Match not found");
  if (!canEditMatchSlots(existing[0].status)) throw new Error("Finished matches cannot be edited");
  await db.update(matches).set({ athleteAId: input.athleteAId, athleteBId: input.athleteBId }).where(eq(matches.id, input.matchId));
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "match", entityId: input.matchId, action: "edit_slots", beforeValue: { athleteAId: existing[0].athleteAId, athleteBId: existing[0].athleteBId }, afterValue: { athleteAId: input.athleteAId, athleteBId: input.athleteBId } });
  return { success: true } as const;
}


export async function bulkCreateAthleteRegistrations(input: { tournamentId: number; rows: Array<{ fullName: string; email?: string; phone?: string; dateOfBirth: string; gender: "male" | "female"; belt: string; expectedWeight: number }>; sport?: string }) {
  if (input.rows.length > 500) throw new Error("A maximum of 500 athletes can be imported at once");
  const results: Array<{ athleteId: number; categoryId: number }> = [];
  for (const row of input.rows) {
    results.push(await createAthleteRegistration({
      athlete: { fullName: row.fullName, email: row.email || null, phone: row.phone || null, dateOfBirth: new Date(`${row.dateOfBirth}T00:00:00Z`), gender: row.gender, belt: row.belt, expectedWeight: row.expectedWeight.toFixed(2), clubId: null },
      registration: { tournamentId: input.tournamentId, status: "pending", paymentStatus: "unpaid", checkInStatus: "not_checked_in", weighInStatus: "pending" },
      sport: input.sport ?? "Brazilian Jiu-Jitsu",
    }));
  }
  return { imported: results.length, results };
}
