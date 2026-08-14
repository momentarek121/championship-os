import pg from "pg";
const connectionString = (process.env.SUPABASE_DATABASE_URL ?? "").replace(/^['"]|['"]$/g, "");
const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000 });
try {
  const result = await pool.query(`select conname, pg_get_constraintdef(oid) as definition from pg_constraint where conrelid = 'public.mats'::regclass order by conname`);
  console.log(JSON.stringify(result.rows, null, 2));
} finally { await pool.end(); }
