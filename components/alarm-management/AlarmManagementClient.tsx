'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import FpsosFilterDropdown from '@/components/ui/FpsosFilterDropdown';
import PeriodFilterDropdown, { PresetPeriod } from '@/components/ui/PeriodFilterDropdown';
import ColumnFilterDropdown from '@/components/ui/ColumnFilterDropdown';
import Pagination from '@/components/ui/Pagination';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { exportBrandedExcel } from '@/lib/excelExportUtils';

export type AlarmTableKey =
  | 'most_frequent_alarms'
  | 'most_frequent_actions'
  | 'chattering_alarms'
  | 'fleeting_alarms'
  | 'symptomatic_analysis';

export interface MostFrequentAlarmRow {
  id: number;
  fpso: string;
  tag: string;
  identifier: string;
  count: number;
  percentage: number;
  priority: string;
  description: string;
  asset: string;
}

export interface MostFrequentActionRow {
  id: number;
  fpso: string;
  tag: string;
  parameter: string;
  count: number;
}

export interface ChatteringAlarmRow {
  id: number;
  fpso: string;
  tag: string;
  identifier: string;
  priority: string;
  occurrence: number;
}

export interface FleetingAlarmRow {
  id: number;
  fpso: string;
  tag: string;
  identifier: string;
  priority: string;
  occurrence: number;
}

export interface SymptomaticAnalysisRow {
  id: number;
  fpso: string;
  parentTag: string;
  parentIdentifier: string;
  childTag: string;
  childIdentifier: string;
  childBlockName: string;
  childDescription: string;
  childAsset: string;
  childPath: string;
  occurrence: number;
  predictability: number;
  significance: number;
}

interface AlarmManagementClientProps {
  fpsos: string[];
  reportWindow: { from: string; to: string };
  mostFrequentAlarms: MostFrequentAlarmRow[];
  mostFrequentActions: MostFrequentActionRow[];
  chatteringAlarms: ChatteringAlarmRow[];
  fleetingAlarms: FleetingAlarmRow[];
  symptomaticAnalysis: SymptomaticAnalysisRow[];
}

const TABLE_OPTIONS: {
  key: AlarmTableKey;
  label: string;
  description: string;
  formula: string;
}[] = [
  {
    key: 'most_frequent_alarms',
    label: 'Most Frequent Alarms',
    description: 'Top alarm tags ranked by total activation count and percentage share during the selected window.',
    formula: 'Rank by Count Descending',
  },
  {
    key: 'most_frequent_actions',
    label: 'Most Frequent Actions',
    description: 'Operator control actions ranked by frequency across control loops and setpoints.',
    formula: '∑(Operator Actions) per Tag',
  },
  {
    key: 'chattering_alarms',
    label: 'Chattering Alarms',
    description: 'Alarms that repeatedly transition between active and normal states within a short period.',
    formula: '∑(Chattering Occurrences) per Tag & Identifier',
  },
  {
    key: 'fleeting_alarms',
    label: 'Fleeting Alarms',
    description: 'Transient alarms that activate and clear automatically within seconds.',
    formula: '∑(Fleeting Occurrences) per Tag & Identifier',
  },
  {
    key: 'symptomatic_analysis',
    label: 'Symptomatic Analysis',
    description: 'Parent-child alarm correlation pairs ranked by occurrence, predictability, and statistical significance.',
    formula: 'Predictability % & Significance %',
  },
];

