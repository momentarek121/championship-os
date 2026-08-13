import { and, asc, eq } from "drizzle-orm";
import { calculateAge, poolLabel, resolveCategory } from "../shared/category";
import { selectNextMatch } from "../shared/athletePortal";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, tournaments, athletes, clubs, registrations, categories, matches, mats, auditLogs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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
  const db = await getDb();
  if (!db) return { tournaments: [], athletes: [], registrations: [], matches: [], metrics: { registered: 0, paid: 0, checkedIn: 0, liveMatches: 0 } };
  const [tournamentRows, athleteRows, registrationRows, matchRows, categoryRows] = await Promise.all([
    db.select().from(tournaments),
    db.select().from(athletes),
    db.select().from(registrations).orderBy(asc(registrations.id)),
    db.select().from(matches),
    db.select().from(categories).orderBy(asc(categories.id)),
  ]);
  const categoryPositions = new Map<number, number>();
  const enrichedRegistrations = registrationRows.map(row => {
    const position = categoryPositions.get(row.categoryId ?? -1) ?? 0;
    categoryPositions.set(row.categoryId ?? -1, position + 1);
    return { ...row, categoryName: categoryRows.find(category => category.id === row.categoryId)?.name ?? "Unassigned", pool: row.categoryId ? poolLabel(Math.floor(position / 4)) : "Unassigned" };
  });
  return {
    tournaments: tournamentRows,
    athletes: athleteRows,
    registrations: enrichedRegistrations,
    matches: matchRows,
    metrics: {
      registered: registrationRows.length,
      paid: registrationRows.filter(row => row.paymentStatus === "paid").length,
      checkedIn: registrationRows.filter(row => row.checkInStatus === "checked_in").length,
      liveMatches: matchRows.filter(row => row.status === "live").length,
    },
  };
}

export async function createTournament(input: typeof tournaments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(tournaments).values(input);
  return result[0].insertId;
}

