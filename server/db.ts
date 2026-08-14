import { and, asc, desc, eq } from "drizzle-orm";
import { calculateAge, poolLabel, resolveCategory } from "../shared/category";
import { selectBracketEligible } from "../shared/operationFlow";
import { buildBracketPairs, nextBracketSlot, nextRoundMatchCount } from "../shared/bracket";
import { normalizeTournamentSettings } from "../shared/tournamentSettings";
import { selectNextMatch } from "../shared/athletePortal";
import { canEditMatchSlots, validateMatchSlots } from "../shared/matchEditing";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, tournaments, athletes, clubs, registrations, categories, matches, mats, auditLogs } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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
  const db = await getDb();
  if (!db) return { tournaments: [], athletes: [], registrations: [], matches: [], metrics: { registered: 0, paid: 0, checkedIn: 0, liveMatches: 0 } };
  const [tournamentRows, athleteRows, registrationRows, matchRows, categoryRows] = await Promise.all([
    db.select().from(tournaments).orderBy(desc(tournaments.id)),
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
  const [result] = await db.insert(tournaments).values(input).returning({ id: tournaments.id });
  return result.id;
}

export async function createAthleteRegistration(input: { athlete: typeof athletes.$inferInsert; registration: Omit<typeof registrations.$inferInsert, "athleteId">; sport?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const tournament = await db.select().from(tournaments).where(eq(tournaments.id, input.registration.tournamentId)).limit(1);
  const sport = input.sport ?? tournament[0]?.sport ?? "Brazilian Jiu-Jitsu";
  if (!input.athlete.dateOfBirth) throw new Error("Date of birth is required for category assignment");
  const categoryValue = resolveCategory({ age: calculateAge(input.athlete.dateOfBirth), gender: input.athlete.gender, belt: input.athlete.belt, weight: Number(input.athlete.expectedWeight), sport });
  const existingCategory = await db.select().from(categories).where(and(eq(categories.tournamentId, input.registration.tournamentId), eq(categories.name, categoryValue.name))).limit(1);
  let categoryId = existingCategory[0]?.id;
  if (!categoryId) { const [createdCategory] = await db.insert(categories).values({ tournamentId: input.registration.tournamentId, name: categoryValue.name, ageGroup: categoryValue.ageGroup, gender: categoryValue.gender, belt: categoryValue.belt, weightLimit: categoryValue.weightLimit.toFixed(2), sport: categoryValue.sport }).returning({ id: categories.id }); categoryId = createdCategory.id; }
  const [createdAthlete] = await db.insert(athletes).values(input.athlete).returning({ id: athletes.id });
  const athleteId = createdAthlete.id;
  await db.insert(registrations).values({ ...input.registration, athleteId, categoryId });
  return { athleteId, categoryId };
}

export async function updateRegistrationStatus(id: number, values: Partial<typeof registrations.$inferInsert>, actorUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  await db.update(registrations).set(values).where(eq(registrations.id, id));
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

export async function updateTournamentSettings(input: { tournamentId: number; organizationName: string; weighInMode: "ibjjf" | "custom"; weighInTolerance: string; scaleNotes: string; actorUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
  if (!existing[0]) throw new Error("Tournament not found");
  const settings = normalizeTournamentSettings(input);
  await db.update(tournaments).set({ organizationName: settings.organizationName, weighInMode: settings.weighInMode, weighInTolerance: settings.weighInTolerance, scaleNotes: settings.scaleNotes || null }).where(eq(tournaments.id, input.tournamentId));
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
  let categoryId = existingCategory[0]?.id;
  if (!categoryId) { const [createdCategory] = await db.insert(categories).values({ tournamentId: input.tournamentId, name: categoryValue.name, ageGroup: categoryValue.ageGroup, gender: categoryValue.gender, belt: categoryValue.belt, weightLimit: categoryValue.weightLimit.toFixed(2), sport: categoryValue.sport }).returning({ id: categories.id }); categoryId = createdCategory.id; }
  const categoryRegistrations = await db.select().from(registrations).where(and(eq(registrations.tournamentId, input.tournamentId), eq(registrations.categoryId, categoryId)));
  const pool = poolLabel(Math.floor(categoryRegistrations.length / 4));
  const [createdAthlete] = await db.insert(athletes).values({ fullName: input.fullName, email: input.email || null, phone: input.phone || null, dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00Z`) : null, gender: input.gender, belt: input.belt, expectedWeight: input.expectedWeight }).returning({ id: athletes.id });
  const athleteId = createdAthlete.id;
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
  const rows = await db.select().from(registrations).where(eq(registrations.tournamentId, tournamentId));
  const eligibleRows = selectBracketEligible(rows as Array<typeof rows[number] & { status: "pending" | "approved" | "rejected"; weighInStatus: "pending" | "passed" | "overweight" }>);
  const pairs = buildBracketPairs(eligibleRows);
  let created = 0;
  const categoryCounts = new Map<number, number>();
  for (const pair of pairs) {
    const matchNumber = (categoryCounts.get(pair.categoryId) ?? 0) + 1;
    categoryCounts.set(pair.categoryId, matchNumber);
    await db.insert(matches).values({ tournamentId, categoryId: pair.categoryId, round: "Round 1", matchNumber, athleteAId: pair.athleteAId, athleteBId: pair.athleteBId, status: "queued" });
    created += 1;
  }
  for (const [categoryId, firstRoundMatches] of Array.from(categoryCounts.entries())) {
    let currentRoundMatches = firstRoundMatches;
    let roundNumber = 2;
    while (currentRoundMatches > 1) {
      const nextRoundMatches = nextRoundMatchCount(currentRoundMatches);
      for (let matchNumber = 1; matchNumber <= nextRoundMatches; matchNumber += 1) {
        await db.insert(matches).values({ tournamentId, categoryId, round: `Round ${roundNumber}`, matchNumber, athleteAId: null, athleteBId: null, status: "queued" });
        created += 1;
      }
      currentRoundMatches = nextRoundMatches;
      roundNumber += 1;
    }
  }
  await db.insert(auditLogs).values({ actorUserId, entityType: "tournament", entityId: tournamentId, action: "generate_brackets", afterValue: { created, firstRoundMatches: pairs.length } });
  return { success: true, created } as const;
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
  if (existing[0]) return { tournamentId: existing[0].id, created: false, message: "Demo tournament already exists" } as const;
  const [createdTournament] = await db.insert(tournaments).values({ name: "Championship OS Demo Open", sport: "Brazilian Jiu-Jitsu", location: "Demo Arena", status: "live", ruleset: "IBJJF Standard", organizationName: "Championship OS Demo", registrationSlug: "demo-live", weighInMode: "ibjjf", weighInTolerance: "0.00", scaleNotes: "DEMO ONLY · Use the digital scale at Mat 1", createdBy: actorUserId }).returning({ id: tournaments.id });
  const tournamentId = createdTournament.id;
  const divisions = [
    { name: "Kids · Boys · White · -30 KG", ageGroup: "Kids", gender: "male" as const, belt: "White", weightLimit: "30.00", count: 4 },
    { name: "Girls · Youth · White · -45 KG", ageGroup: "Youth", gender: "female" as const, belt: "White", weightLimit: "45.00", count: 4 },
    { name: "Boys · Teens · Blue · -60 KG", ageGroup: "Teens", gender: "male" as const, belt: "Blue", weightLimit: "60.00", count: 4 },
    { name: "Women · Adult · Blue · -65 KG", ageGroup: "Adult", gender: "female" as const, belt: "Blue", weightLimit: "65.00", count: 4 },
    { name: "Men · Adult · All belts · -76 KG", ageGroup: "Adult", gender: "male" as const, belt: "Purple", weightLimit: "76.00", count: 4 },
  ];
  const names = ["Adam Demo", "Omar Demo", "Youssef Demo", "Karim Demo", "Lina Demo", "Mariam Demo", "Nada Demo", "Salma Demo", "Ziad Demo", "Hassan Demo", "Seif Demo", "Ali Demo", "Hana Demo", "Jana Demo", "Mira Demo", "Dina Demo", "Mostafa Demo", "Amr Demo", "Tarek Demo", "Khaled Demo"];
  const athletesByCategory: Array<{ categoryId: number; athleteIds: number[] }> = [];
  let nameIndex = 0;
  for (const [divisionIndex, division] of Array.from(divisions.entries())) {
    const [createdCategory] = await db.insert(categories).values({ tournamentId, name: division.name, ageGroup: division.ageGroup, gender: division.gender, belt: division.belt, weightLimit: division.weightLimit, sport: "Brazilian Jiu-Jitsu" }).returning({ id: categories.id });
    const categoryId = createdCategory.id;
    const athleteIds: number[] = [];
    for (let index = 0; index < division.count; index += 1) {
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
  const matIds: number[] = [];
  for (const name of ["Mat 1", "Mat 2", "Mat 3", "Mat 4"]) {
    const [createdMat] = await db.insert(mats).values({ tournamentId, name, status: name === "Mat 1" ? "active" : "idle" }).returning({ id: mats.id });
    matIds.push(createdMat.id);
  }
  let matchNumber = 1;
  for (const [index, group] of Array.from(athletesByCategory.entries())) {
    const [a, b, c] = group.athleteIds;
    await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, matId: matIds[index % matIds.length], round: "Round 1", matchNumber: matchNumber++, athleteAId: a, athleteBId: b, scoreA: 4, scoreB: 0, winnerId: a, status: "finished", finishedAt: new Date() });
    await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, matId: matIds[(index + 1) % matIds.length], round: "Round 1", matchNumber: matchNumber++, athleteAId: c, athleteBId: null, scoreA: 0, scoreB: 0, status: index === 0 ? "live" : "queued" });
    await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, matId: matIds[index % matIds.length], round: "Round 2", matchNumber: matchNumber++, athleteAId: a, athleteBId: c, scoreA: index === 0 ? 2 : 8, scoreB: index === 0 ? 0 : 6, winnerId: index === 0 ? null : a, status: index === 0 ? "queued" : "finished", finishedAt: index === 0 ? null : new Date() });
  }
  await db.insert(auditLogs).values({ actorUserId, entityType: "tournament", entityId: tournamentId, action: "seed_demo", afterValue: { demo: true, divisions: divisions.map(division => division.name), athletes: names.length } });
  return { tournamentId, created: true, message: "Demo tournament seeded" } as const;
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
