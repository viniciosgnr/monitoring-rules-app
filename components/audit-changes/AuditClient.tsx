'use client';
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
  auditRows: AuditEntry[];
}

export default function AuditClient({
  auditRows,
}: Props) {
  return (
    <>
      {/* Audit History */}
      <AuditHistoryTable rows={auditRows} />
    </>
  );
}

