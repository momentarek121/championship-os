import pg from "pg";
const connectionString = (process.env.SUPABASE_DATABASE_URL ?? "").replace(/^['"]|['"]$/g, "");
const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000 });
try {
  const columns = await pool.query(`select column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name='mats' order by ordinal_position`);
  const counts = await pool.query(`select (select count(*) from tournaments) as tournaments, (select count(*) from categories) as categories, (select count(*) from athletes) as athletes, (select count(*) from registrations) as registrations, (select count(*) from mats) as mats`);
  console.log(JSON.stringify({ columns: columns.rows, counts: counts.rows }, null, 2));
} finally { await pool.end(); }
