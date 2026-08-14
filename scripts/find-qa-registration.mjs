import pg from "pg";
const connectionString = (process.env.SUPABASE_DATABASE_URL ?? "").replace(/^['"]|['"]$/g, "");
const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000 });
try {
  const result = await pool.query(`select a.full_name, a.email, r.accreditation_code, r.status, c.name as category_name from athletes a join registrations r on r.athlete_id=a.id left join categories c on c.id=r.category_id where a.email in ('qa-supabase@example.test','qa-supabase-local@example.test') order by a.id`);
  console.log(JSON.stringify(result.rows, null, 2));
} finally { await pool.end(); }
