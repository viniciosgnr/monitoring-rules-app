import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres.chqyjsyvvdteydrdfjpj:26599489Abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
  await sql.unsafe('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS event_id text');
  await sql.unsafe('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS event_description text');
  console.log('✅ Columns alerts.event_id and alerts.event_description added successfully');
  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
