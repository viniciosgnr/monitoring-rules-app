'use client';
import { useState } from 'react';
import KpiCard from '@/components/ui/KpiCard';
import AccuracyChart from './AccuracyChart';
import FalsePositiveChart from './FalsePositiveChart';
import RuleAlertsChart from './RuleAlertsChart';
import StatusAlertsChart from './StatusAlertsChart';
import { SlidersHorizontal, Maximize2 } from 'lucide-react';

const PERIODS = ['Last Week', 'Last Month', 'Last 6 month'];

interface RuleInstanceRow {
  id: number;
  ruleName: string;
  equipmentCode: string;
  fpsoCode: string;
}

interface AlertRow {
  id: number;
  ruleName: string;
  status: string;
  fpsoCode: string;
  equipmentCode: string;
}

interface Props {
  fpsos: string[];
  rules: string[];
  equipments: string[];
  ruleInstances: RuleInstanceRow[];
  alertsList: AlertRow[];
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

export default function AnalyticsClient({ fpsos, rules, equipments, ruleInstances, alertsList }: Props) {
  const [period, setPeriod] = useState('Last Week');
  const [fpso, setFpso] = useState('All FPSOs');
  const [selectedEquipment, setSelectedEquipment] = useState('All Equipment');
  const [rule, setRule] = useState('All Rules');
  const [top10Tab, setTop10Tab] = useState<'lowest_accuracy' | 'highest_fp' | 'highest_alerts'>('lowest_accuracy');

  // Process rules instances deterministically to calculate stats
  const processedInstances = ruleInstances.map(inst => {
    const id = inst.id;
    const alertsCount = 12 + ((id * 37) % 89);
    const falsePositives = Math.min(alertsCount - 5, 2 + ((id * 17) % 25));
    const accuracy = parseFloat((80 + ((id * 23) % 19.5)).toFixed(1));

    return {
      ...inst,
      alertsCount,
      falsePositives,
      accuracy,
    };
  });

  // Calculate Top 10 lists
  const lowestAccuracyList = [...processedInstances]
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 10);

  const highestFpList = [...processedInstances]
    .sort((a, b) => b.falsePositives - a.falsePositives)
    .slice(0, 10);

  const highestAlertsList = [...processedInstances]
    .sort((a, b) => b.alertsCount - a.alertsCount)
    .slice(0, 10);

  return (
    <>
      {/* Global Filters */}
      <div className="flex gap-3 justify-end mb-5">
        <Sel value={period} onChange={setPeriod} options={PERIODS} />
        <Sel value={fpso} onChange={setFpso} options={['All FPSOs', ...fpsos]} />
        <Sel value={selectedEquipment} onChange={setSelectedEquipment} options={['All Equipment', ...equipments]} />
        <Sel value={rule} onChange={setRule} options={['All Rules', ...rules]} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <KpiCard
          title="False Positive"
          value={28}
          subtitle="Last month"
          tooltip="Alerts triggered by the rule that did not correspond to a real anomaly. A high count indicates the rule may be too sensitive."
        />
        <KpiCard
          title="Coverage"
          value={22}
          subtitle="Last month"
          tooltip="Number of equipment instances covered by at least one active monitoring rule in the selected period."
        />
        <KpiCard
          title="Accuracy"
          value="21.4%"
          subtitle="Last month"
          tooltip="Ratio of correctly classified alerts (true positives + true negatives) over total alerts. Calculated as: (TP + TN) / Total."
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accuracy Over Time */}
        <div className="bg-bg-card border border-border-panel rounded-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Accuracy Over Time</h3>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
            </div>
          </div>
          <AccuracyChart period={period} fpso={fpso} equipment={selectedEquipment} rule={rule} />
        </div>

        {/* False Positive Over Time */}
        <div className="bg-bg-card border border-border-panel rounded-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-text-primary">False Positive Over Time</h3>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
            </div>
          </div>
          <FalsePositiveChart period={period} fpso={fpso} equipment={selectedEquipment} rule={rule} />
        </div>

