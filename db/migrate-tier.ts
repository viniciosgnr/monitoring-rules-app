import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres.chqyjsyvvdteydrdfjpj:26599489Abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
  await sql.unsafe('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS tier text');
  console.log('✅ Column alerts.tier added');
  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
