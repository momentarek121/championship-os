import pg from "pg";
const connectionString = (process.env.SUPABASE_DATABASE_URL ?? "").replace(/^['"]|['"]$/g, "");
const pool = new pg.Pool({ connectionString, max: 1, connectionTimeoutMillis: 8000 });
try {
  const users = await pool.query(`select id, open_id, name, email from users order by id`);
  const tournaments = await pool.query(`select id, name, registration_slug, created_by from tournaments order by id`);
  const matches = await pool.query(`select count(*)::int as matches, count(*) filter (where status='live')::int as live_matches from matches`);
  console.log(JSON.stringify({ users: users.rows, tournaments: tournaments.rows, matches: matches.rows }, null, 2));
} finally { await pool.end(); }
