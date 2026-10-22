import { db } from './index';
import { alerts } from './schema';
import { eq, isNull } from 'drizzle-orm';

const JUSTIFICATIONS = [
  'False positive',
  'Alert resolved locally',
  'Duplicate',
  'False positive',
  'Other - Sensor transient disturbance during compressor startup',
  'Alert resolved locally',
  'Other - Routine valve calibration test acknowledged by offshore team',
  'Duplicate',
  'False positive',
  'Other - Known operational baseline adjustment',
  'Alert resolved locally',
  'Other - Scheduled maintenance intervention confirmed by field team',
];

async function main() {
  console.log('Fetching rejected alerts without justification...');
  const rejectedAlerts = await db
    .select({ id: alerts.id })
    .from(alerts)
    .where(eq(alerts.status, 'rejected'));

  console.log(`Found ${rejectedAlerts.length} rejected alerts.`);

  let updatedCount = 0;
  for (let i = 0; i < rejectedAlerts.length; i++) {
    const alert = rejectedAlerts[i];
    const justification = JUSTIFICATIONS[i % JUSTIFICATIONS.length];
    
    await db
      .update(alerts)
      .set({
        comment: justification,
        reviewedBy: 'Jon Doe',
      })
      .where(eq(alerts.id, alert.id));
    
    updatedCount++;
    if (updatedCount % 50 === 0) {
      console.log(`Updated ${updatedCount}/${rejectedAlerts.length} alerts...`);
    }
  }

  console.log(`✅ Successfully updated ${updatedCount} rejected alerts with official justifications!`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error updating rejected alerts:', err);
  process.exit(1);
});
