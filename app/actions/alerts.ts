'use server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { Status } from '@/components/ui/StatusBadge';

export async function updateAlertStatus(id: number, status: Status, tier?: string, comment?: string) {
  const updateData: { status: Status; reviewedAt: Date; reviewedBy: string; tier?: string; comment?: string } = {
    status,
    reviewedAt: new Date(),
    reviewedBy: 'Jon Doe',
  };
  if (tier !== undefined) {
    updateData.tier = tier;
  }
  if (comment !== undefined) {
    updateData.comment = comment;
  }
  await db.update(alerts)
    .set(updateData)
    .where(eq(alerts.id, id));
  revalidatePath('/alert-review');
}

export async function groupAlerts(alertIds: number[], eventId: string, eventDescription: string) {
  if (!alertIds || alertIds.length === 0) return;
  await db.update(alerts)
    .set({
      eventId,
      eventDescription,
    })
    .where(inArray(alerts.id, alertIds));
  revalidatePath('/alert-review');
}
