import pg from "pg";
const { Pool } = pg;
const raw = process.env.SUPABASE_DATABASE_URL;
if (!raw) throw new Error("SUPABASE_DATABASE_URL is required");
const connectionString = raw.trim().replace(/^['"]|['"]$/g, "");
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
try {
  await pool.query("ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS competition_mode text NOT NULL DEFAULT 'gi'");
  await pool.query("ALTER TABLE categories ADD COLUMN IF NOT EXISTS competition_mode text NOT NULL DEFAULT 'gi'");
  const result = await pool.query(`
    select table_name, column_name, data_type, column_default
    from information_schema.columns
    where table_schema = 'public' and column_name = 'competition_mode'
    order by table_name
  `);
  console.log(JSON.stringify(result.rows));
} finally {
  await pool.end();
}
