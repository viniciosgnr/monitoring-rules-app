'use server';
import { db } from '@/db';
import { ruleInstances, monitoringRules, auditLog } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function toggleInstance(id: number, enabled: boolean, reason?: string, deactivatedUntil?: Date | null) {
  const [current] = await db
    .select({
      enabled: ruleInstances.enabled,
    })
    .from(ruleInstances)
    .where(eq(ruleInstances.id, id));

  if (!current) return;

  const updateValues: { enabled: boolean; deactivatedUntil?: Date | null } = { enabled };
  if (enabled) {
    updateValues.deactivatedUntil = null;
  } else if (deactivatedUntil !== undefined) {
    updateValues.deactivatedUntil = deactivatedUntil;
  }

  await db.update(ruleInstances).set(updateValues).where(eq(ruleInstances.id, id));

  const description = enabled ? 'Enabled Rule' : `Disabled rule for ${reason || 'Unknown Reason'}`;
  const beforeState = { enabled: current.enabled };
  const afterState = { 
    enabled, 
    reason: reason ?? null, 
    deactivatedUntil: enabled ? null : (deactivatedUntil ?? null)
  };

  await db.insert(auditLog).values({
    instanceId: id,
    userEmail: 'operator@sbmoffshore.com',
    description,
    beforeState,
    afterState,
  });

  revalidatePath('/');
}

export async function toggleInstancesBulk(ids: number[], enabled: boolean, reason?: string, deactivatedUntil?: Date | null) {
  for (const id of ids) {
    const [current] = await db
      .select({
        enabled: ruleInstances.enabled,
      })
      .from(ruleInstances)
      .where(eq(ruleInstances.id, id));

    if (!current) continue;

    const updateValues: { enabled: boolean; deactivatedUntil?: Date | null } = { enabled };
    if (enabled) {
      updateValues.deactivatedUntil = null;
    } else if (deactivatedUntil !== undefined) {
      updateValues.deactivatedUntil = deactivatedUntil;
    }

    await db.update(ruleInstances).set(updateValues).where(eq(ruleInstances.id, id));

    const description = enabled ? 'Enabled Rule' : `Disabled rule for ${reason || 'Unknown Reason'}`;
    const beforeState = { enabled: current.enabled };
    const afterState = { 
      enabled, 
      reason: reason ?? null,
      deactivatedUntil: enabled ? null : (deactivatedUntil ?? null)
    };

    await db.insert(auditLog).values({
      instanceId: id,
      userEmail: 'operator@sbmoffshore.com',
      description,
      beforeState,
      afterState,
    });
  }

  revalidatePath('/');
}

export async function updateProcessingSteps(ruleId: number, steps: object, instanceId?: number) {
  const [currentRule] = await db
    .select({
      processingSteps: monitoringRules.processingSteps,
    })
    .from(monitoringRules)
    .where(eq(monitoringRules.id, ruleId));

  if (!currentRule) return;

  await db.update(monitoringRules)
    .set({ processingSteps: steps })
    .where(eq(monitoringRules.id, ruleId));

  if (instanceId) {
    const beforeState = { processingSteps: currentRule.processingSteps };
    const afterState = { processingSteps: steps };

    await db.insert(auditLog).values({
      instanceId,
      userEmail: 'operator@sbmoffshore.com',
      description: 'Update rule parameters',
      beforeState,
      afterState,
    });
  }

  revalidatePath('/');
}

export async function getAuditLogsForInstance(instanceId: number) {
  return await db
    .select({
      id: auditLog.id,
      userEmail: auditLog.userEmail,
      description: auditLog.description,
      beforeState: auditLog.beforeState,
      afterState: auditLog.afterState,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .where(eq(auditLog.instanceId, instanceId))
    .orderBy(desc(auditLog.createdAt));
}
