import { db } from '@/db';
import { fpsos, monitoringRules, equipment, ruleInstances, alerts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import AnalyticsClient from '@/components/analytics/AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const fpsoList = await db.select({ code: fpsos.code }).from(fpsos);
  const ruleList = await db.select({ name: monitoringRules.name }).from(monitoringRules);
  const equipList = await db.select({ code: equipment.code }).from(equipment);

  const instancesList = await db
    .select({
      id: ruleInstances.id,
      ruleName: monitoringRules.name,
      equipmentCode: equipment.code,
      fpsoCode: fpsos.code,
    })
    .from(ruleInstances)
    .innerJoin(monitoringRules, eq(ruleInstances.ruleId, monitoringRules.id))
    .innerJoin(equipment, eq(ruleInstances.equipmentId, equipment.id))
    .innerJoin(fpsos, eq(equipment.fpsoId, fpsos.id));

  const alertsList = await db
    .select({
      id:            alerts.id,
      ruleName:      monitoringRules.name,
      status:        alerts.status,
      fpsoCode:      fpsos.code,
      equipmentCode: equipment.code,
    })
    .from(alerts)
    .innerJoin(ruleInstances,   eq(alerts.instanceId,       ruleInstances.id))
    .innerJoin(monitoringRules, eq(ruleInstances.ruleId,    monitoringRules.id))
    .innerJoin(equipment,       eq(ruleInstances.equipmentId, equipment.id))
    .innerJoin(fpsos,           eq(equipment.fpsoId,        fpsos.id));

  return (
    <>
      <Topbar breadcrumb="Analytics" />
      <NavTabs title="Analytics" />
      <main className="px-6 py-5">
        <AnalyticsClient
          fpsos={fpsoList.map(f => f.code)}
          rules={ruleList.map(r => r.name)}
          equipments={equipList.map(e => e.code)}
          ruleInstances={instancesList}
          alertsList={alertsList}
        />
      </main>
    </>
  );
}
