'use client';
import React, { useState, useMemo } from 'react';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import Pagination from '@/components/ui/Pagination';
import ColumnFilterDropdown from '@/components/ui/ColumnFilterDropdown';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, ChevronRight, Download, X } from 'lucide-react';

interface AuditEntry {
  id: number;
  timestamp: string;
  timestampRaw?: string;
  userEmail: string;
  equipmentCode: string;
  system: string;
  subsystem: string;
  paramChanges: string;
  ruleName: string;
  description: string;
  beforeState: object;
  afterState: object;
  [key: string]: unknown;
}

function getFriendlyRuleName(ruleName: string): string {
  const name = ruleName.toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'Spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR')) return 'Surge (Threshold)';
  if (name.includes('TRND') || name.includes('TREND') || name.includes('DEV') || name.includes('TEMP_DEV')) return 'Trend';
  if (name.includes('FOUL') || name.includes('DP') || name.includes('HTEX')) return 'Normalized dP ( step change, spike, trend)';
  if (name.includes('DRFT') || name.includes('DRIFT')) return 'Drift';
  if (name.includes('ML') || name.includes('AI')) return 'AI/ML';
  return ruleName;
}

export default function AuditHistoryTable({ rows }: { rows: AuditEntry[] }) {
  const [page, setPage]                         = useState(1);
  const [pageSize, setPageSize]                 = useState(5);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [showExportModal, setShowExportModal]   = useState(false);
  const [period, setPeriod]                     = useState('All Time');

  const [expandedRules, setExpandedRules] = useState<Set<string>>(() => {
    const s = new Set<string>();
    rows.forEach(r => s.add(getFriendlyRuleName(r.ruleName)));
    return s;
  });

  const columnOptions = useMemo(() => {
    const opts: Record<string, string[]> = {
      timestamp: Array.from(new Set(rows.map(r => r.timestamp))).filter(Boolean).sort(),
      userEmail: Array.from(new Set(rows.map(r => r.userEmail))).filter(Boolean).sort(),
      equipmentCode: Array.from(new Set(rows.map(r => r.equipmentCode))).filter(Boolean).sort(),
      system: Array.from(new Set(rows.map(r => r.system))).filter(Boolean).sort(),
      subsystem: Array.from(new Set(rows.map(r => r.subsystem))).filter(Boolean).sort(),
      ruleName: Array.from(new Set(rows.map(r => getFriendlyRuleName(r.ruleName)))).filter(Boolean).sort(),
      description: Array.from(new Set(rows.map(r => r.description))).filter(Boolean).sort(),
      paramChanges: Array.from(new Set(rows.map(r => r.paramChanges))).filter(Boolean).sort(),
    };
    return opts;
  }, [rows]);

  function toggleRule(friendlyName: string) {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(friendlyName)) next.delete(friendlyName);
      else next.add(friendlyName);
      return next;
    });
  }

  function downloadExcel() {
    const headers = ['Last Updated Time', 'User', 'Asset', 'System', 'Subsystem', 'RuleName', 'Description', 'Parameter Changes'];
    const csvRows = [headers.join(',')];

    for (const row of filtered) {
      const values = [
        row.timestamp,
        row.userEmail,
        row.equipmentCode,
        row.system,
        row.subsystem,
        row.ruleName,
        row.description,
        row.paramChanges
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'mr_audit_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (period !== 'All Time' && r.timestampRaw) {
        const date = new Date(r.timestampRaw);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        if (period === 'Last Week' && diffMs > oneDay * 7) return false;
        if (period === 'Last Month' && diffMs > oneDay * 30) return false;
        if (period === 'Last 3 Months' && diffMs > oneDay * 90) return false;
      }
      return Object.entries(selectedFilters).every(([colKey, selectedList]) => {
        if (!selectedList || selectedList.length === 0) return true;
        const options = columnOptions[colKey] || [];
        if (selectedList.length === options.length) return true;

        let val = '';
        if (colKey === 'ruleName') {
          val = getFriendlyRuleName(r.ruleName);
        } else {
          val = String((r as Record<string, unknown>)[colKey] ?? '');
        }

        return selectedList.includes(val);
      });
    });
  }, [rows, selectedFilters, columnOptions, period]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const groups = useMemo(() => {
    const map = new Map<string, AuditEntry[]>();
    for (const row of paged) {
      const friendly = getFriendlyRuleName(row.ruleName);
      const arr = map.get(friendly) ?? [];
      arr.push(row);
      map.set(friendly, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [paged]);

  function TableColumnFilter({ field, label }: { field: string; label: string }) {
    const opts = columnOptions[field] || [];
    const currentSelected = selectedFilters[field] ?? opts;

    return (
      <ColumnFilterDropdown
        title={label}
        options={opts}
        selectedValues={currentSelected}
        onChange={(newSelected) => {
          setSelectedFilters(prev => ({
            ...prev,
            [field]: newSelected,
          }));
          setPage(1);
        }}
        placeholder="Filter..."
      />
    );
  }

  const cols = [
    ['timestamp', 'Last Updated Time'],
    ['userEmail', 'User'],
    ['equipmentCode', 'Asset'],
    ['system', 'System'],
    ['subsystem', 'Subsystem'],
    ['ruleName', 'Rule'],
    ['description', 'Description'],
    ['paramChanges', 'Parameter Changes'],
  ];

  return (
    <>
      <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border-panel flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-text-primary">Audit History</h2>
          <div className="flex items-center gap-3">
            {/* Time period filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted">Period</span>
              <select
                value={period}
                onChange={e => { setPeriod(e.target.value); setPage(1); }}
                className="bg-bg-panel border border-border-panel rounded px-3 py-1.5 text-xs text-text-primary outline-none cursor-pointer hover:border-accent-blue transition-colors"
              >
                {['Last Week', 'Last Month', 'Last 3 Months', 'All Time'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-bg-panel border border-border-panel text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
            >
              <Download size={13} />
              Export to Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-panel bg-bg-panel/40">
                {/* Chevron expand/collapse header */}
                <th className="w-8 px-3 py-3" />
                {cols.map(([f, l]) => (
                  <th key={f} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                    {l}
                    <TableColumnFilter field={f} label={l} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(([friendlyName, groupRows]) => {
                const isExpanded = expandedRules.has(friendlyName);
                const totalCount = groupRows.length;

                return (
                  <React.Fragment key={friendlyName}>
                    {/* Group header row */}
                    <tr
                      className="border-b border-border-panel bg-bg-base/70 cursor-pointer hover:bg-bg-base transition-colors select-none"
                      onClick={() => toggleRule(friendlyName)}
                    >
                      <td className="px-3 py-2.5">
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-text-muted" />
                        ) : (
                          <ChevronRight size={14} className="text-text-muted" />
                        )}
                      </td>
                      <td colSpan={cols.length} className="px-1 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-text-primary">{friendlyName}</span>
                          <span className="text-[11px] text-text-muted">
                            {totalCount} change{totalCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Individual audit logs under group */}
                    {isExpanded && groupRows.map(row => (
                      <tr key={row.id} className="border-b border-border-panel hover:bg-bg-panel/40">
                        {/* Indent line spacer */}
                        <td className="px-3 py-3">
                          <div className="w-px h-4 bg-border-panel mx-auto" />
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{row.timestamp}</td>
                        <td className="px-4 py-3 text-text-muted text-xs">{row.userEmail}</td>
                        <td className="px-4 py-3"><EquipmentBadge code={row.equipmentCode} /></td>
                        <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{row.system}</td>
                        <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{row.subsystem}</td>
                        <td className="px-4 py-3 text-text-primary font-mono text-xs">{row.ruleName}</td>
                        <td className="px-4 py-3 text-text-muted text-xs">{row.description}</td>
                        <td className="px-4 py-3 text-text-primary font-semibold font-mono text-xs">{row.paramChanges}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}

              {groups.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 1} className="px-4 py-8 text-center text-text-muted text-sm">No results found</td>
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

      {/* Export Confirmation modal */}
      <Dialog.Root open={showExportModal} onOpenChange={setShowExportModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] bg-bg-panel rounded-card border border-border-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold text-text-primary">
                Export Audit History to Excel
              </Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            <p className="text-xs text-text-muted mb-6 leading-relaxed">
              Are you sure you want to download the current Audit History logs? This will export all filtered records in CSV format compatible with Microsoft Excel.
            </p>

            <div className="flex justify-end gap-3 border-t border-border-panel pt-4">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm rounded border border-border-panel text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { downloadExcel(); setShowExportModal(false); }}
                className="px-4 py-2 text-sm rounded bg-accent-blue text-white font-medium hover:bg-accent-blue-dark transition-colors"
              >
                Download
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
