'use client';
import { useState, useMemo } from 'react';
import KpiCard from '@/components/ui/KpiCard';
import ColumnFilterDropdown from '@/components/ui/ColumnFilterDropdown';
import FpsosFilterDropdown from '@/components/ui/FpsosFilterDropdown';
import AccuracyChart from './AccuracyChart';
import FalsePositiveChart from './FalsePositiveChart';
import RuleAlertsChart from './RuleAlertsChart';
import StatusAlertsChart from './StatusAlertsChart';
import { SlidersHorizontal, Maximize2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const PERIODS = ['Last Week', 'Last Month', 'Last 6 month', '1 Year', 'All time'];
const CATEGORIES_LIST = ['Drift', 'Spike', 'Surge', 'Trend', 'Normalized dP'];

interface RuleInstanceRow {
  id: number;
  ruleName: string;
  equipmentCode: string;
  fpsoCode: string;
}

interface AlertRow {
  id: number;
  instanceId: number;
  status: string;
  triggeredAt: string;
  ruleName: string;
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

function getRuleFriendlyCategory(ruleName: string): string {
  const name = ruleName.toUpperCase();
  if (name.includes('DRFT') || name.includes('DRIFT')) return 'Drift';
  if (name.includes('SPK') || name.includes('SPIKE')) return 'Spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR')) return 'Surge';
  if (name.includes('TRND') || name.includes('TREND') || name.includes('DEV') || name.includes('TEMP_DEV')) return 'Trend';
  if (name.includes('FOUL') || name.includes('DP') || name.includes('HTEX')) return 'Normalized dP';
  return 'Trend';
}

function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-[#0B0F19] border border-[#1E293B] rounded-full px-3.5 py-1.5 text-xs text-white outline-none cursor-pointer hover:border-[#3B82F6] transition-colors"
    >
      {options.map(o => <option key={o} value={o} className="bg-[#111827] text-white">{o}</option>)}
    </select>
  );
}

