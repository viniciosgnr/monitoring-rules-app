import { db } from '@/db';
import { alerts, ruleInstances, equipment, monitoringRules, fpsos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import KpiCard from '@/components/ui/KpiCard';
import AlertTable from '@/components/alert-review/AlertTable';

export const dynamic = 'force-dynamic';

export default async function AlertReviewPage() {
  const rows = await db
    .select({
      id:            alerts.id,
      fpso:          fpsos.code,
      equipmentCode: equipment.code,
      ruleName:      monitoringRules.name,
      type:          alerts.type,
      endDate:       alerts.endDate,
      triggeredAt:   alerts.triggeredAt,
      reviewedAt:    alerts.reviewedAt,
      reviewedBy:    alerts.reviewedBy,
      status:        alerts.status,
    })
    .from(alerts)
    .innerJoin(ruleInstances,   eq(alerts.instanceId,      ruleInstances.id))
    .innerJoin(equipment,       eq(ruleInstances.equipmentId, equipment.id))
    .innerJoin(monitoringRules, eq(ruleInstances.ruleId,    monitoringRules.id))
    .innerJoin(fpsos,           eq(equipment.fpsoId,        fpsos.id));

  const total   = rows.length;
  const pending = rows.filter(r => r.status === 'pending').length;

  const serialized = rows.map(r => ({
    ...r,
    endDate:     r.endDate.toLocaleString('pt-BR'),
    triggeredAt: r.triggeredAt.toLocaleString('pt-BR'),
    reviewedAt:  r.reviewedAt?.toLocaleString('pt-BR') ?? '',
    reviewedBy:  r.reviewedBy ?? '',
    status:      r.status as 'accepted' | 'rejected' | 'pending',
  }));

  return (
    <>
      <Topbar breadcrumb="Alert Review" />
      <NavTabs title="Alert Review" />
      <main className="px-6 py-5 space-y-5">
        <div className="flex gap-4">
          <KpiCard title="Total Alerts"  value={total}   subtitle="Last month" />
          <KpiCard title="Pending"       value={pending} subtitle="Last month" />
          <KpiCard title="Overdue (>10)" value={pending} subtitle="Last month" />
        </div>
        <AlertTable rows={serialized} />
      </main>
    </>
  );
}
