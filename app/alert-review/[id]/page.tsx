import { db } from '@/db';
import { alerts, ruleInstances, equipment, monitoringRules, fpsos } from '@/db/schema';
import { eq, and, ne, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import AlertDetailsClient from '@/components/alert-review/AlertDetailsClient';
import type { Status } from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
  searchParams: { from?: string };
}

export default async function AlertDetailsPage({ params, searchParams }: PageProps) {
  // Parse ID supporting both "21440" and "ALT-21440"
  const rawId = params.id.replace(/^alt-?/i, '');
  const alertId = parseInt(rawId, 10);
  if (isNaN(alertId)) {
    notFound();
  }

  const rows = await db
    .select({
      id: alerts.id,
      fpso: fpsos.code,
      equipmentCode: equipment.code,
      ruleName: monitoringRules.name,
      ruleDescription: monitoringRules.description,
      timeseries: ruleInstances.timeseries,
      type: alerts.type,
      endDate: alerts.endDate,
      triggeredAt: alerts.triggeredAt,
      reviewedAt: alerts.reviewedAt,
      reviewedBy: alerts.reviewedBy,
      status: alerts.status,
      tier: alerts.tier,
      eventId: alerts.eventId,
      eventDescription: alerts.eventDescription,
      comment: alerts.comment,
      eventRef: alerts.eventRef,
      processingSteps: monitoringRules.processingSteps,
      ruleId: monitoringRules.id,
      equipmentId: equipment.id,
    })
    .from(alerts)
    .innerJoin(ruleInstances, eq(alerts.instanceId, ruleInstances.id))
    .innerJoin(equipment, eq(ruleInstances.equipmentId, equipment.id))
    .innerJoin(monitoringRules, eq(ruleInstances.ruleId, monitoringRules.id))
    .innerJoin(fpsos, eq(equipment.fpsoId, fpsos.id))
    .where(eq(alerts.id, alertId))
    .limit(1);

  if (rows.length === 0) {
    notFound();
  }

  const alertRaw = rows[0];

  // Query Alert History (up to 5 previous alerts for the same equipment and monitoring rule)
  const historyRows = await db
    .select({
      id: alerts.id,
      endDate: alerts.endDate,
      triggeredAt: alerts.triggeredAt,
      status: alerts.status,
    })
    .from(alerts)
    .innerJoin(ruleInstances, eq(alerts.instanceId, ruleInstances.id))
    .where(
      and(
        eq(ruleInstances.equipmentId, alertRaw.equipmentId),
        eq(ruleInstances.ruleId, alertRaw.ruleId),
        ne(alerts.id, alertRaw.id),
        eq(alerts.status, 'validated')
      )
    )
    .orderBy(desc(alerts.triggeredAt))
    .limit(5);

  const serializedAlert = {
    ...alertRaw,
    endDate: alertRaw.endDate.toLocaleString('pt-BR'),
    endDateRaw: alertRaw.endDate.toISOString(),
    triggeredAt: alertRaw.triggeredAt.toLocaleString('pt-BR'),
    triggeredAtRaw: alertRaw.triggeredAt.toISOString(),
    reviewedAt: alertRaw.reviewedAt?.toLocaleString('pt-BR') ?? '',
    reviewedBy: alertRaw.reviewedBy ?? '',
    status: alertRaw.status as Status,
    tier: alertRaw.tier ?? null,
    eventId: alertRaw.eventId ?? null,
    eventDescription: alertRaw.eventDescription ?? null,
    comment: alertRaw.comment ?? null,
    eventRef: alertRaw.eventRef ?? null,
    processingSteps: (alertRaw.processingSteps as Record<string, unknown>) ?? null,
  };

  const serializedHistory = historyRows.map(h => ({
    id: h.id,
    endDate: h.endDate.toLocaleString('pt-BR'),
    endDateRaw: h.endDate.toISOString(),
    triggeredAt: h.triggeredAt.toLocaleString('pt-BR'),
    triggeredAtRaw: h.triggeredAt.toISOString(),
    status: h.status as Status,
  }));

  const fromTab = searchParams.from === 'validated_alerts' ? 'validated_alerts' : 'for_validation';

  return (
    <AlertDetailsClient
      alert={serializedAlert}
      alertHistory={serializedHistory}
      fromTab={fromTab}
    />
  );
}
