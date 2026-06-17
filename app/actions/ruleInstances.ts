'use server';
import { db } from '@/db';
import { ruleInstances, monitoringRules } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function toggleInstance(id: number, enabled: boolean) {
  await db.update(ruleInstances).set({ enabled }).where(eq(ruleInstances.id, id));
  revalidatePath('/');
}

export async function updateProcessingSteps(ruleId: number, steps: object) {
  await db.update(monitoringRules)
    .set({ processingSteps: steps })
    .where(eq(monitoringRules.id, ruleId));
  revalidatePath('/');
}
