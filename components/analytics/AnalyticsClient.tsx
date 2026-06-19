'use client';
import { useState } from 'react';
import KpiCard from '@/components/ui/KpiCard';
import SuccessRateChart from './SuccessRateChart';
import ParetoChart from './ParetoChart';
import { SlidersHorizontal, Maximize2 } from 'lucide-react';

const PERIODS = ['Last Week', 'Last Month', 'Last 6 month'];

interface Props {
  fpsos: string[];
  rules: string[];
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-bg-panel border border-border-panel rounded px-3 py-1.5 text-xs text-text-primary outline-none cursor-pointer hover:border-accent-blue transition-colors"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

export default function AnalyticsClient({ fpsos, rules }: Props) {
  const [period, setPeriod] = useState('Last Week');
  const [fpso,   setFpso]   = useState('All FPSOs');
  const [rule,   setRule]   = useState('All Rules');

  return (
    <>
      {/* Global Filters */}
      <div className="flex gap-3 justify-end mb-5">
        <Sel value={period} onChange={setPeriod} options={PERIODS} />
        <Sel value={fpso}   onChange={setFpso}   options={['All FPSOs', ...fpsos]} />
        <Sel value="All Equipment" onChange={() => {}} options={['All Equipment']} />
        <Sel value={rule}   onChange={setRule}   options={['All Rules', ...rules]} />
      </div>

      {/* KPI Cards */}
      <div className="flex gap-4 mb-5 flex-wrap">
        <KpiCard
          title="False Positive"
          value={28}
          subtitle="Last month"
          tooltip="Alerts triggered by the rule that did not correspond to a real anomaly. A high count indicates the rule may be too sensitive. ⚠ Logic pending validation."
        />
        <KpiCard
          title="False Negative"
          value={6}
          subtitle="Last month"
          tooltip="Real anomalies that occurred but were NOT detected by the rule. A high count indicates the rule may be too permissive. ⚠ Logic pending validation."
        />
        <KpiCard
          title="Coverage"
          value={22}
          subtitle="Last month"
          tooltip="Number of equipment instances covered by at least one active monitoring rule in the selected period. ⚠ Logic pending validation."
        />
        <KpiCard
          title="Accuracy"
          value="21.4%"
          subtitle="Last month"
          tooltip="Ratio of correctly classified alerts (true positives + true negatives) over total alerts. Calculated as: (TP + TN) / Total. ⚠ Logic pending validation."
        />
        <KpiCard
          title="Confidence Level"
          value="—"
          subtitle="Pending definition"
          tooltip="Statistical confidence that the rule's threshold is correctly calibrated for the current operational context. Definition and calculation logic to be confirmed with domain experts."
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Success Rate */}
        <div className="bg-bg-card border border-border-panel rounded-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Success Rate Over Time</h3>
            <div className="flex items-center gap-2">
              <Sel value={period} onChange={setPeriod} options={PERIODS} />
              <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
            </div>
          </div>
          <SuccessRateChart period={period} />
        </div>

        {/* Pareto */}
        <div className="bg-bg-card border border-border-panel rounded-card p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-text-primary">Error Causes (Pareto)</h3>
            <div className="flex items-center gap-2">
              <Sel value={period} onChange={setPeriod} options={PERIODS} />
              <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mb-2">
            {[
              ['#a855f7', 'No datapoints retrieving'],
              ['#ec4899', 'Time totalization'],
              ['#8b5cf6', 'NDFrame.fillna()'],
              ['#0ea5e9', 'The data'],
              ['#1d4ed8', 'List index Out Of'],
            ].map(([color, label]) => (
              <span key={label} className="flex items-center gap-1 text-xs text-text-muted">
                <span className="w-2 h-2 rounded-sm inline-block flex-shrink-0" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
          <ParetoChart />
        </div>
      </div>
    </>
  );
}
