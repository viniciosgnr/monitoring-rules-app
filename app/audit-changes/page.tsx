import { db } from '@/db';
import { auditLog, ruleInstances, equipment, monitoringRules, fpsos } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import AuditClient from '@/components/audit-changes/AuditClient';

export const dynamic = 'force-dynamic';

export default async function AuditChangesPage() {
  const rows = await db
    .select({
      id:            auditLog.id,
      timestamp:     auditLog.createdAt,
      userEmail:     auditLog.userEmail,
      equipmentCode: equipment.code,
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
    timestamp:   r.timestamp.toLocaleString('pt-BR'),
    beforeState: (r.beforeState as object) ?? {},
    afterState:  (r.afterState  as object) ?? {},
  }));

  return (
    <>
      <Topbar breadcrumb="MR Audit Changes" />
      <NavTabs title="MR Audit Changes" />
      <main className="px-6 py-5">
        <AuditClient
          totalChanges={rows.length}
          peakDay={4}
          topEditorShare="40%"
          hotRule="8"
          auditRows={serialized}
        />
      </main>
    </>
  );
}
