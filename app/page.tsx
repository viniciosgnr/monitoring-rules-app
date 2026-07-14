import { db } from '@/db';
import { ruleInstances, equipment, monitoringRules, fpsos, auditLog } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import KpiCard from '@/components/ui/KpiCard';
import RuleInstanceTable from '@/components/mr-database/RuleInstanceTable';

export const dynamic = 'force-dynamic';

function getSystemFromTimeseries(timeseries: string): string {
  if (timeseries.includes('771')) return 'Gas System';
  if (timeseries.includes('772')) return 'Water Injection System';
  if (timeseries.includes('773')) return 'Crude Oil System';
  if (timeseries.includes('774')) return 'Power Generation System';
  return 'Utility System';
}

function getSubsystem(timeseries: string, equipmentCode: string): string {
  const code = equipmentCode.toUpperCase();
  const has771 = timeseries.includes('771');
  const has772 = timeseries.includes('772');
  const has773 = timeseries.includes('773');
  const has774 = timeseries.includes('774');

  if (code.includes('COCE')) {
    return 'Gas Compression';
  }
  if (code.includes('TRB')) {
    if (has774) return 'Power Generation';
    return 'Gas Turbine Fuel System';
  }
  if (code.includes('HX')) {
    return 'Gas Dehydration & Treatment';
  }
  if (code.includes('PUM')) {
    if (has772) return 'Water Injection Pumps';
    if (has773) return 'Crude Oil Export Pumps';
    if (has771) return 'TEG Circulation Pumps';
    return 'Utility Water Pumps';
  }
  return 'General Process';
}

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

  const total    = rows.length;
  const enabled  = rows.filter(r => r.enabled).length;
  const disabled = total - enabled;

  const serialized = rows.map(r => ({
    ...r,
    system:          getSystemFromTimeseries(r.timeseries),
    subsystem:       getSubsystem(r.timeseries, r.equipmentCode),
    lastRunAt:       r.lastRunAt?.toLocaleString('pt-BR') ?? '—',
    nextRunAt:       r.nextRunAt?.toLocaleString('pt-BR') ?? '—',
    processingSteps: (r.processingSteps as object) ?? {},
    deactivatedUntil: r.deactivatedUntil ? r.deactivatedUntil.toISOString() : null,
  }));

  return (
    <>
      <Topbar breadcrumb="MR Database" />
      <NavTabs title="MR Database" />
      <main className="px-6 py-5 space-y-5">
        <div className="flex gap-4">
          <KpiCard title="Monitoring Rule Instances" value={total} />
          <KpiCard title="Enabled"                  value={enabled} />
          <KpiCard title="Disabled"                 value={disabled} />
        </div>
        <RuleInstanceTable rows={serialized} />
      </main>
    </>
  );
}
