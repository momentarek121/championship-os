import pg from "pg";

const raw = process.env.SUPABASE_DATABASE_URL ?? "";
const connectionString = raw.replace(/^['"]|['"]$/g, "");
if (!connectionString.startsWith("postgres")) throw new Error("SUPABASE_DATABASE_URL is not a PostgreSQL URI");
const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000 });
try {
  const result = await pool.query("select current_database() as database, current_schema() as schema");
  console.log({ ok: true, database: result.rows[0]?.database, schema: result.rows[0]?.schema });
} finally {
  await pool.end();
}
