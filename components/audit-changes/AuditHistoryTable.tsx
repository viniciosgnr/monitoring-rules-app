'use client';
import React, { useState, useMemo } from 'react';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import Pagination from '@/components/ui/Pagination';
import ColumnFilterDropdown from '@/components/ui/ColumnFilterDropdown';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, ChevronRight, Download, Filter, X } from 'lucide-react';
import { exportBrandedExcel } from '@/lib/excelExportUtils';

interface AuditEntry {
  id: number;
  fpso: string;
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

import FpsosFilterDropdown from '@/components/ui/FpsosFilterDropdown';

export default function AuditHistoryTable({ rows }: { rows: AuditEntry[] }) {
  const [page, setPage]                         = useState(1);
  const [pageSize, setPageSize]                 = useState(5);
  const [selectedFpsos, setSelectedFpsos]       = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [showExportModal, setShowExportModal]   = useState(false);
  const [period, setPeriod]                     = useState('All Time');

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

  const columnOptions = useMemo(() => {
    const opts: Record<string, string[]> = {
      fpso: Array.from(new Set(rows.map(r => r.fpso))).filter(Boolean).sort(),
      timestamp: Array.from(new Set(rows.map(r => r.timestamp))).filter(Boolean).sort(),
      userEmail: Array.from(new Set(rows.map(r => r.userEmail))).filter(Boolean).sort(),
      equipmentCode: Array.from(new Set(rows.map(r => r.equipmentCode))).filter(Boolean).sort(),
      system: Array.from(new Set(rows.map(r => r.system))).filter(Boolean).sort(),
      subsystem: Array.from(new Set(rows.map(r => r.subsystem))).filter(Boolean).sort(),
      ruleName: Array.from(new Set(rows.map(r => r.ruleName))).filter(Boolean).sort(),
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
    const headers = ['FPSO', 'Last Updated Time', 'User', 'Asset', 'System', 'Subsystem', 'Rule', 'Description', 'Parameter Changes'];

    const dataRows = filtered.map(row => [
      row.fpso || '',
      row.timestamp || '',
      row.userEmail || '',
      row.equipmentCode || '',
      row.system || '',
      row.subsystem || '',
      row.ruleName || '',
      row.description || '',
      row.paramChanges || ''
    ]);

    exportBrandedExcel({
      sheetName: 'Audit History',
      title: 'Monitoring Rules Management',
      originTab: 'Audit History',
      headers,
      rows: dataRows,
      filename: 'mr_audit_history.xlsx',
    });
  }

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (selectedFpsos.length > 0 && selectedFpsos.length < allFpsos.length && !selectedFpsos.includes(r.fpso)) {
        return false;
      }

      if (selectedCategories.length > 0 && selectedCategories.length < allCategories.length) {
        const cat = getFriendlyRuleName(r.ruleName);
        if (!selectedCategories.includes(cat)) return false;
      }

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

        const val = String((r as Record<string, unknown>)[colKey] ?? '');
        return selectedList.includes(val);
      });
    });
  }, [rows, selectedCategories, allCategories, selectedFilters, columnOptions, period, selectedFpsos, allFpsos]);

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

  const cols: [string, string][] = [
    ['fpso', 'FPSO'],
    ['timestamp', 'Last updated'],
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
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-white">Audit history</h2>
          <div className="flex items-center gap-3">
            {/* FPSO Filter Dropdown */}
            <FpsosFilterDropdown
              fpsos={allFpsos}
              selectedFpsos={selectedFpsos}
              onChange={(newFpsos) => {
                setSelectedFpsos(newFpsos);
                setPage(1);
              }}
            />

            {/* Time period filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={period}
                onChange={e => { setPeriod(e.target.value); setPage(1); }}
                className="bg-[#0B0F19] border border-[#1E293B] rounded-full px-3.5 py-1.5 text-xs text-white outline-none cursor-pointer hover:border-[#3B82F6] transition-colors"
              >
                {['All Time', 'Last Week', 'Last Month', 'Last 3 Months'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {/* Dedicated Category Filter Dropdown */}
            <CategoryFilterDropdown
              categories={allCategories}
              selectedCategories={selectedCategories}
              onChange={(newCategories) => {
                setSelectedCategories(newCategories);
                setPage(1);
              }}
            />
            {/* Export to Excel Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-normal rounded-full bg-transparent border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
            >
              <Download size={13} />
              Export to Excel
            </button>
          </div>
        </div>

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
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-medium text-white">{friendlyName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#1E293B] border border-[#334155]/40 text-[#94A3B8] text-[11px] font-medium font-sans">
                            {totalCount} change{totalCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Individual audit logs under group */}
                    {isExpanded && groupRows.map(row => (
                      <tr key={row.id} className="border-b border-[#1E293B] bg-[#0F1623] hover:bg-[#1A2335] transition-colors">
                        {/* Indent line spacer */}
                        <td className="px-3 py-3">
                          <div className="w-px h-4 bg-[#1E293B] mx-auto" />
                        </td>
                        <td className="px-4 py-3 text-white font-medium text-xs font-mono">{row.fpso}</td>
                        <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{row.timestamp}</td>
                        <td className="px-4 py-3 text-[#94A3B8] text-xs">{row.userEmail}</td>
                        <td className="px-4 py-3"><EquipmentBadge code={row.equipmentCode} /></td>
                        <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{row.system}</td>
                        <td className="px-4 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{row.subsystem}</td>
                        <td className="px-4 py-3 text-[#94A3B8] font-mono text-xs">{row.ruleName}</td>
                        <td className="px-4 py-3 text-[#94A3B8] text-xs">{row.description}</td>
                        <td className="px-4 py-3 text-[#E2E8F0] font-mono text-xs">{row.paramChanges}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}

              {groups.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 1} className="px-4 py-8 text-center text-[#64748B] text-xs">No audit logs found matching selected criteria</td>
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

      {/* Export Confirmation modal matching SLB Figma design */}
      <Dialog.Root open={showExportModal} onOpenChange={setShowExportModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[450px] bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold text-white">
                Export Audit History to Excel
              </Dialog.Title>
              <Dialog.Close className="text-[#64748B] hover:text-white transition-colors cursor-pointer">
                <X size={18} />
              </Dialog.Close>
            </div>
            <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">
              Are you sure you want to download the current Audit History logs? This will export all filtered records in CSV format compatible with Microsoft Excel.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:bg-[#1E293B]/40 transition-colors cursor-pointer"
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
