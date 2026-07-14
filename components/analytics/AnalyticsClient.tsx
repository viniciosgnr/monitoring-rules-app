'use client';
import { useState } from 'react';
import KpiCard from '@/components/ui/KpiCard';
import AccuracyChart from './AccuracyChart';
import FalsePositiveChart from './FalsePositiveChart';
import RuleAlertsChart from './RuleAlertsChart';
import StatusAlertsChart from './StatusAlertsChart';
import { SlidersHorizontal, Maximize2 } from 'lucide-react';

const PERIODS = ['Last Week', 'Last Month', 'Last 6 month'];
const CATEGORIES = ['All Categories', 'Drift', 'Spike', 'Surge', 'Trend', 'Normalized dP'];

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

function getRuleCategory(ruleName: string): 'surge' | 'spike' | 'generic' {
  const name = ruleName.toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('TME_NRS')) return 'surge';
  return 'generic';
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

function TableFilterInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1 mt-1.5 font-normal">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="filter-input text-text-primary"
        placeholder="Filter..."
      />
      <SlidersHorizontal size={11} className="text-text-muted flex-shrink-0" />
    </div>
  );
}

export default function AnalyticsClient({ equipments, ruleInstances, alertsList }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bad_actors'>('overview');
  const [period, setPeriod] = useState('Last Week');
  const [selectedEquipment, setSelectedEquipment] = useState('All Equipment');
  const [rule, setRule] = useState('All Categories');
  const [top10Tab, setTop10Tab] = useState<'lowest_accuracy' | 'highest_fp' | 'highest_alerts'>('lowest_accuracy');

  // Local column filters for Overview breakdown tables
  const [accuracyRuleFilter, setAccuracyRuleFilter] = useState('');
  const [accuracyEquipFilter, setAccuracyEquipFilter] = useState('');
  const [fpRuleFilter, setFpRuleFilter] = useState('');
  const [fpEquipFilter, setFpEquipFilter] = useState('');

  const dbAlertsCount = alertsList?.length || 0;

  // Process rules instances deterministically to calculate stats based on period
  const processedInstances = ruleInstances.map(inst => {
    const id = inst.id;
    let alertsCount = 12 + ((id * 37) % 89);
    let falsePositives = Math.min(alertsCount - 5, 2 + ((id * 17) % 25));

    // Scale stats by period
    if (period === 'Last Week') {
      alertsCount = Math.max(1, Math.round(alertsCount / 10));
      falsePositives = Math.min(alertsCount, Math.max(0, Math.round(falsePositives / 10)));
    } else if (period === 'Last Month') {
      alertsCount = Math.max(2, Math.round(alertsCount / 3));
      falsePositives = Math.min(alertsCount, Math.max(0, Math.round(falsePositives / 3)));
    }

    // Introduce slight accuracy variation based on period
    let accuracy = parseFloat((80 + ((id * 23) % 19.5)).toFixed(1));
    if (period === 'Last Week') {
      accuracy = parseFloat(Math.min(100, Math.max(50, accuracy + ((id % 5) - 2))).toFixed(1));
    } else if (period === 'Last Month') {
      accuracy = parseFloat(Math.min(100, Math.max(50, accuracy + ((id % 7) - 3))).toFixed(1));
    }

    return {
      ...inst,
      alertsCount,
      falsePositives,
      accuracy,
    };
  });

  const filteredInstances = processedInstances.filter(inst => {

    // 2. Filter by Equipment
    if (selectedEquipment !== 'All Equipment' && inst.equipmentCode !== selectedEquipment) return false;

    // 3. Filter by Rule Category
    if (rule !== 'All Categories') {
      const cat = getRuleCategory(inst.ruleName);
      let friendlyCat = '';
      if (cat === 'spike') {
        friendlyCat = 'Spike';
      } else if (cat === 'surge') {
        friendlyCat = 'Surge';
      } else {
        const name = inst.ruleName.toUpperCase();
        if (name.includes('TRND') || name.includes('TREND') || name.includes('DEV') || name.includes('TEMP_DEV')) {
          friendlyCat = 'Trend';
        } else if (name.includes('FOUL') || name.includes('DP') || name.includes('HTEX')) {
          friendlyCat = 'Normalized dP';
        } else if (name.includes('DRFT') || name.includes('DRIFT')) {
          friendlyCat = 'Drift';
        }
      }
      if (friendlyCat !== rule) return false;
    }

    return true;
  });

  const filteredAccuracyRows = filteredInstances.filter(inst => {
    const matchesRule = inst.ruleName.toLowerCase().includes(accuracyRuleFilter.toLowerCase());
    const matchesEquip = inst.equipmentCode.toLowerCase().includes(accuracyEquipFilter.toLowerCase());
    return matchesRule && matchesEquip;
  });

  const filteredFpRows = filteredInstances.filter(inst => {
    const matchesRule = inst.ruleName.toLowerCase().includes(fpRuleFilter.toLowerCase());
    const matchesEquip = inst.equipmentCode.toLowerCase().includes(fpEquipFilter.toLowerCase());
    return matchesRule && matchesEquip;
  });

  // Calculate Top 10 lists
  const lowestAccuracyList = [...filteredInstances]
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 10);

  const highestFpList = [...filteredInstances]
    .sort((a, b) => b.falsePositives - a.falsePositives)
    .slice(0, 10);

  const highestAlertsList = [...filteredInstances]
    .sort((a, b) => b.alertsCount - a.alertsCount)
    .slice(0, 10);

  return (
    <>
      {/* Global Filters Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-border-panel/30 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Analysis Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <Sel value={period} onChange={setPeriod} options={PERIODS} />
          <Sel value={selectedEquipment} onChange={setSelectedEquipment} options={['All Equipment', ...equipments]} />
          <Sel value={rule} onChange={setRule} options={CATEGORIES} />
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex border-b border-border-panel mb-6 text-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-accent-blue text-accent-blue bg-bg-panel/10'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Overview & Trends
        </button>
        <button
          onClick={() => setActiveTab('bad_actors')}
          className={`px-6 py-3 font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'bad_actors'
              ? 'border-accent-blue text-accent-blue bg-bg-panel/10'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Bad Actors & Rule Audit
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <KpiCard
              title="False Positive"
              value={28}
              subtitle="Last month"
              tooltip={`Alerts triggered by the rule that did not correspond to a real anomaly. Total db alerts: ${dbAlertsCount}.`}
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
            <div className="bg-bg-card border border-border-panel rounded-card p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-text-primary">Accuracy Over Time</h3>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                    <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                  </div>
                </div>
                <AccuracyChart period={period} fpso="All FPSOs" equipment={selectedEquipment} rule={rule} />
              </div>
            </div>

            {/* False Positive Over Time */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-text-primary">False Positive Over Time</h3>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                    <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                  </div>
                </div>
                <FalsePositiveChart period={period} fpso="All FPSOs" equipment={selectedEquipment} rule={rule} />
              </div>
            </div>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Accuracy Breakdown Table Card */}
            <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border-panel">
                <h3 className="text-sm font-semibold text-text-primary">Accuracy Breakdown by Instance</h3>
              </div>
              <div className="overflow-x-auto max-h-60 overflow-y-auto pr-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                        Rule / Instance
                        <TableFilterInput value={accuracyRuleFilter} onChange={setAccuracyRuleFilter} />
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                        Equipment
                        <TableFilterInput value={accuracyEquipFilter} onChange={setAccuracyEquipFilter} />
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">Evaluations</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">Correct</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccuracyRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-text-muted italic bg-bg-panel/5">No instances found</td>
                      </tr>
                    ) : (
                      filteredAccuracyRows.map(inst => {
                        const totalEvaluations = 100 + ((inst.id * 41) % 150);
                        const correctActions = Math.round(totalEvaluations * (inst.accuracy / 100));
                        return (
                          <tr key={inst.id} className="border-b border-border-panel/40 hover:bg-bg-panel/10 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-300">{inst.ruleName}</td>
                            <td className="px-4 py-3 text-slate-400">{inst.equipmentCode}</td>
                            <td className="px-4 py-3 text-right text-slate-400">{totalEvaluations}</td>
                            <td className="px-4 py-3 text-right text-status-ok font-medium">{correctActions}</td>
                            <td className="px-4 py-3 text-right font-semibold text-accent-blue">{inst.accuracy}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* False Positive Breakdown Table Card */}
            <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border-panel">
                <h3 className="text-sm font-semibold text-text-primary">False Positive Breakdown by Instance</h3>
              </div>
              <div className="overflow-x-auto max-h-60 overflow-y-auto pr-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                        Rule / Instance
                        <TableFilterInput value={fpRuleFilter} onChange={setFpRuleFilter} />
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                        Equipment
                        <TableFilterInput value={fpEquipFilter} onChange={setFpEquipFilter} />
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">Alerts</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">False Positives</th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">FP Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFpRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-text-muted italic bg-bg-panel/5">No instances found</td>
                      </tr>
                    ) : (
                      filteredFpRows.map(inst => {
                        const fpRate = parseFloat(((inst.falsePositives / inst.alertsCount) * 100).toFixed(1));
                        return (
                          <tr key={inst.id} className="border-b border-border-panel/40 hover:bg-bg-panel/10 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-300">{inst.ruleName}</td>
                            <td className="px-4 py-3 text-slate-400">{inst.equipmentCode}</td>
                            <td className="px-4 py-3 text-right text-slate-400">{inst.alertsCount}</td>
                            <td className="px-4 py-3 text-right text-status-warn font-medium">{inst.falsePositives}</td>
                            <td className="px-4 py-3 text-right font-semibold text-status-warn">{fpRate}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'bad_actors' && (
        <div className="space-y-6">
          {/* Column Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alerts Treated by Monitoring Rule */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Alerts Treated by Monitoring Rule</h3>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                  <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                </div>
              </div>
              <RuleAlertsChart period={period} fpso="All FPSOs" equipment={selectedEquipment} rule={rule} />
            </div>

            {/* Alerts Treated by Status */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Alerts Treated by Status</h3>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                  <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                </div>
              </div>
              <StatusAlertsChart period={period} fpso="All FPSOs" equipment={selectedEquipment} rule={rule} />
            </div>
          </div>

          {/* Top 10 Rule Instances Card */}
          <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden mt-2">
            <div className="px-4 py-3 border-b border-border-panel flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-panel/20">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Top 10 Monitoring Rule Instances</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Rankings based on active filters and time period</p>
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
                  {lowestAccuracyList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-text-muted italic">
                        No rules found matching the active filters.
                      </td>
                    </tr>
                  )}

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
        </div>
      )}
    </>
  );
}

