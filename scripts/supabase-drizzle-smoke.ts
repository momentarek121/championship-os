import { getDb } from "../server/db";
import { athletes, categories, matches, registrations, tournaments } from "../drizzle/schema";

const db = await getDb();
if (!db) throw new Error("Drizzle did not initialize");
const [tournamentsRows, athleteRows, registrationRows, categoryRows, matchRows] = await Promise.all([
  db.select({ id: tournaments.id }).from(tournaments),
  db.select({ id: athletes.id }).from(athletes),
  db.select({ id: registrations.id }).from(registrations),
  db.select({ id: categories.id }).from(categories),
  db.select({ id: matches.id }).from(matches),
]);
console.log({ ok: true, tournaments: tournamentsRows.length, athletes: athleteRows.length, registrations: registrationRows.length, categories: categoryRows.length, matches: matchRows.length });
