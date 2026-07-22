'use client';
import React, { useState, useMemo, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import ColumnFilterDropdown from '@/components/ui/ColumnFilterDropdown';
import { updateAlertStatus } from '@/app/actions/alerts';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Status } from '@/components/ui/StatusBadge';

interface AlertRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  ruleName: string;
  type: string;
  endDate: string;
  triggeredAt: string;
  triggeredAtRaw?: string;
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

export function formatDurationOpen(triggeredAtRaw: string | undefined): string {
  if (!triggeredAtRaw) return '—';
  const triggeredAt = new Date(triggeredAtRaw);
  const now = new Date();
  const diffMs = now.getTime() - triggeredAt.getTime();
  if (diffMs <= 0) return '0m';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remainingHours = diffHours % 24;
    return `${diffDays}d ${remainingHours}h`;
  }
  if (diffHours > 0) {
    const remainingMins = diffMins % 60;
    return `${diffHours}h ${remainingMins}m`;
  }
  return `${diffMins}m`;
}

export function getEventId(row: AlertRow): string {
  const fpso = row.fpso || 'UNY';
  const dateStr = row.triggeredAtRaw || '';
  const year = dateStr ? new Date(dateStr).getFullYear() : 2026;
  const yearTwoDigits = String(year).slice(-2);

  const t = (row.type || '').toLowerCase();
  let acronym = 'EV';
  if (t.includes('fouling') || t.includes('foul')) acronym = 'FW';
  else if (t.includes('spike') || t.includes('spark') || t.includes('compressor')) acronym = 'CP';
  else if (t.includes('trend') || t.includes('temp')) acronym = 'TD';
  else if (t.includes('vibration') || t.includes('vib')) acronym = 'VT';
  else if (t.includes('surge')) acronym = 'SM';
  else if (t.includes('drift')) acronym = 'LO';

  return `event_${fpso}${yearTwoDigits}-${acronym}${row.id}`;
}

