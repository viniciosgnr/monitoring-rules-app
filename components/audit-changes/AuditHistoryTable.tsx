'use client';
import { useState } from 'react';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import Pagination from '@/components/ui/Pagination';
import ParamDiffModal from './ParamDiffModal';
import { SlidersHorizontal } from 'lucide-react';

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

export default function AuditHistoryTable({ rows }: { rows: AuditEntry[] }) {
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(5);
  const [filters, setFilters]     = useState<Record<string, string>>({});
  const [diffEntry, setDiffEntry] = useState<AuditEntry | null>(null);

  const filtered = rows.filter(r =>
    Object.entries(filters).every(([k, v]) =>
      !v || String((r as Record<string, unknown>)[k]).toLowerCase().includes(v.toLowerCase())
    )
  );
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function FilterInput({ field }: { field: string }) {
    return (
      <div className="flex items-center gap-1 mt-1.5">
        <input
          value={filters[field] ?? ''}
          onChange={e => { setFilters(f => ({ ...f, [field]: e.target.value })); setPage(1); }}
          className="filter-input"
        />
        <SlidersHorizontal size={11} className="text-text-muted flex-shrink-0" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border-panel">
          <h2 className="text-sm font-semibold text-text-primary">Audit History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-panel">
                {[
                  ['timestamp', 'Timestamp'],
                  ['userEmail', 'User'],
                  ['equipmentCode', 'Equipment'],
                  ['ruleName', 'Rule'],
                  ['description', 'Description'],
                ].map(([f, l]) => (
                  <th key={f} className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                    {l}
                    <FilterInput field={f} />
                  </th>
                ))}
                <th className="px-4 py-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {paged.map(row => (
                <tr key={row.id} className="border-b border-border-panel hover:bg-bg-panel/40">
                  <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{row.timestamp}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{row.userEmail}</td>
                  <td className="px-4 py-3"><EquipmentBadge code={row.equipmentCode} /></td>
                  <td className="px-4 py-3 text-text-primary text-sm">{row.ruleName}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{row.description}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDiffEntry(row)}
                      className="px-3 py-1.5 text-xs rounded border border-border-panel text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors whitespace-nowrap font-medium"
                    >
                      View Diff
                    </button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted text-sm">No results found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <ParamDiffModal
        open={!!diffEntry}
        onClose={() => setDiffEntry(null)}
        entry={diffEntry}
      />
    </>
  );
}
