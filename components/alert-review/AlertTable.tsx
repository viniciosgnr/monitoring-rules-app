'use client';
import React, { useState, useMemo } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import { updateAlertStatus } from '@/app/actions/alerts';
import { SlidersHorizontal, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import type { Status } from '@/components/ui/StatusBadge';

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
  status: Status;
  [key: string]: unknown;
}

const STATUS_ORDER: Record<Status, number> = {
  to_be_validated:        0,
  validation_in_progress: 1,
  validated:              2,
  rejected:               3,
  closed:                 4,
};

const ALL_STATUSES: Status[] = [
  'to_be_validated',
  'validation_in_progress',
  'validated',
  'rejected',
  'closed',
];

const PERIODS = ['Last Week', 'Last Month', 'Last 3 Months', 'All Time'];

export function getFriendlyRuleName(ruleName: string): string {
  const name = ruleName.toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'Spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR')) return 'Surge (Threshold)';
  if (name.includes('TRND') || name.includes('TREND') || name.includes('DEV') || name.includes('TEMP_DEV')) return 'Trend';
  if (name.includes('FOUL') || name.includes('DP') || name.includes('HTEX')) return 'Normalized dP ( step change, spike, trend)';
  if (name.includes('DRFT') || name.includes('DRIFT')) return 'Drift';
  if (name.includes('ML') || name.includes('AI')) return 'AI/ML';
  return ruleName;
}

