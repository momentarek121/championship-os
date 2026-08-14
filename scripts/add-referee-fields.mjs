import pg from "pg";
const { Pool } = pg;
const raw = process.env.SUPABASE_DATABASE_URL;
if (!raw) throw new Error("SUPABASE_DATABASE_URL is required");
const pool = new Pool({ connectionString: raw.trim().replace(/^['"]|['"]$/g, ""), ssl: { rejectUnauthorized: false } });
try {
  for (const sql of [
    "ALTER TABLE matches ADD COLUMN IF NOT EXISTS advantage_a integer NOT NULL DEFAULT 0",
    "ALTER TABLE matches ADD COLUMN IF NOT EXISTS advantage_b integer NOT NULL DEFAULT 0",
    "ALTER TABLE matches ADD COLUMN IF NOT EXISTS penalty_a integer NOT NULL DEFAULT 0",
    "ALTER TABLE matches ADD COLUMN IF NOT EXISTS penalty_b integer NOT NULL DEFAULT 0",
    "ALTER TABLE matches ADD COLUMN IF NOT EXISTS evaluation text",
  ]) await pool.query(sql);
  const result = await pool.query(`select column_name from information_schema.columns where table_schema='public' and table_name='matches' and column_name in ('advantage_a','advantage_b','penalty_a','penalty_b','evaluation') order by column_name`);
  console.log(JSON.stringify(result.rows));
} finally { await pool.end(); }
