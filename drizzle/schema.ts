import { bigint, integer, jsonb, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("login_method", { length: 64 }),
  role: text("role").$type<"user" | "admin" | "organizer" | "registration_staff" | "weighin_staff" | "referee" | "mat_manager" | "athlete">().notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export const tournaments = pgTable("tournaments", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(), name: varchar("name", { length: 180 }).notNull(), sport: varchar("sport", { length: 80 }).notNull(), location: varchar("location", { length: 180 }),
  startDate: timestamp("start_date", { withTimezone: true }), endDate: timestamp("end_date", { withTimezone: true }),
  status: text("status").$type<"draft" | "registration" | "live" | "completed">().notNull().default("draft"), ruleset: varchar("ruleset", { length: 120 }).default("IBJJF Standard").notNull(), organizationName: varchar("organization_name", { length: 160 }).default("Championship OS").notNull(), registrationSlug: varchar("registration_slug", { length: 120 }).notNull().unique(),
  weighInMode: text("weigh_in_mode").$type<"ibjjf" | "custom">().notNull().default("ibjjf"), weighInTolerance: numeric("weigh_in_tolerance", { precision: 6, scale: 2 }).default("0.00").notNull(), scaleNotes: text("scale_notes"), createdBy: bigint("created_by", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clubs = pgTable("clubs", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(), name: varchar("name", { length: 160 }).notNull(), country: varchar("country", { length: 80 }), contactName: varchar("contact_name", { length: 120 }), contactPhone: varchar("contact_phone", { length: 40 }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const athletes = pgTable("athletes", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(), fullName: varchar("full_name", { length: 180 }).notNull(), email: varchar("email", { length: 320 }), phone: varchar("phone", { length: 40 }), dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  gender: text("gender").$type<"male" | "female">().notNull(), belt: varchar("belt", { length: 40 }).notNull(), expectedWeight: numeric("expected_weight", { precision: 6, scale: 2 }), actualWeight: numeric("actual_weight", { precision: 6, scale: 2 }), clubId: bigint("club_id", { mode: "number" }), federationId: varchar("federation_id", { length: 80 }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(), tournamentId: bigint("tournament_id", { mode: "number" }).notNull(), name: varchar("name", { length: 180 }).notNull(), ageGroup: varchar("age_group", { length: 60 }).notNull(), gender: varchar("gender", { length: 20 }).notNull(), belt: varchar("belt", { length: 40 }).notNull(), weightLimit: numeric("weight_limit", { precision: 6, scale: 2 }).notNull(), sport: varchar("sport", { length: 80 }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const registrations = pgTable("registrations", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(), tournamentId: bigint("tournament_id", { mode: "number" }).notNull(), athleteId: bigint("athlete_id", { mode: "number" }).notNull(), categoryId: bigint("category_id", { mode: "number" }), seed: integer("seed"),
  status: text("status").$type<"pending" | "approved" | "rejected">().notNull().default("pending"), paymentStatus: text("payment_status").$type<"unpaid" | "pending" | "paid" | "refunded">().notNull().default("unpaid"), paymentMethod: varchar("payment_method", { length: 40 }), checkInStatus: text("check_in_status").$type<"not_checked_in" | "checked_in">().notNull().default("not_checked_in"), weighInStatus: text("weigh_in_status").$type<"pending" | "passed" | "overweight">().notNull().default("pending"), weighInNotes: text("weigh_in_notes"), accreditationCode: varchar("accreditation_code", { length: 40 }).unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mats = pgTable("mats", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(), tournamentId: bigint("tournament_id", { mode: "number" }).notNull(), name: varchar("name", { length: 40 }).notNull(), status: text("status").$type<"available" | "live" | "paused">().notNull().default("available"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(), tournamentId: bigint("tournament_id", { mode: "number" }).notNull(), categoryId: bigint("category_id", { mode: "number" }).notNull(), matId: bigint("mat_id", { mode: "number" }), round: varchar("round", { length: 40 }).notNull(), matchNumber: integer("match_number").notNull(), athleteAId: bigint("athlete_a_id", { mode: "number" }), athleteBId: bigint("athlete_b_id", { mode: "number" }), winnerId: bigint("winner_id", { mode: "number" }), scoreA: integer("score_a").default(0).notNull(), scoreB: integer("score_b").default(0).notNull(), status: text("status").$type<"queued" | "called" | "live" | "finished" | "no_show">().notNull().default("queued"), scheduledAt: timestamp("scheduled_at", { withTimezone: true }), finishedAt: timestamp("finished_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(), actorUserId: bigint("actor_user_id", { mode: "number" }), entityType: varchar("entity_type", { length: 60 }).notNull(), entityId: bigint("entity_id", { mode: "number" }).notNull(), action: varchar("action", { length: 80 }).notNull(), beforeValue: jsonb("before_value"), afterValue: jsonb("after_value"), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type Athlete = typeof athletes.$inferSelect;
export type Registration = typeof registrations.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Match = typeof matches.$inferSelect;
