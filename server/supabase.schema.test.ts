import { describe, expect, it } from "vitest";
import pg from "pg";

const requiredTables = ["users", "tournaments", "athletes", "categories", "registrations", "mats", "matches", "audit_logs"];

describe("Supabase PostgreSQL schema", () => {
  it("contains the Championship OS application tables", async () => {
    const connectionString = (process.env.SUPABASE_DATABASE_URL ?? "").trim().replace(/^['"]|['"]$/g, "");
    expect(connectionString).toMatch(/^postgres(?:ql):\/\//);
    const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 1, connectionTimeoutMillis: 5000 });
    try {
      const result = await pool.query<{ table_name: string }>("select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1::text[])", [requiredTables]);
      expect(result.rows.map(row => row.table_name).sort()).toEqual([...requiredTables].sort());
    } finally {
      await pool.end();
    }
  }, 15_000);
});
