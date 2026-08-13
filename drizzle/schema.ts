import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const tournaments = mysqlTable("tournaments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  sport: varchar("sport", { length: 80 }).notNull(),
  location: varchar("location", { length: 180 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["draft", "registration", "live", "completed"]).default("draft").notNull(),
  ruleset: varchar("ruleset", { length: 120 }).default("Standard").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const clubs = mysqlTable("clubs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  country: varchar("country", { length: 80 }),
  contactName: varchar("contactName", { length: 120 }),
  contactPhone: varchar("contactPhone", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const athletes = mysqlTable("athletes", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  dateOfBirth: timestamp("dateOfBirth"),
  gender: mysqlEnum("gender", ["male", "female"]).notNull(),
  belt: varchar("belt", { length: 40 }).notNull(),
  expectedWeight: decimal("expectedWeight", { precision: 6, scale: 2 }),
  actualWeight: decimal("actualWeight", { precision: 6, scale: 2 }),
  clubId: int("clubId"),
  federationId: varchar("federationId", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  ageGroup: varchar("ageGroup", { length: 60 }).notNull(),
  gender: varchar("gender", { length: 20 }).notNull(),
  belt: varchar("belt", { length: 40 }).notNull(),
  weightLimit: decimal("weightLimit", { precision: 6, scale: 2 }).notNull(),
  sport: varchar("sport", { length: 80 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const registrations = mysqlTable("registrations", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  athleteId: int("athleteId").notNull(),
  categoryId: int("categoryId"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "pending", "paid", "refunded"]).default("unpaid").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 40 }),
  checkInStatus: mysqlEnum("checkInStatus", ["not_checked_in", "checked_in"]).default("not_checked_in").notNull(),
  weighInStatus: mysqlEnum("weighInStatus", ["pending", "passed", "overweight"]).default("pending").notNull(),
  accreditationCode: varchar("accreditationCode", { length: 40 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mats = mysqlTable("mats", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  name: varchar("name", { length: 40 }).notNull(),
  status: mysqlEnum("status", ["available", "live", "paused"]).default("available").notNull(),
});

export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  categoryId: int("categoryId").notNull(),
  matId: int("matId"),
  round: varchar("round", { length: 40 }).notNull(),
  matchNumber: int("matchNumber").notNull(),
  athleteAId: int("athleteAId"),
  athleteBId: int("athleteBId"),
  scoreA: int("scoreA").default(0).notNull(),
  scoreB: int("scoreB").default(0).notNull(),
  winnerId: int("winnerId"),
  status: mysqlEnum("status", ["queued", "called", "live", "finished", "no_show"]).default("queued").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  finishedAt: timestamp("finishedAt"),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId").notNull(),
  entityType: varchar("entityType", { length: 60 }).notNull(),
  entityId: int("entityId").notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  beforeValue: text("beforeValue"),
  afterValue: text("afterValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type Athlete = typeof athletes.$inferSelect;
export type Registration = typeof registrations.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Match = typeof matches.$inferSelect;
