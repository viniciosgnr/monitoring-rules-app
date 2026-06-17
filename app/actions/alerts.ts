'use server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateAlertStatus(
  id: number,
  status: 'accepted' | 'rejected' | 'pending'
) {
  await db.update(alerts)
    .set({ status, reviewedAt: new Date(), reviewedBy: 'Jon Doe' })
    .where(eq(alerts.id, id));
  revalidatePath('/alert-review');
}
