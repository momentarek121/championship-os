import { getDb, seedDemoTournament } from "../server/db";
import { users } from "../drizzle/schema";

const db = await getDb();
if (!db) throw new Error("Database unavailable");
const [actor] = await db.select({ id: users.id }).from(users).limit(1);
if (!actor) throw new Error("No user exists in Supabase");
const result = await seedDemoTournament(actor.id);
console.log(JSON.stringify(result));
