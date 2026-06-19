'use client';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import { updateAlertStatus } from '@/app/actions/alerts';
import { SlidersHorizontal } from 'lucide-react';

interface AlertRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  ruleName: string;
  type: string;
  endDate: string;
  triggeredAt: string;
  reviewedAt: string;
  reviewedBy: string;
  status: 'accepted' | 'rejected' | 'pending';
  [key: string]: unknown;
}

export default function AlertTable({ rows }: { rows: AlertRow[] }) {
  const [data, setData]         = useState(rows);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [filters, setFilters]   = useState<Record<string, string>>({});

  const filtered = data.filter(r =>
    Object.entries(filters).every(([k, v]) =>
      !v || String((r as Record<string, unknown>)[k]).toLowerCase().includes(v.toLowerCase())
    )
  );
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function handleStatus(id: number, status: 'accepted' | 'rejected' | 'pending') {
    setData(d => d.map(r => r.id === id ? { ...r, status } : r));
    await updateAlertStatus(id, status);
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

  const COLS: [string, string][] = [
    ['fpso', 'FPSO'],
    ['equipmentCode', 'Equipment'],
    ['ruleName', 'Rule'],
    ['type', 'Type'],
    ['triggeredAt', 'Triggered At'],
    ['endDate', 'End Date'],
    ['reviewedAt', 'Reviewed At'],
    ['reviewedBy', 'Reviewed by'],
  ];

  return (
    <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border-panel">
        <h2 className="text-sm font-semibold text-text-primary">Alerts</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-panel">
              {COLS.map(([field, label]) => (
                <th key={field} className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                  {label}
                  <FilterInput field={field} />
                </th>
              ))}
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted">
                Status
                <FilterInput field="status" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map(row => (
              <tr key={row.id} className="border-b border-border-panel hover:bg-bg-panel/40">
                <td className="px-4 py-3 text-text-muted">{row.fpso}</td>
                <td className="px-4 py-3"><EquipmentBadge code={row.equipmentCode} /></td>
                <td className="px-4 py-3 text-text-primary">{row.ruleName}</td>
                <td className="px-4 py-3 text-text-muted">{row.type}</td>
                <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{row.triggeredAt}</td>
                <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{row.endDate}</td>
                <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{row.reviewedAt || '—'}</td>
                <td className="px-4 py-3 text-text-muted">{row.reviewedBy || '—'}</td>
                <td className="px-4 py-3">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="cursor-pointer hover:opacity-80 transition-opacity">
                        <StatusBadge status={row.status} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="z-50 bg-bg-panel border border-border-panel rounded-card shadow-xl p-1 text-sm min-w-[130px]"
                        sideOffset={4}
                      >
                        {(['accepted', 'rejected', 'pending'] as const).map(s => (
                          <DropdownMenu.Item
                            key={s}
                            onSelect={() => handleStatus(row.id, s)}
                            className="px-3 py-1.5 rounded cursor-pointer hover:bg-border-panel text-text-primary capitalize outline-none select-none"
                          >
                            {s}
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
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
    </div>
  );
}
