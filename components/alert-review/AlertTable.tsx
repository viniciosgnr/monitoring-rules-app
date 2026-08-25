'use client';
import React, { useState, useMemo, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import ColumnFilterDropdown from '@/components/ui/ColumnFilterDropdown';
import EventDetailsModal from '@/components/alert-review/EventDetailsModal';
import { updateAlertStatus } from '@/app/actions/alerts';
import { ChevronDown, ChevronRight, Filter, MoreHorizontal, Check } from 'lucide-react';
import type { Status } from '@/components/ui/StatusBadge';

interface AlertRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  ruleName: string;
  ruleDescription?: string | null;
  timeseries?: string;
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

const PERIODS = ['All Time', 'Last Week', 'Last Month', 'Last 3 Months', 'Last 6 months'];

export function getFriendlyRuleName(ruleName: string): string {
  const name = ruleName.toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'Spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR') || name.includes('MGN')) return 'Surge (Threshold)';
  if (name.includes('TRND') || name.includes('TREND') || name.includes('DEV') || name.includes('TEMP_DEV')) return 'Trend';
  if (name.includes('FOUL') || name.includes('DP') || name.includes('HTEX') || name.includes('NORM')) return 'Normalized dP ( step change, spike, trend)';
  if (name.includes('DRFT') || name.includes('DRIFT')) return 'Drift';
  if (name.includes('ML') || name.includes('AI')) return 'AI/ML';
  return ruleName;
}

export function getEventId(row: AlertRow): string {
  const fpso = row.fpso || 'UNY';
  const yearTwoDigits = '26';
  const idStr = String(row.id).padStart(2, '0');
  return `${fpso}${yearTwoDigits}-MA${idStr}`;
}