        {/* Alerts Treated by Monitoring Rule */}
        <div className="bg-bg-card border border-border-panel rounded-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Alerts Treated by Monitoring Rule</h3>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
            </div>
          </div>
          <RuleAlertsChart period={period} fpso={fpso} equipment={selectedEquipment} rule={rule} />
        </div>

        {/* Alerts Treated [%] */}
        <div className="bg-bg-card border border-border-panel rounded-card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Alerts Treated [%]</h3>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
            </div>
          </div>
          <StatusAlertsChart period={period} fpso={fpso} equipment={selectedEquipment} rule={rule} />
        </div>
      </div>

      {/* Top 10 Rule Instances Card */}
      <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden mt-6">
        <div className="px-4 py-3 border-b border-border-panel flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-panel/20">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Top 10 Monitoring Rule Instances</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Global rankings of rule configurations across all FPSOs (unaffected by filters)</p>
          </div>
          {/* Tab buttons */}
          <div className="flex bg-bg-panel/60 p-0.5 rounded border border-border-panel/50 text-xs">
            <button
              onClick={() => setTop10Tab('lowest_accuracy')}
              className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer ${
                top10Tab === 'lowest_accuracy'
                  ? 'bg-accent-blue text-[#090d16] font-bold shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Lowest Accuracy
            </button>
            <button
              onClick={() => setTop10Tab('highest_fp')}
              className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer ${
                top10Tab === 'highest_fp'
                  ? 'bg-accent-blue text-[#090d16] font-bold shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Highest False Positives
            </button>
            <button
              onClick={() => setTop10Tab('highest_alerts')}
              className={`px-3 py-1.5 rounded font-semibold transition-all cursor-pointer ${
                top10Tab === 'highest_alerts'
                  ? 'bg-accent-blue text-[#090d16] font-bold shadow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Highest Alerts
            </button>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-panel text-text-muted text-[10px] font-bold uppercase tracking-wider bg-bg-panel/40 select-none">
                <th className="px-4 py-3 w-16">Rank</th>
                <th className="px-4 py-3">Monitoring Rule</th>
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">FPSO</th>
                <th className="px-4 py-3 text-right">
                  {top10Tab === 'lowest_accuracy' && 'Accuracy'}
                  {top10Tab === 'highest_fp' && 'False Positives'}
                  {top10Tab === 'highest_alerts' && 'Total Alerts'}
                </th>
              </tr>
            </thead>
            <tbody>
              {top10Tab === 'lowest_accuracy' &&
                lowestAccuracyList.map((item, index) => (
                  <tr key={item.id} className="border-b border-border-panel hover:bg-bg-panel/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-muted">#{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{item.ruleName}</td>
                    <td className="px-4 py-3 text-text-muted">{item.equipmentCode}</td>
                    <td className="px-4 py-3 text-text-muted">{item.fpsoCode}</td>
                    <td className="px-4 py-3 text-right font-bold text-accent-blue">{item.accuracy}%</td>
                  </tr>
                ))}

              {top10Tab === 'highest_fp' &&
                highestFpList.map((item, index) => (
                  <tr key={item.id} className="border-b border-border-panel hover:bg-bg-panel/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-muted">#{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{item.ruleName}</td>
                    <td className="px-4 py-3 text-text-muted">{item.equipmentCode}</td>
                    <td className="px-4 py-3 text-text-muted">{item.fpsoCode}</td>
                    <td className="px-4 py-3 text-right font-bold text-status-warn">{item.falsePositives}</td>
                  </tr>
                ))}

              {top10Tab === 'highest_alerts' &&
                highestAlertsList.map((item, index) => (
                  <tr key={item.id} className="border-b border-border-panel hover:bg-bg-panel/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-muted">#{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{item.ruleName}</td>
                    <td className="px-4 py-3 text-text-muted">{item.equipmentCode}</td>
                    <td className="px-4 py-3 text-text-muted">{item.fpsoCode}</td>
                    <td className="px-4 py-3 text-right font-bold text-status-ok">{item.alertsCount}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
