'use client';
import React, { useState, useMemo, useEffect } from 'react';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import KpiCard from '@/components/ui/KpiCard';
import ColumnFilterDropdown from '@/components/ui/ColumnFilterDropdown';
import EventDetailsModal from '@/components/alert-review/EventDetailsModal';
import RejectEventModal from '@/components/alert-review/RejectEventModal';
import GroupAlertsModal from '@/components/alert-review/GroupAlertsModal';
import { updateAlertStatus, groupAlerts } from '@/app/actions/alerts';
import { ChevronDown, ChevronRight, Filter, Check, ArrowUpDown, ArrowUp, ArrowDown, Layers, Download, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { exportBrandedExcel } from '@/lib/excelExportUtils';
import type { Status } from '@/components/ui/StatusBadge';

interface AlertRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  ruleName: string;
  ruleDescription?: string | null;
  timeseries?: string;
  type?: string;
  source?: string;
  endDate: string;
  endDateRaw?: string;
  triggeredAt: string;
  triggeredAtRaw?: string;
  reviewedAt: string;
  reviewedBy: string;
  status: Status;
  tier?: string | null;
  eventId?: string | null;
  eventDescription?: string | null;
  comment?: string | null;
  [key: string]: unknown;
}

const STATUS_ORDER: Record<Status, number> = {
  to_be_validated:        0,
  validation_in_progress: 1,
  validated:              2,
  rejected:               3,
  closed:                 4,
};

export const CATEGORY_ORDER: Record<string, number> = {
  'Spike': 1,
  'Surge (Threshold)': 2,
  'Trend': 3,
  'Normalized dP ( step change, spike, trend)': 4,
  'Drift': 5,
  'AI/ML': 6,
  'Seeq': 98,
  'PreWarningOps': 99,
  'Pre Warnings Ops': 99,
};

export function sortCategories(a: string, b: string): number {
  const orderA = CATEGORY_ORDER[a] ?? 50;
  const orderB = CATEGORY_ORDER[b] ?? 50;
  if (orderA !== orderB) return orderA - orderB;
  return a.localeCompare(b);
}

function TimeseriesCell({ timeseries }: { timeseries?: string | null }) {
  if (!timeseries || !timeseries.trim()) {
    return <span className="text-[#64748B] text-xs font-mono">—</span>;
  }
  const tags = timeseries.split(/[,;]\s*/).map(t => t.trim()).filter(Boolean);
  if (tags.length === 0) {
    return <span className="text-[#64748B] text-xs font-mono">—</span>;
  }
  if (tags.length === 1) {
    return (
      <span className="text-[#94A3B8] font-mono text-xs font-normal whitespace-nowrap" title={tags[0]}>
        {tags[0]}
      </span>
    );
  }
  const firstTag = tags[0];
  const remainingCount = tags.length - 1;
  const allTagsTooltip = tags.join(', ');

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap" title={allTagsTooltip}>
      <span className="text-[#94A3B8] font-mono text-xs font-normal">
        {firstTag}
      </span>
      <span className="px-1 py-0.5 rounded text-[10px] font-mono text-[#94A3B8] bg-[#1E293B]/60 border border-[#334155]/40 cursor-pointer hover:text-white">
        +{remainingCount}
      </span>
    </div>
  );
}

const PERIODS = ['All Time', 'Last Week', 'Last Month', 'Last 3 Months', 'Last 6 months', 'Last Year'];

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

export function getCategory(row: AlertRow): string {
  if (row.source === 'Seeq') return 'Seeq';
  if (row.source === 'Pre Warnings Ops' || row.source === 'PreWarningOps') return 'PreWarningOps';
  return getFriendlyRuleName(row.ruleName);
}

const SOURCES = ['Monitoring Rules Engine', 'Seeq', 'Pre Warnings Ops'];

function getSource(row: AlertRow): string {
  if (row.source) return row.source;
  const idx = (row.id ?? 1) % 3;
  return SOURCES[idx];
}

