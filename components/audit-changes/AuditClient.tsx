'use client';
import { useState } from 'react';
import KpiCard from '@/components/ui/KpiCard';
import HBarChart from './HBarChart';
import DonutChart from './DonutChart';
import AuditHistoryTable from './AuditHistoryTable';
import { SlidersHorizontal, Maximize2 } from 'lucide-react';

interface AuditEntry {
  id: number;
  timestamp: string;
  userEmail: string;
  equipmentCode: string;
  ruleName: string;
  description: string;
  beforeState: object;
  afterState: object;
  [key: string]: unknown;
}

interface Props {
  totalChanges: number;
  peakDay: number;
  topEditorShare: string;
  hotRule: string;
  equipmentData: { label: string; value: number }[];
  rulesData:     { label: string; value: number }[];
  auditRows:     AuditEntry[];
}

const PERIODS = ['Last Week', 'Last Month'];

const CHANGE_TYPES = [
  ['#ec4899', 'Updated threshold_comparison operator'],
  ['#a855f7', 'Modified surge margin threshold'],
  ['#22d3ee', 'Adjusted time_totalization period'],
  ['#0ea5e9', 'Enabled rule after maintenance window'],
  ['#1d4ed8', 'Updated alert sensitivity'],
];

export default function AuditClient({
  totalChanges, peakDay, topEditorShare, hotRule,
  equipmentData, rulesData, auditRows,
}: Props) {
  const [period, setPeriod] = useState('Last Week');

  return (
    <>
      {/* KPI Cards */}
      <div className="flex gap-4 mb-5">
        <KpiCard title="Total Changes"    value={totalChanges}   subtitle="Across 27 active days" />
        <KpiCard title="Peak Day"         value={peakDay}        subtitle="on 23/02" />
        <KpiCard title="Top Editor Share" value={topEditorShare} subtitle="icaro.zelioli • 17 of 42" />
        <KpiCard title="Hot Rule"         value={hotRule}        subtitle="COCE_TIME_NRS_01 • 19%" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Most Modified Equipment */}
        <div className="bg-bg-card border border-border-panel rounded-card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Most Modified Equipment</h3>
          <HBarChart data={equipmentData.length > 0 ? equipmentData : [
            { label: 'UNY-775-COCE-0220', value: 10 },
            { label: 'MMA-100-PUM-0420',  value: 7  },
            { label: 'PIO-310-HX-0145',   value: 5  },
            { label: 'UNY-775-COCE-0221', value: 4  },
            { label: 'PIO-220-TRB-0312',  value: 2  },
          ]} />
        </div>

        {/* Most Modified Rules */}
        <div className="bg-bg-card border border-border-panel rounded-card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Most Modified Rules</h3>
          <HBarChart data={rulesData.length > 0 ? rulesData : [
            { label: 'COCE_TIME_NRS_01',  value: 10 },
            { label: 'TURB_TEMP_DEV_03',  value: 7  },
            { label: 'PUMP_VIB_THRES_02', value: 5  },
            { label: 'SURGE_MARGIN_06',   value: 4  },
            { label: 'HX_FOULING_04',     value: 2  },
          ]} />
        </div>

        {/* Change Types Donut */}
        <div className="bg-bg-card border border-border-panel rounded-card p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-text-primary">Change Types</h3>
            <div className="flex items-center gap-2">
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="bg-bg-panel border border-border-panel rounded px-2 py-1 text-xs text-text-primary outline-none cursor-pointer"
              >
                {PERIODS.map(p => <option key={p}>{p}</option>)}
              </select>
              <SlidersHorizontal size={13} className="text-text-muted cursor-pointer hover:text-text-primary" />
              <Maximize2 size={13} className="text-text-muted cursor-pointer hover:text-text-primary" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {CHANGE_TYPES.map(([color, label]) => (
              <span key={label} className="flex items-center gap-1 text-xs text-text-muted">
                <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
          <DonutChart />
        </div>
      </div>

      {/* Audit History */}
      <AuditHistoryTable rows={auditRows} />
    </>
  );
}
