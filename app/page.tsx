import { db } from '@/db';
import { ruleInstances, equipment, monitoringRules, fpsos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import KpiCard from '@/components/ui/KpiCard';
import RuleInstanceTable from '@/components/mr-database/RuleInstanceTable';

export const dynamic = 'force-dynamic';

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
    })
    .from(ruleInstances)
    .innerJoin(equipment,       eq(ruleInstances.equipmentId, equipment.id))
    .innerJoin(monitoringRules, eq(ruleInstances.ruleId,      monitoringRules.id))
    .innerJoin(fpsos,           eq(equipment.fpsoId,          fpsos.id));

  const total    = rows.length;
  const enabled  = rows.filter(r => r.enabled).length;
  const disabled = total - enabled;

  const serialized = rows.map(r => ({
    ...r,
    lastRunAt:       r.lastRunAt?.toLocaleString('pt-BR') ?? '—',
    nextRunAt:       r.nextRunAt?.toLocaleString('pt-BR') ?? '—',
    processingSteps: (r.processingSteps as object) ?? {},
  }));

  return (
    <>
      <Topbar breadcrumb="MR Database" />
      <NavTabs title="MR Database" />
      <main className="px-6 py-5 space-y-5">
        <div className="flex gap-4">
          <KpiCard title="Monitoring Rule Instance" value={total} />
          <KpiCard title="Enabled"                  value={enabled} />
          <KpiCard title="Disabled"                 value={disabled} />
        </div>
        <RuleInstanceTable rows={serialized} />
      </main>
    </>
  );
}
