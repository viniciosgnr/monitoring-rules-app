'use server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { Status } from '@/components/ui/StatusBadge';

export async function updateAlertStatus(id: number, status: Status, tier?: string) {
  const updateData: { status: Status; reviewedAt: Date; reviewedBy: string; tier?: string } = {
    status,
    reviewedAt: new Date(),
    reviewedBy: 'Jon Doe',
  };
  if (tier !== undefined) {
    updateData.tier = tier;
  }
  await db.update(alerts)
    .set(updateData)
    .where(eq(alerts.id, id));
  revalidatePath('/alert-review');
}
