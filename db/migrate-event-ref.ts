import { db } from './index';
import { alerts } from './schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const missing = await db.select({
    id: alerts.id,
    eventId: alerts.eventId,
    eventRef: alerts.eventRef,
  })
  .from(alerts)
  .where(sql`alerts.event_id IS NOT NULL AND alerts.event_ref IS NULL`);

  console.log(`Found ${missing.length} alerts with event_id but missing event_ref.`);

  for (const item of missing) {
    if (!item.eventId) continue;
    let ref = item.eventId;
    // Normalize MRM-UNY26-GRP-02 or MRM-UNY26-EVT-07 -> UNY26-EVT-02 / UNY26-EVT-07
    const m = item.eventId.match(/^(?:MRM-)?([A-Z]+)(\d{2})-(?:GRP|EVT)-(\d+)/i);
    if (m) {
      const [, fpso, yr, seq] = m;
      ref = `${fpso.toUpperCase()}${yr}-EVT-${seq}`;
    } else {
      const m2 = item.eventId.match(/^([A-Z]+\d{2}-EVT-\d+)/i);
      if (m2) {
        ref = m2[1].toUpperCase();
      }
    }

    await db.update(alerts)
      .set({ eventRef: ref })
      .where(eq(alerts.id, item.id));
    console.log(`Updated alert ${item.id} (${item.eventId}) -> eventRef: ${ref}`);
  }

  console.log('✅ Migration complete.');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
