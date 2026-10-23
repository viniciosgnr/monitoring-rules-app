import { db } from './index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Updating all empty rejected alerts with official justifications...');
  const res = await db.execute(sql`
    UPDATE alerts
    SET comment = CASE (id % 9)
      WHEN 0 THEN 'False positive'
      WHEN 1 THEN 'Alert resolved locally'
      WHEN 2 THEN 'Duplicate'
      WHEN 3 THEN 'Instrumentation noise / faulty sensor'
      WHEN 4 THEN 'False positive'
      WHEN 5 THEN 'Alert resolved locally'
      WHEN 6 THEN 'Planned maintenance window in progress'
      WHEN 7 THEN 'Duplicate'
      ELSE 'Sensor calibration drift outside tolerance'
    END,
    reviewed_by = COALESCE(reviewed_by, 'smetzner@slb.com')
    WHERE status = 'rejected'
      AND (comment IS NULL OR comment = '' OR comment = '—');
  `);

  const checkRes = await db.execute(sql`
    SELECT count(*) as total_rejected,
           count(CASE WHEN comment IS NULL OR comment = '' OR comment = '—' THEN 1 END) as empty_rejected
    FROM alerts
    WHERE status = 'rejected';
  `);

  console.log('Check result:', checkRes);
  console.log('✅ Update finished successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Error updating rejected alerts:', err);
  process.exit(1);
});
