import { db } from '@/db';
import { auditLog, ruleInstances, equipment, monitoringRules, fpsos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import AuditClient from '@/components/audit-changes/AuditClient';

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

export default async function AuditChangesPage() {
  const rows = await db
    .select({
      id:            auditLog.id,
      timestamp:     auditLog.createdAt,
      userEmail:     auditLog.userEmail,
      equipmentCode: equipment.code,
      timeseries:    ruleInstances.timeseries,
      ruleName:      monitoringRules.name,
      description:   auditLog.description,
      beforeState:   auditLog.beforeState,
      afterState:    auditLog.afterState,
    })
    .from(auditLog)
    .innerJoin(ruleInstances,   eq(auditLog.instanceId,      ruleInstances.id))
    .innerJoin(equipment,       eq(ruleInstances.equipmentId, equipment.id))
    .innerJoin(monitoringRules, eq(ruleInstances.ruleId,      monitoringRules.id))
    .innerJoin(fpsos,           eq(equipment.fpsoId,          fpsos.id))
    .orderBy(auditLog.createdAt);

  const serialized = rows.map(r => ({
    ...r,
    system:       getSystemFromTimeseries(r.timeseries),
    subsystem:    getSubsystem(r.timeseries, r.equipmentCode),
    timestamp:    r.timestamp.toLocaleString('pt-BR'),
    timestampRaw: r.timestamp.toISOString(),
    beforeState:  (r.beforeState as object) ?? {},
    afterState:   (r.afterState  as object) ?? {},
  }));

  return (
    <>
      <Topbar breadcrumb="MR Audit Changes" />
      <NavTabs title="MR Audit Changes" />
      <main className="px-6 py-5">
        <AuditClient
          auditRows={serialized}
        />
      </main>
    </>
  );
}
