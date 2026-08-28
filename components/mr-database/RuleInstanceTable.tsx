'use client';
import React, { useState, useMemo, useEffect } from 'react';
import * as Switch from '@radix-ui/react-switch';
import * as Dialog from '@radix-ui/react-dialog';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import Pagination from '@/components/ui/Pagination';
import ColumnFilterDropdown from '@/components/ui/ColumnFilterDropdown';
import EditRuleModal from './EditRuleModal';
import { toggleInstance, toggleInstancesBulk } from '@/app/actions/ruleInstances';
import FpsosFilterDropdown from '@/components/ui/FpsosFilterDropdown';
import { ChevronDown, ChevronRight, Download, Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useUserRole } from '@/components/context/UserRoleContext';
import { exportBrandedExcel } from '@/lib/excelExportUtils';

interface InstanceRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  timeseries: string;
  system: string;
  subsystem: string;
  ruleName: string;
  ruleId: number;
  schedule: string;
  lastRunAt: string;
  lastRunAtRaw?: string | null;
  nextRunAt: string;
  nextRunAtRaw?: string | null;
  enabled: boolean;
  processingSteps: object;
  deactivatedUntil: string | null;
  [key: string]: unknown;
}

function getFriendlyRuleName(ruleName: string): string {
  const name = ruleName.toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'Spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR') || name.includes('MGN')) return 'Surge (Threshold)';
  if (name.includes('TRND') || name.includes('TREND') || name.includes('DEV') || name.includes('TEMP_DEV')) return 'Trend';
  if (name.includes('FOUL') || name.includes('DP') || name.includes('HTEX') || name.includes('NORM')) return 'Normalized dP ( step change, spike, trend)';
  if (name.includes('DRFT') || name.includes('DRIFT')) return 'Drift';
  if (name.includes('ML') || name.includes('AI')) return 'AI/ML';
  return ruleName;
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

