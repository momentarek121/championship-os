// dist/vercel.js
import express2 from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { parse as parseCookieHeader2 } from "cookie";
import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { bigint, integer, jsonb, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import express from "express";
import fs from "fs";
import path from "path";
import { z as z2 } from "zod";
import { nanoid } from "nanoid";
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};
function calculateAge(dateOfBirth, now = /* @__PURE__ */ new Date()) {
  const birth = typeof dateOfBirth === "string" ? /* @__PURE__ */ new Date(`${dateOfBirth}T00:00:00Z`) : dateOfBirth;
  if (Number.isNaN(birth.getTime())) throw new Error("Invalid date of birth");
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || monthDelta === 0 && now.getUTCDate() < birth.getUTCDate()) age -= 1;
  return age;
}
function expandCompetitionModes(mode) {
  return mode === "both" ? ["gi", "nogi"] : [mode];
}
function resolveCategory(input) {
  const ageGroup = input.age < 13 ? "Kids" : input.age < 16 ? "Youth" : input.age < 18 ? "Teens" : input.age < 30 ? "Adult" : "Master";
  const weightLimit = input.gender === "male" ? input.weight <= 77 ? 77 : input.weight <= 85 ? 85 : 94 : input.weight <= 63 ? 63 : input.weight <= 70 ? 70 : 76;
  const competitionMode = input.competitionMode ?? "gi";
  const modeLabel = competitionMode === "nogi" ? "No-Gi" : competitionMode === "both" ? "GI + No-Gi" : "GI";
  return { ageGroup, gender: input.gender === "male" ? "Male" : "Female", belt: input.belt, weightLimit, competitionMode, name: `${ageGroup} / ${input.gender === "male" ? "Male" : "Female"} / ${input.belt} / ${modeLabel} / -${weightLimit} KG`, sport: input.sport };
}
function poolLabel(index) {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + value % 26) + label;
    value = Math.floor(value / 26);
  }
  return `Pool ${label}`;
}
function selectBracketEligible(rows) {
  return rows.filter((row) => row.status === "approved" && row.weighInStatus === "passed");
}
function buildBracketPairs(rows) {
  const grouped = /* @__PURE__ */ new Map();
  rows.forEach((row) => {
    if (row.categoryId == null) return;
    grouped.set(row.categoryId, [...grouped.get(row.categoryId) ?? [], row]);
  });
  const pairs = [];
  Array.from(grouped.entries()).forEach(([categoryId, categoryRows]) => {
    categoryRows.sort((a, b) => (a.seed ?? 999999) - (b.seed ?? 999999) || a.athleteId - b.athleteId);
    for (let index = 0; index < categoryRows.length - 1; index += 2) {
      pairs.push({ categoryId, athleteAId: categoryRows[index].athleteId, athleteBId: categoryRows[index + 1].athleteId });
    }
  });
  return pairs;
}
function nextRoundMatchCount(firstRoundMatches) {
  return firstRoundMatches > 1 ? Math.ceil(firstRoundMatches / 2) : 0;
}
function nextBracketSlot(round, matchNumber) {
  if (matchNumber < 1) return null;
  const namedRounds = { "Round of 16": "Quarterfinal", Quarterfinal: "Semifinal", Semifinal: "Final", Final: null };
  if (round in namedRounds) {
    const nextRound = namedRounds[round];
    return nextRound ? { round: nextRound, matchNumber: Math.ceil(matchNumber / 2), slot: matchNumber % 2 === 1 ? "athleteAId" : "athleteBId" } : null;
  }
  const roundNumber = Number(round.match(/\d+/)?.[0] ?? 0);
  if (!roundNumber) return null;
  return { round: `Round ${roundNumber + 1}`, matchNumber: Math.ceil(matchNumber / 2), slot: matchNumber % 2 === 1 ? "athleteAId" : "athleteBId" };
}
function roundLabel(matchCount) {
  if (matchCount >= 8) return "Round of 16";
  if (matchCount >= 4) return "Quarterfinal";
  if (matchCount >= 2) return "Semifinal";
  return "Final";
}
function pickCandidate(remaining, lastCategoryId) {
  return remaining.find((match) => match.categoryId !== lastCategoryId) ?? remaining[0];
}
function buildMatSchedule(matches2, options) {
  const matCount = Math.max(1, Math.floor(options.matCount));
  const durationMinutes = Math.max(1, Math.floor(options.durationMinutes ?? 6));
  const transitionMinutes = Math.max(0, Math.floor(options.transitionMinutes ?? 2));
  const remaining = [...matches2].sort((a, b) => a.matchNumber - b.matchNumber || a.id - b.id);
  const lastCategory = Array.from({ length: matCount }, () => null);
  const matCounts = Array.from({ length: matCount }, () => 0);
  const output = [];
  let order = 1;
  while (remaining.length) {
    for (let matIndex = 0; matIndex < matCount && remaining.length; matIndex += 1) {
      const lockedId = options.lockedMatIds?.[remaining[0].id];
      const preferredIndex = lockedId ? Math.max(0, Math.min(matCount - 1, lockedId - 1)) : matIndex;
      const candidates = remaining.filter((match) => options.lockedMatIds?.[match.id] ? options.lockedMatIds[match.id] === preferredIndex + 1 : true);
      if (!candidates.length) continue;
      const candidate = pickCandidate(candidates, lastCategory[preferredIndex]);
      const index = remaining.findIndex((match) => match.id === candidate.id);
      remaining.splice(index, 1);
      const slot = matCounts[preferredIndex];
      const scheduledAt = new Date(options.startAt.getTime() + slot * (durationMinutes + transitionMinutes) * 6e4);
      output.push({ ...candidate, matIndex: preferredIndex + 1, schedulerOrder: order, scheduledAt, durationMinutes, delayMinutes: 0 });
      lastCategory[preferredIndex] = candidate.categoryId;
      matCounts[preferredIndex] += 1;
      order += 1;
    }
    if (remaining.length && output.length === 0) break;
  }
  return output;
}
function calculateAcademyStandings(rows) {
  const grouped = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const academy = row.academy?.trim() || "Unattached";
    const current = grouped.get(academy) ?? { academy, wins: 0, gold: 0, silver: 0, bronze: 0, matches: 0 };
    current.matches += 1;
    if (row.winner) current.wins += 1;
    if (row.medal === "gold") current.gold += 1;
    if (row.medal === "silver") current.silver += 1;
    if (row.medal === "bronze") current.bronze += 1;
    grouped.set(academy, current);
  }
  return Array.from(grouped.values()).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || b.wins - a.wins || a.academy.localeCompare(b.academy));
}
function roundRank(round) {
  const match = round.match(/round\s+(\d+)/i);
  if (match) return Number(match[1]);
  if (/final/i.test(round)) return 99;
  if (/semi/i.test(round)) return 98;
  return 0;
}
function selectMedalResults(matches2) {
  const byCategory = /* @__PURE__ */ new Map();
  for (const match of matches2) {
    if (match.status !== "finished" || !match.winnerId) continue;
    const bucket = byCategory.get(match.categoryId) ?? [];
    bucket.push(match);
    byCategory.set(match.categoryId, bucket);
  }
  return Array.from(byCategory.entries()).sort(([a], [b]) => a - b).map(([categoryId, rows]) => {
    const ordered = [...rows].sort((a, b) => roundRank(b.round) - roundRank(a.round) || b.matchNumber - a.matchNumber);
    const finalRank = roundRank(ordered[0]?.round ?? "");
    const final = ordered.find((row) => /final/i.test(row.round)) ?? ordered.find((row) => roundRank(row.round) === finalRank) ?? ordered[0];
    if (!final?.winnerId) return { categoryId, goldId: null, silverId: null, bronzeIds: [] };
    const silverId = final.athleteAId === final.winnerId ? final.athleteBId : final.athleteAId;
    const semiLosers = rows.filter((row) => (/semi/i.test(row.round) || roundRank(row.round) === finalRank - 1) && row.winnerId).map((row) => row.athleteAId === row.winnerId ? row.athleteBId : row.athleteAId).filter((id) => id !== null && id !== silverId && id !== final.winnerId);
    const uniqueBronze = Array.from(new Set(semiLosers)).slice(0, 2);
    return { categoryId, goldId: final.winnerId, silverId, bronzeIds: uniqueBronze };
  });
}
function normalizeTournamentSettings(input) {
  const organizationName = input.organizationName.trim();
  const weighInTolerance = input.weighInTolerance.trim() || "0.00";
  if (organizationName.length < 2) throw new Error("Organization name is required");
  if (!/^\d+(\.\d{1,2})?$/.test(weighInTolerance)) throw new Error("Invalid weigh-in tolerance");
  return {
    organizationName,
    weighInMode: input.weighInMode,
    weighInTolerance,
    scaleNotes: input.scaleNotes.trim()
  };
}
function formatBeltPolicyNote(selectedBelts = []) {
  const belts = selectedBelts.length ? selectedBelts.join(", ") : "No belt, White, Blue, Purple, Brown, Black";
  return `Belt policy: ${belts}; children may use organization-defined belt bands.`;
}
function selectNextMatch(matches2) {
  return [...matches2].sort((a, b) => a.matchNumber - b.matchNumber).find((match) => match.status !== "finished" && match.status !== "no_show");
}
function canEditMatchSlots(status) {
  return status !== "finished";
}
function validateMatchSlots(athleteAId, athleteBId) {
  if (athleteAId !== null && athleteAId === athleteBId) {
    return { ok: false, reason: "A match cannot contain the same athlete twice" };
  }
  return { ok: true };
}
var users = pgTable("users", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: text("role").$type().notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull()
});
var tournaments = pgTable("tournaments", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  sport: varchar("sport", { length: 80 }).notNull(),
  location: varchar("location", { length: 180 }),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  status: text("status").$type().notNull().default("draft"),
  ruleset: varchar("ruleset", { length: 120 }).default("IBJJF Standard").notNull(),
  organizationName: varchar("organization_name", { length: 160 }).default("Championship OS").notNull(),
  registrationSlug: varchar("registration_slug", { length: 120 }).notNull().unique(),
  weighInMode: text("weigh_in_mode").$type().notNull().default("ibjjf"),
  weighInTolerance: numeric("weigh_in_tolerance", { precision: 6, scale: 2 }).default("0.00").notNull(),
  competitionMode: text("competition_mode").$type().notNull().default("gi"),
  scaleNotes: text("scale_notes"),
  createdBy: bigint("created_by", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var clubs = pgTable("clubs", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  country: varchar("country", { length: 80 }),
  contactName: varchar("contact_name", { length: 120 }),
  contactPhone: varchar("contact_phone", { length: 40 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var athletes = pgTable("athletes", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  fullName: varchar("full_name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  gender: text("gender").$type().notNull(),
  belt: varchar("belt", { length: 40 }).notNull(),
  expectedWeight: numeric("expected_weight", { precision: 6, scale: 2 }),
  actualWeight: numeric("actual_weight", { precision: 6, scale: 2 }),
  clubId: bigint("club_id", { mode: "number" }),
  federationId: varchar("federation_id", { length: 80 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var categories = pgTable("categories", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  tournamentId: bigint("tournament_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  ageGroup: varchar("age_group", { length: 60 }).notNull(),
  gender: varchar("gender", { length: 20 }).notNull(),
  belt: varchar("belt", { length: 40 }).notNull(),
  weightLimit: numeric("weight_limit", { precision: 6, scale: 2 }).notNull(),
  sport: varchar("sport", { length: 80 }).notNull(),
  competitionMode: text("competition_mode").$type().notNull().default("gi"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var registrations = pgTable("registrations", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  tournamentId: bigint("tournament_id", { mode: "number" }).notNull(),
  athleteId: bigint("athlete_id", { mode: "number" }).notNull(),
  categoryId: bigint("category_id", { mode: "number" }),
  seed: integer("seed"),
  status: text("status").$type().notNull().default("pending"),
  paymentStatus: text("payment_status").$type().notNull().default("unpaid"),
  paymentMethod: varchar("payment_method", { length: 40 }),
  checkInStatus: text("check_in_status").$type().notNull().default("not_checked_in"),
  weighInStatus: text("weigh_in_status").$type().notNull().default("pending"),
  weighInNotes: text("weigh_in_notes"),
  accreditationCode: varchar("accreditation_code", { length: 40 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var mats = pgTable("mats", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  tournamentId: bigint("tournament_id", { mode: "number" }).notNull(),
  name: varchar("name", { length: 40 }).notNull(),
  status: text("status").$type().notNull().default("idle"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var matches = pgTable("matches", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  tournamentId: bigint("tournament_id", { mode: "number" }).notNull(),
  categoryId: bigint("category_id", { mode: "number" }).notNull(),
  matId: bigint("mat_id", { mode: "number" }),
  round: varchar("round", { length: 40 }).notNull(),
  matchNumber: integer("match_number").notNull(),
  athleteAId: bigint("athlete_a_id", { mode: "number" }),
  athleteBId: bigint("athlete_b_id", { mode: "number" }),
  winnerId: bigint("winner_id", { mode: "number" }),
  scoreA: integer("score_a").default(0).notNull(),
  scoreB: integer("score_b").default(0).notNull(),
  advantageA: integer("advantage_a").default(0).notNull(),
  advantageB: integer("advantage_b").default(0).notNull(),
  penaltyA: integer("penalty_a").default(0).notNull(),
  penaltyB: integer("penalty_b").default(0).notNull(),
  evaluation: text("evaluation"),
  status: text("status").$type().notNull().default("queued"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes").notNull().default(6),
  delayMinutes: integer("delay_minutes").notNull().default(0),
  schedulerOrder: integer("scheduler_order"),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var auditLogs = pgTable("audit_logs", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  actorUserId: bigint("actor_user_id", { mode: "number" }),
  entityType: varchar("entity_type", { length: 60 }).notNull(),
  entityId: bigint("entity_id", { mode: "number" }).notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  beforeValue: jsonb("before_value"),
  afterValue: jsonb("after_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};
var _db = null;
async function getDb() {
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
async function updateUserRole(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!existing[0]) throw new Error("User not found");
  if (existing[0].openId === ENV.ownerOpenId && input.role !== "admin") throw new Error("The project owner must remain an admin");
  await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "user", entityId: input.userId, action: "role_change", beforeValue: { role: existing[0].role }, afterValue: { role: input.role } });
  return { success: true };
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getTournamentDashboard() {
  const db = await getDb();
  if (!db) return { tournaments: [], athletes: [], registrations: [], matches: [], mats: [], standings: [], metrics: { registered: 0, paid: 0, checkedIn: 0, liveMatches: 0 } };
  const [tournamentRows, athleteRows, registrationRows, matchRows, categoryRows, matRows, clubRows] = await Promise.all([
    db.select().from(tournaments).orderBy(desc(tournaments.id)),
    db.select().from(athletes),
    db.select().from(registrations).orderBy(asc(registrations.id)),
    db.select().from(matches),
    db.select().from(categories).orderBy(asc(categories.id)),
    db.select().from(mats).orderBy(asc(mats.id)),
    db.select().from(clubs).orderBy(asc(clubs.id))
  ]);
  const categoryPositions = /* @__PURE__ */ new Map();
  const clubNames = new Map(clubRows.map((club) => [club.id, club.name]));
  const athleteClubs = new Map(athleteRows.map((athlete) => [athlete.id, athlete.clubId ? clubNames.get(athlete.clubId) ?? null : null]));
  const finishedMatches = matchRows.filter((match) => match.status === "finished" && match.winnerId != null);
  const medalResults = selectMedalResults(matchRows);
  const medalByAthlete = /* @__PURE__ */ new Map();
  medalResults.forEach((result) => {
    if (result.goldId != null) medalByAthlete.set(result.goldId, "gold");
    if (result.silverId != null) medalByAthlete.set(result.silverId, "silver");
    result.bronzeIds.forEach((id) => medalByAthlete.set(id, "bronze"));
  });
  const standings = calculateAcademyStandings(finishedMatches.map((match) => ({ academy: athleteClubs.get(match.winnerId) ?? "Unattached", winner: true, medal: medalByAthlete.get(match.winnerId) ?? null })));
  const enrichedRegistrations = registrationRows.map((row) => {
    const position = categoryPositions.get(row.categoryId ?? -1) ?? 0;
    categoryPositions.set(row.categoryId ?? -1, position + 1);
    const category = categoryRows.find((category2) => category2.id === row.categoryId);
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
      paid: registrationRows.filter((row) => row.paymentStatus === "paid").length,
      checkedIn: registrationRows.filter((row) => row.checkInStatus === "checked_in").length,
      liveMatches: matchRows.filter((row) => row.status === "live").length
    }
  };
}
async function createTournament(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const { matCount = 4, ...tournamentValues } = input;
  const [result] = await db.insert(tournaments).values(tournamentValues).returning({ id: tournaments.id });
  await db.insert(mats).values(Array.from({ length: Math.max(1, Math.min(32, matCount)) }, (_, index) => ({ tournamentId: result.id, name: `Mat ${index + 1}`, status: index === 0 ? "active" : "idle" })));
  return result.id;
}
async function createAthleteRegistration(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const tournament = await db.select().from(tournaments).where(eq(tournaments.id, input.registration.tournamentId)).limit(1);
  const sport = input.sport ?? tournament[0]?.sport ?? "Brazilian Jiu-Jitsu";
  if (!input.athlete.dateOfBirth) throw new Error("Date of birth is required for category assignment");
  const competitionMode = tournament[0]?.competitionMode ?? "gi";
  const categoryValue = resolveCategory({ age: calculateAge(input.athlete.dateOfBirth), gender: input.athlete.gender, belt: input.athlete.belt, weight: Number(input.athlete.expectedWeight), sport, competitionMode });
  const existingCategory = await db.select().from(categories).where(and(eq(categories.tournamentId, input.registration.tournamentId), eq(categories.name, categoryValue.name))).limit(1);
  let categoryId = existingCategory[0]?.id;
  if (!categoryId) {
    const [createdCategory] = await db.insert(categories).values({ tournamentId: input.registration.tournamentId, name: categoryValue.name, ageGroup: categoryValue.ageGroup, gender: categoryValue.gender, belt: categoryValue.belt, weightLimit: categoryValue.weightLimit.toFixed(2), sport: categoryValue.sport, competitionMode: categoryValue.competitionMode }).returning({ id: categories.id });
    categoryId = createdCategory.id;
  }
  const [createdAthlete] = await db.insert(athletes).values(input.athlete).returning({ id: athletes.id });
  const athleteId = createdAthlete.id;
  await db.insert(registrations).values({ ...input.registration, athleteId, categoryId });
  return { athleteId, categoryId };
}
async function updateAthleteProfile(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(athletes).where(eq(athletes.id, input.athleteId)).limit(1);
  if (!existing[0]) throw new Error("Athlete not found");
  const { athleteId, actorUserId, ...values } = input;
  await db.update(athletes).set(values).where(eq(athletes.id, athleteId));
  await db.insert(auditLogs).values({ actorUserId, entityType: "athlete", entityId: athleteId, action: "profile_update", beforeValue: existing[0], afterValue: values });
  return { success: true };
}
async function updateRegistrationStatus(id, values, actorUserId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  const { actualWeight, ...registrationValues } = values;
  if (Object.keys(registrationValues).length > 0) await db.update(registrations).set(registrationValues).where(eq(registrations.id, id));
  if (actualWeight !== void 0 && existing[0]?.athleteId) await db.update(athletes).set({ actualWeight: actualWeight.toFixed(2) }).where(eq(athletes.id, existing[0].athleteId));
  await db.insert(auditLogs).values({ actorUserId, entityType: "registration", entityId: id, action: "update", beforeValue: existing[0] ?? null, afterValue: values });
  return { success: true };
}
async function updateTournamentWeighIn(tournamentId, weighInMode, weighInTolerance, actorUserId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(tournaments).set({ weighInMode, weighInTolerance }).where(eq(tournaments.id, tournamentId));
  await db.insert(auditLogs).values({ actorUserId, entityType: "tournament", entityId: tournamentId, action: "weigh_in_settings", afterValue: { weighInMode, weighInTolerance } });
  return { success: true };
}
async function updateTournamentSettings(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
  if (!existing[0]) throw new Error("Tournament not found");
  const settings = normalizeTournamentSettings(input);
  const beltPolicyNote = formatBeltPolicyNote(input.beltPolicy);
  const notes = [settings.scaleNotes, beltPolicyNote, `Competition mode: ${input.competitionMode === "nogi" ? "No-Gi" : input.competitionMode === "both" ? "GI + No-Gi" : "GI"}`].filter(Boolean).join(" \xB7 ");
  await db.update(tournaments).set({ organizationName: settings.organizationName, weighInMode: settings.weighInMode, weighInTolerance: settings.weighInTolerance, competitionMode: input.competitionMode, scaleNotes: notes || null }).where(eq(tournaments.id, input.tournamentId));
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "tournament", entityId: input.tournamentId, action: "settings", beforeValue: existing[0], afterValue: settings });
  return { success: true };
}
async function getClubs() {
  const db = await getDb();
  return db ? db.select().from(clubs) : [];
}
async function getAthletePortal(slug, accreditationCode) {
  const db = await getDb();
  if (!db) return void 0;
  const tournament = await db.select().from(tournaments).where(eq(tournaments.registrationSlug, slug)).limit(1);
  if (!tournament[0]) return void 0;
  const registration = await db.select().from(registrations).where(and(eq(registrations.tournamentId, tournament[0].id), eq(registrations.accreditationCode, accreditationCode))).limit(1);
  if (!registration[0]) return void 0;
  const athlete = await db.select().from(athletes).where(eq(athletes.id, registration[0].athleteId)).limit(1);
  const category = registration[0].categoryId ? await db.select().from(categories).where(eq(categories.id, registration[0].categoryId)).limit(1) : [];
  const athleteMatches = await db.select().from(matches).where(and(eq(matches.tournamentId, tournament[0].id), eq(matches.athleteAId, registration[0].athleteId)));
  const opponentMatches = await db.select().from(matches).where(and(eq(matches.tournamentId, tournament[0].id), eq(matches.athleteBId, registration[0].athleteId)));
  const tournamentMats = await db.select().from(mats).where(eq(mats.tournamentId, tournament[0].id));
  const allMatches = [...athleteMatches, ...opponentMatches].sort((a, b) => a.matchNumber - b.matchNumber);
  const matchesWithMats = allMatches.map((match) => ({ ...match, matName: tournamentMats.find((mat) => mat.id === match.matId)?.name ?? "TBA" }));
  const nextMatch = selectNextMatch(matchesWithMats);
  return { tournament: tournament[0], registration: registration[0], athlete: athlete[0], category: category[0], nextMatch, matches: matchesWithMats };
}
async function getTournamentBySlug(slug) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(tournaments).where(eq(tournaments.registrationSlug, slug)).limit(1);
  return result[0];
}
async function getPublicParticipants(slug) {
  const db = await getDb();
  if (!db) return void 0;
  const tournament = await getTournamentBySlug(slug);
  if (!tournament) return void 0;
  const [categoryRows, registrationRows, athleteRows] = await Promise.all([
    db.select().from(categories).where(eq(categories.tournamentId, tournament.id)).orderBy(asc(categories.id)),
    db.select().from(registrations).where(eq(registrations.tournamentId, tournament.id)).orderBy(asc(registrations.id)),
    db.select().from(athletes).orderBy(asc(athletes.id))
  ]);
  const athleteById = new Map(athleteRows.map((athlete) => [athlete.id, athlete]));
  const grouped = categoryRows.map((category) => {
    const rows = registrationRows.filter((row) => row.categoryId === category.id);
    const approved = rows.filter((row) => row.status === "approved");
    const unapproved = rows.filter((row) => row.status !== "approved");
    return {
      category,
      approvedCount: approved.length,
      unapprovedCount: unapproved.length,
      approved: approved.map((row) => ({ id: row.id, athleteId: row.athleteId, name: athleteById.get(row.athleteId)?.fullName ?? `Athlete #${row.athleteId}`, pool: poolLabel(Math.floor(rows.indexOf(row) / 4)) })),
      unapproved: unapproved.map((row) => ({ id: row.id, athleteId: row.athleteId, name: athleteById.get(row.athleteId)?.fullName ?? `Athlete #${row.athleteId}` }))
    };
  });
  return { tournament, categories: grouped };
}
async function createPublicRegistration(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const tournament = await db.select().from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
  if (!input.dateOfBirth) throw new Error("Date of birth is required for category assignment");
  const modes = expandCompetitionModes(input.competitionMode);
  const [createdAthlete] = await db.insert(athletes).values({ fullName: input.fullName, email: input.email || null, phone: input.phone || null, dateOfBirth: /* @__PURE__ */ new Date(`${input.dateOfBirth}T00:00:00Z`), gender: input.gender, belt: input.belt, expectedWeight: input.expectedWeight }).returning({ id: athletes.id });
  const athleteId = createdAthlete.id;
  const code = `ATH-${String(athleteId).padStart(5, "0")}`;
  const created = [];
  for (const competitionMode of modes) {
    const categoryValue = resolveCategory({ age: calculateAge(input.dateOfBirth), gender: input.gender, belt: input.belt, weight: Number(input.expectedWeight), sport: tournament[0]?.sport ?? "Brazilian Jiu-Jitsu", competitionMode });
    const existingCategory = await db.select().from(categories).where(and(eq(categories.tournamentId, input.tournamentId), eq(categories.name, categoryValue.name))).limit(1);
    let categoryId = existingCategory[0]?.id;
    if (!categoryId) {
      const [createdCategory] = await db.insert(categories).values({ tournamentId: input.tournamentId, name: categoryValue.name, ageGroup: categoryValue.ageGroup, gender: categoryValue.gender, belt: categoryValue.belt, weightLimit: categoryValue.weightLimit.toFixed(2), sport: categoryValue.sport, competitionMode: categoryValue.competitionMode }).returning({ id: categories.id });
      categoryId = createdCategory.id;
    }
    const categoryRegistrations = await db.select().from(registrations).where(and(eq(registrations.tournamentId, input.tournamentId), eq(registrations.categoryId, categoryId)));
    const pool = poolLabel(Math.floor(categoryRegistrations.length / 4));
    const registrationCode = modes.length > 1 ? `${code}-${competitionMode.toUpperCase()}` : code;
    await db.insert(registrations).values({ tournamentId: input.tournamentId, athleteId, categoryId, status: "pending", paymentStatus: "unpaid", checkInStatus: "not_checked_in", weighInStatus: "pending", accreditationCode: registrationCode });
    created.push({ categoryId, categoryName: categoryValue.name, competitionMode, pool });
  }
  return { athleteId, categoryId: created[0].categoryId, accreditationCode: code, registrations: created };
}
async function finishMatch(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
  if (!existing[0]) throw new Error("Match not found");
  if (![existing[0].athleteAId, existing[0].athleteBId].includes(input.winnerId)) throw new Error("Winner must be one of the match athletes");
  await db.update(matches).set({ winnerId: input.winnerId, scoreA: input.scoreA, scoreB: input.scoreB, advantageA: input.advantageA ?? 0, advantageB: input.advantageB ?? 0, penaltyA: input.penaltyA ?? 0, penaltyB: input.penaltyB ?? 0, evaluation: input.evaluation ?? null, status: "finished", finishedAt: /* @__PURE__ */ new Date() }).where(eq(matches.id, input.matchId));
  const slot = nextBracketSlot(existing[0].round, existing[0].matchNumber);
  let advancedTo = null;
  if (slot) {
    const next = await db.select().from(matches).where(and(eq(matches.tournamentId, existing[0].tournamentId), eq(matches.categoryId, existing[0].categoryId), eq(matches.round, slot.round), eq(matches.matchNumber, slot.matchNumber))).limit(1);
    if (next[0] && next[0].status !== "finished") {
      await db.update(matches).set({ [slot.slot]: input.winnerId }).where(eq(matches.id, next[0].id));
      advancedTo = next[0].id;
    }
  }
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "match", entityId: input.matchId, action: "finish", beforeValue: existing[0], afterValue: { ...input, advancedTo } });
  return { success: true, advancedTo };
}
async function updateMatchStatus(matchId, status, actorUserId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(matches).set({ status }).where(eq(matches.id, matchId));
  await db.insert(auditLogs).values({ actorUserId, entityType: "match", entityId: matchId, action: "status", afterValue: { status } });
  return { success: true };
}
async function generateAutomaticBrackets(tournamentId, actorUserId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db.select().from(registrations).where(eq(registrations.tournamentId, tournamentId));
  const eligibleRows = selectBracketEligible(rows);
  const pairs = buildBracketPairs(eligibleRows);
  let created = 0;
  const pairsByCategory = /* @__PURE__ */ new Map();
  for (const pair of pairs) pairsByCategory.set(pair.categoryId, [...pairsByCategory.get(pair.categoryId) ?? [], pair]);
  for (const [categoryId, categoryPairs] of Array.from(pairsByCategory.entries())) {
    const firstRoundMatches = categoryPairs.length;
    for (let index = 0; index < categoryPairs.length; index += 1) {
      const pair = categoryPairs[index];
      await db.insert(matches).values({ tournamentId, categoryId, round: roundLabel(firstRoundMatches), matchNumber: index + 1, athleteAId: pair.athleteAId, athleteBId: pair.athleteBId, status: "queued", durationMinutes: 6, delayMinutes: 0 });
      created += 1;
    }
    let currentRoundMatches = firstRoundMatches;
    while (currentRoundMatches > 1) {
      const nextRoundMatches = nextRoundMatchCount(currentRoundMatches);
      const nextRound = nextRoundMatches === 1 ? "Final" : roundLabel(nextRoundMatches * 2);
      for (let matchNumber = 1; matchNumber <= nextRoundMatches; matchNumber += 1) {
        await db.insert(matches).values({ tournamentId, categoryId, round: nextRound, matchNumber, athleteAId: null, athleteBId: null, status: "queued", durationMinutes: 6, delayMinutes: 0 });
        created += 1;
      }
      currentRoundMatches = nextRoundMatches;
    }
  }
  const availableMats = await db.select().from(mats).where(eq(mats.tournamentId, tournamentId));
  if (availableMats.length === 0 && created > 0) throw new Error("No mats are configured for this tournament. Add at least one mat before generating the schedule.");
  const generatedMatches = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId));
  if (generatedMatches.length > 0) {
    const scheduled = buildMatSchedule(generatedMatches, { matCount: availableMats.length || 1, startAt: /* @__PURE__ */ new Date(), durationMinutes: 6, transitionMinutes: 2 });
    for (const scheduledMatch of scheduled) {
      await db.update(matches).set({ matId: availableMats[scheduledMatch.matIndex - 1]?.id ?? null, scheduledAt: scheduledMatch.scheduledAt, durationMinutes: scheduledMatch.durationMinutes, delayMinutes: scheduledMatch.delayMinutes, schedulerOrder: scheduledMatch.schedulerOrder }).where(eq(matches.id, scheduledMatch.id));
    }
  }
  await db.insert(auditLogs).values({ actorUserId, entityType: "tournament", entityId: tournamentId, action: "generate_brackets", afterValue: { created, firstRoundMatches: pairs.length, scheduled: true } });
  return { success: true, created };
}
async function createManualMatch(input) {
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
async function seedDemoTournament(actorUserId) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(tournaments).where(eq(tournaments.registrationSlug, "demo-live")).limit(1);
  const divisions = [
    { name: "Kids \xB7 Boys \xB7 White \xB7 -30 KG", ageGroup: "Kids", gender: "male", belt: "White", weightLimit: "30.00", count: 4 },
    { name: "Girls \xB7 Youth \xB7 White \xB7 -45 KG", ageGroup: "Youth", gender: "female", belt: "White", weightLimit: "45.00", count: 4 },
    { name: "Boys \xB7 Teens \xB7 Blue \xB7 -60 KG", ageGroup: "Teens", gender: "male", belt: "Blue", weightLimit: "60.00", count: 4 },
    { name: "Women \xB7 Adult \xB7 Blue \xB7 -65 KG", ageGroup: "Adult", gender: "female", belt: "Blue", weightLimit: "65.00", count: 4 },
    { name: "Men \xB7 Adult \xB7 All belts \xB7 -76 KG", ageGroup: "Adult", gender: "male", belt: "Purple", weightLimit: "76.00", count: 4 }
  ];
  const names = ["Adam Demo", "Omar Demo", "Youssef Demo", "Karim Demo", "Lina Demo", "Mariam Demo", "Nada Demo", "Salma Demo", "Ziad Demo", "Hassan Demo", "Seif Demo", "Ali Demo", "Hana Demo", "Jana Demo", "Mira Demo", "Dina Demo", "Mostafa Demo", "Amr Demo", "Tarek Demo", "Khaled Demo"];
  let tournamentId = existing[0]?.id;
  let created = false;
  if (!tournamentId) {
    const [createdTournament] = await db.insert(tournaments).values({ name: "Championship OS Demo Open", sport: "Brazilian Jiu-Jitsu", location: "Demo Arena", status: "live", ruleset: "IBJJF Standard", organizationName: "Championship OS Demo", registrationSlug: "demo-live", weighInMode: "ibjjf", weighInTolerance: "0.00", scaleNotes: "DEMO ONLY \xB7 Use the digital scale at Mat 1", createdBy: actorUserId }).returning({ id: tournaments.id });
    tournamentId = createdTournament.id;
    created = true;
  }
  const athletesByCategory = [];
  const existingCategories = await db.select().from(categories).where(eq(categories.tournamentId, tournamentId)).orderBy(asc(categories.id));
  const existingRegistrations = await db.select().from(registrations).where(eq(registrations.tournamentId, tournamentId)).orderBy(asc(registrations.id));
  let nameIndex = existingRegistrations.length;
  for (const [divisionIndex, division] of Array.from(divisions.entries())) {
    let categoryId = existingCategories.find((category) => category.name === division.name)?.id;
    if (!categoryId) {
      const [createdCategory] = await db.insert(categories).values({ tournamentId, name: division.name, ageGroup: division.ageGroup, gender: division.gender, belt: division.belt, weightLimit: division.weightLimit, sport: "Brazilian Jiu-Jitsu" }).returning({ id: categories.id });
      categoryId = createdCategory.id;
    }
    let athleteIds = existingRegistrations.filter((row) => row.categoryId === categoryId).sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999)).map((row) => row.athleteId);
    for (let index = athleteIds.length; index < division.count; index += 1) {
      const dateOfBirth = new Date(Date.UTC(2015 - divisionIndex * 3, 4, 10 + index));
      const [createdAthlete] = await db.insert(athletes).values({ fullName: names[nameIndex++], email: `demo${nameIndex}@example.test`, phone: `01000000${String(nameIndex).padStart(3, "0")}`, dateOfBirth, gender: division.gender, belt: division.belt, expectedWeight: division.weightLimit, actualWeight: index === 3 ? String(Number(division.weightLimit) + 1.2) : division.weightLimit }).returning({ id: athletes.id });
      const athleteId = createdAthlete.id;
      athleteIds.push(athleteId);
      const isOverweight = index === 3;
      const isApproved = index < 3;
      await db.insert(registrations).values({ tournamentId, athleteId, categoryId, seed: index + 1, status: isApproved ? "approved" : "pending", paymentStatus: index === 2 ? "unpaid" : "paid", checkInStatus: isApproved ? "checked_in" : "not_checked_in", weighInStatus: isOverweight ? "overweight" : isApproved ? "passed" : "pending", weighInNotes: isOverweight ? "DEMO \xB7 Over class limit" : "DEMO \xB7 Verified", accreditationCode: `DEMO-${String(athleteId).padStart(5, "0")}` });
    }
    athletesByCategory.push({ categoryId, athleteIds });
  }
  const existingMats = await db.select().from(mats).where(eq(mats.tournamentId, tournamentId)).orderBy(asc(mats.id));
  const matIds = existingMats.map((mat) => mat.id);
  for (const name of ["Mat 1", "Mat 2", "Mat 3", "Mat 4"].slice(matIds.length)) {
    const [createdMat] = await db.insert(mats).values({ tournamentId, name, status: name === "Mat 1" ? "active" : "idle" }).returning({ id: mats.id });
    matIds.push(createdMat.id);
  }
  const existingMatches = await db.select({ id: matches.id }).from(matches).where(eq(matches.tournamentId, tournamentId));
  if (existingMatches.length === 0) {
    let matchNumber = 1;
    for (const [index, group] of Array.from(athletesByCategory.entries())) {
      const [a, b, c] = group.athleteIds;
      await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, matId: matIds[index % matIds.length], round: "Round 1", matchNumber: matchNumber++, athleteAId: a, athleteBId: b, scoreA: 4, scoreB: 0, winnerId: a, status: "finished", finishedAt: /* @__PURE__ */ new Date() });
      await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, matId: matIds[(index + 1) % matIds.length], round: "Round 1", matchNumber: matchNumber++, athleteAId: c, athleteBId: null, scoreA: 0, scoreB: 0, status: index === 0 ? "live" : "queued" });
      await db.insert(matches).values({ tournamentId, categoryId: group.categoryId, matId: matIds[index % matIds.length], round: "Round 2", matchNumber: matchNumber++, athleteAId: a, athleteBId: c, scoreA: index === 0 ? 2 : 8, scoreB: index === 0 ? 0 : 6, winnerId: index === 0 ? null : a, status: index === 0 ? "queued" : "finished", finishedAt: index === 0 ? null : /* @__PURE__ */ new Date() });
    }
  }
  const demoMatches = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId));
  for (const match of demoMatches) {
    const namedRound = match.round === "Round 1" ? "Semifinal" : match.round === "Round 2" ? "Final" : match.round;
    if (namedRound !== match.round) await db.update(matches).set({ round: namedRound }).where(eq(matches.id, match.id));
  }
  const refreshedDemoMatches = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId));
  const scheduledDemoMatches = buildMatSchedule(refreshedDemoMatches, { matCount: Math.max(1, matIds.length), startAt: /* @__PURE__ */ new Date(), durationMinutes: 6, transitionMinutes: 2 });
  for (const scheduledMatch of scheduledDemoMatches) {
    await db.update(matches).set({ matId: matIds[scheduledMatch.matIndex - 1] ?? null, scheduledAt: scheduledMatch.scheduledAt, durationMinutes: scheduledMatch.durationMinutes, delayMinutes: scheduledMatch.delayMinutes, schedulerOrder: scheduledMatch.schedulerOrder }).where(eq(matches.id, scheduledMatch.id));
  }
  await db.insert(auditLogs).values({ actorUserId, entityType: "tournament", entityId: tournamentId, action: "seed_demo", afterValue: { demo: true, divisions: divisions.map((division) => division.name), athletes: names.length, recovered: !created, scheduled: true } });
  return { tournamentId, created, message: created ? "Demo tournament seeded" : "Demo tournament completed" };
}
async function reassignMatchMat(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
  if (!existing[0]) throw new Error("Match not found");
  if (existing[0].status === "finished") throw new Error("Finished matches cannot be reassigned");
  await db.update(matches).set({ matId: input.matId }).where(eq(matches.id, input.matchId));
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "match", entityId: input.matchId, action: "reassign_mat", beforeValue: { matId: existing[0].matId }, afterValue: { matId: input.matId } });
  return { success: true };
}
async function updateMatchSlots(input) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const slotValidation = validateMatchSlots(input.athleteAId, input.athleteBId);
  if (!slotValidation.ok) throw new Error(slotValidation.reason);
  const existing = await db.select().from(matches).where(eq(matches.id, input.matchId)).limit(1);
  if (!existing[0]) throw new Error("Match not found");
  if (!canEditMatchSlots(existing[0].status)) throw new Error("Finished matches cannot be edited");
  await db.update(matches).set({ athleteAId: input.athleteAId, athleteBId: input.athleteBId }).where(eq(matches.id, input.matchId));
  await db.insert(auditLogs).values({ actorUserId: input.actorUserId, entityType: "match", entityId: input.matchId, action: "edit_slots", beforeValue: { athleteAId: existing[0].athleteAId, athleteBId: existing[0].athleteBId }, afterValue: { athleteAId: input.athleteAId, athleteBId: input.athleteBId } });
  return { success: true };
}
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
function serveStatic(app2) {
  const candidates = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "public"),
    path.resolve(process.cwd(), "api", "public")
  ];
  const distPath = candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
  if (!fs.existsSync(distPath)) {
    console.error(`Could not find the build directory: ${distPath}`);
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => res.sendFile(path.resolve(distPath, "index.html")));
}
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
var capabilities = {
  user: [],
  admin: ["dashboard", "registration", "weigh_in", "brackets", "scoring"],
  organizer: ["dashboard", "registration", "weigh_in", "brackets", "scoring"],
  registration_staff: ["dashboard", "registration"],
  weighin_staff: ["dashboard", "weigh_in"],
  referee: ["dashboard", "scoring"],
  mat_manager: ["dashboard", "brackets", "scoring"],
  athlete: ["athlete_portal"]
};
function canRole(role, capability) {
  return Boolean(role && (capabilities[role] ?? []).includes(capability));
}
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var capabilityProcedure = (capability) => t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || !canRole(ctx.user.role, capability) && ctx.user.openId !== ENV.ownerOpenId) {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var staffProcedure = capabilityProcedure("dashboard");
var registrationProcedure = capabilityProcedure("registration");
var weighInProcedure = capabilityProcedure("weigh_in");
var bracketProcedure = capabilityProcedure("brackets");
var refereeProcedure = capabilityProcedure("scoring");
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin" && ctx.user.openId !== ENV.ownerOpenId) {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});
function canUpdateRegistrationFields(role, fields) {
  if (role === "admin" || role === "organizer") return true;
  const keys = Object.keys(fields).filter((key) => fields[key] !== void 0);
  if (role === "registration_staff") return keys.every((key) => ["paymentStatus", "checkInStatus", "status"].includes(key));
  if (role === "weighin_staff") return keys.length > 0 && keys.every((key) => ["weighInStatus", "weighInNotes", "actualWeight"].includes(key));
  return false;
}
var tournamentInput = z2.object({
  name: z2.string().min(2),
  sport: z2.string().min(2),
  location: z2.string().optional(),
  ruleset: z2.string().default("IBJJF Standard"),
  organizationName: z2.string().min(2).default("Championship OS"),
  weighInMode: z2.enum(["ibjjf", "custom"]).default("ibjjf"),
  weighInTolerance: z2.string().regex(/^\\d+(\\.\\d{1,2})?$/).default("0.00"),
  competitionMode: z2.enum(["gi", "nogi", "both"]).default("gi"),
  mats: z2.coerce.number().int().min(1).max(32).default(4)
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  publicRegistration: router({
    getBySlug: publicProcedure.input(z2.object({ slug: z2.string() })).query(({ input }) => getTournamentBySlug(input.slug)),
    participants: publicProcedure.input(z2.object({ slug: z2.string() })).query(({ input }) => getPublicParticipants(input.slug)),
    athletePortal: publicProcedure.input(z2.object({ slug: z2.string(), accreditationCode: z2.string().min(3) })).query(({ input }) => getAthletePortal(input.slug, input.accreditationCode)),
    submit: publicProcedure.input(z2.object({
      slug: z2.string().min(3),
      fullName: z2.string().min(2),
      email: z2.string().email().optional().or(z2.literal("")),
      phone: z2.string().optional(),
      dateOfBirth: z2.string().min(1),
      gender: z2.enum(["male", "female"]),
      belt: z2.string().min(2),
      expectedWeight: z2.number().positive(),
      competitionMode: z2.enum(["gi", "nogi", "both"]).default("gi")
    })).mutation(async ({ input }) => {
      const tournament = await getTournamentBySlug(input.slug);
      if (!tournament) throw new Error("Tournament registration link not found");
      return createPublicRegistration({ ...input, tournamentId: tournament.id, expectedWeight: input.expectedWeight.toFixed(2) });
    })
  }),
  users: router({
    updateRole: adminProcedure.input(z2.object({ userId: z2.number(), role: z2.enum(["user", "admin", "organizer", "registration_staff", "weighin_staff", "referee", "mat_manager", "athlete"]) })).mutation(({ input, ctx }) => updateUserRole({ ...input, actorUserId: ctx.user.id }))
  }),
  tournament: router({
    dashboard: staffProcedure.query(() => getTournamentDashboard()),
    clubs: adminProcedure.query(() => getClubs()),
    create: adminProcedure.input(tournamentInput).mutation(({ input, ctx }) => {
      const { mats: matCount, ...tournament } = input;
      return createTournament({ ...tournament, matCount, registrationSlug: nanoid(10).toLowerCase(), createdBy: ctx.user.id });
    }),
    seedDemo: adminProcedure.mutation(({ ctx }) => seedDemoTournament(ctx.user.id)),
    registerAthlete: registrationProcedure.input(z2.object({
      tournamentId: z2.number(),
      fullName: z2.string().min(2),
      email: z2.string().email().optional().or(z2.literal("")),
      phone: z2.string().optional(),
      dateOfBirth: z2.string().min(1),
      gender: z2.enum(["male", "female"]),
      belt: z2.string().min(2),
      expectedWeight: z2.number().positive(),
      clubId: z2.number().optional()
    })).mutation(({ input }) => createAthleteRegistration({
      athlete: {
        fullName: input.fullName,
        email: input.email || null,
        phone: input.phone || null,
        dateOfBirth: input.dateOfBirth ? /* @__PURE__ */ new Date(`${input.dateOfBirth}T00:00:00Z`) : null,
        gender: input.gender,
        belt: input.belt,
        expectedWeight: input.expectedWeight.toFixed(2),
        clubId: input.clubId ?? null
      },
      registration: { tournamentId: input.tournamentId, status: "pending", paymentStatus: "unpaid", checkInStatus: "not_checked_in", weighInStatus: "pending" },
      sport: "Brazilian Jiu-Jitsu"
    })),
    updateWeighIn: weighInProcedure.input(z2.object({ tournamentId: z2.number(), weighInMode: z2.enum(["ibjjf", "custom"]), weighInTolerance: z2.string().regex(/^\\d+(\\.\\d{1,2})?$/) })).mutation(({ input, ctx }) => updateTournamentWeighIn(input.tournamentId, input.weighInMode, input.weighInTolerance, ctx.user.id)),
    updateSettings: adminProcedure.input(z2.object({ tournamentId: z2.number(), organizationName: z2.string().min(2), weighInMode: z2.enum(["ibjjf", "custom"]), weighInTolerance: z2.string().regex(/^\\d+(\\.\\d{1,2})?$/), competitionMode: z2.enum(["gi", "nogi", "both"]).default("gi"), scaleNotes: z2.string().max(1e3).default(""), beltPolicy: z2.array(z2.string().min(1)).max(12).default([]) })).mutation(({ input, ctx }) => updateTournamentSettings({ ...input, actorUserId: ctx.user.id })),
    generateBrackets: bracketProcedure.input(z2.object({ tournamentId: z2.number() })).mutation(({ input, ctx }) => generateAutomaticBrackets(input.tournamentId, ctx.user.id)),
    createManualMatch: bracketProcedure.input(z2.object({ tournamentId: z2.number(), categoryId: z2.number(), athleteAId: z2.number(), athleteBId: z2.number() })).mutation(({ input, ctx }) => createManualMatch({ ...input, actorUserId: ctx.user.id })),
    updateMatchSlots: bracketProcedure.input(z2.object({ matchId: z2.number(), athleteAId: z2.number().nullable(), athleteBId: z2.number().nullable() })).mutation(({ input, ctx }) => updateMatchSlots({ ...input, actorUserId: ctx.user.id })),
    reassignMatchMat: bracketProcedure.input(z2.object({ matchId: z2.number(), matId: z2.number().nullable() })).mutation(({ input, ctx }) => reassignMatchMat({ ...input, actorUserId: ctx.user.id })),
    finishMatch: refereeProcedure.input(z2.object({ matchId: z2.number(), winnerId: z2.number(), scoreA: z2.number().int().min(0), scoreB: z2.number().int().min(0), advantageA: z2.number().int().min(0).default(0), advantageB: z2.number().int().min(0).default(0), penaltyA: z2.number().int().min(0).default(0), penaltyB: z2.number().int().min(0).default(0), evaluation: z2.string().max(500).optional() })).mutation(({ input, ctx }) => finishMatch({ ...input, actorUserId: ctx.user.id })),
    updateMatchStatus: refereeProcedure.input(z2.object({ matchId: z2.number(), status: z2.enum(["queued", "called", "live", "no_show"]) })).mutation(({ input, ctx }) => updateMatchStatus(input.matchId, input.status, ctx.user.id)),
    updateAthlete: staffProcedure.input(z2.object({ athleteId: z2.number(), fullName: z2.string().min(2).optional(), email: z2.string().email().optional().or(z2.literal("")), phone: z2.string().optional(), dateOfBirth: z2.string().optional(), gender: z2.enum(["male", "female"]).optional(), belt: z2.string().min(2).optional(), expectedWeight: z2.number().positive().optional() })).mutation(({ input, ctx }) => updateAthleteProfile({ athleteId: input.athleteId, fullName: input.fullName, email: input.email || null, phone: input.phone || null, dateOfBirth: input.dateOfBirth ? /* @__PURE__ */ new Date(`${input.dateOfBirth}T00:00:00Z`) : void 0, gender: input.gender, belt: input.belt, expectedWeight: input.expectedWeight?.toFixed(2), actorUserId: ctx.user.id })),
    updateRegistration: staffProcedure.input(z2.object({
      id: z2.number(),
      paymentStatus: z2.enum(["unpaid", "pending", "paid", "refunded"]).optional(),
      checkInStatus: z2.enum(["not_checked_in", "checked_in"]).optional(),
      weighInStatus: z2.enum(["pending", "passed", "overweight"]).optional(),
      weighInNotes: z2.string().max(1e3).optional(),
      actualWeight: z2.number().min(0).max(500).optional(),
      seed: z2.number().int().min(1).max(999).nullable().optional(),
      status: z2.enum(["pending", "approved", "rejected"]).optional()
    })).mutation(({ input, ctx }) => {
      const { id, ...values } = input;
      if (ctx.user.openId !== process.env.OWNER_OPEN_ID && !canUpdateRegistrationFields(ctx.user.role, values)) throw new TRPCError3({ code: "FORBIDDEN", message: "This role cannot edit these registration fields" });
      return updateRegistrationStatus(id, values, ctx.user.id);
    })
  })
});
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}
function createApp() {
  const app2 = express2();
  app2.use(express2.json({ limit: "50mb" }));
  app2.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app2);
  registerOAuthRoutes(app2);
  app2.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  if (process.env.NODE_ENV !== "development") serveStatic(app2);
  return app2;
}
process.env.NODE_ENV = "production";
var app = createApp();
var vercel_default = app;

// api/index.ts
var index_default = vercel_default;
export {
  index_default as default
};
