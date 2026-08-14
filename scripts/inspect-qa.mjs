import { asc, eq } from "drizzle-orm";
import { getDb } from "../server/db.ts";
import { matches, mats } from "../drizzle/schema.ts";
const db = await getDb();
console.log(JSON.stringify({ matches: await db.select().from(matches).where(eq(matches.tournamentId, 5)).orderBy(asc(matches.matchNumber)), mats: await db.select().from(mats).where(eq(mats.tournamentId, 5)).orderBy(asc(mats.id)) }, null, 2));
