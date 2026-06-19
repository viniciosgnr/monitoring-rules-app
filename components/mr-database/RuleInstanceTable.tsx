'use client';
import { useState } from 'react';
import * as Switch from '@radix-ui/react-switch';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import Pagination from '@/components/ui/Pagination';
import EditRuleModal from './EditRuleModal';
import { toggleInstance } from '@/app/actions/ruleInstances';
import { SlidersHorizontal } from 'lucide-react';

interface InstanceRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  timeseries: string;
  ruleName: string;
  ruleId: number;
  schedule: string;
  lastRunAt: string;
  nextRunAt: string;
  enabled: boolean;
  processingSteps: object;
  [key: string]: unknown;
}

export default function RuleInstanceTable({ rows }: { rows: InstanceRow[] }) {
  const [data, setData]         = useState(rows);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [filters, setFilters]   = useState<Record<string, string>>({});
  const [editRow, setEditRow]   = useState<InstanceRow | null>(null);

  const filtered = data.filter(r =>
    Object.entries(filters).every(([k, v]) =>
      !v || String((r as Record<string, unknown>)[k]).toLowerCase().includes(v.toLowerCase())
    )
  );
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function handleToggle(id: number, enabled: boolean) {
    setData(d => d.map(r => r.id === id ? { ...r, enabled } : r));
    await toggleInstance(id, enabled);
  }

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

  const cols: [string, string][] = [
    ['fpso', 'FPSO'],
    ['equipmentCode', 'Equipment'],
    ['timeseries', 'Timeseries'],
    ['ruleName', 'Rule'],
    ['schedule', 'Schedule'],
    ['lastRunAt', 'Last Run At'],
    ['nextRunAt', 'Next Run At'],
  ];

  return (
    <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border-panel">
        <h2 className="text-sm font-semibold text-text-primary">Monitoring Rule Instance Catalog</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-panel">
              {cols.map(([field, label]) => (
                <th key={field} className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                  {label}
                  <FilterInput field={field} />
                </th>
              ))}
              <th className="px-4 py-2 w-12" />
              <th className="px-4 py-2 w-20" />
            </tr>
          </thead>
          <tbody>
            {paged.map(row => (
              <tr key={row.id} className="border-b border-border-panel hover:bg-bg-panel/40">
                <td className="px-4 py-3 text-text-muted text-sm">{row.fpso}</td>
                <td className="px-4 py-3">
                  <EquipmentBadge code={row.equipmentCode} />
                </td>
                <td className="px-4 py-3 text-text-muted font-mono text-xs">{row.timeseries}</td>
                <td className="px-4 py-3 text-text-primary text-sm">{row.ruleName}</td>
                <td className="px-4 py-3 text-text-muted text-sm">{row.schedule}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{row.lastRunAt}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{row.nextRunAt}</td>
                <td className="px-4 py-3">
                  <Switch.Root
                    checked={row.enabled}
                    onCheckedChange={v => handleToggle(row.id, v)}
                    className="relative w-10 h-5 rounded-full border border-border-panel bg-bg-panel data-[state=checked]:bg-accent-blue outline-none cursor-pointer transition-colors"
                  >
                    <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-sm translate-x-0.5 data-[state=checked]:translate-x-5 transition-transform" />
                  </Switch.Root>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setEditRow(row)}
                    className="px-3 py-1 text-xs rounded-full border border-border-panel text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-text-muted text-sm">No results found</td>
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
      {editRow && (
        <EditRuleModal
          open={!!editRow}
          onClose={() => setEditRow(null)}
          ruleId={editRow.ruleId}
          ruleName={editRow.ruleName}
          equipmentCode={editRow.equipmentCode}
          steps={editRow.processingSteps as Record<string, { tags_to_apply?: string; period?: string }>}
        />
      )}
    </div>
  );
}