export default function AlertTable({ rows }: { rows: AlertRow[] }) {
  const [data, setData]     = useState(rows);
  const [period, setPeriod] = useState('All Time');
  const [ruleSearch, setRuleSearch]     = useState('');
  const [filters, setFilters]           = useState<Record<string, string>>({});
  const [expandedRules, setExpandedRules] = useState<Set<string>>(() => {
    // Default: expand all rules that have to_be_validated alerts
    const s = new Set<string>();
    rows.forEach(r => {
      if (r.status === 'to_be_validated') {
        s.add(getFriendlyRuleName(r.ruleName));
      }
    });
    return s;
  });

  function toggleRule(ruleName: string) {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(ruleName)) { next.delete(ruleName); } else { next.add(ruleName); }
      return next;
    });
  }

  async function handleStatus(id: number, status: Status) {
    setData(d => d.map(r => r.id === id ? { ...r, status } : r));
    await updateAlertStatus(id, status);
  }

  // Filter rows (column-level + rule search)
  const filtered = useMemo(() => {
    return data.filter(r => {
      const colMatch = Object.entries(filters).every(([k, v]) =>
        !v || String((r as Record<string, unknown>)[k]).toLowerCase().includes(v.toLowerCase())
      );
      const friendly = getFriendlyRuleName(r.ruleName);
      const ruleMatch = !ruleSearch || 
        r.ruleName.toLowerCase().includes(ruleSearch.toLowerCase()) ||
        friendly.toLowerCase().includes(ruleSearch.toLowerCase());
      return colMatch && ruleMatch;
    });
  }, [data, filters, ruleSearch]);

  // Group by friendlyName, sorted: rules with to_be_validated alerts first
  const groups = useMemo(() => {
    const map = new Map<string, AlertRow[]>();
    for (const row of filtered) {
      const friendlyName = getFriendlyRuleName(row.ruleName);
      const arr = map.get(friendlyName) ?? [];
      arr.push(row);
      map.set(friendlyName, arr);
    }
    // Sort rows within each group by status priority
    for (const arr of Array.from(map.values())) {
      arr.sort((a: AlertRow, b: AlertRow) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    }
    // Sort groups: lowest status priority value first (to_be_validated = 0)
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      const aMin = Math.min(...a.map((r: AlertRow) => STATUS_ORDER[r.status]));
      const bMin = Math.min(...b.map((r: AlertRow) => STATUS_ORDER[r.status]));
      return aMin - bMin;
    });
  }, [filtered]);

  function FilterInput({ field }: { field: string }) {
    return (
      <div className="flex items-center gap-1 mt-1.5">
        <input
          value={filters[field] ?? ''}
          onChange={e => { setFilters(f => ({ ...f, [field]: e.target.value })); }}
          className="filter-input"
        />
        <SlidersHorizontal size={11} className="text-text-muted flex-shrink-0" />
      </div>
    );
  }

  const totalRows = filtered.length;

  return (
    <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden">

      {/* ── Table header bar ── */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border-panel flex-wrap">
        <h2 className="text-sm font-semibold text-text-primary">
          Alerts
          <span className="ml-2 text-xs font-normal text-text-muted">{totalRows} records</span>
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Rule search */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">Rule</span>
            <input
              value={ruleSearch}
              onChange={e => setRuleSearch(e.target.value)}
              placeholder="Search rule…"
              className="bg-bg-panel border border-border-panel rounded px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent-blue transition-colors w-44"
            />
          </div>

          {/* Time period filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">Period</span>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="bg-bg-panel border border-border-panel rounded px-3 py-1.5 text-xs text-text-primary outline-none cursor-pointer hover:border-accent-blue transition-colors"
            >
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-panel">
              {/* Expand chevron column */}
              <th className="w-8 px-3 py-2" />
              {/* Alert ID */}
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                Alert ID
                <FilterInput field="id" />
              </th>
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                FPSO
                <FilterInput field="fpso" />
              </th>
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                Equipment
                <FilterInput field="equipmentCode" />
              </th>
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                Type
                <FilterInput field="type" />
              </th>
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                Triggered At
                <FilterInput field="triggeredAt" />
              </th>
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                End Date
                <FilterInput field="endDate" />
              </th>
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                Reviewed At
                <FilterInput field="reviewedAt" />
              </th>
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted whitespace-nowrap">
                Reviewed by
                <FilterInput field="reviewedBy" />
              </th>
              <th className="text-left px-4 py-2 text-xs font-medium text-text-muted">
                Status
                <FilterInput field="status" />
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map(([ruleName, ruleRows]) => {
              const isExpanded        = expandedRules.has(ruleName);
              const toBeValidated     = ruleRows.filter(r => r.status === 'to_be_validated').length;
              const inProgress        = ruleRows.filter(r => r.status === 'validation_in_progress').length;

              return (
                <React.Fragment key={ruleName}>
                  {/* ── Group header row ── */}
                  <tr
                    className="border-b border-border-panel bg-bg-base/70 cursor-pointer hover:bg-bg-base transition-colors select-none"
                    onClick={() => toggleRule(ruleName)}
                  >
                    <td className="px-3 py-2.5">
                      {isExpanded
                        ? <ChevronDown size={14} className="text-text-muted" />
                        : <ChevronRight size={14} className="text-text-muted" />
                      }
                    </td>
                    <td colSpan={9} className="px-1 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-text-primary">{ruleName}</span>
                        <span className="text-[11px] text-text-muted">
                          {ruleRows.length} alert{ruleRows.length !== 1 ? 's' : ''}
                        </span>
                        {toBeValidated > 0 && (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
                            {toBeValidated} to validate
                          </span>
                        )}
                        {inProgress > 0 && (
                          <span className="text-[10px] font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-1.5 py-0.5 rounded">
                            {inProgress} in progress
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* ── Individual alert rows ── */}
                  {isExpanded && ruleRows.map(row => (
                    <tr key={row.id} className="border-b border-border-panel hover:bg-bg-panel/40">
                      {/* Indent spacer */}
                      <td className="px-3 py-3">
                        <div className="w-px h-4 bg-border-panel mx-auto" />
                      </td>

                      {/* Alert ID — future Optifast link */}
                      <td className="px-4 py-3">
                        <span className="relative group inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border-panel text-xs font-mono text-text-muted cursor-pointer hover:border-accent-blue hover:text-accent-blue transition-colors">
                          #{row.id}
                          <ExternalLink size={9} className="opacity-40" />
                          <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-40 bg-bg-panel border border-border-panel rounded px-2 py-1.5 text-[10px] text-text-muted opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 text-center whitespace-nowrap">
                            Optifast link — coming soon
                          </span>
                        </span>
                      </td>

                      <td className="px-4 py-3 text-text-muted text-sm">{row.fpso}</td>
                      <td className="px-4 py-3"><EquipmentBadge code={row.equipmentCode} /></td>
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
                              className="z-50 bg-bg-panel border border-border-panel rounded-card shadow-xl p-1 min-w-[200px]"
                              sideOffset={4}
                            >
                              {ALL_STATUSES.map(s => (
                                <DropdownMenu.Item
                                  key={s}
                                  onSelect={() => handleStatus(row.id, s)}
                                  className="px-3 py-1.5 rounded cursor-pointer hover:bg-border-panel outline-none select-none"
                                >
                                  <StatusBadge status={s} />
                                </DropdownMenu.Item>
                              ))}
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            {groups.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-text-muted text-sm">
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
