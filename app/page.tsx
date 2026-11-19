import { db } from '@/db';
import { ruleInstances, equipment, monitoringRules, fpsos, auditLog } from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import RuleInstanceTable from '@/components/mr-database/RuleInstanceTable';

export const dynamic = 'force-dynamic';

import { getSystemFromTimeseries, getSubsystem } from '@/lib/systemUtils';

export default async function MRDatabasePage() {
  const rows = await db
    .select({
      id:              ruleInstances.id,
      fpso:            fpsos.code,
      equipmentCode:   equipment.code,
      timeseries:      ruleInstances.timeseries,
      ruleName:        monitoringRules.name,
      ruleId:          monitoringRules.id,
      schedule:        ruleInstances.schedule,
      lastRunAt:       ruleInstances.lastRunAt,
      nextRunAt:       ruleInstances.nextRunAt,
      enabled:         ruleInstances.enabled,
      processingSteps: monitoringRules.processingSteps,
      deactivatedUntil: ruleInstances.deactivatedUntil,
    })
    .from(ruleInstances)
    .innerJoin(equipment,       eq(ruleInstances.equipmentId, equipment.id))
    .innerJoin(monitoringRules, eq(ruleInstances.ruleId,      monitoringRules.id))
    .innerJoin(fpsos,           eq(equipment.fpsoId,          fpsos.id));

  const now = new Date();
  const expiredIds = rows
    .filter(r => !r.enabled && r.deactivatedUntil && now > r.deactivatedUntil)
    .map(r => r.id);

  if (expiredIds.length > 0) {
    await db
      .update(ruleInstances)
      .set({ enabled: true, deactivatedUntil: null })
      .where(inArray(ruleInstances.id, expiredIds));

    for (const id of expiredIds) {
      await db.insert(auditLog).values({
        instanceId: id,
        userEmail: 'system@sbmoffshore.com',
        description: 'Automatically enabled rule instance (deactivation period expired)',
        beforeState: { enabled: false },
        afterState: { enabled: true, deactivatedUntil: null },
      });
    }

    rows.forEach(r => {
      if (expiredIds.includes(r.id)) {
        r.enabled = true;
        r.deactivatedUntil = null;
      }
    });
  }

  // Fetch latest disable justification from audit_log for currently disabled instances
  const disabledIds = rows.filter(r => !r.enabled).map(r => r.id);
  const disabledReasonMap = new Map<number, string>();
  if (disabledIds.length > 0) {
    const logs = await db
      .select({
        instanceId: auditLog.instanceId,
        description: auditLog.description,
        afterState: auditLog.afterState,
      })
      .from(auditLog)
      .where(inArray(auditLog.instanceId, disabledIds))
      .orderBy(desc(auditLog.createdAt));

    for (const log of logs) {
      if (disabledReasonMap.has(log.instanceId)) continue;
      const state = log.afterState as { enabled?: boolean; reason?: string | null } | null;
      if (state && state.enabled === false) {
        if (state.reason) {
          disabledReasonMap.set(log.instanceId, state.reason);
        } else if (log.description?.startsWith('Disabled rule for ')) {
          disabledReasonMap.set(log.instanceId, log.description.replace('Disabled rule for ', ''));
        }
      } else if (!state && log.description?.startsWith('Disabled rule for ')) {
        disabledReasonMap.set(log.instanceId, log.description.replace('Disabled rule for ', ''));
      }
    }
  }

  const serialized = rows.map(r => ({
    ...r,
    system:           getSystemFromTimeseries(r.timeseries),
    subsystem:        getSubsystem(r.timeseries, r.equipmentCode),
    lastRunAt:        r.lastRunAt?.toLocaleString('pt-BR') ?? '—',
    lastRunAtRaw:     r.lastRunAt ? r.lastRunAt.toISOString() : null,
    nextRunAt:        r.nextRunAt?.toLocaleString('pt-BR') ?? '—',
    nextRunAtRaw:     r.nextRunAt ? r.nextRunAt.toISOString() : null,
    processingSteps:  (r.processingSteps as object) ?? {},
    deactivatedUntil: r.deactivatedUntil ? r.deactivatedUntil.toISOString() : null,
    disabledReason:   !r.enabled ? (disabledReasonMap.get(r.id) ?? null) : null,
  }));

  return (
    <>
      <Topbar breadcrumb="MR Database" />
      <NavTabs title="MR Database" />
      <main className="px-6 py-5 space-y-5">
        <RuleInstanceTable rows={serialized} />
      </main>
    </>
  );
}