export default function AlertTable({ rows }: { rows: AlertRow[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [data, setData]                 = useState(rows);
  const [period, setPeriod]             = useState('All Time');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [statusScope, setStatusScope]   = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(() => {
    const s = new Set<string>();
    rows.forEach(r => {
      if (r.status === 'to_be_validated') {
        s.add(getFriendlyRuleName(r.ruleName));
      }
    });
    return s;
  });

  useEffect(() => {
    setData(rows);
  }, [rows]);

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

  const enrichedRows = useMemo(() => {
    return data.map(r => ({
      ...r,
      eventId: getEventId(r),
      timeOpen: formatDurationOpen(r.triggeredAtRaw),
    }));
  }, [data]);

  const columnOptions = useMemo(() => {
    const opts: Record<string, string[]> = {
      eventId: Array.from(new Set(enrichedRows.map(r => r.eventId))).filter(Boolean).sort(),
      equipmentCode: Array.from(new Set(enrichedRows.map(r => r.equipmentCode))).filter(Boolean).sort(),
      ruleName: Array.from(new Set(enrichedRows.map(r => getFriendlyRuleName(r.ruleName)))).filter(Boolean).sort(),
      type: Array.from(new Set(enrichedRows.map(r => r.type))).filter(Boolean).sort(),
      triggeredAt: Array.from(new Set(enrichedRows.map(r => r.triggeredAt))).filter(Boolean).sort(),
      endDate: Array.from(new Set(enrichedRows.map(r => r.endDate))).filter(Boolean).sort(),
      timeOpen: Array.from(new Set(enrichedRows.map(r => r.timeOpen))).filter(Boolean).sort(),
      status: Array.from(new Set(enrichedRows.map(r => r.status))).filter(Boolean).sort(),
      reviewedAt: Array.from(new Set(enrichedRows.map(r => r.reviewedAt))).filter(Boolean).sort(),
      reviewedBy: Array.from(new Set(enrichedRows.map(r => r.reviewedBy))).filter(Boolean).sort(),
    };
    return opts;
  }, [enrichedRows]);

  const filtered = useMemo(() => {
    return enrichedRows.filter(r => {
      if (statusScope === 'pending') {
        const isPending = r.status === 'to_be_validated' || r.status === 'validation_in_progress';
        if (!isPending) return false;
      } else if (statusScope === 'reviewed') {
        const isReviewed = r.status === 'validated' || r.status === 'rejected' || r.status === 'closed';
        if (!isReviewed) return false;
      }

      if (period !== 'All Time' && r.triggeredAtRaw) {
        const date = new Date(r.triggeredAtRaw);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        if (period === 'Last Week' && diffMs > oneDay * 7) return false;
        if (period === 'Last Month' && diffMs > oneDay * 30) return false;
        if (period === 'Last 3 Months' && diffMs > oneDay * 90) return false;
      }

      const colMatch = Object.entries(selectedFilters).every(([colKey, selectedList]) => {
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
      return colMatch;
    });
  }, [enrichedRows, selectedFilters, columnOptions, period, statusScope]);

  // Group by friendlyName, sorted: rules with to_be_validated alerts first
  const groups = useMemo(() => {
    const map = new Map<string, typeof enrichedRows[0][]>();
    for (const row of filtered) {
      const friendlyName = getFriendlyRuleName(row.ruleName);
      const arr = map.get(friendlyName) ?? [];
      arr.push(row);
      map.set(friendlyName, arr);
    }
    // Sort rows within each group by status priority
    for (const arr of Array.from(map.values())) {
      arr.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    }
    // Sort groups: lowest status priority value first (to_be_validated = 0)
    return Array.from(map.entries()).sort(([, a], [, b]) => {
      const aMin = Math.min(...a.map(r => STATUS_ORDER[r.status]));
      const bMin = Math.min(...b.map(r => STATUS_ORDER[r.status]));
      return aMin - bMin;
    });
  }, [filtered]);

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
        }}
        placeholder="Filter..."
      />
    );
  }

  const totalRows = filtered.length;

  return (
    <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden">

      {/* ── Table header bar ── */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border-panel flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-sm font-semibold text-text-primary">
            Alerts
            <span className="ml-2 text-xs font-normal text-text-muted">{totalRows} records</span>
          </h2>

          {/* Status Scope Selector Tabs */}
          <div className="flex bg-bg-panel border border-border-panel rounded p-0.5 text-[11px]">
            <button
              onClick={() => setStatusScope('pending')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                statusScope === 'pending'
                  ? 'bg-accent-blue text-white font-medium'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Pending Action
            </button>
            <button
              onClick={() => setStatusScope('reviewed')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                statusScope === 'reviewed'
                  ? 'bg-accent-blue text-white font-medium'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Reviewed History
            </button>
            <button
              onClick={() => setStatusScope('all')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                statusScope === 'all'
                  ? 'bg-accent-blue text-white font-medium'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              All Alerts
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">

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
            <tr className="border-b border-border-panel bg-bg-panel/40">
              {/* Expand chevron column */}
              <th className="w-8 px-3 py-3" />
              {/* Event ID */}
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                Event ID
                <TableColumnFilter field="eventId" label="Event ID" />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                Asset
                <TableColumnFilter field="equipmentCode" label="Asset" />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                Rule
                <TableColumnFilter field="ruleName" label="Rule" />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                Type
                <TableColumnFilter field="type" label="Type" />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                Triggered At
                <TableColumnFilter field="triggeredAt" label="Triggered At" />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                End Date
                <TableColumnFilter field="endDate" label="End Date" />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                Time Open
                <TableColumnFilter field="timeOpen" label="Time Open" />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary">
                Status
                <TableColumnFilter field="status" label="Status" />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                Reviewed At
                <TableColumnFilter field="reviewedAt" label="Reviewed At" />
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                Reviewed By
                <TableColumnFilter field="reviewedBy" label="Reviewed By" />
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
                    <td colSpan={10} className="px-1 py-2.5">
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

                      {/* Event ID (Plain text) */}
                      <td className="px-4 py-3 text-text-muted text-sm font-medium whitespace-nowrap">
                        {row.eventId}
                      </td>

                      <td className="px-4 py-3"><EquipmentBadge code={row.equipmentCode} /></td>
                      <td className="px-4 py-3 text-text-muted font-mono text-xs">{row.ruleName}</td>
                      <td className="px-4 py-3 text-text-muted">{row.type}</td>
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{row.triggeredAt}</td>
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{row.endDate || '—'}</td>
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">
                        {mounted ? row.timeOpen : '—'}
                      </td>
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
                      <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{row.reviewedAt || '—'}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{row.reviewedBy || '—'}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            {groups.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-text-muted text-sm">
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
