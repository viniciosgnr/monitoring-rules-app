import postgres from 'postgres';

async function main() {
  const sql = postgres('postgresql://postgres.chqyjsyvvdteydrdfjpj:26599489Abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres');
  await sql.unsafe('ALTER TABLE alerts ALTER COLUMN status TYPE varchar(30)');
  console.log('✅ Column alerts.status altered to varchar(30)');
  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