export default function RuleInstanceTable({ rows }: { rows: InstanceRow[] }) {
  const { role } = useUserRole();
  const isViewer = role === 'viewer';

  const [data, setData]                 = useState(rows);
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(5);
  const allFpsos = useMemo(() => {
    return Array.from(new Set(data.map(r => r.fpso))).filter(Boolean).sort();
  }, [data]);
  const [selectedFpso, setSelectedFpso] = useState<string>('UNY');

  useEffect(() => {
    if (allFpsos.length > 0 && (!selectedFpso || !allFpsos.includes(selectedFpso))) {
      setSelectedFpso(allFpsos[0]);
    }
  }, [allFpsos, selectedFpso]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [sortField, setSortField]       = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editRow, setEditRow]           = useState<InstanceRow | null>(null);

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
    return Array.from(new Set(data.map(r => getFriendlyRuleName(r.ruleName)))).filter(Boolean).sort();
  }, [data]);

  // Dynamic distinct options per column
  const columnOptions = useMemo(() => {
    const opts: Record<string, string[]> = {
      fpso: Array.from(new Set(data.map(r => r.fpso))).filter(Boolean).sort(),
      equipmentCode: Array.from(new Set(data.map(r => r.equipmentCode))).filter(Boolean).sort(),
      timeseries: Array.from(new Set(data.map(r => r.timeseries))).filter(Boolean).sort(),
      system: Array.from(new Set(data.map(r => r.system))).filter(Boolean).sort(),
      subsystem: Array.from(new Set(data.map(r => r.subsystem))).filter(Boolean).sort(),
      ruleName: Array.from(new Set(data.map(r => r.ruleName))).filter(Boolean).sort(),
      schedule: Array.from(new Set(data.map(r => r.schedule))).filter(Boolean).sort(),
      lastRunAt: Array.from(new Set(data.map(r => {
        if (!r.lastRunAt || r.lastRunAt === '—') return '';
        return r.lastRunAt.includes(',') ? r.lastRunAt.split(',')[0].trim() : (r.lastRunAtRaw ? new Date(r.lastRunAtRaw).toLocaleDateString('pt-BR') : r.lastRunAt.split(' ')[0]);
      }))).filter(Boolean).sort(),
      nextRunAt: Array.from(new Set(data.map(r => {
        if (!r.nextRunAt || r.nextRunAt === '—') return '';
        return r.nextRunAt.includes(',') ? r.nextRunAt.split(',')[0].trim() : (r.nextRunAtRaw ? new Date(r.nextRunAtRaw).toLocaleDateString('pt-BR') : r.nextRunAt.split(' ')[0]);
      }))).filter(Boolean).sort(),
      deactivatedUntil: Array.from(new Set(data.map(r => {
        if (!r.deactivatedUntil) return '';
        return new Date(r.deactivatedUntil).toLocaleDateString('pt-BR');
      }))).filter(Boolean).sort(),
    };
    return opts;
  }, [data]);

  // Disable Modal States
  const [disableRow, setDisableRow] = useState<InstanceRow | null>(null);
  const [disableGroupData, setDisableGroupData] = useState<{ friendlyName: string; rows: InstanceRow[] } | null>(null);
  const [disableReason, setDisableReason] = useState('Process Shutdown / Maintenance');
  const [customReason, setCustomReason] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Enable Modal States
  const [enableRow, setEnableRow] = useState<InstanceRow | null>(null);
  const [enableGroupData, setEnableGroupData] = useState<{ friendlyName: string; rows: InstanceRow[] } | null>(null);

  function applyPresetDays(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  }

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

  const filtered = data.filter(r => {
    // 0. Global Single FPSO Filter
    if (selectedFpso && r.fpso !== selectedFpso) {
      return false;
    }

    // 1. Category Filter
    if (selectedCategories.length > 0 && selectedCategories.length < allCategories.length) {
      const cat = getFriendlyRuleName(r.ruleName);
      if (!selectedCategories.includes(cat)) return false;
    }

    // 2. Column Filters
    return Object.entries(selectedFilters).every(([colKey, selectedList]) => {
      if (!selectedList || selectedList.length === 0) return true;
      const options = columnOptions[colKey] || [];
      if (selectedList.length === options.length) return true;

      let val = '';
      if (colKey === 'lastRunAt') {
        val = r.lastRunAt && r.lastRunAt !== '—' ? (r.lastRunAt.includes(',') ? r.lastRunAt.split(',')[0].trim() : (r.lastRunAtRaw ? new Date(r.lastRunAtRaw).toLocaleDateString('pt-BR') : r.lastRunAt.split(' ')[0])) : '';
      } else if (colKey === 'nextRunAt') {
        val = r.nextRunAt && r.nextRunAt !== '—' ? (r.nextRunAt.includes(',') ? r.nextRunAt.split(',')[0].trim() : (r.nextRunAtRaw ? new Date(r.nextRunAtRaw).toLocaleDateString('pt-BR') : r.nextRunAt.split(' ')[0])) : '';
      } else if (colKey === 'deactivatedUntil') {
        val = r.deactivatedUntil ? new Date(r.deactivatedUntil).toLocaleDateString('pt-BR') : '';
      } else {
        val = String((r as Record<string, unknown>)[colKey] ?? '');
      }

      return selectedList.includes(val);
    });
  });

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      if (sortField === 'lastRunAt') {
        const aTime = a.lastRunAtRaw ? new Date(a.lastRunAtRaw).getTime() : 0;
        const bTime = b.lastRunAtRaw ? new Date(b.lastRunAtRaw).getTime() : 0;
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }
      if (sortField === 'nextRunAt') {
        const aTime = a.nextRunAtRaw ? new Date(a.nextRunAtRaw).getTime() : 0;
        const bTime = b.nextRunAtRaw ? new Date(b.nextRunAtRaw).getTime() : 0;
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }
      if (sortField === 'deactivatedUntil') {
        const aTime = a.deactivatedUntil ? new Date(a.deactivatedUntil).getTime() : 0;
        const bTime = b.deactivatedUntil ? new Date(b.deactivatedUntil).getTime() : 0;
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }

      const aVal = (a as Record<string, unknown>)[sortField];
      const bVal = (b as Record<string, unknown>)[sortField];
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filtered, sortField, sortDirection]);

  const paginatedInstances = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [sorted, page, pageSize]);

  const groups = useMemo(() => {
    const map = new Map<string, InstanceRow[]>();
    for (const row of paginatedInstances) {
      const friendly = getFriendlyRuleName(row.ruleName);
      const arr = map.get(friendly) ?? [];
      arr.push(row);
      map.set(friendly, arr);
    }
    return Array.from(map.entries());
  }, [paginatedInstances]);

  async function handleToggle(id: number, enabled: boolean, reason?: string, deactivatedUntil?: Date | null) {
    setData(d => d.map(r => r.id === id ? { ...r, enabled, deactivatedUntil: deactivatedUntil ? deactivatedUntil.toISOString() : null } : r));
    await toggleInstance(id, enabled, reason, deactivatedUntil);
  }

  function handleSwitchChange(row: InstanceRow, checked: boolean) {
    if (!checked) {
      // Disabling -> Open confirmation / reason modal
      setDisableRow(row);
      setDisableReason('Process Shutdown / Maintenance');
      setCustomReason('');
      setDueDate('');
    } else {
      // Enabling -> Open confirmation modal
      setEnableRow(row);
    }
  }

  function confirmDisable() {
    if (!disableRow) return;
    const reason = disableReason === 'Other' ? customReason : disableReason;
    const d = dueDate ? new Date(dueDate) : null;
    handleToggle(disableRow.id, false, reason, d);
    setDisableRow(null);
  }

  function confirmEnable() {
    if (!enableRow) return;
    handleToggle(enableRow.id, true);
    setEnableRow(null);
  }

  async function handleGroupToggle(ids: number[], enabled: boolean, reason?: string, deactivatedUntil?: Date | null) {
    setData(d => d.map(r => ids.includes(r.id) ? { ...r, enabled, deactivatedUntil: deactivatedUntil ? deactivatedUntil.toISOString() : null } : r));
    await toggleInstancesBulk(ids, enabled, reason, deactivatedUntil);
  }

  function handleGroupSwitchChange(friendlyName: string, groupRows: InstanceRow[], checked: boolean) {
    if (!checked) {
      // Disabling all active -> Open confirmation / reason modal for the group
      setDisableGroupData({ friendlyName, rows: groupRows });
      setDisableReason('Process Shutdown / Maintenance');
      setCustomReason('');
      setDueDate('');
    } else {
      // Enabling all -> Open confirmation modal for the group
      setEnableGroupData({ friendlyName, rows: groupRows });
    }
  }

  function confirmGroupDisable() {
    if (!disableGroupData) return;
    const reason = disableReason === 'Other' ? customReason : disableReason;
    const d = dueDate ? new Date(dueDate) : null;
    const ids = disableGroupData.rows.map(r => r.id);
    handleGroupToggle(ids, false, reason, d);
    setDisableGroupData(null);
  }

  function confirmGroupEnable() {
    if (!enableGroupData) return;
    const disabledRows = enableGroupData.rows.filter(r => !r.enabled);
    const ids = disabledRows.map(r => r.id);
    if (ids.length > 0) {
      handleGroupToggle(ids, true);
    }
    setEnableGroupData(null);
  }

