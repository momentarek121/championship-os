import { describe, expect, it } from "vitest";
import { getDb } from "./db";
import { tournaments } from "../drizzle/schema";

describe("production database secret", () => {
  it("connects to Supabase PostgreSQL and reads the tournaments table", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const rows = await db!.select({ id: tournaments.id }).from(tournaments).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  }, 15_000);
});
