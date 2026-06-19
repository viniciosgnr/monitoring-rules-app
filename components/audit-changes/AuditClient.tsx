'use client';
import KpiCard from '@/components/ui/KpiCard';
import AuditHistoryTable from './AuditHistoryTable';

interface AuditEntry {
  id: number;
  timestamp: string;
  userEmail: string;
  equipmentCode: string;
  ruleName: string;
  description: string;
  beforeState: object;
  afterState: object;
  [key: string]: unknown;
}

interface Props {
  totalChanges: number;
  peakDay: number;
  topEditorShare: string;
  hotRule: string;
  auditRows: AuditEntry[];
}

export default function AuditClient({
  totalChanges, peakDay, topEditorShare, hotRule,
  auditRows,
}: Props) {
  return (
    <>
      {/* KPI Cards */}
      <div className="flex gap-4 mb-5">
        <KpiCard title="Total Changes"    value={totalChanges}   subtitle="Across 27 active days" />
        <KpiCard title="Peak Day"         value={peakDay}        subtitle="on 23/02" />
        <KpiCard title="Top Editor Share" value={topEditorShare} subtitle="icaro.zelioli • 17 of 42" />
        <KpiCard title="Hot Rule"         value={hotRule}        subtitle="COCE_GEN_SPK_01 • 19%" />
      </div>

      {/* Audit History */}
      <AuditHistoryTable rows={auditRows} />
    </>
  );
}