function formatModalParamsJson(ruleName: string, steps: unknown): string {
  const name = ruleName.toUpperCase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = (steps as any) || {};

  if (name.includes('SPK') || name.includes('SPIKE')) {
    const sd = s.rule_trigger_params?.[0]?.spike_detection || {};
    return JSON.stringify({
      height: sd.height ?? null,
      threshold: sd.threshold ?? null,
      distance: sd.distance ?? 50,
      prominence: sd.prominence ?? 1,
    });
  }

  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR')) {
    const val = s.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 150;
    return JSON.stringify({
      threshold: val,
    });
  }

  return JSON.stringify({
    threshold: 10,
  });
}

  function downloadExcel() {
    const headers = [
      'FPSO',
      'Asset',
      'Timeseries',
      'System',
      'Subsystem',
      'Rule',
      'Schedule',
      'Last Run At',
      'Next Run At',
      'Disabled Until',
      'Enabled',
      'Rule Parameters (JSON)'
    ];

    const dataRows = filtered.map(row => {
      let disabledUntilStr = '—';
      if (!row.enabled) {
        if (!row.deactivatedUntil) {
          disabledUntilStr = 'Indefinite';
        } else {
          const limit = new Date(row.deactivatedUntil);
          const dateStr = limit.toLocaleDateString('pt-BR');
          disabledUntilStr = new Date() > limit ? `Expired (${dateStr})` : dateStr;
        }
      }

      const paramsJson = formatModalParamsJson(row.ruleName, row.processingSteps);

      return [
        row.fpso || '',
        row.equipmentCode || '',
        row.timeseries || '',
        row.system || '',
        row.subsystem || '',
        row.ruleName || '',
        row.schedule || '',
        row.lastRunAt || '',
        row.nextRunAt || '',
        disabledUntilStr,
        row.enabled ? 'Yes' : 'No',
        paramsJson,
      ];
    });

    exportBrandedExcel({
      sheetName: 'Rule Catalog',
      title: 'Monitoring Rules Management',
      originTab: 'Monitoring Rule Instance Catalog',
      headers,
      rows: dataRows,
      filename: 'monitoring_rule_catalog.xlsx',
    });
  }

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

  const cols: [string, string][] = [
    ['fpso', 'FPSO'],
    ['equipmentCode', 'Asset'],
    ['timeseries', 'Timeseries'],
    ['system', 'System'],
    ['subsystem', 'Subsystem'],
    ['ruleName', 'Rule'],
    ['schedule', 'Schedule'],
    ['lastRunAt', 'Last Run At'],
    ['nextRunAt', 'Next Run At'],
    ['deactivatedUntil', 'Disabled Until'],
  ];

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm font-semibold text-white">Monitoring rule instance catalog</h2>
        <div className="flex items-center gap-3">
          <FpsosFilterDropdown
            fpsos={allFpsos}
            selectedFpso={selectedFpso}
            onChange={(newFpso) => {
              setSelectedFpso(newFpso);
              setPage(1);
            }}
          />
          <CategoryFilterDropdown
            categories={allCategories}
            selectedCategories={selectedCategories}
            onChange={(newCategories) => {
              setSelectedCategories(newCategories);
              setPage(1);
            }}
          />
          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-normal rounded-full bg-transparent border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
          >
            <Download size={13} />
            Export to excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#1E293B] bg-[#0B0F19]/40">
              {/* Chevron column */}
              <th className="w-8 px-3 py-3" />
              {cols.map(([field, label]) => {
                const isSortable = ['lastRunAt', 'nextRunAt', 'deactivatedUntil'].includes(field);
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
              <th className="px-4 py-3 w-12" />
              <th className="px-4 py-3 w-20" />
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
                    className="border-b border-[#1E293B] bg-[#151D2E] cursor-pointer hover:bg-[#1A2438] transition-colors select-none"
                    onClick={() => toggleRule(friendlyName)}
                  >
                    <td className="px-3 py-3">
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-[#94A3B8]" />
                      ) : (
                        <ChevronRight size={14} className="text-[#94A3B8]" />
                      )}
                    </td>
                    <td colSpan={cols.length} className="px-1 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-white">{friendlyName}</span>
                        <span className="text-xs text-[#64748B]">
                          {totalCount} instance{totalCount !== 1 ? 's' : ''} ({enabledCount} active)
                        </span>
                      </div>
                    </td>
                    {/* Group Switch + Enable all label */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Switch.Root
                          checked={enabledCount > 0}
                          onCheckedChange={v => handleGroupSwitchChange(friendlyName, groupRows, v)}
                          className={`relative w-9 h-5 rounded-full border border-[#1E293B] bg-[#1E293B] data-[state=checked]:bg-[#3B82F6] outline-none cursor-pointer transition-colors ${
                            isViewer ? 'opacity-40 pointer-events-none' : ''
                          }`}
                        >
                          <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-sm translate-x-0.5 data-[state=checked]:translate-x-4 transition-transform" />
                        </Switch.Root>
                        <span className="text-xs text-[#94A3B8] font-normal whitespace-nowrap">Enable all</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" />
                  </tr>

                  {isExpanded && groupRows.map(row => (
                    <tr key={row.id} className="border-b border-[#1E293B] bg-[#0F1623] hover:bg-[#1A2335] transition-colors">
                      {/* Indent line spacer */}
                      <td className="px-3 py-3">
                        <div className="w-px h-4 bg-[#1E293B] mx-auto" />
                      </td>
                      <td className="px-4 py-3 text-white font-medium text-xs font-mono">{row.fpso}</td>
                      <td className="px-4 py-3">
                        <EquipmentBadge code={row.equipmentCode} />
                      </td>
                      <td className="px-4 py-3 text-[#94A3B8] font-mono text-xs">{row.timeseries}</td>
                      <td className="px-4 py-3 text-[#94A3B8] text-xs">{row.system}</td>
                      <td className="px-4 py-3 text-[#94A3B8] text-xs">{row.subsystem}</td>
                      <td className="px-4 py-3 text-[#94A3B8] font-mono text-xs">{row.ruleName}</td>
                      <td className="px-4 py-3 text-[#94A3B8] text-xs">{row.schedule}</td>
                      <td className="px-4 py-3 text-[#94A3B8] text-xs">{row.lastRunAt}</td>
                      <td className="px-4 py-3 text-[#94A3B8] text-xs">{row.nextRunAt}</td>
                      <td className="px-4 py-3 text-xs">
                        {!row.enabled ? (
                          !row.deactivatedUntil ? (
                            <span className="text-[#64748B]">Indefinite</span>
                          ) : (() => {
                            const limit = new Date(row.deactivatedUntil);
                            const now = new Date();
                            const dateStr = limit.toLocaleDateString('pt-BR');
                            if (now > limit) {
                              return (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                  Expired ({dateStr})
                                </span>
                              );
                            }
                             return <span className="text-[#94A3B8] text-xs">{dateStr}</span>;
                          })()
                        ) : (
                          <span className="text-[#64748B]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Switch.Root
                          checked={row.enabled}
                          onCheckedChange={v => handleSwitchChange(row, v)}
                          className={`relative w-9 h-5 rounded-full border border-[#1E293B] bg-[#1E293B] data-[state=checked]:bg-[#3B82F6] outline-none cursor-pointer transition-colors ${
                            isViewer ? 'opacity-40 pointer-events-none' : ''
                          }`}
                        >
                          <Switch.Thumb className="block w-4 h-4 bg-white rounded-full shadow-sm translate-x-0.5 data-[state=checked]:translate-x-4 transition-transform" />
                        </Switch.Root>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditRow(row)}
                          className="px-3.5 py-1 text-xs rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
                        >
                          {isViewer ? 'View' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}

            {groups.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-[#64748B] text-xs">No results found</td>
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
          instanceId={editRow.id}
          enabled={editRow.enabled}
        />
      )}

      {/* Disable single instance modal */}
      <Dialog.Root open={!!disableRow} onOpenChange={v => !v && setDisableRow(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-base font-semibold text-white">
                Disable Monitoring Rule Instance
              </Dialog.Title>
              <Dialog.Close className="text-[#64748B] hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
            <p className="text-xs text-[#94A3B8] mb-5 leading-relaxed">
              Specify a justification for disabling the rule instance <span className="font-semibold text-white">{disableRow ? getFriendlyRuleName(disableRow.ruleName) : ''}</span> (<span className="font-mono text-[#94A3B8]">{disableRow?.ruleName}</span>) for equipment <span className="text-white font-semibold">{disableRow?.equipmentCode}</span>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1.5">JUSTIFICATION REASON</label>
                <select
                  value={disableReason}
                  onChange={e => setDisableReason(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#3B82F6] transition-colors cursor-pointer"
                >
                  <option value="Process Shutdown / Maintenance">Process Shutdown / Maintenance</option>
                  <option value="Sensor Calibration">Sensor Calibration</option>
                  <option value="False Alert Tuning">False Alert Tuning</option>
                  <option value="Other">Other (Write reason below)</option>
                </select>
              </div>

              {disableReason === 'Other' && (
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1.5">CUSTOM REASON</label>
                  <textarea
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Describe the reason for disabling this rule..."
                    className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#3B82F6] transition-colors h-24 resize-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1.5">DEACTIVATION DUE DATE (OPTIONAL)</label>
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#3B82F6] transition-colors min-w-[150px] flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => applyPresetDays(7)}
                    className="px-3 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDays(30)}
                    className="px-3 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
                  >
                    +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDays(90)}
                    className="px-3 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
                  >
                    +90 Days
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#1E293B]">
              <button
                onClick={() => setDisableRow(null)}
                className="px-5 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:bg-[#1E293B]/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisable}
                className="px-5 py-2 text-xs rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors cursor-pointer"
              >
                Disable
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Disable Group reason modal (Bulk) */}
      <Dialog.Root open={!!disableGroupData} onOpenChange={v => !v && setDisableGroupData(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-base font-semibold text-white">
                Disable All Rule Instances (Bulk)
              </Dialog.Title>
              <Dialog.Close className="text-[#64748B] hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
            <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
              Specify a justification for disabling <span className="font-semibold text-white">ALL</span> instances of the Monitoring Rule <span className="font-semibold text-white">{disableGroupData?.friendlyName}</span>
            </p>
            {/* Amber Warning Box matching Figma Image 3 & 4 */}
            <div className="bg-[#2A1D0E] border border-[#EAB308]/40 rounded-xl p-3 mb-5 leading-relaxed text-xs">
              <p className="font-medium text-[#F59E0B] mb-1">Warning:</p>
              <p className="text-[#FCD34D]">
                This will disable {disableGroupData?.rows.filter(r => r.enabled).length} active rule instance(s) across equipment:{' '}
                <span className="font-mono text-[#FEE2E2]">
                  {disableGroupData?.rows.filter(r => r.enabled).map(r => r.equipmentCode).join(', ')}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1.5">JUSTIFICATION REASON</label>
                <select
                  value={disableReason}
                  onChange={e => setDisableReason(e.target.value)}
                  className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#3B82F6] transition-colors cursor-pointer"
                >
                  <option value="Process Shutdown / Maintenance">Process Shutdown / Maintenance</option>
                  <option value="Sensor Calibration">Sensor Calibration</option>
                  <option value="False Alert Tuning">False Alert Tuning</option>
                  <option value="Other">Other (Write reason below)</option>
                </select>
              </div>

              {disableReason === 'Other' && (
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1.5">CUSTOM REASON</label>
                  <textarea
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Describe the reason for disabling these rules..."
                    className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#3B82F6] transition-colors h-24 resize-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1.5">DEACTIVATION DUE DATE (OPTIONAL)</label>
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#3B82F6] transition-colors min-w-[150px] flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => applyPresetDays(7)}
                    className="px-3 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
                  >
                    +7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDays(30)}
                    className="px-3 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
                  >
                    +30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetDays(90)}
                    className="px-3 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
                  >
                    +90 Days
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#1E293B]">
              <button
                onClick={() => setDisableGroupData(null)}
                className="px-5 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:bg-[#1E293B]/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmGroupDisable}
                className="px-5 py-2 text-xs rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors cursor-pointer"
              >
                Disable All
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Export Confirmation modal matching Figma Image 2 from new batch */}
      <Dialog.Root open={showExportModal} onOpenChange={setShowExportModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[450px] bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold text-white">
                Export Catalog to Excel
              </Dialog.Title>
              <Dialog.Close className="text-[#64748B] hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
            <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">
              Are you sure you want to download the current Monitoring Rule Instance Catalog? This will export all filtered records in CSV format compatible with Microsoft Excel.
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

      {/* Enable Instance Confirmation modal matching Figma Image 5 */}
      <Dialog.Root open={!!enableRow} onOpenChange={v => !v && setEnableRow(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[450px] bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold text-white">
                Enable monitoring rule instance
              </Dialog.Title>
              <Dialog.Close className="text-[#64748B] hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
            <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">
              Are you sure you want to enable monitoring for instance <span className="font-semibold text-white">{enableRow?.ruleName}</span> on asset <span className="font-semibold text-white">{enableRow?.equipmentCode}</span>?
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
              <button
                onClick={() => setEnableRow(null)}
                className="px-4 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnable}
                className="px-4 py-2 text-xs rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors cursor-pointer"
              >
                Yes, enable
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Enable Group Confirmation modal */}
      <Dialog.Root open={!!enableGroupData} onOpenChange={v => !v && setEnableGroupData(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[450px] bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold text-white">
                Enable monitoring rule instances
              </Dialog.Title>
              <Dialog.Close className="text-[#64748B] hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
            <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">
              Are you sure you want to enable all {enableGroupData?.rows.filter(r => !r.enabled).length} disabled instances for rule <span className="font-semibold text-white">{enableGroupData?.friendlyName}</span>?
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
              <button
                onClick={() => setEnableGroupData(null)}
                className="px-4 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmGroupEnable}
                className="px-4 py-2 text-xs rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors cursor-pointer"
              >
                Yes, enable
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
