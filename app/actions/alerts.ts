'use server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { Status } from '@/components/ui/StatusBadge';

export async function updateAlertStatus(id: number, status: Status, tier?: string, comment?: string) {
  const updateData: { status: Status; reviewedAt?: Date | null; reviewedBy?: string | null; tier?: string; comment?: string } = {
    status,
  };
  if (status === 'validation_in_progress') {
    updateData.reviewedBy = 'Jon Doe';
    updateData.reviewedAt = null;
  } else if (status === 'validated') {
    updateData.reviewedBy = 'Jon Doe';
    updateData.reviewedAt = new Date();
  } else if (status === 'rejected') {
    updateData.reviewedBy = 'Jon Doe';
    updateData.reviewedAt = null;
  }
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

export async function groupAlerts(alertIds: number[], eventId: string, eventDescription: string, tier?: string) {
  if (!alertIds || alertIds.length === 0) return;
  const updateData: { eventId: string; eventDescription: string; tier?: string } = {
    eventId,
    eventDescription,
  };
  if (tier) {
    updateData.tier = tier;
  }
  await db.update(alerts)
    .set(updateData)
    .where(inArray(alerts.id, alertIds));
  revalidatePath('/alert-review');
}
