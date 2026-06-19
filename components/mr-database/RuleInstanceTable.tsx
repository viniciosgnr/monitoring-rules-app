'use client';
import React, { useState, useMemo } from 'react';
import * as Switch from '@radix-ui/react-switch';
import * as Dialog from '@radix-ui/react-dialog';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import Pagination from '@/components/ui/Pagination';
import EditRuleModal from './EditRuleModal';
import { toggleInstance } from '@/app/actions/ruleInstances';
import { SlidersHorizontal, ChevronDown, ChevronRight, Download, X } from 'lucide-react';

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

function getFriendlyRuleName(ruleName: string): string {
  const name = ruleName.toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'Spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR')) return 'Surge (Threshold)';
  if (name.includes('DEV') || name.includes('TEMP_DEV')) return 'Trend';
  if (name.includes('FOUL') || name.includes('DP') || name.includes('HTEX')) return 'Normalized dP ( step change, spike, trend)';
  if (name.includes('DRFT') || name.includes('DRIFT')) return 'Drift';
  if (name.includes('ML') || name.includes('AI')) return 'AI/ML';
  return ruleName;
}

export default function RuleInstanceTable({ rows }: { rows: InstanceRow[] }) {
  const [data, setData]         = useState(rows);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [filters, setFilters]   = useState<Record<string, string>>({});
  const [editRow, setEditRow]   = useState<InstanceRow | null>(null);

  // Disable Modal States
  const [disableRow, setDisableRow] = useState<InstanceRow | null>(null);
  const [disableReason, setDisableReason] = useState('Process Shutdown / Maintenance');
  const [customReason, setCustomReason] = useState('');

  // Export Confirmation Modal State
  const [showExportModal, setShowExportModal] = useState(false);

  // Expanded groups state
  const [expandedRules, setExpandedRules] = useState<Set<string>>(() => {
    const s = new Set<string>();
    rows.forEach(r => s.add(getFriendlyRuleName(r.ruleName)));
    return s;
  });

  function toggleRule(friendlyName: string) {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(friendlyName)) next.delete(friendlyName);
      else next.add(friendlyName);
      return next;
    });
  }

  const filtered = data.filter(r =>
    Object.entries(filters).every(([k, v]) =>
      !v || String((r as Record<string, unknown>)[k]).toLowerCase().includes(v.toLowerCase())
    )
  );

  const groups = useMemo(() => {
    const map = new Map<string, InstanceRow[]>();
    for (const row of filtered) {
      const friendly = getFriendlyRuleName(row.ruleName);
      const arr = map.get(friendly) ?? [];
      arr.push(row);
      map.set(friendly, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  async function handleToggle(id: number, enabled: boolean, reason?: string) {
    setData(d => d.map(r => r.id === id ? { ...r, enabled } : r));
    await toggleInstance(id, enabled, reason);
  }

  function handleSwitchChange(row: InstanceRow, checked: boolean) {
    if (!checked) {
      // Disabling -> Open confirmation / reason modal
      setDisableRow(row);
      setDisableReason('Process Shutdown / Maintenance');
      setCustomReason('');
    } else {
      // Enabling -> Trigger immediately
      handleToggle(row.id, true);
    }
  }

  function confirmDisable() {
    if (!disableRow) return;
    const reason = disableReason === 'Other' ? customReason : disableReason;
    handleToggle(disableRow.id, false, reason);
    setDisableRow(null);
  }

  function downloadExcel() {
    const headers = ['FPSO', 'Equipment', 'Timeseries', 'Rule', 'Schedule', 'Last Run At', 'Next Run At', 'Enabled'];
    const csvRows = [headers.join(',')];

    for (const row of filtered) {
      const values = [
        row.fpso,
        row.equipmentCode,
        row.timeseries,
        row.ruleName,
        row.schedule,
        row.lastRunAt,
        row.nextRunAt,
        row.enabled ? 'Yes' : 'No'
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'monitoring_rule_catalog.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <div className="px-4 py-3 border-b border-border-panel flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Monitoring Rule Instance Catalog</h2>
        {/* Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-bg-panel border border-border-panel text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
        >
          <Download size={13} />
          Export to Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-panel">
              {/* Chevron column */}
              <th className="w-8 px-3 py-2" />
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
            {groups.map(([friendlyName, groupRows]) => {
              const isExpanded = expandedRules.has(friendlyName);
              const totalCount = groupRows.length;
              const enabledCount = groupRows.filter(r => r.enabled).length;

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
                    <td colSpan={9} className="px-1 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-text-primary">{friendlyName}</span>
                        <span className="text-[11px] text-text-muted">
                          {totalCount} instance{totalCount !== 1 ? 's' : ''} ({enabledCount} active)
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Individual rows in group */}
                  {isExpanded && groupRows.map(row => (
                    <tr key={row.id} className="border-b border-border-panel hover:bg-bg-panel/40">
                      {/* Indent line spacer */}
                      <td className="px-3 py-3">
                        <div className="w-px h-4 bg-border-panel mx-auto" />
                      </td>
                      <td className="px-4 py-3 text-text-muted text-sm">{row.fpso}</td>
                      <td className="px-4 py-3">
                        <EquipmentBadge code={row.equipmentCode} />
                      </td>
                      <td className="px-4 py-3 text-text-muted font-mono text-xs">{row.timeseries}</td>
                      <td className="px-4 py-3 text-text-primary font-mono text-xs">{row.ruleName}</td>
                      <td className="px-4 py-3 text-text-muted text-sm">{row.schedule}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{row.lastRunAt}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{row.nextRunAt}</td>
                      <td className="px-4 py-3">
                        <Switch.Root
                          checked={row.enabled}
                          onCheckedChange={v => handleSwitchChange(row, v)}
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
                </React.Fragment>
              );
            })}

            {groups.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-text-muted text-sm">No results found</td>
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

      {/* Edit modal */}
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

      {/* Disable reason modal */}
      <Dialog.Root open={!!disableRow} onOpenChange={v => !v && setDisableRow(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[460px] bg-bg-panel rounded-card border border-border-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold text-text-primary">
                Disable Monitoring Rule Instance
              </Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Specify a justification for disabling the rule instance <span className="font-mono text-text-primary">{disableRow?.ruleName}</span> for equipment <span className="text-text-primary font-medium">{disableRow?.equipmentCode}</span>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-muted font-medium">Justification Reason</label>
                <select
                  value={disableReason}
                  onChange={e => setDisableReason(e.target.value)}
                  className="w-full mt-1.5 bg-bg-input border border-border-panel rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors"
                >
                  <option value="Process Shutdown / Maintenance">Process Shutdown / Maintenance</option>
                  <option value="Sensor Calibration">Sensor Calibration</option>
                  <option value="False Alert Tuning">False Alert Tuning</option>
                  <option value="Other">Other (Write reason below)</option>
                </select>
              </div>

              {disableReason === 'Other' && (
                <div>
                  <label className="text-xs text-text-muted font-medium">Custom Reason</label>
                  <textarea
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Describe the reason for disabling this rule..."
                    className="w-full mt-1.5 bg-bg-input border border-border-panel rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors h-24 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t border-border-panel pt-4">
              <button
                onClick={() => setDisableRow(null)}
                className="px-4 py-2 text-sm rounded border border-border-panel text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisable}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Confirm Disable
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Export Confirmation modal */}
      <Dialog.Root open={showExportModal} onOpenChange={setShowExportModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] bg-bg-panel rounded-card border border-border-panel p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold text-text-primary">
                Export Catalog to Excel
              </Dialog.Title>
              <Dialog.Close className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            <p className="text-xs text-text-muted mb-6 leading-relaxed">
              Are you sure you want to download the current Monitoring Rule Instance Catalog? This will export all filtered records in CSV format compatible with Microsoft Excel.
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
    </div>
  );
}
