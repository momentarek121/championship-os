import { describe, expect, it } from "vitest";
import pg from "pg";

describe("Supabase runtime secret", () => {
  it("connects to the configured PostgreSQL database", async () => {
    const raw = process.env.SUPABASE_DATABASE_URL ?? "";
    const connectionString = raw.replace(/^['"]|['"]$/g, "");
    expect(connectionString.startsWith("postgres")).toBe(true);
    const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000 });
    try {
      const result = await pool.query("select current_database() as database");
      expect(result.rows[0]?.database).toBe("postgres");
    } finally {
      await pool.end();
    }
  }, 15000);
});
