'use server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { Status } from '@/components/ui/StatusBadge';

export async function updateAlertStatus(id: number, status: Status) {
  await db.update(alerts)
    .set({ status, reviewedAt: new Date(), reviewedBy: 'Jon Doe' })
    .where(eq(alerts.id, id));
  revalidatePath('/alert-review');
}
