import { and, eq } from "drizzle-orm";
import { resolveCategory } from "../shared/category";
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
  const [tournamentRows, athleteRows, registrationRows, matchRows] = await Promise.all([
    db.select().from(tournaments),
    db.select().from(athletes),
    db.select().from(registrations),
    db.select().from(matches),
  ]);
  return {
    tournaments: tournamentRows,
    athletes: athleteRows,
    registrations: registrationRows,
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
  const categoryValue = resolveCategory({ age: 18, gender: input.athlete.gender, belt: input.athlete.belt, weight: Number(input.athlete.expectedWeight), sport });
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

export async function getTournamentBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tournaments).where(eq(tournaments.registrationSlug, slug)).limit(1);
  return result[0];
}

export async function createPublicRegistration(input: { tournamentId: number; fullName: string; email?: string; phone?: string; gender: "male" | "female"; belt: string; expectedWeight: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const tournament = await db.select().from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
  const categoryValue = resolveCategory({ age: 18, gender: input.gender, belt: input.belt, weight: Number(input.expectedWeight), sport: tournament[0]?.sport ?? "Brazilian Jiu-Jitsu" });
  const existingCategory = await db.select().from(categories).where(and(eq(categories.tournamentId, input.tournamentId), eq(categories.name, categoryValue.name))).limit(1);
  const categoryId = existingCategory[0]?.id ?? Number((await db.insert(categories).values({ tournamentId: input.tournamentId, name: categoryValue.name, ageGroup: categoryValue.ageGroup, gender: categoryValue.gender, belt: categoryValue.belt, weightLimit: categoryValue.weightLimit.toFixed(2), sport: categoryValue.sport }))[0].insertId);
  const athleteResult = await db.insert(athletes).values({ fullName: input.fullName, email: input.email || null, phone: input.phone || null, gender: input.gender, belt: input.belt, expectedWeight: input.expectedWeight });
  const athleteId = athleteResult[0].insertId;
  const code = `ATH-${String(athleteId).padStart(5, "0")}`;
  await db.insert(registrations).values({ tournamentId: input.tournamentId, athleteId, categoryId, status: "pending", paymentStatus: "unpaid", checkInStatus: "not_checked_in", weighInStatus: "pending", accreditationCode: code });
  return { athleteId, categoryId, accreditationCode: code };
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
