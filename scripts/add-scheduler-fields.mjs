import pg from "pg";
const { Pool } = pg;
const raw = process.env.SUPABASE_DATABASE_URL;
if (!raw) throw new Error("SUPABASE_DATABASE_URL is required");
const connectionString = raw.trim().replace(/^['"]|['"]$/g, "");
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
try {
  await pool.query("ALTER TABLE matches ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 6");
  await pool.query("ALTER TABLE matches ADD COLUMN IF NOT EXISTS delay_minutes integer NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE matches ADD COLUMN IF NOT EXISTS scheduler_order integer");
  const result = await pool.query(`
    select column_name, data_type, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = 'matches'
      and column_name in ('duration_minutes','delay_minutes','scheduler_order')
    order by column_name
  `);
  console.log(JSON.stringify(result.rows));
} finally {
  await pool.end();
}
