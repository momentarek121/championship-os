import pg from "pg";

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DATABASE_URL is required");
const client = new pg.Client({ connectionString: connectionString.replace(/^['"]|['"]$/g, "") });
await client.connect();
try {
  await client.query(`
    alter table public.users add column if not exists role text;
    alter table public.athletes add column if not exists date_of_birth timestamptz;
    alter table public.athletes add column if not exists actual_weight numeric(6,2);
    alter table public.registrations add column if not exists seed integer;
    alter table public.registrations add column if not exists payment_method text;
    alter table public.registrations add column if not exists weigh_in_notes text;
    alter table public.matches add column if not exists scheduled_at timestamptz;
    alter table public.matches add column if not exists finished_at timestamptz;
  `);
  await client.query(`
    do $$ declare constraint_row record; begin
      for constraint_row in
        select conname from pg_constraint
        where conrelid = 'public.users'::regclass and contype = 'c'
          and pg_get_constraintdef(oid) like '%role%'
      loop execute format('alter table public.users drop constraint if exists %I', constraint_row.conname); end loop;
    end $$;
    alter table public.users add constraint users_role_check check (role in ('user','admin','organizer','registration_staff','weighin_staff','referee','mat_manager','athlete'));
  `);
  const result = await client.query(`select table_name from information_schema.tables where table_schema = 'public' and table_name in ('users','tournaments','athletes','categories','registrations','mats','matches','audit_logs') order by table_name`);
  console.log(JSON.stringify({ tables: result.rows.map(row => row.table_name), migrated: true }));
} finally {
  await client.end();
}
