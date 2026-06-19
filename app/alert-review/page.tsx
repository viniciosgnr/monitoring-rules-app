import { db } from '@/db';
import { alerts, ruleInstances, equipment, monitoringRules, fpsos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import KpiCard from '@/components/ui/KpiCard';
import AlertTable from '@/components/alert-review/AlertTable';
import type { Status } from '@/components/ui/StatusBadge';

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

  // KPI counts — ordered: To Be Validated | Validation in Progress | Total
  const toBeValidated    = rows.filter(r => r.status === 'to_be_validated').length;
  const inProgress       = rows.filter(r => r.status === 'validation_in_progress').length;
  const total            = rows.length;

  const serialized = rows.map(r => ({
    ...r,
    endDate:     r.endDate.toLocaleString('pt-BR'),
    triggeredAt: r.triggeredAt.toLocaleString('pt-BR'),
    reviewedAt:  r.reviewedAt?.toLocaleString('pt-BR') ?? '',
    reviewedBy:  r.reviewedBy ?? '',
    status:      r.status as Status,
  }));

  return (
    <>
      <Topbar breadcrumb="Alert Review" />
      <NavTabs title="Alert Review" />
      <main className="px-6 py-5 space-y-5">
        {/* KPIs: To Be Validated | Validation in Progress | Total */}
        <div className="flex gap-4">
          <KpiCard
            title="To Be Validated"
            value={toBeValidated}
            subtitle="Requires operator action"
            tooltip="Alerts that have been triggered and are awaiting initial review by an operator. These should be prioritised."
          />
          <KpiCard
            title="Validation in Progress"
            value={inProgress}
            subtitle="Under review"
            tooltip="Alerts currently being reviewed by an operator. An investigation or corrective action may be in progress."
          />
          <KpiCard
            title="Total Alerts"
            value={total}
            subtitle="All statuses"
            tooltip="Total number of alerts across all monitoring rules and equipment for the selected period."
          />
        </div>
        <AlertTable rows={serialized} />
      </main>
    </>
  );
}