function PriorityBadge({ priority }: { priority: string }) {
  const p = (priority || '').toLowerCase();
  let dotColor = '#64748B';
  if (p === 'high' || p === 'critical') {
    dotColor = '#FF4D4F'; // Optisite Red
  } else if (p === 'medium' || p === 'warning') {
    dotColor = '#FAAD14'; // Optisite Orange/Amber
  } else if (p === 'low' || p === 'healthy') {
    dotColor = '#73D13D'; // Optisite Green
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs text-[#CBD5E1]">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <span>{priority || '—'}</span>
    </span>
  );
}

export default function AlarmManagementClient({
  fpsos,
  reportWindow,
  mostFrequentAlarms,
  mostFrequentActions,
  chatteringAlarms,
  fleetingAlarms,
  symptomaticAnalysis,
}: AlarmManagementClientProps) {
  const [selectedTable, setSelectedTable] = useState<AlarmTableKey>('most_frequent_alarms');
  const [selectedFpsos, setSelectedFpsos] = useState<string[]>([]);
  const [period, setPeriod] = useState<PresetPeriod>('Last month');
  const [customFrom, setCustomFrom] = useState<string>(`${reportWindow.from} 00:00:00`);
  const [customTo, setCustomTo] = useState<string>(`${reportWindow.to} 23:59:59`);

  // Local column filters
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [identifierFilter, setIdentifierFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [assetFilter, setAssetFilter] = useState<string[]>([]);

  // Sorting & pagination
  const [sortField, setSortField] = useState<string>('default');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset local column filters & pagination when switching tables
  const handleSelectTable = (key: AlarmTableKey) => {
    setSelectedTable(key);
    setTagFilter([]);
    setIdentifierFilter([]);
    setPriorityFilter([]);
    setAssetFilter([]);
    setSortField('default');
    setSortDir('desc');
    setPage(1);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Compute period date boundaries matching AnalyticsClient
  const periodOverlapsReport = useMemo(() => {
    const now = new Date();
    let periodStart = new Date(0);
    let periodEnd = new Date();

    if (period === 'Custom dates' && customFrom && customTo) {
      const [fDate, fTime] = customFrom.split(' ');
      const [tDate, tTime] = customTo.split(' ');
      const [fy, fm, fd] = (fDate || '').split('-').map(Number);
      const [fh, fmin, fs] = (fTime || '00:00:00').split(':').map(Number);
      const [ty, tm, td] = (tDate || '').split('-').map(Number);
      const [th, tmin, ts] = (tTime || '23:59:59').split(':').map(Number);
      periodStart = new Date(fy, fm - 1, fd, isNaN(fh) ? 0 : fh, isNaN(fmin) ? 0 : fmin, isNaN(fs) ? 0 : fs);
      periodEnd = new Date(ty, tm - 1, td, isNaN(th) ? 23 : th, isNaN(tmin) ? 59 : tmin, isNaN(ts) ? 59 : ts);
    } else if (period === 'Last week') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (period === 'Last month') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (period === 'Last 6 months') {
      periodStart = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else {
      // Last year
      periodStart = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const [ry1, rm1, rd1] = reportWindow.from.split('-').map(Number);
    const [ry2, rm2, rd2] = reportWindow.to.split('-').map(Number);
    const reportStart = new Date(ry1, rm1 - 1, rd1, 0, 0, 0);
    const reportEnd = new Date(ry2, rm2 - 1, rd2, 23, 59, 59);

    return periodStart.getTime() <= reportEnd.getTime() && periodEnd.getTime() >= reportStart.getTime();
  }, [period, customFrom, customTo, reportWindow]);

  const fpsoAllowed = useMemo(() => {
    return (fpsoCode: string) =>
      selectedFpsos.length === 0 ||
      selectedFpsos.length === fpsos.length ||
      selectedFpsos.includes(fpsoCode);
  }, [selectedFpsos, fpsos.length]);

  // Base rows per table respecting Global FPSO + Duration filter
  const baseRows = useMemo(() => {
    if (!periodOverlapsReport) return [];

    if (selectedTable === 'most_frequent_alarms') {
      return mostFrequentAlarms.filter(r => fpsoAllowed(r.fpso));
    }
    if (selectedTable === 'most_frequent_actions') {
      return mostFrequentActions.filter(r => fpsoAllowed(r.fpso));
    }
    if (selectedTable === 'chattering_alarms') {
      return chatteringAlarms.filter(r => fpsoAllowed(r.fpso));
    }
    if (selectedTable === 'fleeting_alarms') {
      return fleetingAlarms.filter(r => fpsoAllowed(r.fpso));
    }
    return symptomaticAnalysis.filter(r => fpsoAllowed(r.fpso));
  }, [
    periodOverlapsReport,
    selectedTable,
    mostFrequentAlarms,
    mostFrequentActions,
    chatteringAlarms,
    fleetingAlarms,
    symptomaticAnalysis,
    fpsoAllowed,
  ]);

  // Column filter options
  const tagOpts = useMemo(() => {
    if (selectedTable === 'symptomatic_analysis') {
      return Array.from(new Set((baseRows as SymptomaticAnalysisRow[]).map(r => r.parentTag))).filter(Boolean).sort();
    }
    return Array.from(new Set((baseRows as { tag: string }[]).map(r => r.tag))).filter(Boolean).sort();
  }, [baseRows, selectedTable]);

  const identifierOpts = useMemo(() => {
    if (selectedTable === 'most_frequent_actions') return [];
    if (selectedTable === 'symptomatic_analysis') {
      return Array.from(new Set((baseRows as SymptomaticAnalysisRow[]).map(r => r.parentIdentifier))).filter(Boolean).sort();
    }
    return Array.from(new Set((baseRows as { identifier: string }[]).map(r => r.identifier))).filter(Boolean).sort();
  }, [baseRows, selectedTable]);

  const priorityOpts = useMemo(() => {
    if (selectedTable === 'most_frequent_actions' || selectedTable === 'symptomatic_analysis') return [];
    return Array.from(new Set((baseRows as { priority: string }[]).map(r => r.priority))).filter(Boolean).sort();
  }, [baseRows, selectedTable]);

  const assetOpts = useMemo(() => {
    if (selectedTable === 'most_frequent_alarms') {
      return Array.from(new Set((baseRows as MostFrequentAlarmRow[]).map(r => r.asset))).filter(Boolean).sort();
    }
    if (selectedTable === 'symptomatic_analysis') {
      return Array.from(new Set((baseRows as SymptomaticAnalysisRow[]).map(r => r.childAsset))).filter(Boolean).sort();
    }
    return [];
  }, [baseRows, selectedTable]);

  // Apply local filters & sorting
  const filteredRows = useMemo(() => {
    if (selectedTable === 'most_frequent_alarms') {
      const rows = (baseRows as MostFrequentAlarmRow[]).filter(r => {
        const mTag = tagFilter.length === 0 || tagFilter.length === tagOpts.length || tagFilter.includes(r.tag);
        const mId = identifierFilter.length === 0 || identifierFilter.length === identifierOpts.length || identifierFilter.includes(r.identifier);
        const mPri = priorityFilter.length === 0 || priorityFilter.length === priorityOpts.length || priorityFilter.includes(r.priority);
        const mAsset = assetFilter.length === 0 || assetFilter.length === assetOpts.length || assetFilter.includes(r.asset);
        return mTag && mId && mPri && mAsset;
      });
      if (sortField === 'default') return rows;
      return [...rows].sort((a, b) => {
        const valA = sortField === 'percentage' ? a.percentage : a.count;
        const valB = sortField === 'percentage' ? b.percentage : b.count;
        return sortDir === 'asc' ? valA - valB : valB - valA;
      });
    }

    if (selectedTable === 'most_frequent_actions') {
      const rows = (baseRows as MostFrequentActionRow[]).filter(r => {
        return tagFilter.length === 0 || tagFilter.length === tagOpts.length || tagFilter.includes(r.tag);
      });
      if (sortField === 'default') return rows;
      return [...rows].sort((a, b) => (sortDir === 'asc' ? a.count - b.count : b.count - a.count));
    }

    if (selectedTable === 'chattering_alarms' || selectedTable === 'fleeting_alarms') {
      const rows = (baseRows as (ChatteringAlarmRow | FleetingAlarmRow)[]).filter(r => {
        const mTag = tagFilter.length === 0 || tagFilter.length === tagOpts.length || tagFilter.includes(r.tag);
        const mId = identifierFilter.length === 0 || identifierFilter.length === identifierOpts.length || identifierFilter.includes(r.identifier);
        const mPri = priorityFilter.length === 0 || priorityFilter.length === priorityOpts.length || priorityFilter.includes(r.priority);
        return mTag && mId && mPri;
      });
      if (sortField === 'default') return rows;
      return [...rows].sort((a, b) => (sortDir === 'asc' ? a.occurrence - b.occurrence : b.occurrence - a.occurrence));
    }

    // symptomatic_analysis
    const rows = (baseRows as SymptomaticAnalysisRow[]).filter(r => {
      const mTag = tagFilter.length === 0 || tagFilter.length === tagOpts.length || tagFilter.includes(r.parentTag);
      const mId = identifierFilter.length === 0 || identifierFilter.length === identifierOpts.length || identifierFilter.includes(r.parentIdentifier);
      const mAsset = assetFilter.length === 0 || assetFilter.length === assetOpts.length || assetFilter.includes(r.childAsset);
      return mTag && mId && mAsset;
    });
    if (sortField === 'default') return rows;
    return [...rows].sort((a, b) => {
      let valA = a.occurrence;
      let valB = b.occurrence;
      if (sortField === 'predictability') { valA = a.predictability; valB = b.predictability; }
      else if (sortField === 'significance') { valA = a.significance; valB = b.significance; }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [
    selectedTable,
    baseRows,
    tagFilter,
    tagOpts.length,
    identifierFilter,
    identifierOpts.length,
    priorityFilter,
    priorityOpts.length,
    assetFilter,
    assetOpts.length,
    sortField,
    sortDir,
  ]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    if (page > totalPages) {
      setPage(1);
    }
  }, [filteredRows.length, pageSize, page]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  const activeTableMeta = TABLE_OPTIONS.find(t => t.key === selectedTable)!;

  const handleExportExcel = async () => {
    if (selectedTable === 'most_frequent_alarms') {
      const rows = (filteredRows as MostFrequentAlarmRow[]).map(r => [
        r.fpso,
        r.tag,
        r.identifier,
        r.count,
        `${r.percentage.toFixed(2)}%`,
        r.priority,
        r.description,
        r.asset,
      ]);
      await exportBrandedExcel({
        sheetName: 'Most Frequent Alarms',
        title: 'Alarm Management — Most Frequent Alarms',
        originTab: 'Alarm Management',
        headers: ['FPSO', 'Tag', 'Identifier', 'Count', 'Percentage', 'Priority', 'Description', 'Asset'],
        rows,
        filename: 'Alarm_Management_Most_Frequent_Alarms',
      });
    } else if (selectedTable === 'most_frequent_actions') {
      const rows = (filteredRows as MostFrequentActionRow[]).map(r => [
        r.fpso,
        r.tag,
        r.parameter || '—',
        r.count,
      ]);
      await exportBrandedExcel({
        sheetName: 'Most Frequent Actions',
        title: 'Alarm Management — Most Frequent Actions',
        originTab: 'Alarm Management',
        headers: ['FPSO', 'Tag', 'Parameter', 'Count'],
        rows,
        filename: 'Alarm_Management_Most_Frequent_Actions',
      });
    } else if (selectedTable === 'chattering_alarms' || selectedTable === 'fleeting_alarms') {
      const rows = (filteredRows as (ChatteringAlarmRow | FleetingAlarmRow)[]).map(r => [
        r.fpso,
        r.tag,
        r.identifier,
        r.priority,
        r.occurrence,
      ]);
      await exportBrandedExcel({
        sheetName: activeTableMeta.label,
        title: `Alarm Management — ${activeTableMeta.label}`,
        originTab: 'Alarm Management',
        headers: ['FPSO', 'Tag', 'Identifier', 'Priority', 'Occurrence'],
        rows,
        filename: `Alarm_Management_${activeTableMeta.label.replace(/\s+/g, '_')}`,
      });
    } else {
      const rows = (filteredRows as SymptomaticAnalysisRow[]).map(r => [
        r.fpso,
        r.parentTag,
        r.parentIdentifier,
        r.childTag,
        r.childIdentifier,
        r.childDescription,
        r.childAsset,
        r.occurrence,
        `${r.predictability.toFixed(2)}%`,
        `${r.significance.toFixed(2)}%`,
      ]);
      await exportBrandedExcel({
        sheetName: 'Symptomatic Analysis',
        title: 'Alarm Management — Symptomatic Analysis',
        originTab: 'Alarm Management',
        headers: [
          'FPSO',
          'Parent Tag',
          'Parent Identifier',
          'Child Tag',
          'Child Identifier',
          'Child Description',
          'Child Asset',
          'Occurrence',
          'Predictability',
          'Significance',
        ],
        rows,
        filename: 'Alarm_Management_Symptomatic_Analysis',
      });
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField === field) {
      return sortDir === 'asc' ? (
        <ArrowUp className="w-3 h-3 text-brand-primary" />
      ) : (
        <ArrowDown className="w-3 h-3 text-brand-primary" />
      );
    }
    return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />;
  };

  return (
    <div className="bg-bg-card border border-border-panel rounded-card">
      {/* Top Toolbar: Title & Table Selector + Global FPSO, Duration, Export */}
      <div className="px-4 py-3.5 border-b border-border-panel flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-text-primary">
              {activeTableMeta.label}
            </h2>
            <InfoTooltip
              side="bottom"
              title={activeTableMeta.label}
              formula={activeTableMeta.formula}
              description={activeTableMeta.description}
              statusList={[`Source Window: ${reportWindow.from} to ${reportWindow.to}`]}
            />
          </div>

          <span className="text-[11px] font-mono text-[#94A3B8] bg-[#0B0F19] px-2.5 py-1 rounded-md border border-[#1E293B]">
            Total: <strong className="text-white">{filteredRows.length}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Table Selector Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="bg-[#0B0F19] border border-[#1E293B] hover:border-[#3B82F6] rounded-md px-3.5 py-1.5 text-xs text-white flex items-center gap-2.5 cursor-pointer transition-colors"
              >
                <span className="font-medium">{activeTableMeta.label}</span>
                <ChevronDown size={13} className="text-[#94A3B8]" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-[100] w-[240px] bg-[#161923] border border-[#2B3142] rounded-lg shadow-2xl py-1 select-none"
              >
                {TABLE_OPTIONS.map(opt => {
                  const isActive = opt.key === selectedTable;
                  return (
                    <DropdownMenu.Item
                      key={opt.key}
                      onSelect={() => handleSelectTable(opt.key)}
                      className={`px-4 py-2.5 text-xs outline-none cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#4A526D] text-white font-semibold'
                          : 'text-[#CBD5E1] hover:bg-[#232838] hover:text-white font-medium'
                      }`}
                    >
                      {opt.label}
                    </DropdownMenu.Item>
                  );
                })}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Global FPSO Filter */}
          <FpsosFilterDropdown
            fpsos={fpsos}
            isMultiSelect={true}
            selectedFpsos={selectedFpsos}
            onMultiChange={setSelectedFpsos}
            baseLabel="All FPSOs"
          />

          {/* Global Duration Filter (same as Analytics) */}
          <PeriodFilterDropdown
            value={period}
            customFrom={customFrom}
            customTo={customTo}
            onSelectPreset={p => setPeriod(p)}
            onApplyCustomDates={(from, to) => {
              setCustomFrom(from);
              setCustomTo(to);
              setPeriod('Custom dates');
            }}
          />

          {/* Export to Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0B0F19] border border-[#1E293B] text-white text-xs hover:border-[#3B82F6] disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {selectedTable === 'most_frequent_alarms' && (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  FPSO
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Tag
                  <ColumnFilterDropdown
                    title="Tag"
                    options={tagOpts}
                    selectedValues={tagFilter.length === 0 ? tagOpts : tagFilter}
                    onChange={setTagFilter}
                  />
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Identifier
                  <ColumnFilterDropdown
                    title="Identifier"
                    options={identifierOpts}
                    selectedValues={identifierFilter.length === 0 ? identifierOpts : identifierFilter}
                    onChange={setIdentifierFilter}
                  />
                </th>
                <th
                  onClick={() => toggleSort('count')}
                  className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group"
                >
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <span>Count</span>
                    {renderSortIcon('count')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('percentage')}
                  className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group"
                >
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <span>Percentage</span>
                    {renderSortIcon('percentage')}
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Priority
                  <ColumnFilterDropdown
                    title="Priority"
                    options={priorityOpts}
                    selectedValues={priorityFilter.length === 0 ? priorityOpts : priorityFilter}
                    onChange={setPriorityFilter}
                  />
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Description
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Asset
                  <ColumnFilterDropdown
                    title="Asset"
                    options={assetOpts}
                    selectedValues={assetFilter.length === 0 ? assetOpts : assetFilter}
                    onChange={setAssetFilter}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-text-muted italic bg-bg-panel/5">
                    No alarm records found for the selected period and filters.
                  </td>
                </tr>
              ) : (
                (paginatedRows as MostFrequentAlarmRow[]).map(row => (
                  <tr key={row.id} className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors">
                    <td className="px-4 py-3 text-[#CBD5E1] font-mono">{row.fpso}</td>
                    <td className="px-4 py-3 text-white font-mono font-medium">{row.tag}</td>
                    <td className="px-4 py-3 text-[#CBD5E1]">{row.identifier}</td>
                    <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{row.count}</td>
                    <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{row.percentage.toFixed(2)}%</td>
                    <td className="px-4 py-3"><PriorityBadge priority={row.priority} /></td>
                    <td className="px-4 py-3 text-[#CBD5E1] max-w-[300px] truncate" title={row.description}>{row.description}</td>
                    <td className="px-4 py-3 text-[#CBD5E1] font-mono">{row.asset}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {selectedTable === 'most_frequent_actions' && (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  FPSO
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Tag
                  <ColumnFilterDropdown
                    title="Tag"
                    options={tagOpts}
                    selectedValues={tagFilter.length === 0 ? tagOpts : tagFilter}
                    onChange={setTagFilter}
                  />
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Parameter
                </th>
                <th
                  onClick={() => toggleSort('count')}
                  className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group"
                >
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <span>Count</span>
                    {renderSortIcon('count')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-text-muted italic bg-bg-panel/5">
                    No action records found for the selected period and filters.
                  </td>
                </tr>
              ) : (
                (paginatedRows as MostFrequentActionRow[]).map(row => (
                  <tr key={row.id} className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors">
                    <td className="px-4 py-3 text-[#CBD5E1] font-mono">{row.fpso}</td>
                    <td className="px-4 py-3 text-white font-mono font-medium">{row.tag}</td>
                    <td className="px-4 py-3 text-[#CBD5E1] font-mono">{row.parameter || '—'}</td>
                    <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {(selectedTable === 'chattering_alarms' || selectedTable === 'fleeting_alarms') && (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  FPSO
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Tag
                  <ColumnFilterDropdown
                    title="Tag"
                    options={tagOpts}
                    selectedValues={tagFilter.length === 0 ? tagOpts : tagFilter}
                    onChange={setTagFilter}
                  />
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Identifier
                  <ColumnFilterDropdown
                    title="Identifier"
                    options={identifierOpts}
                    selectedValues={identifierFilter.length === 0 ? identifierOpts : identifierFilter}
                    onChange={setIdentifierFilter}
                  />
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Priority
                  <ColumnFilterDropdown
                    title="Priority"
                    options={priorityOpts}
                    selectedValues={priorityFilter.length === 0 ? priorityOpts : priorityFilter}
                    onChange={setPriorityFilter}
                  />
                </th>
                <th
                  onClick={() => toggleSort('occurrence')}
                  className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group"
                >
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <span>Occurrence</span>
                    {renderSortIcon('occurrence')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted italic bg-bg-panel/5">
                    No alarm records found for the selected period and filters.
                  </td>
                </tr>
              ) : (
                (paginatedRows as (ChatteringAlarmRow | FleetingAlarmRow)[]).map(row => (
                  <tr key={row.id} className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors">
                    <td className="px-4 py-3 text-[#CBD5E1] font-mono">{row.fpso}</td>
                    <td className="px-4 py-3 text-white font-mono font-medium">{row.tag}</td>
                    <td className="px-4 py-3 text-[#CBD5E1]">{row.identifier}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={row.priority} /></td>
                    <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{row.occurrence}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {selectedTable === 'symptomatic_analysis' && (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  FPSO
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Parent Tag
                  <ColumnFilterDropdown
                    title="Parent Tag"
                    options={tagOpts}
                    selectedValues={tagFilter.length === 0 ? tagOpts : tagFilter}
                    onChange={setTagFilter}
                  />
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Parent Identifier
                  <ColumnFilterDropdown
                    title="Parent Identifier"
                    options={identifierOpts}
                    selectedValues={identifierFilter.length === 0 ? identifierOpts : identifierFilter}
                    onChange={setIdentifierFilter}
                  />
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Child Tag
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Child Identifier
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Child Description
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                  Child Asset
                  <ColumnFilterDropdown
                    title="Child Asset"
                    options={assetOpts}
                    selectedValues={assetFilter.length === 0 ? assetOpts : assetFilter}
                    onChange={setAssetFilter}
                  />
                </th>
                <th
                  onClick={() => toggleSort('occurrence')}
                  className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group"
                >
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <span>Occurrence</span>
                    {renderSortIcon('occurrence')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('predictability')}
                  className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group"
                >
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <span>Predictability</span>
                    {renderSortIcon('predictability')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('significance')}
                  className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group"
                >
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <span>Significance</span>
                    {renderSortIcon('significance')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-text-muted italic bg-bg-panel/5">
                    No symptomatic pairs found for the selected period and filters.
                  </td>
                </tr>
              ) : (
                (paginatedRows as SymptomaticAnalysisRow[]).map(row => (
                  <tr key={row.id} className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors">
                    <td className="px-4 py-3 text-[#CBD5E1] font-mono">{row.fpso}</td>
                    <td className="px-4 py-3 text-white font-mono font-medium">{row.parentTag}</td>
                    <td className="px-4 py-3 text-[#CBD5E1]">{row.parentIdentifier}</td>
                    <td className="px-4 py-3 text-white font-mono font-medium">{row.childTag}</td>
                    <td className="px-4 py-3 text-[#CBD5E1]">{row.childIdentifier}</td>
                    <td className="px-4 py-3 text-[#CBD5E1] max-w-[240px] truncate" title={row.childDescription}>{row.childDescription}</td>
                    <td className="px-4 py-3 text-[#CBD5E1] font-mono">{row.childAsset}</td>
                    <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{row.occurrence}</td>
                    <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{row.predictability.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{row.significance.toFixed(2)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {filteredRows.length > 0 && (
        <Pagination
          total={filteredRows.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

