'use client';
import { useState, useMemo } from 'react';
import KpiCard from '@/components/ui/KpiCard';
import ColumnFilterDropdown from '@/components/ui/ColumnFilterDropdown';
import FpsosFilterDropdown from '@/components/ui/FpsosFilterDropdown';
import AccuracyChart from './AccuracyChart';
import FalsePositiveChart from './FalsePositiveChart';
import RuleAlertsChart from './RuleAlertsChart';
import StatusAlertsChart from './StatusAlertsChart';
import DaysToTreatChart from './DaysToTreatChart';
import { SlidersHorizontal, Maximize2, ArrowUp, ArrowDown, ArrowUpDown, Clock, BarChart3, Percent } from 'lucide-react';

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
  reviewedAt?: string | null;
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
  const allFpsos = useMemo(() => Array.from(new Set(ruleInstances.map(i => i.fpsoCode))).filter(Boolean).sort(), [ruleInstances]);
  const [selectedFpsos, setSelectedFpsos] = useState<string[]>([]);

  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [statusChartMode, setStatusChartMode] = useState<'count' | 'percent'>('count');

  // Local column filters for Overview breakdown tables
  const [accuracyRuleSelected, setAccuracyRuleSelected] = useState<string[]>([]);
  const [accuracyEquipSelected, setAccuracyEquipSelected] = useState<string[]>([]);
  const [fpRuleSelected, setFpRuleSelected] = useState<string[]>([]);
  const [fpEquipSelected, setFpEquipSelected] = useState<string[]>([]);

  // Local column filters for Bad Actors List
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

      const alertsCount = instanceAlerts.length;
      const falsePositives = instanceAlerts.filter(a => a.status === 'rejected').length;
      const correctActions = instanceAlerts.filter(a => a.status === 'eligible_for_em' || a.status === 'validated').length;
      const totalEvaluations = correctActions + falsePositives;
      
      const accuracy = totalEvaluations > 0
        ? parseFloat(((correctActions / totalEvaluations) * 100).toFixed(1))
        : null;

      const fpRate = totalEvaluations > 0
        ? parseFloat(((falsePositives / totalEvaluations) * 100).toFixed(1))
        : null;

      return {
        ...inst,
        alertsCount,
        falsePositives,
        totalEvaluations,
        correctActions,
        accuracy,
        fpRate,
      };
    });
  }, [ruleInstances, alertsList, periodBoundaries]);

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

  const accuracyRuleOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.ruleName))).filter(Boolean).sort(), [filteredInstances]);
  const accuracyEquipOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.equipmentCode))).filter(Boolean).sort(), [filteredInstances]);
  
  const fpRuleOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.ruleName))).filter(Boolean).sort(), [filteredInstances]);
  const fpEquipOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.equipmentCode))).filter(Boolean).sort(), [filteredInstances]);

  const badRuleOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.ruleName))).filter(Boolean).sort(), [filteredInstances]);
  const badEquipOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.equipmentCode))).filter(Boolean).sort(), [filteredInstances]);

  const filteredAccuracyRows = useMemo(() => {
    const rows = filteredInstances.filter(inst => {
      const matchRule = accuracyRuleSelected.length === 0 || accuracyRuleSelected.length === accuracyRuleOpts.length || accuracyRuleSelected.includes(inst.ruleName);
      const matchEquip = accuracyEquipSelected.length === 0 || accuracyEquipSelected.length === accuracyEquipOpts.length || accuracyEquipSelected.includes(inst.equipmentCode);
      return matchRule && matchEquip;
    });

    if (!accSortField) return rows;

    return [...rows].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (accSortField === 'evaluations') { valA = a.totalEvaluations; valB = b.totalEvaluations; }
      else if (accSortField === 'correct') { valA = a.correctActions; valB = b.correctActions; }
      else if (accSortField === 'accuracy') { valA = a.accuracy ?? -1; valB = b.accuracy ?? -1; }
      return accSortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredInstances, accuracyRuleSelected, accuracyRuleOpts, accuracyEquipSelected, accuracyEquipOpts, accSortField, accSortDir]);

  const filteredFpRows = useMemo(() => {
    const rows = filteredInstances.filter(inst => {
      const matchRule = fpRuleSelected.length === 0 || fpRuleSelected.length === fpRuleOpts.length || fpRuleSelected.includes(inst.ruleName);
      const matchEquip = fpEquipSelected.length === 0 || fpEquipSelected.length === fpEquipOpts.length || fpEquipSelected.includes(inst.equipmentCode);
      return matchRule && matchEquip;
    });

    if (!fpSortField) return rows;

    return [...rows].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (fpSortField === 'alerts') { valA = a.totalEvaluations; valB = b.totalEvaluations; }
      else if (fpSortField === 'fp') { valA = a.falsePositives; valB = b.falsePositives; }
      else if (fpSortField === 'fpRate') {
        valA = a.fpRate ?? -1;
        valB = b.fpRate ?? -1;
      }
      return fpSortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredInstances, fpRuleSelected, fpRuleOpts, fpEquipSelected, fpEquipOpts, fpSortField, fpSortDir]);

  // Calculate Bad Actors List (up to 30) by highest alerts count
  const badActorsList = useMemo(() => {
    return [...filteredInstances]
      .filter(inst => {
        if (inst.alertsCount === 0) return false;
        const matchRule = badRuleSelected.length === 0 || badRuleSelected.length === badRuleOpts.length || badRuleSelected.includes(inst.ruleName);
        const matchEquip = badEquipSelected.length === 0 || badEquipSelected.length === badEquipOpts.length || badEquipSelected.includes(inst.equipmentCode);
        return matchRule && matchEquip;
      })
      .sort((a, b) => b.alertsCount - a.alertsCount)
      .slice(0, 30);
  }, [filteredInstances, badRuleSelected, badRuleOpts, badEquipSelected, badEquipOpts]);

  // Calculate KPI card values dynamically
  const globalAccuracy = useMemo(() => {
    const totalEvals = filteredInstances.reduce((sum, inst) => sum + inst.totalEvaluations, 0);
    const totalCorrect = filteredInstances.reduce((sum, inst) => sum + inst.correctActions, 0);
    
    if (totalEvals > 0) {
      return ((totalCorrect / totalEvals) * 100).toFixed(1) + '%';
    }
    
    return '—';
  }, [filteredInstances]);

  const globalFalsePositiveRate = useMemo(() => {
    const totalEvals = filteredInstances.reduce((sum, inst) => sum + inst.totalEvaluations, 0);
    const totalFP = filteredInstances.reduce((sum, inst) => sum + inst.falsePositives, 0);

    if (totalEvals > 0) {
      return ((totalFP / totalEvals) * 100).toFixed(1) + '%';
    }

    return '—';
  }, [filteredInstances]);

  // Calculate Avg. Time to Treat (days from Created Date to Review Date)
  const avgDaysToTreat = useMemo(() => {
    const { periodStart, periodEnd } = periodBoundaries;
    const treatedAlerts = alertsList.filter(a => {
      if (selectedFpsos.length > 0 && selectedFpsos.length < allFpsos.length && !selectedFpsos.includes(a.fpsoCode)) {
        return false;
      }
      if (selectedEquipments.length > 0 && selectedEquipments.length < equipments.length && !selectedEquipments.includes(a.equipmentCode)) {
        return false;
      }
      if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES_LIST.length) {
        const friendlyCat = getRuleFriendlyCategory(a.ruleName);
        if (!selectedCategories.includes(friendlyCat)) return false;
      }
      const tTime = new Date(a.triggeredAt).getTime();
      if (tTime < periodStart.getTime() || tTime > periodEnd.getTime()) {
        return false;
      }
      return (a.status === 'eligible_for_em' || a.status === 'validated' || a.status === 'rejected') && a.reviewedAt;
    });

    if (treatedAlerts.length === 0) return '—';

    const totalDays = treatedAlerts.reduce((sum, a) => {
      const diffMs = new Date(a.reviewedAt!).getTime() - new Date(a.triggeredAt).getTime();
      const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);

    const avg = totalDays / treatedAlerts.length;
    return `${avg.toFixed(2)} days`;
  }, [alertsList, periodBoundaries, selectedFpsos, allFpsos, selectedEquipments, selectedCategories, equipments]);

  const periodSubtitle = useMemo(() => {
    if (period === 'Last Week') return 'Last week';
    if (period === 'Last Month') return 'Last month';
    if (period === 'Last 6 month') return 'Last 6 months';
    if (period === '1 Year') return 'Last 1 year';
    return 'All time';
  }, [period]);

  // Dynamic series aggregation for line and bar charts
  const trendData = useMemo(() => {
    const { buckets, periodStart } = periodBoundaries;

    return buckets.map(({ label, start, end }) => {
      // 1. Isolated interval alerts (for stacked bar chart distributions per bucket)
      const intervalAlerts = alertsList.filter(a => {
        if (selectedFpsos.length > 0 && selectedFpsos.length < allFpsos.length && !selectedFpsos.includes(a.fpsoCode)) {
          return false;
        }

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
        if (selectedFpsos.length > 0 && selectedFpsos.length < allFpsos.length && !selectedFpsos.includes(a.fpsoCode)) {
          return false;
        }

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

      const cumFps = cumulativeAlerts.filter(a => a.status === 'rejected').length;
      const cumCorrect = cumulativeAlerts.filter(a => a.status === 'eligible_for_em' || a.status === 'validated').length;
      const cumEvaluations = cumCorrect + cumFps;

      const accuracy = cumEvaluations > 0 ? parseFloat(((cumCorrect / cumEvaluations) * 100).toFixed(1)) : 100;
      const falsePositives = cumEvaluations > 0 ? parseFloat(((cumFps / cumEvaluations) * 100).toFixed(1)) : 0;

      return {
        label,
        accuracy,
        falsePositives,
        driftCount: intervalAlerts.filter(a => getRuleFriendlyCategory(a.ruleName) === 'Drift').length,
        spikeCount: intervalAlerts.filter(a => getRuleFriendlyCategory(a.ruleName) === 'Spike').length,
        normalizedDpCount: intervalAlerts.filter(a => getRuleFriendlyCategory(a.ruleName) === 'Normalized dP').length,
        surgeCount: intervalAlerts.filter(a => getRuleFriendlyCategory(a.ruleName) === 'Surge').length,
        trendCount: intervalAlerts.filter(a => getRuleFriendlyCategory(a.ruleName) === 'Trend').length,
        newCount: intervalAlerts.filter(a => a.status === 'new' || a.status === 'to_be_validated').length,
        reviewInProgressCount: intervalAlerts.filter(a => a.status === 'review_in_progress' || a.status === 'validation_in_progress').length,
        eligibleForEmCount: intervalAlerts.filter(a => a.status === 'eligible_for_em' || a.status === 'validated').length,
        rejectedCount: intervalAlerts.filter(a => a.status === 'rejected').length,
      };
    });
  }, [alertsList, periodBoundaries, selectedFpsos, allFpsos, selectedEquipments, selectedCategories, equipments]);

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

  // Status chart data (Count or 100% Percent stacked)
  const statusAlertsChartData = useMemo(() => {
    return trendData.map(d => {
      if (statusChartMode === 'percent') {
        const total = d.newCount + d.reviewInProgressCount + d.eligibleForEmCount + d.rejectedCount;
        if (total === 0) {
          return {
            timeKey: d.label,
            'New': 0,
            'Review in Progress': 0,
            'Eligible for Event Manager': 0,
            'Rejected': 0,
          };
        }
        return {
          timeKey: d.label,
          'New': parseFloat(((d.newCount / total) * 100).toFixed(1)),
          'Review in Progress': parseFloat(((d.reviewInProgressCount / total) * 100).toFixed(1)),
          'Eligible for Event Manager': parseFloat(((d.eligibleForEmCount / total) * 100).toFixed(1)),
          'Rejected': parseFloat(((d.rejectedCount / total) * 100).toFixed(1)),
        };
      }

      return {
        timeKey: d.label,
        'New': d.newCount,
        'Review in Progress': d.reviewInProgressCount,
        'Eligible for Event Manager': d.eligibleForEmCount,
        'Rejected': d.rejectedCount,
      };
    });
  }, [trendData, statusChartMode]);

  // Days to Treat an Alert (Average) composed chart data
  const daysToTreatData = useMemo(() => {
    const { buckets } = periodBoundaries;
    const activeFpsos = selectedFpsos.length > 0 && selectedFpsos.length < allFpsos.length
      ? selectedFpsos
      : allFpsos;

    return buckets.map(({ label, start, end }) => {
      const point: { timeKey: string; Fleet: number; [key: string]: number | string } = {
        timeKey: label,
        Fleet: 0,
      };

      const bucketTreated = alertsList.filter(a => {
        if (selectedEquipments.length > 0 && selectedEquipments.length < equipments.length && !selectedEquipments.includes(a.equipmentCode)) {
          return false;
        }
        if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES_LIST.length) {
          const friendlyCat = getRuleFriendlyCategory(a.ruleName);
          if (!selectedCategories.includes(friendlyCat)) return false;
        }
        const tTime = new Date(a.triggeredAt).getTime();
        return (
          tTime >= start.getTime() &&
          tTime <= end.getTime() &&
          (a.status === 'eligible_for_em' || a.status === 'validated' || a.status === 'rejected') &&
          a.reviewedAt
        );
      });

      // Fleet average in this bucket
      if (bucketTreated.length > 0) {
        const fleetTotal = bucketTreated.reduce((sum, a) => {
          const diffDays = Math.max(0, (new Date(a.reviewedAt!).getTime() - new Date(a.triggeredAt).getTime()) / 86400000);
          return sum + diffDays;
        }, 0);
        point.Fleet = parseFloat((fleetTotal / bucketTreated.length).toFixed(2));
      } else {
        point.Fleet = 0;
      }

      // Per FPSO average
      activeFpsos.forEach(fpso => {
        const fpsoAlerts = bucketTreated.filter(a => a.fpsoCode === fpso);
        if (fpsoAlerts.length > 0) {
          const totalDays = fpsoAlerts.reduce((sum, a) => {
            const diffDays = Math.max(0, (new Date(a.reviewedAt!).getTime() - new Date(a.triggeredAt).getTime()) / 86400000);
            return sum + diffDays;
          }, 0);
          point[fpso] = parseFloat((totalDays / fpsoAlerts.length).toFixed(2));
        } else {
          point[fpso] = 0;
        }
      });

      return point;
    });
  }, [alertsList, periodBoundaries, allFpsos, selectedFpsos, selectedEquipments, selectedCategories, equipments]);

  // Breakdown Table: Alerts Treated per Unit (FPSO)
  const fpsoTreatmentStats = useMemo(() => {
    const { periodStart, periodEnd } = periodBoundaries;
    const activeFpsos = selectedFpsos.length > 0 && selectedFpsos.length < allFpsos.length
      ? selectedFpsos
      : allFpsos;

    const stats = activeFpsos.map(fpso => {
      const fpsoAlerts = alertsList.filter(a => {
        if (a.fpsoCode !== fpso) return false;
        if (selectedEquipments.length > 0 && selectedEquipments.length < equipments.length && !selectedEquipments.includes(a.equipmentCode)) {
          return false;
        }
        if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES_LIST.length) {
          const friendlyCat = getRuleFriendlyCategory(a.ruleName);
          if (!selectedCategories.includes(friendlyCat)) return false;
        }
        const tTime = new Date(a.triggeredAt).getTime();
        return tTime >= periodStart.getTime() && tTime <= periodEnd.getTime();
      });

      const total = fpsoAlerts.length;
      const eligible = fpsoAlerts.filter(a => a.status === 'eligible_for_em' || a.status === 'validated').length;
      const rejected = fpsoAlerts.filter(a => a.status === 'rejected').length;
      const pending = fpsoAlerts.filter(a => a.status === 'new' || a.status === 'review_in_progress' || a.status === 'to_be_validated' || a.status === 'validation_in_progress').length;

      const treatedAlerts = fpsoAlerts.filter(a => (a.status === 'eligible_for_em' || a.status === 'validated' || a.status === 'rejected') && a.reviewedAt);
      const avgDays = treatedAlerts.length > 0
        ? (treatedAlerts.reduce((sum, a) => sum + Math.max(0, (new Date(a.reviewedAt!).getTime() - new Date(a.triggeredAt).getTime()) / 86400000), 0) / treatedAlerts.length).toFixed(2)
        : '—';

      const eligiblePct = total > 0 ? ((eligible / total) * 100).toFixed(1) : '0.0';
      const rejectedPct = total > 0 ? ((rejected / total) * 100).toFixed(1) : '0.0';
      const pendingPct = total > 0 ? ((pending / total) * 100).toFixed(1) : '0.0';

      return {
        fpso,
        total,
        eligible,
        eligiblePct,
        rejected,
        rejectedPct,
        pending,
        pendingPct,
        avgDays,
      };
    });

    // Calculate Fleet Total row
    const fleetTotalAlerts = stats.reduce((sum, s) => sum + s.total, 0);
    const fleetEligible = stats.reduce((sum, s) => sum + s.eligible, 0);
    const fleetRejected = stats.reduce((sum, s) => sum + s.rejected, 0);
    const fleetPending = stats.reduce((sum, s) => sum + s.pending, 0);

    const fleetEligiblePct = fleetTotalAlerts > 0 ? ((fleetEligible / fleetTotalAlerts) * 100).toFixed(1) : '0.0';
    const fleetRejectedPct = fleetTotalAlerts > 0 ? ((fleetRejected / fleetTotalAlerts) * 100).toFixed(1) : '0.0';
    const fleetPendingPct = fleetTotalAlerts > 0 ? ((fleetPending / fleetTotalAlerts) * 100).toFixed(1) : '0.0';

    return {
      rows: stats,
      totalRow: {
        total: fleetTotalAlerts,
        eligible: fleetEligible,
        eligiblePct: fleetEligiblePct,
        rejected: fleetRejected,
        rejectedPct: fleetRejectedPct,
        pending: fleetPending,
        pendingPct: fleetPendingPct,
      },
    };
  }, [alertsList, periodBoundaries, allFpsos, selectedFpsos, selectedEquipments, selectedCategories, equipments]);

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
            isMultiSelect={true}
            selectedFpsos={selectedFpsos}
            onMultiChange={setSelectedFpsos}
            baseLabel="All FPSOs"
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

      {/* Global KPI Cards: Accuracy -> False Positive (%) -> Avg. Time to Treat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title="Accuracy"
          value={globalAccuracy}
          subtitle={periodSubtitle}
          tooltip="Ratio of validated alerts (eligible for Event Manager) over total reviewed alerts. Calculated as: Eligible / (Eligible + Rejected)."
        />
        <KpiCard
          title="False Positive Rate"
          value={globalFalsePositiveRate}
          subtitle={periodSubtitle}
          tooltip="Percentage of reviewed alerts rejected by operators as false alarms. Calculated as: Rejected / (Eligible + Rejected)."
        />
        <KpiCard
          title="Avg. Time to Treat"
          value={avgDaysToTreat}
          subtitle={periodSubtitle}
          tooltip="Average lead time in days from alert creation (Created Date) to operator review completion (Review Date) for treated alerts."
        />
      </div>

      {activeTab === 'overview' && (
        <>
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
                            accSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-primary" /> : <ArrowDown className="w-3 h-3 text-brand-primary" />
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
                            accSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-primary" /> : <ArrowDown className="w-3 h-3 text-brand-primary" />
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
                            accSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-primary" /> : <ArrowDown className="w-3 h-3 text-brand-primary" />
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
                      filteredAccuracyRows.map(inst => (
                        <tr key={inst.id} className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors">
                          <td className="px-4 py-3 text-slate-400 font-mono">{inst.fpsoCode}</td>
                          <td className="px-4 py-3 font-medium text-slate-300">{inst.ruleName}</td>
                          <td className="px-4 py-3 text-slate-400 font-mono">{inst.equipmentCode}</td>
                          <td className="px-4 py-3 text-right text-slate-400">{inst.totalEvaluations}</td>
                          <td className="px-4 py-3 text-right text-status-success font-medium">{inst.correctActions}</td>
                          <td className="px-4 py-3 text-right font-semibold text-status-success">{inst.accuracy !== null ? `${inst.accuracy}%` : '—'}</td>
                        </tr>
                      ))
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
                      filteredFpRows.map(inst => (
                        <tr key={inst.id} className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors">
                            <td className="px-4 py-3 text-slate-400 font-mono">{inst.fpsoCode}</td>
                            <td className="px-4 py-3 font-medium text-slate-300">{inst.ruleName}</td>
                            <td className="px-4 py-3 text-slate-400 font-mono">{inst.equipmentCode}</td>
                            <td className="px-4 py-3 text-right text-slate-400">{inst.totalEvaluations}</td>
                            <td className="px-4 py-3 text-right text-status-warn font-medium">{inst.falsePositives}</td>
                            <td className="px-4 py-3 text-right font-semibold text-status-warn">{inst.fpRate !== null ? `${inst.fpRate}%` : '—'}</td>
                          </tr>
                      ))
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
          {/* Top Section: Days to Treat an Alert (Average) */}
          <div className="bg-bg-card border border-border-panel rounded-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-[#1E293B]/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-[#38BDF8]" />
                  <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                    Days to Treat an Alert (Average)
                  </h3>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Monthly lead time in days per FPSO and Fleet Average from creation to operator resolution
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#94A3B8] bg-[#0B0F19] px-2.5 py-1 rounded-md border border-[#1E293B]">
                  Fleet Avg: <strong className="text-white">{avgDaysToTreat}</strong>
                </span>
                <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              </div>
            </div>
            <DaysToTreatChart data={daysToTreatData} fpsos={allFpsos} />
          </div>

          {/* Middle Section: 2 Charts Grid (Status & Rule Type) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alerts Treated by Status with Count vs % Toggle */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">Alerts Treated by Status</h3>
                  <span className="text-[10px] text-[#94A3B8] font-mono">
                    ({statusChartMode === 'percent' ? '100% Normalized' : 'Volume'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mode Toggle Buttons */}
                  <div className="flex items-center bg-[#0B0F19] border border-[#1E293B] rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setStatusChartMode('count')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                        statusChartMode === 'count'
                          ? 'bg-[#1E293B] text-white font-medium shadow-sm'
                          : 'text-[#94A3B8] hover:text-white'
                      }`}
                      title="Show absolute alert counts"
                    >
                      <BarChart3 size={11} />
                      <span>Vol</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusChartMode('percent')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                        statusChartMode === 'percent'
                          ? 'bg-[#1E293B] text-white font-medium shadow-sm'
                          : 'text-[#94A3B8] hover:text-white'
                      }`}
                      title="Show 100% normalized proportions"
                    >
                      <Percent size={11} />
                      <span>%</span>
                    </button>
                  </div>
                  <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                  <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                </div>
              </div>
              <StatusAlertsChart data={statusAlertsChartData} mode={statusChartMode} />
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
              <RuleAlertsChart data={ruleAlertsChartData} selectedCategories={selectedCategories} />
            </div>
          </div>

          {/* Third Section: Table ALERTS TREATED PER UNIT (FPSO) */}
          <div className="bg-bg-card border border-border-panel rounded-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border-panel flex items-center justify-between bg-[#0F172A]/30">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Alerts Treated per Unit (FPSO)</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">Status breakdown, resolution proportions, and average treatment lead time by vessel</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary">
                      FPSO Unit
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-status-success">
                      Eligible for EM (Ack)
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-status-warn">
                      Rejected (False Pos.)
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Pending Review
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                      Avg. Days to Treat
                    </th>
                    <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-white">
                      Total Alerts
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-panel">
                  {fpsoTreatmentStats.rows.map(row => (
                    <tr key={row.fpso} className="hover:bg-bg-panel/10 transition-colors">
                      <td className="px-5 py-3 font-mono font-medium text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                        {row.fpso}
                      </td>
                      <td className="px-5 py-3 text-right font-mono">
                        <span className="text-status-success font-semibold">{row.eligiblePct}%</span>
                        <span className="text-[#64748B] text-[11px] ml-1.5">({row.eligible})</span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono">
                        <span className="text-status-warn font-semibold">{row.rejectedPct}%</span>
                        <span className="text-[#64748B] text-[11px] ml-1.5">({row.rejected})</span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono">
                        <span className="text-amber-400 font-semibold">{row.pendingPct}%</span>
                        <span className="text-[#64748B] text-[11px] ml-1.5">({row.pending})</span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[#38BDF8] font-medium">
                        {row.avgDays !== '—' ? `${row.avgDays} d` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-white font-medium">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0F172A]/80 font-bold border-t-2 border-[#1E293B]">
                    <td className="px-5 py-3 text-white uppercase text-[11px]">Fleet Total</td>
                    <td className="px-5 py-3 text-right font-mono text-status-success">
                      {fpsoTreatmentStats.totalRow.eligiblePct}%
                      <span className="text-[#94A3B8] font-normal text-[11px] ml-1.5">({fpsoTreatmentStats.totalRow.eligible})</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-status-warn">
                      {fpsoTreatmentStats.totalRow.rejectedPct}%
                      <span className="text-[#94A3B8] font-normal text-[11px] ml-1.5">({fpsoTreatmentStats.totalRow.rejected})</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-amber-400">
                      {fpsoTreatmentStats.totalRow.pendingPct}%
                      <span className="text-[#94A3B8] font-normal text-[11px] ml-1.5">({fpsoTreatmentStats.totalRow.pending})</span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[#38BDF8]">
                      {avgDaysToTreat}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {fpsoTreatmentStats.totalRow.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Fourth Section: Bad Actors List Card */}
          <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl overflow-hidden mt-3 shadow-sm">
            <div className="px-5 py-4 border-b border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F172A]/30">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide">Bad Actors List</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">Most active rule configurations across FPSOs filtered by active criteria</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8] font-mono">
                  Showing top {badActorsList.length} rules
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] bg-[#0F172A]/40 text-[#94A3B8] select-none text-[11px] uppercase tracking-wider font-semibold sticky top-0 z-10 backdrop-blur-md">
                    <th className="py-3 px-4 w-12 text-center text-[#64748B]">#</th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>Rule / Instance</span>
                        <ColumnFilterDropdown
                          title="Rule / Instance"
                          options={badRuleOpts}
                          selectedValues={badRuleSelected.length === 0 ? badRuleOpts : badRuleSelected}
                          onChange={setBadRuleSelected}
                        />
                      </div>
                    </th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>Asset</span>
                        <ColumnFilterDropdown
                          title="Asset"
                          options={badEquipOpts}
                          selectedValues={badEquipSelected.length === 0 ? badEquipOpts : badEquipSelected}
                          onChange={setBadEquipSelected}
                        />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-mono">FPSO</th>
                    <th className="py-3 px-4 text-right">Evaluations</th>
                    <th className="py-3 px-4 text-right">Correct</th>
                    <th className="py-3 px-4 text-right">FP</th>
                    <th className="py-3 px-4 text-right">Accuracy</th>
                    <th className="py-3 px-4 text-right">FP Rate</th>
                    <th className="py-3 px-4 text-right font-bold text-[#F59E0B]">Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60 text-xs">
                  {badActorsList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#64748B] italic">
                        No active bad actor rules found for the selected filters and time period.
                      </td>
                    </tr>
                  ) : (
                    badActorsList.map((inst, index) => (
                      <tr
                        key={inst.id}
                        className="hover:bg-[#151D2E]/80 transition-colors group"
                      >
                        <td className="py-3 px-4 text-center font-mono text-[#64748B]">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-white max-w-[280px] truncate" title={inst.ruleName}>
                          {inst.ruleName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#94A3B8]">
                          {inst.equipmentCode}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#38BDF8]">
                          {inst.fpsoCode}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#94A3B8]">
                          {inst.totalEvaluations}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#22C55E]">
                          {inst.correctActions}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#EF4444]">
                          {inst.falsePositives}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-[#22C55E]">
                          {inst.accuracy !== null ? `${inst.accuracy}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-[#EF4444]">
                          {inst.fpRate !== null ? `${inst.fpRate}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#F59E0B]">
                          {inst.alertsCount}
                        </td>
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