function CategoryFilterDropdown({
  categories,
  selectedCategories,
  onChange,
}: {
  categories: string[];
  selectedCategories: string[];
  onChange: (cats: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const allSelected = selectedCategories.length === 0 || selectedCategories.length === categories.length;

  function handleToggleAll() {
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...categories]);
    }
  }

  function handleToggleOne(cat: string) {
    if (selectedCategories.length === 0) {
      onChange([cat]);
      return;
    }
    if (selectedCategories.includes(cat)) {
      const next = selectedCategories.filter(c => c !== cat);
      onChange(next);
    } else {
      onChange([...selectedCategories, cat]);
    }
  }

  const label = selectedCategories.length === 0 || selectedCategories.length === categories.length
    ? 'All Categories'
    : `Category (${selectedCategories.length})`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-normal rounded-full bg-[#0B0F19] border border-[#1E293B] text-white hover:border-[#3B82F6] transition-colors cursor-pointer"
      >
        <Filter size={13} className="text-[#3B82F6]" />
        <span>{label}</span>
        <ChevronDown size={13} className="text-[#94A3B8]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl z-50 p-3 select-none">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 mb-2">
            <span className="text-xs font-medium text-white">Filter Category</span>
            <button
              onClick={handleToggleAll}
              className="text-[11px] text-[#3B82F6] hover:underline cursor-pointer"
            >
              {allSelected ? 'Clear' : 'Select All'}
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {categories.map(cat => {
              const isChecked = selectedCategories.length === 0 || selectedCategories.includes(cat);
              return (
                <label
                  key={cat}
                  onClick={() => handleToggleOne(cat)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#1E293B]/50 cursor-pointer text-xs text-[#E2E8F0]"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="rounded border-[#1E293B] bg-[#0B0F19] text-[#3B82F6] focus:ring-0 cursor-pointer"
                  />
                  <span className="truncate">{cat}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import FpsosFilterDropdown from '@/components/ui/FpsosFilterDropdown';

export default function AlertTable({ rows }: { rows: AlertRow[] }) {
  const [data, setData]                       = useState(rows);
  const [period, setPeriod]                   = useState('All Time');
  const [selectedFpsos, setSelectedFpsos]     = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [statusScope, setStatusScope]         = useState<'events_list' | 'event_validation'>('event_validation');
  const [selectedAlertDetails, setSelectedAlertDetails] = useState<AlertRow | null>(null);

  const allFpsos = useMemo(() => {
    return Array.from(new Set(rows.map(r => r.fpso))).filter(Boolean).sort();
  }, [rows]);

  const allCategories = useMemo(() => {
    return Array.from(new Set(rows.map(r => getFriendlyRuleName(r.ruleName)))).filter(Boolean).sort();
  }, [rows]);

  const [expandedRules, setExpandedRules] = useState<Set<string>>(() => {
    const s = new Set<string>();
    rows.forEach(r => s.add(getFriendlyRuleName(r.ruleName)));
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
    const reviewedBy = 'smetzner@slb.com';
    const reviewedAt = new Date().toLocaleString('pt-BR');
    setData(d => d.map(r => r.id === id ? { ...r, status, reviewedBy, reviewedAt } : r));
    await updateAlertStatus(id, status);
  }

  const enrichedRows = useMemo(() => {
    return data.map(r => ({
      ...r,
      eventId: getEventId(r),
    }));
  }, [data]);

  const scopedRows = useMemo(() => {
    return enrichedRows.filter(r => {
      if (selectedFpsos.length > 0 && selectedFpsos.length < allFpsos.length && !selectedFpsos.includes(r.fpso)) {
        return false;
      }

      if (statusScope === 'event_validation') {
        const isPending = r.status === 'to_be_validated' || r.status === 'validation_in_progress';
        if (!isPending) return false;
      }

      if (period !== 'All Time' && r.triggeredAtRaw) {
        const date = new Date(r.triggeredAtRaw);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        if (period === 'Last Week' && diffMs > oneDay * 7) return false;
        if (period === 'Last Month' && diffMs > oneDay * 30) return false;
        if (period === 'Last 3 Months' && diffMs > oneDay * 90) return false;
        if (period === 'Last 6 months' && diffMs > oneDay * 180) return false;
      }
      return true;
    });
  }, [enrichedRows, statusScope, period, selectedFpsos, allFpsos]);

  const columnOptions = useMemo(() => {
    const opts: Record<string, string[]> = {
      fpso: Array.from(new Set(scopedRows.map(r => r.fpso))).filter(Boolean).sort(),
      eventId: Array.from(new Set(scopedRows.map(r => r.eventId))).filter(Boolean).sort(),
      equipmentCode: Array.from(new Set(scopedRows.map(r => r.equipmentCode))).filter(Boolean).sort(),
      ruleName: Array.from(new Set(scopedRows.map(r => getFriendlyRuleName(r.ruleName)))).filter(Boolean).sort(),
      type: Array.from(new Set(scopedRows.map(r => r.type))).filter(Boolean).sort(),
      triggeredAt: Array.from(new Set(scopedRows.map(r => r.triggeredAt ? r.triggeredAt.split(',')[0].trim() : ''))).filter(Boolean).sort(),
      status: Array.from(new Set(scopedRows.map(r => r.status))).filter(Boolean).sort(),
      reviewedBy: Array.from(new Set(scopedRows.map(r => (r.status === 'to_be_validated' || !r.reviewedBy ? '-' : r.reviewedBy)))).filter(Boolean).sort(),
    };
    return opts;
  }, [scopedRows]);

  const filtered = useMemo(() => {
    return scopedRows.filter(r => {
      if (selectedCategories.length > 0 && selectedCategories.length < allCategories.length) {
        const cat = getFriendlyRuleName(r.ruleName);
        if (!selectedCategories.includes(cat)) return false;
      }

      const colMatch = Object.entries(selectedFilters).every(([colKey, selectedList]) => {
        if (!selectedList || selectedList.length === 0) return true;
        const options = columnOptions[colKey] || [];
        if (selectedList.length === options.length) return true;

        let val = String((r as Record<string, unknown>)[colKey] ?? '');
        if (colKey === 'reviewedBy') {
          val = r.status === 'to_be_validated' || !r.reviewedBy ? '-' : String(r.reviewedBy);
        } else if (colKey === 'triggeredAt') {
          val = r.triggeredAt ? r.triggeredAt.split(',')[0].trim() : '';
        }
        return selectedList.includes(val);
      });
      return colMatch;
    });
  }, [scopedRows, selectedCategories, allCategories, selectedFilters, columnOptions]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof enrichedRows[0][]>();
    for (const row of filtered) {
      const friendlyName = getFriendlyRuleName(row.ruleName);
      const arr = map.get(friendlyName) ?? [];
      arr.push(row);
      map.set(friendlyName, arr);
    }
    for (const arr of Array.from(map.values())) {
      arr.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    }
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

  const cols: [string, string][] = [
    ['fpso', 'FPSO'],
    ['equipmentCode', 'Assets'],
    ['eventId', 'Alarm Ref.'],
    ['type', 'Type'],
    ['triggeredAt', 'Creation Date'],
    ['status', 'Status'],
    ['reviewedBy', 'Validation By'],
  ];

  return (
    <>
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">

        {/* ── Table header bar ── */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#1E293B] flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Status Scope Selector Tabs matching SLB Figma design */}
            <div className="flex bg-[#0B0F19] border border-[#1E293B] rounded-full p-1 text-xs select-none font-sans">
              <button
                onClick={() => setStatusScope('event_validation')}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full transition-all cursor-pointer font-semibold ${
                  statusScope === 'event_validation'
                    ? 'bg-[#1E293B] text-[#3B82F6] shadow-sm'
                    : 'text-[#E2E8F0] hover:text-white'
                }`}
              >
                {statusScope === 'event_validation' && <Check size={13} className="text-[#3B82F6] stroke-[3]" />}
                <span>Alarm Validation</span>
              </button>

              <button
                onClick={() => setStatusScope('events_list')}
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full transition-all cursor-pointer font-semibold ${
                  statusScope === 'events_list'
                    ? 'bg-[#1E293B] text-[#3B82F6] shadow-sm'
                    : 'text-[#E2E8F0] hover:text-white'
                }`}
              >
                {statusScope === 'events_list' && <Check size={13} className="text-[#3B82F6] stroke-[3]" />}
                <span>Alarm List</span>
              </button>
            </div>

            <span className="text-xs font-normal text-[#94A3B8]">({totalRows} alarms)</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* FPSO Filter */}
            <FpsosFilterDropdown
              fpsos={allFpsos}
              selectedFpsos={selectedFpsos}
              onChange={(newFpsos) => setSelectedFpsos(newFpsos)}
            />

            {/* Time period filter */}
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="bg-[#0B0F19] border border-[#1E293B] rounded-full px-3.5 py-1.5 text-xs text-white outline-none cursor-pointer hover:border-[#3B82F6] transition-colors"
            >
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Category Filter Dropdown */}
            <CategoryFilterDropdown
              categories={allCategories}
              selectedCategories={selectedCategories}
              onChange={(newCats) => setSelectedCategories(newCats)}
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0B0F19]/40">
                {/* Chevron column */}
                <th className="w-8 px-3 py-3" />
                {cols.map(([field, label]) => (
                  <th key={field} className="text-left px-4 py-3 text-xs font-normal text-[#94A3B8] whitespace-nowrap">
                    {label}
                    <TableColumnFilter field={field} label={label} />
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs font-normal text-[#94A3B8] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map(([ruleName, ruleRows]) => {
                const isExpanded = expandedRules.has(ruleName);
                const totalCount = ruleRows.length;

                return (
                  <React.Fragment key={ruleName}>
                    {/* ── Group header row ── */}
                    <tr
                      className="border-b border-[#1E293B] bg-[#151D2E] cursor-pointer hover:bg-[#1A2438] transition-colors select-none"
                      onClick={() => toggleRule(ruleName)}
                    >
                      <td className="px-3 py-3">
                        {isExpanded
                          ? <ChevronDown size={14} className="text-[#94A3B8]" />
                          : <ChevronRight size={14} className="text-[#94A3B8]" />
                        }
                      </td>
                      <td colSpan={cols.length + 1} className="px-1 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-medium text-white">{ruleName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#1E293B] border border-[#334155]/40 text-[#94A3B8] text-[11px] font-medium font-sans">
                            {totalCount} alert{totalCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* ── Individual alert rows ── */}
                    {isExpanded && ruleRows.map(row => (
                      <tr key={row.id} className="border-b border-[#1E293B] bg-[#0F1623] hover:bg-[#1A2335] transition-colors">
                        {/* Indent spacer */}
                        <td className="px-3 py-3">
                          <div className="w-px h-4 bg-[#1E293B] mx-auto" />
                        </td>

                        {/* FPSO */}
                        <td className="px-4 py-3 text-white font-medium text-xs font-mono">{row.fpso}</td>

                        {/* Asset */}
                        <td className="px-4 py-3"><EquipmentBadge code={row.equipmentCode} /></td>

                        {/* Event Ref (Clickable link opening details modal) */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedAlertDetails(row)}
                            className="text-[#3B82F6] hover:underline font-mono text-xs font-medium cursor-pointer"
                          >
                            {row.eventId}
                          </button>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 text-[#94A3B8] text-xs">Monitoring alert triggered</td>

                        {/* Creation Date / Triggered At */}
                        <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{row.triggeredAt}</td>

                        {/* Status Badge */}
                        <td className="px-4 py-3">
                          <StatusBadge status={row.status} />
                        </td>

                        {/* Validation By */}
                        <td className="px-4 py-3 text-[#94A3B8] font-mono text-xs whitespace-nowrap">
                          {row.status === 'to_be_validated' || !row.reviewedBy ? '-' : row.reviewedBy}
                        </td>

                        {/* Action Column: Change Status ▾ Dropdown Button (only on Event Validation tab) & ... Options */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {statusScope === 'event_validation' && (
                              <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                  <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-medium hover:border-[#3B82F6] transition-colors cursor-pointer">
                                    <span>Change Status</span>
                                    <ChevronDown size={12} className="text-[#94A3B8]" />
                                  </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                  <DropdownMenu.Content
                                    className="z-50 bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl p-1.5 min-w-[210px] select-none"
                                    sideOffset={4}
                                  >
                                    {ALL_STATUSES.map(s => (
                                      <DropdownMenu.Item
                                        key={s}
                                        onSelect={() => handleStatus(row.id, s)}
                                        className="px-3 py-2 rounded-xl cursor-pointer hover:bg-[#1E293B] outline-none transition-colors"
                                      >
                                        <StatusBadge status={s} />
                                      </DropdownMenu.Item>
                                    ))}
                                  </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                              </DropdownMenu.Root>
                            )}

                            {/* More options button (...) */}
                            <button
                              onClick={() => setSelectedAlertDetails(row)}
                              title="View Alarm Details"
                              className="p-1.5 rounded-full text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}

              {groups.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 2} className="px-4 py-8 text-center text-[#64748B] text-xs">
                    No alarms found matching selected criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        open={!!selectedAlertDetails}
        onClose={() => setSelectedAlertDetails(null)}
        alert={selectedAlertDetails}
        onStatusChange={handleStatus}
      />
    </>
  );
}
