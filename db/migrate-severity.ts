import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.chqyjsyvvdteydrdfjpj:26599489Abc@aws-1-us-east-1.pooler.supabase.com:5432/postgres';
  const sql = postgres(connectionString);

  console.log('Adding severity column to alerts table if not exists...');
  await sql.unsafe('ALTER TABLE alerts ADD COLUMN IF NOT EXISTS severity text;');

  console.log('Migrating existing tier values to severity...');
  await sql.unsafe(`
    UPDATE alerts
    SET severity = CASE
      WHEN tier ILIKE '%tier 1%' OR tier ILIKE '%critical%' THEN 'High'
      WHEN tier ILIKE '%tier 2%' OR tier ILIKE '%degraded%' THEN 'Medium'
      WHEN tier ILIKE '%tier 3%' OR tier ILIKE '%tier 4%' OR tier ILIKE '%good%' THEN 'Low'
      ELSE tier
    END
    WHERE tier IS NOT NULL AND (severity IS NULL OR severity = '');
  `);

  console.log('✅ Column alerts.severity added and data migrated.');
  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