export function generateNextEventId(fpsoCode: string, existingAlerts: AlertRow[]): string {
  const prefix = (fpsoCode || 'UNY').replace(/\s+/g, '');
  const year = '26';
  const regex = new RegExp(`^${prefix}${year}-EVT-(\\d+)`, 'i');
  let maxSeq = 0;
  for (const a of existingAlerts) {
    if (a.eventId) {
      const match = a.eventId.match(regex);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(2, '0');
  return `${prefix}${year}-EVT-${nextSeq}`;
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
  const allFpsos = useMemo(() => {
    return Array.from(new Set(rows.map(r => r.fpso))).filter(Boolean).sort();
  }, [rows]);
  const [selectedFpsos, setSelectedFpsos]     = useState<string[]>(['UNY']);

  useEffect(() => {
    if (allFpsos.length > 0 && selectedFpsos.length === 0) {
      setSelectedFpsos([allFpsos.includes('UNY') ? 'UNY' : allFpsos[0]]);
    }
  }, [allFpsos, selectedFpsos]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [statusScope, setStatusScope]         = useState<'for_validation' | 'validated_alerts'>('for_validation');
  const [selectedAlertDetails, setSelectedAlertDetails] = useState<AlertRow | null>(null);
  const [pendingRejectAlertId, setPendingRejectAlertId]   = useState<number | null>(null);
  const [selectedAlertIds, setSelectedAlertIds]           = useState<Set<number>>(new Set());
  const [showGroupModal, setShowGroupModal]               = useState<boolean>(false);
  const [showExportModal, setShowExportModal]             = useState<boolean>(false);
  const [sortField, setSortField]       = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setSelectedAlertIds(new Set());
  }, [statusScope]);

  function handleSort(field: string) {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortField(null);
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    data.forEach(r => cats.add(getCategory(r)));
    ['Spike', 'Surge (Threshold)', 'Trend', 'Normalized dP ( step change, spike, trend)', 'Drift', 'AI/ML', 'Seeq', 'PreWarningOps'].forEach(c => cats.add(c));
    return Array.from(cats).filter(Boolean).sort(sortCategories);
  }, [data]);

  const [expandedRules, setExpandedRules] = useState<Set<string>>(() => {
    const s = new Set<string>();
    rows.forEach(r => s.add(getCategory(r)));
    s.add('Seeq');
    s.add('PreWarningOps');
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

  async function handleStatus(id: number, status: Status, comment?: string, tier?: string) {
    if (status === 'rejected') {
      setPendingRejectAlertId(id);
      return;
    }

    const targetRow = data.find(r => r.id === id);
    const reviewedBy = 'smetzner@slb.com';
    const reviewedAt = new Date().toLocaleString('pt-BR');
    const finalComment = comment !== undefined ? comment : (targetRow?.comment ?? null);
    const finalTier = tier || targetRow?.tier;
    setData(d => d.map(r => r.id === id ? { ...r, status, reviewedBy, reviewedAt, tier: finalTier, comment: finalComment } : r));
    if (selectedAlertDetails?.id === id) {
      setSelectedAlertDetails(prev => prev ? { ...prev, status, reviewedBy, reviewedAt, tier: finalTier, comment: finalComment } : null);
    }
    await updateAlertStatus(id, status, finalTier ?? undefined, finalComment ?? undefined);
  }

  async function handleConfirmRejection(reasons: string[], comment: string) {
    if (!pendingRejectAlertId) return;
    const targetId = pendingRejectAlertId;
    const reviewedBy = 'smetzner@slb.com';
    const reviewedAt = new Date().toLocaleString('pt-BR');
    const fullComment = reasons.length > 0 ? `${reasons.join(', ')}${comment ? ` - ${comment}` : ''}` : comment;

    setData(d => d.map(r => r.id === targetId ? { ...r, status: 'rejected' as Status, reviewedBy, reviewedAt, comment: fullComment } : r));
    await updateAlertStatus(targetId, 'rejected', undefined, fullComment);
    setPendingRejectAlertId(null);
  }

  const enrichedRows = useMemo(() => {
    return data.map(r => ({
      ...r,
      eventId: r.eventId || null,
      source: r.source || getSource(r),
    }));
  }, [data]);

  const globalFilteredRows = useMemo(() => {
    return enrichedRows.filter(r => {
      if (r.status === 'closed') return false;
      if (selectedFpsos.length > 0 && !selectedFpsos.includes(r.fpso)) {
        return false;
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
        if (period === 'Last Year' && diffMs > oneDay * 365) return false;
      }

      if (selectedCategories.length > 0 && selectedCategories.length < allCategories.length) {
        const cat = getCategory(r);
        if (!selectedCategories.includes(cat)) return false;
      }

      return true;
    });
  }, [enrichedRows, selectedFpsos, period, selectedCategories, allCategories]);

  // Reactive KPIs synced with global filters (FPSO, Time, Categories)
  const kpiToBeValidated = useMemo(() => {
    return globalFilteredRows.filter(r => r.status === 'to_be_validated').length;
  }, [globalFilteredRows]);

  const kpiInProgress = useMemo(() => {
    return globalFilteredRows.filter(r => r.status === 'validation_in_progress').length;
  }, [globalFilteredRows]);

  const kpiTotalForValidation = useMemo(() => {
    return kpiToBeValidated + kpiInProgress;
  }, [kpiToBeValidated, kpiInProgress]);

  const validatedAlertsList = useMemo(() => {
    return globalFilteredRows.filter(r => r.status === 'validated');
  }, [globalFilteredRows]);

  const kpiUngrouped = useMemo(() => {
    return validatedAlertsList.filter(r => !r.eventId).length;
  }, [validatedAlertsList]);

  const kpiGrouped = useMemo(() => {
    return validatedAlertsList.filter(r => Boolean(r.eventId)).length;
  }, [validatedAlertsList]);

  const kpiTotalValidated = validatedAlertsList.length;

  const scopedRows = useMemo(() => {
    if (statusScope === 'for_validation') {
      return globalFilteredRows.filter(r => r.status === 'to_be_validated' || r.status === 'validation_in_progress');
    }
    return globalFilteredRows.filter(r => r.status === 'validated');
  }, [globalFilteredRows, statusScope]);

  const columnOptions = useMemo(() => {
    const opts: Record<string, string[]> = {
      fpso: Array.from(new Set(scopedRows.map(r => r.fpso))).filter(Boolean).sort(),
      alertId: Array.from(new Set(scopedRows.map(r => `ALT-${r.id}`))).filter(Boolean).sort(),
      equipmentCode: Array.from(new Set(scopedRows.map(r => r.equipmentCode))).filter(Boolean).sort(),
      timeseries: Array.from(new Set(scopedRows.map(r => r.timeseries || '—'))).filter(Boolean).sort(),
      eventId: Array.from(new Set(scopedRows.map(r => r.eventId || '—'))).filter(Boolean).sort(),
      ruleName: Array.from(new Set(scopedRows.map(r => r.ruleName))).filter(Boolean).sort(),
      source: Array.from(new Set(scopedRows.map(r => r.source))).filter(Boolean).sort(),
      triggeredAt: Array.from(new Set(scopedRows.map(r => r.triggeredAt ? r.triggeredAt.split(',')[0].trim() : ''))).filter(Boolean).sort(),
      endDate: Array.from(new Set(scopedRows.map(r => r.endDate ? r.endDate.split(',')[0].trim() : ''))).filter(Boolean).sort(),
      reviewedAt: Array.from(new Set(scopedRows.map(r => r.reviewedAt ? r.reviewedAt.split(',')[0].trim() : '—'))).filter(Boolean).sort(),
      status: Array.from(new Set(scopedRows.map(r => r.status))).filter(Boolean).sort(),
    };
    return opts;
  }, [scopedRows]);

  const filtered = useMemo(() => {
    return scopedRows.filter(r => {
      const colMatch = Object.entries(selectedFilters).every(([colKey, selectedList]) => {
        if (!selectedList || selectedList.length === 0) return true;
        const options = columnOptions[colKey] || [];
        if (selectedList.length === options.length) return true;

        let val = String((r as Record<string, unknown>)[colKey] ?? '');
        if (colKey === 'alertId') {
          val = `ALT-${r.id}`;
        } else if (colKey === 'triggeredAt') {
          val = r.triggeredAt ? r.triggeredAt.split(',')[0].trim() : '';
        } else if (colKey === 'endDate') {
          val = r.endDate ? r.endDate.split(',')[0].trim() : '';
        } else if (colKey === 'reviewedAt') {
          val = r.reviewedAt ? r.reviewedAt.split(',')[0].trim() : '—';
        } else if (colKey === 'eventId') {
          val = r.eventId || '—';
        } else if (colKey === 'timeseries') {
          val = r.timeseries || '—';
        } else if (colKey === 'ruleName') {
          val = r.ruleName;
        }
        return selectedList.includes(val);
      });
      return colMatch;
    });
  }, [scopedRows, selectedFilters, columnOptions]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof enrichedRows[0][]>();
    for (const row of filtered) {
      const friendlyName = getCategory(row);
      const arr = map.get(friendlyName) ?? [];
      arr.push(row);
      map.set(friendlyName, arr);
    }
    for (const arr of Array.from(map.values())) {
      arr.sort((a, b) => {
        if (sortField) {
          const aVal = (a as Record<string, unknown>)[sortField];
          const bVal = (b as Record<string, unknown>)[sortField];
          if (sortField === 'alertId') {
            return sortDirection === 'asc' ? a.id - b.id : b.id - a.id;
          }
          if (sortField === 'eventId') {
            const aVal = a.eventId || '';
            const bVal = b.eventId || '';
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          }
          if (sortField === 'triggeredAt') {
            const aTime = a.triggeredAtRaw ? new Date(a.triggeredAtRaw).getTime() : 0;
            const bTime = b.triggeredAtRaw ? new Date(b.triggeredAtRaw).getTime() : 0;
            return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
          }
          if (sortField === 'endDate') {
            const aDate = a.endDate ? new Date(a.endDate).getTime() : 0;
            const bDate = b.endDate ? new Date(b.endDate).getTime() : 0;
            return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
          }
          if (sortField === 'reviewedAt') {
            const aDate = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
            const bDate = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
            return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
          }
          const aStr = String(aVal ?? '');
          const bStr = String(bVal ?? '');
          return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        }
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      });
    }
    return Array.from(map.entries()).sort(([catA], [catB]) => {
      return sortCategories(catA, catB);
    });
  }, [filtered, sortField, sortDirection]);

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

  const toggleSelectAlert = (id: number) => {
    setSelectedAlertIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleIds = useMemo(() => filtered.map(r => r.id), [filtered]);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedAlertIds.has(id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedAlertIds(new Set());
    } else {
      setSelectedAlertIds(new Set(allVisibleIds));
    }
  };

  const selectedAlertsForGrouping = useMemo(() => {
    return data.filter(r => selectedAlertIds.has(r.id));
  }, [data, selectedAlertIds]);

  const currentGeneratedEventId = useMemo(() => {
    const fpsoForEvent = selectedAlertsForGrouping[0]?.fpso || selectedFpsos[0] || 'UNY';
    return generateNextEventId(fpsoForEvent, data);
  }, [selectedAlertsForGrouping, selectedFpsos, data]);

  const handleConfirmGrouping = async (generatedEventId: string, description: string, tier: string) => {
    const idsToGroup = Array.from(selectedAlertIds);
    setData(prev => prev.map(r => idsToGroup.includes(r.id) ? { ...r, eventId: generatedEventId, eventDescription: description, tier } : r));
    await groupAlerts(idsToGroup, generatedEventId, description, tier);
    setSelectedAlertIds(new Set());
  };

  const totalRows = filtered.length;

  function downloadExcel() {
    const isValidationTab = statusScope === 'for_validation';
    const sheetName = isValidationTab ? 'For Validation' : 'Validated Alerts';
    const originTab = isValidationTab ? 'Alert Review - For Validation' : 'Alert Review - Validated Alerts';
    const filename = isValidationTab ? 'alerts_for_validation.xlsx' : 'validated_alerts.xlsx';

    const headers = isValidationTab
      ? ['FPSO', 'Alert Ref.', 'Asset', 'Timeseries', 'Source', 'Creation Date', 'Status', 'Rule']
      : ['FPSO', 'Event Ref.', 'Alert Ref.', 'Asset', 'Timeseries', 'Source', 'Start Date', 'End Date', 'Validated Date', 'Rule'];

    const STATUS_TEXT: Record<string, string> = {
      to_be_validated: 'To Be Validated',
      validation_in_progress: 'Validation in Progress',
      validated: 'Validated',
      rejected: 'Rejected',
      closed: 'Closed',
    };

    const dataRows = filtered.map(row => {
      if (isValidationTab) {
        return [
          row.fpso || '',
          `ALT-${row.id}`,
          row.equipmentCode || '',
          row.timeseries || '',
          row.source || '',
          row.triggeredAt || '',
          STATUS_TEXT[row.status] || row.status || '',
          row.ruleName || '',
        ];
      }
      return [
        row.fpso || '',
        row.eventId || '—',
        `ALT-${row.id}`,
        row.equipmentCode || '',
        row.timeseries || '',
        row.source || '',
        row.triggeredAt || '',
        row.endDate || '—',
        row.reviewedAt || '—',
        row.ruleName || '',
      ];
    });

    exportBrandedExcel({
      sheetName,
      title: 'Monitoring Rules Management',
      originTab,
      headers,
      rows: dataRows,
      filename,
    });
  }

  const cols: [string, string][] = useMemo(() => {
    if (statusScope === 'validated_alerts') {
      return [
        ['fpso', 'FPSO'],
        ['eventId', 'Event Ref.'],
        ['alertId', 'Alert Ref.'],
        ['equipmentCode', 'Assets'],
        ['timeseries', 'Timeseries'],
        ['source', 'Source'],
        ['triggeredAt', 'Start Date'],
        ['endDate', 'End Date'],
        ['reviewedAt', 'Validated Date'],
        ['ruleName', 'Rule'],
      ];
    }
    return [
      ['fpso', 'FPSO'],
      ['alertId', 'Alert Ref.'],
      ['equipmentCode', 'Assets'],
      ['timeseries', 'Timeseries'],
      ['source', 'Source'],
      ['triggeredAt', 'Creation Date'],
      ['status', 'Status'],
      ['ruleName', 'Rule'],
    ];
  }, [statusScope]);

  return (
    <>
      {/* ── Global Controls Header (Subtabs & Filters above KPIs) ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Status Scope Selector Tabs matching SLB Figma design */}
          <div className="flex bg-[#0B0F19] border border-[#1E293B] rounded-full p-1 text-xs select-none font-sans">
            <button
              onClick={() => setStatusScope('for_validation')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full transition-all cursor-pointer font-semibold ${
                statusScope === 'for_validation'
                  ? 'bg-[#1E293B] text-[#3B82F6] shadow-sm'
                  : 'text-[#E2E8F0] hover:text-white'
              }`}
            >
              {statusScope === 'for_validation' && <Check size={13} className="text-[#3B82F6] stroke-[3]" />}
              <span>For Validation</span>
            </button>

            <button
              onClick={() => setStatusScope('validated_alerts')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full transition-all cursor-pointer font-semibold ${
                statusScope === 'validated_alerts'
                  ? 'bg-[#1E293B] text-[#3B82F6] shadow-sm'
                  : 'text-[#E2E8F0] hover:text-white'
              }`}
            >
              {statusScope === 'validated_alerts' && <Check size={13} className="text-[#3B82F6] stroke-[3]" />}
              <span>Validated Alerts</span>
            </button>
          </div>

          <span className="text-xs font-normal text-[#94A3B8]">({totalRows} alerts)</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Multi-select FPSO Filter */}
          <FpsosFilterDropdown
            fpsos={allFpsos}
            isMultiSelect={true}
            selectedFpsos={selectedFpsos}
            onMultiChange={(newFpsos) => setSelectedFpsos(newFpsos)}
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

          {/* Export to Excel Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-normal rounded-full bg-transparent border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
          >
            <Download size={13} />
            Export to excel
          </button>
        </div>
      </div>

      {/* ── Dynamic KPI Cards synced with global filters (FPSO, Time Period, Categories) and active subtab ── */}
      <div className="flex gap-4">
        {statusScope === 'for_validation' ? (
          <>
            <KpiCard
              title="To Be Validated"
              value={kpiToBeValidated}
              subtitle="Requires Operator Validation"
              tooltip="Alerts that have been triggered and are awaiting initial review by an operator."
            />
            <KpiCard
              title="Validation in Progress"
              value={kpiInProgress}
              subtitle="Under review"
              tooltip="Alerts currently being investigated or reviewed by an operator."
            />
            <KpiCard
              title="Total Alerts"
              value={kpiTotalForValidation}
              subtitle="Pending validation"
              tooltip="Total number of alerts awaiting validation or currently under review for the selected filters."
            />
          </>
        ) : (
          <>
            <KpiCard
              title="Ungrouped Alerts"
              value={kpiUngrouped}
              subtitle="Pending Alert Grouping"
              tooltip="Validated alerts that have not yet been assigned to an Event Reference ID."
            />
            <KpiCard
              title="Grouped Alerts"
              value={kpiGrouped}
              subtitle="Linked to Event Ref."
              tooltip="Validated alerts that have been consolidated and linked to an Event Reference ID."
            />
            <KpiCard
              title="Total Validated"
              value={kpiTotalValidated}
              subtitle="Confirmed valid"
              tooltip="Total number of validated alerts (both grouped and ungrouped) for the selected filters."
            />
          </>
        )}
      </div>

      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        {/* Table Card Header Toolbar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E293B] bg-[#0B0F19]/40 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-white">
              {statusScope === 'for_validation' ? 'For Validation' : 'Validated Alerts'}
            </span>
            {statusScope === 'validated_alerts' && selectedAlertIds.size > 0 && (
              <span className="text-xs text-[#94A3B8]">
                ({selectedAlertIds.size} alert{selectedAlertIds.size !== 1 ? 's' : ''} selected)
              </span>
            )}
          </div>
          {statusScope === 'validated_alerts' && (
            <button
              type="button"
              disabled={selectedAlertIds.size === 0}
              onClick={() => setShowGroupModal(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedAlertIds.size > 0
                  ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white cursor-pointer shadow-sm'
                  : 'bg-[#1E293B]/60 text-[#64748B] border border-[#1E293B] cursor-not-allowed opacity-60'
              }`}
            >
              <Layers size={13} />
              <span>Group Alerts {selectedAlertIds.size > 0 ? `(${selectedAlertIds.size})` : ''}</span>
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0B0F19]/40">
                {/* Chevron / Checkbox column */}
                {statusScope === 'validated_alerts' ? (
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-[#334155] bg-[#0B0F19] text-[#3B82F6] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#3B82F6]"
                    />
                  </th>
                ) : (
                  <th className="w-8 px-3 py-3" />
                )}
                {cols.map(([field, label]) => {
                  const isSortable = field === 'alertId' || field === 'eventId' || field === 'triggeredAt' || field === 'endDate' || field === 'reviewedAt';
                  const isCurrentSort = sortField === field;
                  return (
                    <th key={field} className="text-left px-4 py-3 text-xs font-normal text-[#94A3B8] whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1.5 ${isSortable ? 'cursor-pointer hover:text-white transition-colors select-none' : ''}`}
                        onClick={() => isSortable && handleSort(field)}
                      >
                        <span>{label}</span>
                        {isSortable && (
                          <span className="text-[#64748B] hover:text-white">
                            {isCurrentSort ? (
                              sortDirection === 'asc' ? <ArrowUp size={12} className="text-[#3B82F6]" /> : <ArrowDown size={12} className="text-[#3B82F6]" />
                            ) : (
                              <ArrowUpDown size={12} />
                            )}
                          </span>
                        )}
                      </div>
                      {field !== 'fpso' && <TableColumnFilter field={field} label={label} />}
                    </th>
                  );
                })}
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
                      <td className="px-3 py-3 text-center">
                        {isExpanded
                          ? <ChevronDown size={14} className="text-[#94A3B8] inline" />
                          : <ChevronRight size={14} className="text-[#94A3B8] inline" />
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
                        {/* Checkbox column on Validated Alerts, Indent spacer on For Validation */}
                        {statusScope === 'validated_alerts' ? (
                          <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedAlertIds.has(row.id)}
                              onChange={() => toggleSelectAlert(row.id)}
                              className="rounded border-[#334155] bg-[#0B0F19] text-[#3B82F6] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#3B82F6]"
                            />
                          </td>
                        ) : (
                          <td className="px-3 py-3">
                            <div className="w-px h-4 bg-[#1E293B] mx-auto" />
                          </td>
                        )}

                        {/* FPSO */}
                        <td className="px-4 py-3 text-white font-medium text-xs font-mono">{row.fpso}</td>

                        {/* Event Ref - only on Validated Alerts */}
                        {statusScope === 'validated_alerts' && (
                          <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                            {row.eventId ? (
                              <span className="text-white">{row.eventId}</span>
                            ) : (
                              <span className="text-[#64748B]">—</span>
                            )}
                          </td>
                        )}

                        {/* Alert ID */}
                        <td className="px-4 py-3 text-white font-mono text-xs whitespace-nowrap">
                          ALT-{row.id}
                        </td>

                        {/* Asset */}
                        <td className="px-4 py-3"><EquipmentBadge code={row.equipmentCode} /></td>

                        {/* Timeseries */}
                        <td className="px-4 py-3">
                          <TimeseriesCell timeseries={row.timeseries} />
                        </td>

                        {/* Source */}
                        <td className="px-4 py-3 text-[#94A3B8] text-xs font-medium">{row.source}</td>

                        {/* Date & Status columns for For Validation */}
                        {statusScope === 'for_validation' && (
                          <>
                            {/* Creation Date / Triggered At */}
                            <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{row.triggeredAt}</td>

                            {/* Status Badge */}
                            <td className="px-4 py-3">
                              <StatusBadge status={row.status} />
                            </td>
                          </>
                        )}

                        {/* Date columns for Validated Alerts */}
                        {statusScope === 'validated_alerts' && (
                          <>
                            {/* Start Date */}
                            <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{row.triggeredAt}</td>

                            {/* End Date */}
                            <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{row.endDate || '—'}</td>

                            {/* Validated Date */}
                            <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{row.reviewedAt || '—'}</td>
                          </>
                        )}

                        {/* MR ID */}
                        <td className="px-4 py-3 text-white font-mono text-xs whitespace-nowrap font-medium">
                          {row.ruleName}
                        </td>

                        {/* Action Column: Details button */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedAlertDetails(row);
                            }}
                            className="px-3.5 py-1 text-xs rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}

              {groups.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 2} className="px-4 py-8 text-center text-[#64748B] text-xs">
                    No alerts found matching selected criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Group Alerts Modal */}
      <GroupAlertsModal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        selectedAlerts={selectedAlertsForGrouping}
        generatedEventId={currentGeneratedEventId}
        onConfirm={handleConfirmGrouping}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        open={!!selectedAlertDetails}
        onClose={() => {
          setSelectedAlertDetails(null);
        }}
        alert={selectedAlertDetails}
        statusScope={statusScope}
        onStatusChange={handleStatus}
      />

      {/* Reject Event Modal */}
      <RejectEventModal
        open={pendingRejectAlertId !== null}
        onClose={() => setPendingRejectAlertId(null)}
        onSubmit={handleConfirmRejection}
      />

      {/* Export Confirmation modal matching MR Database */}
      <Dialog.Root open={showExportModal} onOpenChange={setShowExportModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[450px] bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold text-white">
                Export Alerts to Excel
              </Dialog.Title>
              <Dialog.Close className="text-[#64748B] hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
            <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">
              Are you sure you want to download the current {statusScope === 'for_validation' ? 'For Validation' : 'Validated'} alerts? This will export all filtered records in Excel (.xlsx) format.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => { downloadExcel(); setShowExportModal(false); }}
                className="px-4 py-2 text-xs rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors cursor-pointer"
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