export async function createAthleteRegistration(input: { athlete: typeof athletes.$inferInsert; registration: Omit<typeof registrations.$inferInsert, "athleteId">; sport?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const tournament = await db.select().from(tournaments).where(eq(tournaments.id, input.registration.tournamentId)).limit(1);
  const sport = input.sport ?? tournament[0]?.sport ?? "Brazilian Jiu-Jitsu";
  if (!input.athlete.dateOfBirth) throw new Error("Date of birth is required for category assignment");
  const categoryValue = resolveCategory({ age: calculateAge(input.athlete.dateOfBirth), gender: input.athlete.gender, belt: input.athlete.belt, weight: Number(input.athlete.expectedWeight), sport });
  const existingCategory = await db.select().from(categories).where(and(eq(categories.tournamentId, input.registration.tournamentId), eq(categories.name, categoryValue.name))).limit(1);
  const categoryId = existingCategory[0]?.id ?? Number((await db.insert(categories).values({ tournamentId: input.registration.tournamentId, name: categoryValue.name, ageGroup: categoryValue.ageGroup, gender: categoryValue.gender, belt: categoryValue.belt, weightLimit: categoryValue.weightLimit.toFixed(2), sport: categoryValue.sport }))[0].insertId);
  const athleteResult = await db.insert(athletes).values(input.athlete);
  const athleteId = athleteResult[0].insertId;
  await db.insert(registrations).values({ ...input.registration, athleteId, categoryId });
  return { athleteId, categoryId };
}

export async function updateRegistrationStatus(id: number, values: Partial<typeof registrations.$inferInsert>, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  await db.update(registrations).set(values).where(eq(registrations.id, id));
  await db.insert(auditLogs).values({ actorUserId, entityType: "registration", entityId: id, action: "update", beforeValue: JSON.stringify(existing[0] ?? null), afterValue: JSON.stringify(values) });
  return { success: true } as const;
}

export async function updateTournamentWeighIn(tournamentId: number, weighInMode: "ibjjf" | "custom", weighInTolerance: string, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(tournaments).set({ weighInMode, weighInTolerance }).where(eq(tournaments.id, tournamentId));
  await db.insert(auditLogs).values({ actorUserId, entityType: "tournament", entityId: tournamentId, action: "weigh_in_settings", afterValue: JSON.stringify({ weighInMode, weighInTolerance }) });
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
  return result[0];
}

export async function getPublicParticipants(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const tournament = await getTournamentBySlug(slug);
  if (!tournament) return undefined;
  const [categoryRows, registrationRows, athleteRows] = await Promise.all([
    db.select().from(categories).where(eq(categories.tournamentId, tournament.id)).orderBy(asc(categories.id)),
    db.select().from(registrations).where(eq(registrations.tournamentId, tournament.id)).orderBy(asc(registrations.id)),
    db.select().from(athletes).orderBy(asc(athletes.id)),
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

export async function createPublicRegistration(input: { tournamentId: number; fullName: string; email?: string; phone?: string; dateOfBirth: string; gender: "male" | "female"; belt: string; expectedWeight: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const tournament = await db.select().from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
  if (!input.dateOfBirth) throw new Error("Date of birth is required for category assignment");
  const categoryValue = resolveCategory({ age: calculateAge(input.dateOfBirth), gender: input.gender, belt: input.belt, weight: Number(input.expectedWeight), sport: tournament[0]?.sport ?? "Brazilian Jiu-Jitsu" });
  const existingCategory = await db.select().from(categories).where(and(eq(categories.tournamentId, input.tournamentId), eq(categories.name, categoryValue.name))).limit(1);
  const categoryId = existingCategory[0]?.id ?? Number((await db.insert(categories).values({ tournamentId: input.tournamentId, name: categoryValue.name, ageGroup: categoryValue.ageGroup, gender: categoryValue.gender, belt: categoryValue.belt, weightLimit: categoryValue.weightLimit.toFixed(2), sport: categoryValue.sport }))[0].insertId);
  const categoryRegistrations = await db.select().from(registrations).where(and(eq(registrations.tournamentId, input.tournamentId), eq(registrations.categoryId, categoryId)));
  const pool = poolLabel(Math.floor(categoryRegistrations.length / 4));
  const athleteResult = await db.insert(athletes).values({ fullName: input.fullName, email: input.email || null, phone: input.phone || null, dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00Z`) : null, gender: input.gender, belt: input.belt, expectedWeight: input.expectedWeight });
  const athleteId = athleteResult[0].insertId;
  const code = `ATH-${String(athleteId).padStart(5, "0")}`;
  await db.insert(registrations).values({ tournamentId: input.tournamentId, athleteId, categoryId, status: "pending", paymentStatus: "unpaid", checkInStatus: "not_checked_in", weighInStatus: "pending", accreditationCode: code });
  return { athleteId, categoryId, accreditationCode: code, categoryName: categoryValue.name, pool };
}


export async function finishMatch(input: { matchId: number; winnerId: number; scoreA: number; scoreB: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
  if (!existing[0]) throw new Error("Match not found");
  if (![existing[0].athleteAId, existing[0].athleteBId].includes(input.winnerId)) throw new Error("Winner must be one of the match athletes");
  await db.update(matches).set({ winnerId: input.winnerId, scoreA: input.scoreA, scoreB: input.scoreB, status: "finished", finishedAt: new Date() }).where(eq(matches.id, input.matchId));
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "match", entityId: input.matchId, action: "finish", beforeValue: JSON.stringify(existing[0]), afterValue: JSON.stringify(input) });
  return { success: true } as const;
}

export async function updateMatchStatus(matchId: number, status: "queued" | "called" | "live" | "no_show", actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(matches).set({ status }).where(eq(matches.id, matchId));
  await db.insert(auditLogs).values({ actorUserId, entityType: "match", entityId: matchId, action: "status", afterValue: JSON.stringify({ status }) });
  return { success: true } as const;
}

export async function generateAutomaticBrackets(tournamentId: number, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(registrations).where(and(eq(registrations.tournamentId, tournamentId), eq(registrations.status, "approved"), eq(registrations.weighInStatus, "passed")));
  const grouped = new Map<number, typeof rows>();
  rows.forEach(row => { if (row.categoryId) grouped.set(row.categoryId, [...(grouped.get(row.categoryId) ?? []), row]); });
  grouped.forEach(categoryRows => categoryRows.sort((a, b) => (a.seed ?? 999999) - (b.seed ?? 999999)));
  let created = 0;
  await Promise.all(Array.from(grouped.entries()).map(async ([categoryId, categoryRows]) => {
    for (let index = 0; index < categoryRows.length - 1; index += 2) {
      await db.insert(matches).values({ tournamentId, categoryId, round: "Round 1", matchNumber: created + 1, athleteAId: categoryRows[index].athleteId, athleteBId: categoryRows[index + 1].athleteId, status: "queued" });
      created += 1;
    }
  }));
  await db.insert(auditLogs).values({ actorUserId, entityType: "tournament", entityId: tournamentId, action: "generate_brackets", afterValue: JSON.stringify({ created }) });
  return { success: true, created } as const;
}

export async function createManualMatch(input: { tournamentId: number; categoryId: number; athleteAId: number; athleteBId: number; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (input.athleteAId === input.athleteBId) throw new Error("A match needs two different athletes");
  const existing = await db.select().from(matches).where(and(eq(matches.tournamentId, input.tournamentId), eq(matches.athleteAId, input.athleteAId), eq(matches.athleteBId, input.athleteBId))).limit(1);
  if (existing[0]) return existing[0].id;
  const count = await db.select().from(matches).where(eq(matches.tournamentId, input.tournamentId));
  const result = await db.insert(matches).values({ tournamentId: input.tournamentId, categoryId: input.categoryId, round: "Manual", matchNumber: count.length + 1, athleteAId: input.athleteAId, athleteBId: input.athleteBId, status: "queued" });
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "tournament", entityId: input.tournamentId, action: "manual_match", afterValue: JSON.stringify(input) });
  return Number(result[0].insertId);
}
