import { db } from '@/db';
import { alerts, ruleInstances, equipment, monitoringRules, fpsos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import AlertTable from '@/components/alert-review/AlertTable';
import type { Status } from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

export default async function AlertReviewPage() {
  const rows = await db
    .select({
      id:              alerts.id,
      fpso:            fpsos.code,
      equipmentCode:   equipment.code,
      ruleName:        monitoringRules.name,
      ruleDescription: monitoringRules.description,
      timeseries:      ruleInstances.timeseries,
      type:            alerts.type,
      endDate:         alerts.endDate,
      triggeredAt:     alerts.triggeredAt,
      reviewedAt:      alerts.reviewedAt,
      reviewedBy:      alerts.reviewedBy,
      status:          alerts.status,
      tier:            alerts.tier,
    })
    .from(alerts)
    .innerJoin(ruleInstances,   eq(alerts.instanceId,      ruleInstances.id))
    .innerJoin(equipment,       eq(ruleInstances.equipmentId, equipment.id))
    .innerJoin(monitoringRules, eq(ruleInstances.ruleId,    monitoringRules.id))
    .innerJoin(fpsos,           eq(equipment.fpsoId,        fpsos.id));

  const serialized = rows.map(r => ({
    ...r,
    endDate:        r.endDate.toLocaleString('pt-BR'),
    triggeredAt:    r.triggeredAt.toLocaleString('pt-BR'),
    triggeredAtRaw: r.triggeredAt.toISOString(),
    reviewedAt:     r.reviewedAt?.toLocaleString('pt-BR') ?? '',
    reviewedBy:     r.reviewedBy ?? '',
    status:         r.status as Status,
    tier:           r.tier ?? null,
  }));

  return (
    <>
      <Topbar breadcrumb="Alert Review" />
      <NavTabs title="Alert Review" />
      <main className="px-6 py-5 space-y-5">
        <AlertTable rows={serialized} />
      </main>
    </>
  );
}
