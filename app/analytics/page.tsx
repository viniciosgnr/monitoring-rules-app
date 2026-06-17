import { db } from '@/db';
import { fpsos, monitoringRules } from '@/db/schema';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import AnalyticsClient from '@/components/analytics/AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const fpsoList = await db.select({ code: fpsos.code }).from(fpsos);
  const ruleList = await db.select({ name: monitoringRules.name }).from(monitoringRules);

  return (
    <>
      <Topbar breadcrumb="Analytics" />
      <NavTabs title="Analytics" />
      <main className="px-6 py-5">
        <AnalyticsClient
          fpsos={fpsoList.map(f => f.code)}
          rules={ruleList.map(r => r.name)}
        />
      </main>
    </>
  );
}
