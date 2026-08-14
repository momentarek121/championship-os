import pg from "pg";

const raw = process.env.SUPABASE_DATABASE_URL ?? "";
const connectionString = raw.replace(/^['"]|['"]$/g, "");
const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000 });
try {
  const result = await pool.query(`select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = any($1::text[]) order by table_name, ordinal_position`, [["users", "tournaments", "clubs", "athletes", "categories", "registrations", "mats", "matches", "audit_logs"]]);
  console.log(JSON.stringify(result.rows, null, 2));
} finally {
  await pool.end();
}