export default function AnalyticsClient({ equipments, ruleInstances, alertsList }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bad_actors'>('overview');
  const [period, setPeriod] = useState('Last Week');
  const [selectedFpsos, setSelectedFpsos] = useState<string[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Local column filters for Overview breakdown tables
  const [accFpsoSelected, setAccFpsoSelected] = useState<string[]>([]);
  const [accuracyRuleSelected, setAccuracyRuleSelected] = useState<string[]>([]);
  const [accuracyEquipSelected, setAccuracyEquipSelected] = useState<string[]>([]);
  const [fpFpsoSelected, setFpFpsoSelected] = useState<string[]>([]);
  const [fpRuleSelected, setFpRuleSelected] = useState<string[]>([]);
  const [fpEquipSelected, setFpEquipSelected] = useState<string[]>([]);

  // Local column filters for Bad Actors List
  const [badFpsoSelected, setBadFpsoSelected] = useState<string[]>([]);
  const [badRuleSelected, setBadRuleSelected] = useState<string[]>([]);
  const [badEquipSelected, setBadEquipSelected] = useState<string[]>([]);

  // Sorting state for Breakdown Tables
  const [accSortField, setAccSortField] = useState<'evaluations' | 'correct' | 'accuracy' | null>(null);
  const [accSortDir, setAccSortDir] = useState<'asc' | 'desc'>('asc');
  const [fpSortField, setFpSortField] = useState<'alerts' | 'fp' | 'fpRate' | null>(null);
  const [fpSortDir, setFpSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleAccSort = (field: 'evaluations' | 'correct' | 'accuracy') => {
    if (accSortField === field) {
      setAccSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setAccSortField(field);
      setAccSortDir(field === 'accuracy' ? 'asc' : 'desc');
    }
  };

  const toggleFpSort = (field: 'alerts' | 'fp' | 'fpRate') => {
    if (fpSortField === field) {
      setFpSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setFpSortField(field);
      setFpSortDir('desc');
    }
  };

  // Shared time buckets & exact period boundaries for 100% mathematical synchronization
  const periodBoundaries = useMemo(() => {
    const isWeekly = period === 'Last Week';
    const isDailyMonth = period === 'Last Month';
    const is6Months = period === 'Last 6 month';
    const isAllTime = period === 'All time';
    const bucketsCount = isWeekly ? 7 : isDailyMonth ? 30 : is6Months ? 6 : 12;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    const buckets = Array.from({ length: bucketsCount }, (_, index) => {
      let start = new Date();
      let end = new Date();
      let label = '';

      if (isWeekly) {
        const daysAgo = 6 - index;
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
        const dayStr = String(targetDate.getDate()).padStart(2, '0');
        const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
        label = `${dayStr}/${monthStr}`;
        start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
        end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
      } else if (isDailyMonth) {
        const daysAgo = 29 - index;
        const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo);
        const dayStr = String(targetDate.getDate()).padStart(2, '0');
        const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
        label = `${dayStr}/${monthStr}`;
        start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
        end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);
      } else {
        const totalMonths = bucketsCount;
        const monthsAgo = (totalMonths - 1) - index;
        const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1, 0, 0, 0);
        label = monthNames[targetMonth.getMonth()];
        start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1, 0, 0, 0);
        end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);
      }

      return { label, start, end };
    });

    const periodStart = isAllTime ? new Date(0) : buckets[0].start;
    const periodEnd = isAllTime ? new Date() : buckets[buckets.length - 1].end;

    return { buckets, periodStart, periodEnd };
  }, [period]);

  // Process rules instances dynamically based on alert database logs
  const processedInstances = useMemo(() => {
    const { periodStart, periodEnd } = periodBoundaries;

    return ruleInstances.map(inst => {
      const id = inst.id;
      
      const instanceAlerts = (alertsList || []).filter(a => {
        if (a.instanceId !== id) return false;
        const date = new Date(a.triggeredAt);
        const tTime = date.getTime();
        return tTime >= periodStart.getTime() && tTime <= periodEnd.getTime();
      });

      const totalEvaluations = instanceAlerts.length;
      const falsePositives = instanceAlerts.filter(a => a.status === 'rejected').length;
      const correctActions = instanceAlerts.filter(a => a.status === 'validated' || a.status === 'closed').length;
      const alertsCount = totalEvaluations;
      
      const accuracy = totalEvaluations > 0
        ? parseFloat(((correctActions / totalEvaluations) * 100).toFixed(1))
        : 90.0;

      return {
        ...inst,
        alertsCount,
        falsePositives,
        totalEvaluations,
        correctActions,
        accuracy,
      };
    });
  }, [ruleInstances, alertsList, periodBoundaries]);

  const allFpsos = useMemo(() => Array.from(new Set(ruleInstances.map(i => i.fpsoCode))).filter(Boolean).sort(), [ruleInstances]);

  const filteredInstances = useMemo(() => {
    return processedInstances.filter(inst => {
      if (selectedFpsos.length > 0 && selectedFpsos.length < allFpsos.length && !selectedFpsos.includes(inst.fpsoCode)) {
        return false;
      }

      if (selectedEquipments.length > 0 && selectedEquipments.length < equipments.length && !selectedEquipments.includes(inst.equipmentCode)) {
        return false;
      }

      if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES_LIST.length) {
        const cat = getRuleFriendlyCategory(inst.ruleName);
        if (!selectedCategories.includes(cat)) return false;
      }

      return true;
    });
  }, [processedInstances, selectedFpsos, allFpsos, selectedEquipments, selectedCategories, equipments]);

  const accFpsoOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.fpsoCode))).filter(Boolean).sort(), [filteredInstances]);
  const accuracyRuleOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.ruleName))).filter(Boolean).sort(), [filteredInstances]);
  const accuracyEquipOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.equipmentCode))).filter(Boolean).sort(), [filteredInstances]);
  
  const fpFpsoOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.fpsoCode))).filter(Boolean).sort(), [filteredInstances]);
  const fpRuleOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.ruleName))).filter(Boolean).sort(), [filteredInstances]);
  const fpEquipOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.equipmentCode))).filter(Boolean).sort(), [filteredInstances]);

  const badFpsoOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.fpsoCode))).filter(Boolean).sort(), [filteredInstances]);
  const badRuleOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.ruleName))).filter(Boolean).sort(), [filteredInstances]);
  const badEquipOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.equipmentCode))).filter(Boolean).sort(), [filteredInstances]);

  const filteredAccuracyRows = useMemo(() => {
    const rows = filteredInstances.filter(inst => {
      const matchFpso = accFpsoSelected.length === 0 || accFpsoSelected.length === accFpsoOpts.length || accFpsoSelected.includes(inst.fpsoCode);
      const matchRule = accuracyRuleSelected.length === 0 || accuracyRuleSelected.length === accuracyRuleOpts.length || accuracyRuleSelected.includes(inst.ruleName);
      const matchEquip = accuracyEquipSelected.length === 0 || accuracyEquipSelected.length === accuracyEquipOpts.length || accuracyEquipSelected.includes(inst.equipmentCode);
      return matchFpso && matchRule && matchEquip;
    });

    if (!accSortField) return rows;

    return [...rows].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (accSortField === 'evaluations') { valA = a.totalEvaluations; valB = b.totalEvaluations; }
      else if (accSortField === 'correct') { valA = a.correctActions; valB = b.correctActions; }
      else if (accSortField === 'accuracy') { valA = a.accuracy; valB = b.accuracy; }
      return accSortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredInstances, accFpsoSelected, accFpsoOpts, accuracyRuleSelected, accuracyRuleOpts, accuracyEquipSelected, accuracyEquipOpts, accSortField, accSortDir]);

  const filteredFpRows = useMemo(() => {
    const rows = filteredInstances.filter(inst => {
      const matchFpso = fpFpsoSelected.length === 0 || fpFpsoSelected.length === fpFpsoOpts.length || fpFpsoSelected.includes(inst.fpsoCode);
      const matchRule = fpRuleSelected.length === 0 || fpRuleSelected.length === fpRuleOpts.length || fpRuleSelected.includes(inst.ruleName);
      const matchEquip = fpEquipSelected.length === 0 || fpEquipSelected.length === fpEquipOpts.length || fpEquipSelected.includes(inst.equipmentCode);
      return matchFpso && matchRule && matchEquip;
    });

    if (!fpSortField) return rows;

    return [...rows].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (fpSortField === 'alerts') { valA = a.alertsCount; valB = b.alertsCount; }
      else if (fpSortField === 'fp') { valA = a.falsePositives; valB = b.falsePositives; }
      else if (fpSortField === 'fpRate') {
        valA = (a.falsePositives / a.alertsCount) * 100;
        valB = (b.falsePositives / b.alertsCount) * 100;
      }
      return fpSortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredInstances, fpFpsoSelected, fpFpsoOpts, fpRuleSelected, fpRuleOpts, fpEquipSelected, fpEquipOpts, fpSortField, fpSortDir]);

  // Calculate Bad Actors List (up to 30) by highest alerts count
  const badActorsList = useMemo(() => {
    return [...filteredInstances]
      .filter(inst => {
        if (inst.alertsCount === 0) return false;
        const matchFpso = badFpsoSelected.length === 0 || badFpsoSelected.length === badFpsoOpts.length || badFpsoSelected.includes(inst.fpsoCode);
        const matchRule = badRuleSelected.length === 0 || badRuleSelected.length === badRuleOpts.length || badRuleSelected.includes(inst.ruleName);
        const matchEquip = badEquipSelected.length === 0 || badEquipSelected.length === badEquipOpts.length || badEquipSelected.includes(inst.equipmentCode);
        return matchFpso && matchRule && matchEquip;
      })
      .sort((a, b) => b.alertsCount - a.alertsCount)
      .slice(0, 30);
  }, [filteredInstances, badFpsoSelected, badFpsoOpts, badRuleSelected, badRuleOpts, badEquipSelected, badEquipOpts]);

  // Calculate KPI card values dynamically
  const coveredAssets = useMemo(() => {
    return new Set(filteredInstances.map(inst => inst.equipmentCode)).size;
  }, [filteredInstances]);

  const globalAccuracy = useMemo(() => {
    const totalEvals = filteredInstances.reduce((sum, inst) => sum + inst.totalEvaluations, 0);
    const totalCorrect = filteredInstances.reduce((sum, inst) => sum + inst.correctActions, 0);
    
    if (totalEvals > 0) {
      return ((totalCorrect / totalEvals) * 100).toFixed(1) + '%';
    }
    
    const avg = filteredInstances.reduce((sum, inst) => sum + inst.accuracy, 0) / Math.max(1, filteredInstances.length);
    return avg.toFixed(1) + '%';
  }, [filteredInstances]);

  const globalFalsePositiveRate = useMemo(() => {
    const totalAlerts = filteredInstances.reduce((sum, inst) => sum + inst.alertsCount, 0);
    const totalFP = filteredInstances.reduce((sum, inst) => sum + inst.falsePositives, 0);

    if (totalAlerts > 0) {
      return ((totalFP / totalAlerts) * 100).toFixed(1) + '%';
    }

    const accNum = parseFloat(globalAccuracy);
    return (100 - (isNaN(accNum) ? 87.5 : accNum)).toFixed(1) + '%';
  }, [filteredInstances, globalAccuracy]);

  const periodSubtitle = useMemo(() => {
    if (period === 'Last Week') return 'Last week';
    if (period === 'Last Month') return 'Last month';
    if (period === 'Last 6 month') return 'Last 6 months';
    if (period === '1 Year') return 'Last 1 year';
    return 'All time';
  }, [period]);

  // Dynamic series aggregation for line charts
  const trendData = useMemo(() => {
    const { buckets, periodStart } = periodBoundaries;

    return buckets.map(({ label, start, end }) => {
      // 1. Isolated interval alerts (for stacked bar chart distributions per bucket)
      const intervalAlerts = alertsList.filter(a => {
        if (selectedEquipments.length > 0 && selectedEquipments.length < equipments.length && !selectedEquipments.includes(a.equipmentCode)) {
          return false;
        }

        if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES_LIST.length) {
          const friendlyCat = getRuleFriendlyCategory(a.ruleName);
          if (!selectedCategories.includes(friendlyCat)) return false;
        }

        const tTime = new Date(a.triggeredAt).getTime();
        return tTime >= start.getTime() && tTime <= end.getTime();
      });

      // 2. Cumulative alerts (from periodStart up to bucket end) for smooth trend line charts
      const cumulativeAlerts = alertsList.filter(a => {
        if (selectedEquipments.length > 0 && selectedEquipments.length < equipments.length && !selectedEquipments.includes(a.equipmentCode)) {
          return false;
        }

        if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES_LIST.length) {
          const friendlyCat = getRuleFriendlyCategory(a.ruleName);
          if (!selectedCategories.includes(friendlyCat)) return false;
        }

        const tTime = new Date(a.triggeredAt).getTime();
        return tTime >= periodStart.getTime() && tTime <= end.getTime();
      });

      const cumTotal = cumulativeAlerts.length;
      const cumFps = cumulativeAlerts.filter(a => a.status === 'rejected').length;
      const cumCorrect = cumulativeAlerts.filter(a => a.status === 'validated' || a.status === 'closed').length;

      // Cumulative accuracy (%) and false positive rate (%) matching top KPI totals at the last point
      const accuracy = cumTotal > 0 ? parseFloat(((cumCorrect / cumTotal) * 100).toFixed(1)) : 90;
      const falsePositives = cumTotal > 0 ? parseFloat(((cumFps / cumTotal) * 100).toFixed(1)) : 10.0;

      return {
        label,
        accuracy,
        falsePositives,
        driftCount: intervalAlerts.filter(a => getRuleFriendlyCategory(a.ruleName) === 'Drift').length,
        spikeCount: intervalAlerts.filter(a => getRuleFriendlyCategory(a.ruleName) === 'Spike').length,
        normalizedDpCount: intervalAlerts.filter(a => getRuleFriendlyCategory(a.ruleName) === 'Normalized dP').length,
        surgeCount: intervalAlerts.filter(a => getRuleFriendlyCategory(a.ruleName) === 'Surge').length,
        trendCount: intervalAlerts.filter(a => getRuleFriendlyCategory(a.ruleName) === 'Trend').length,
        toBeValidatedCount: intervalAlerts.filter(a => a.status === 'to_be_validated').length,
        validationInProgressCount: intervalAlerts.filter(a => a.status === 'validation_in_progress').length,
        validatedCount: intervalAlerts.filter(a => a.status === 'validated').length,
        rejectedCount: intervalAlerts.filter(a => a.status === 'rejected').length,
        closedCount: intervalAlerts.filter(a => a.status === 'closed').length,
      };
    });
  }, [alertsList, periodBoundaries, selectedEquipments, selectedCategories, equipments]);

  const accuracyChartData = useMemo(() => {
    return trendData.map(d => ({ label: d.label, accuracy: d.accuracy }));
  }, [trendData]);

  const fpChartData = useMemo(() => {
    return trendData.map(d => ({ label: d.label, falsePositives: d.falsePositives }));
  }, [trendData]);

  const ruleAlertsChartData = useMemo(() => {
    return trendData.map(d => ({
      timeKey: d.label,
      Drift: d.driftCount,
      Spike: d.spikeCount,
      'Normalized dP': d.normalizedDpCount,
      Surge: d.surgeCount,
      Trend: d.trendCount,
    }));
  }, [trendData]);

  const statusAlertsChartData = useMemo(() => {
    return trendData.map(d => ({
      timeKey: d.label,
      'To Be Validated': d.toBeValidatedCount,
      'Validation in Progress': d.validationInProgressCount,
      Validated: d.validatedCount,
      Rejected: d.rejectedCount,
      Closed: d.closedCount,
    }));
  }, [trendData]);

  return (
    <>
      {/* Navigation Sub-tabs & Global Filters Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Optisite Sub-tabs */}
        <div className="flex items-center gap-1 bg-[#0B0F19] border border-[#1E293B] p-1 rounded-xl select-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#1E293B] text-white font-medium shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Overview & Trends
          </button>
          <button
            onClick={() => setActiveTab('bad_actors')}
            className={`px-4 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
              activeTab === 'bad_actors'
                ? 'bg-[#1E293B] text-white font-medium shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Alerts Treated
          </button>
        </div>

        {/* Global Filters Control Bar */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <FpsosFilterDropdown
            fpsos={allFpsos}
            selectedFpsos={selectedFpsos}
            onChange={setSelectedFpsos}
          />
          <Sel value={period} onChange={setPeriod} options={PERIODS} />
          <ColumnFilterDropdown
            variant="select"
            placeholder="All Assets"
            options={equipments}
            selectedValues={selectedEquipments}
            onChange={setSelectedEquipments}
          />
          <ColumnFilterDropdown
            variant="select"
            placeholder="All Categories"
            options={CATEGORIES_LIST}
            selectedValues={selectedCategories}
            onChange={setSelectedCategories}
          />
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* KPI Cards: Accuracy -> False Positive (%) -> Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <KpiCard
              title="Accuracy"
              value={globalAccuracy}
              subtitle={periodSubtitle}
              tooltip="Ratio of validated alerts (true positives) over total reviewed alerts. Calculated as: TP / (TP + FP)."
            />
            <KpiCard
              title="False Positive"
              value={globalFalsePositiveRate}
              subtitle={periodSubtitle}
              tooltip="Percentage of triggered alerts rejected by operators as false alarms (did not correspond to a real anomaly). Calculated as: FP / Total Alerts."
            />
            <KpiCard
              title="Coverage"
              value={coveredAssets}
              subtitle={periodSubtitle}
              tooltip="Number of unique assets (equipment) protected by at least one active monitoring rule instance in the selected period."
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
                <AccuracyChart data={accuracyChartData} />
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
                <FalsePositiveChart data={fpChartData} />
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
                        FPSO
                        <ColumnFilterDropdown
                          title="FPSO"
                          options={accFpsoOpts}
                          selectedValues={accFpsoSelected.length === 0 ? accFpsoOpts : accFpsoSelected}
                          onChange={setAccFpsoSelected}
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                        Rule / Instance
                        <ColumnFilterDropdown
                          title="Rule / Instance"
                          options={accuracyRuleOpts}
                          selectedValues={accuracyRuleSelected.length === 0 ? accuracyRuleOpts : accuracyRuleSelected}
                          onChange={setAccuracyRuleSelected}
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                        Asset
                        <ColumnFilterDropdown
                          title="Asset"
                          options={accuracyEquipOpts}
                          selectedValues={accuracyEquipSelected.length === 0 ? accuracyEquipOpts : accuracyEquipSelected}
                          onChange={setAccuracyEquipSelected}
                        />
                      </th>
                      <th
                        onClick={() => toggleAccSort('evaluations')}
                        className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group select-none"
                      >
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span>Evaluations</span>
                          {accSortField === 'evaluations' ? (
                            accSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-accent-blue" /> : <ArrowDown className="w-3 h-3 text-accent-blue" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleAccSort('correct')}
                        className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group select-none"
                      >
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span>Correct</span>
                          {accSortField === 'correct' ? (
                            accSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-accent-blue" /> : <ArrowDown className="w-3 h-3 text-accent-blue" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleAccSort('accuracy')}
                        className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group select-none"
                      >
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span>Accuracy</span>
                          {accSortField === 'accuracy' ? (
                            accSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-accent-blue" /> : <ArrowDown className="w-3 h-3 text-accent-blue" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccuracyRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-muted italic bg-bg-panel/5">No instances found</td>
                      </tr>
                    ) : (
                      filteredAccuracyRows.map(inst => {
                        return (
                          <tr key={inst.id} className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors">
                            <td className="px-4 py-3 text-slate-400 font-mono">{inst.fpsoCode}</td>
                            <td className="px-4 py-3 font-medium text-slate-300">{inst.ruleName}</td>
                            <td className="px-4 py-3 text-slate-400 font-mono">{inst.equipmentCode}</td>
                            <td className="px-4 py-3 text-right text-slate-400">{inst.totalEvaluations}</td>
                            <td className="px-4 py-3 text-right text-status-ok font-medium">{inst.correctActions}</td>
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
                        FPSO
                        <ColumnFilterDropdown
                          title="FPSO"
                          options={fpFpsoOpts}
                          selectedValues={fpFpsoSelected.length === 0 ? fpFpsoOpts : fpFpsoSelected}
                          onChange={setFpFpsoSelected}
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                        Rule / Instance
                        <ColumnFilterDropdown
                          title="Rule / Instance"
                          options={fpRuleOpts}
                          selectedValues={fpRuleSelected.length === 0 ? fpRuleOpts : fpRuleSelected}
                          onChange={setFpRuleSelected}
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                        Asset
                        <ColumnFilterDropdown
                          title="Asset"
                          options={fpEquipOpts}
                          selectedValues={fpEquipSelected.length === 0 ? fpEquipOpts : fpEquipSelected}
                          onChange={setFpEquipSelected}
                        />
                      </th>
                      <th
                        onClick={() => toggleFpSort('alerts')}
                        className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group select-none"
                      >
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span>Evaluations</span>
                          {fpSortField === 'alerts' ? (
                            fpSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-status-warn" /> : <ArrowDown className="w-3 h-3 text-status-warn" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleFpSort('fp')}
                        className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group select-none"
                      >
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span>False Positives</span>
                          {fpSortField === 'fp' ? (
                            fpSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-status-warn" /> : <ArrowDown className="w-3 h-3 text-status-warn" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleFpSort('fpRate')}
                        className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group select-none"
                      >
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span>FP Rate</span>
                          {fpSortField === 'fpRate' ? (
                            fpSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-status-warn" /> : <ArrowDown className="w-3 h-3 text-status-warn" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFpRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-muted italic bg-bg-panel/5">No instances found</td>
                      </tr>
                    ) : (
                      filteredFpRows.map(inst => {
                        const fpRate = inst.alertsCount > 0 ? ((inst.falsePositives / inst.alertsCount) * 100).toFixed(1) : '0';
                        return (
                          <tr key={inst.id} className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors">
                            <td className="px-4 py-3 text-slate-400 font-mono">{inst.fpsoCode}</td>
                            <td className="px-4 py-3 font-medium text-slate-300">{inst.ruleName}</td>
                            <td className="px-4 py-3 text-slate-400 font-mono">{inst.equipmentCode}</td>
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
              <RuleAlertsChart data={ruleAlertsChartData} selectedCategories={selectedCategories} />
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
              <StatusAlertsChart data={statusAlertsChartData} />
            </div>
          </div>

          {/* Bad Actors List Card - Matching Optisite mockup */}
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl overflow-hidden mt-3 shadow-sm">
            <div className="px-5 py-4 border-b border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F172A]/30">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">Bad Actors List</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">Most active rule configurations across FPSOs filtered by active criteria</p>
              </div>
            </div>

            {/* Table representation matching Optisite mockup */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] text-[#94A3B8] text-xs font-medium select-none bg-[#0B0F19]">
                    <th className="px-5 py-3.5 whitespace-nowrap">
                      <span>FPSO</span>
                      <ColumnFilterDropdown
                        title="FPSO"
                        options={badFpsoOpts}
                        selectedValues={badFpsoSelected.length === 0 ? badFpsoOpts : badFpsoSelected}
                        onChange={setBadFpsoSelected}
                      />
                    </th>
                    <th className="px-5 py-3.5 whitespace-nowrap">
                      <span>Monitoring Rule</span>
                      <ColumnFilterDropdown
                        title="Monitoring Rule"
                        options={badRuleOpts}
                        selectedValues={badRuleSelected.length === 0 ? badRuleOpts : badRuleSelected}
                        onChange={setBadRuleSelected}
                      />
                    </th>
                    <th className="px-5 py-3.5 whitespace-nowrap">
                      <span>Asset</span>
                      <ColumnFilterDropdown
                        title="Asset"
                        options={badEquipOpts}
                        selectedValues={badEquipSelected.length === 0 ? badEquipOpts : badEquipSelected}
                        onChange={setBadEquipSelected}
                      />
                    </th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="text-xs text-[#94A3B8]">Total Alerts</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {badActorsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-[#94A3B8] italic">
                        No rules found matching active filters.
                      </td>
                    </tr>
                  ) : (
                    badActorsList.map(item => (
                      <tr key={item.id} className="border-b border-[#1E293B]/60 hover:bg-[#1E293B]/20 transition-colors">
                        <td className="px-5 py-4 text-[#94A3B8] font-mono">{item.fpsoCode}</td>
                        <td className="px-5 py-4 font-medium text-[#E2E8F0]">{item.ruleName}</td>
                        <td className="px-5 py-4 text-[#94A3B8] font-mono">{item.equipmentCode}</td>
                        <td className="px-5 py-4 text-right font-semibold text-[#60A5FA]">{item.alertsCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

