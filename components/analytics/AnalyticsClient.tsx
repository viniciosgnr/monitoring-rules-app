'use client';
import { useState, useMemo, useEffect } from 'react';
import KpiCard from '@/components/ui/KpiCard';
import ColumnFilterDropdown from '@/components/ui/ColumnFilterDropdown';
import FpsosFilterDropdown from '@/components/ui/FpsosFilterDropdown';
import PeriodFilterDropdown, { PresetPeriod } from '@/components/ui/PeriodFilterDropdown';
import Pagination from '@/components/ui/Pagination';
import AccuracyChart from './AccuracyChart';
import FalsePositiveChart from './FalsePositiveChart';
import RuleAlertsChart from './RuleAlertsChart';
import StatusAlertsChart from './StatusAlertsChart';
import DaysToTreatChart from './DaysToTreatChart';
import AlertsPerResponsibleChart from './AlertsPerResponsibleChart';
import AlertsBySystemChart from './AlertsBySystemChart';
import InfoTooltip from '@/components/ui/InfoTooltip';
import { SlidersHorizontal, Maximize2, ArrowUp, ArrowDown, ArrowUpDown, FileDown, CheckCircle2, Loader2, FileText } from 'lucide-react';

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
  reviewedBy?: string | null;
  system?: string;
  ruleName: string;
  fpsoCode: string;
  equipmentCode: string;
}

const DEFAULT_SYSTEMS = [
  'Gas System',
  'Water Injection System',
  'Utility System',
  'Crude Oil System',
  'Power Generation System',
];

const SYSTEM_SHORT_LABELS: Record<string, string> = {
  'Gas System': 'Gas System',
  'Water Injection System': 'Water Injection',
  'Utility System': 'Utility System',
  'Crude Oil System': 'Crude Oil',
  'Power Generation System': 'Power Generation',
};

const KNOWN_RESPONSIBLE_MAP: Record<string, string> = {
  'smetzner@slb.com': 'Metzner, S.',
  'jdoe@slb.com': 'Doe, Jon',
  'jon.doe@sbmoffshore.com': 'Doe, Jon',
  'jon doe': 'Doe, Jon',
  'mrodrigues@slb.com': 'Rodrigues, Marcos',
  'icaro.zelioli@sbmoffshore.com': 'Zelioli, Icaro',
};

const DEFAULT_RESPONSIBLES = [
  'Doe, Jon',
  'Metzner, S.',
  'Rodrigues, Marcos',
  'Zelioli, Icaro',
];

function formatResponsibleName(raw?: string | null): string | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  const mapped = KNOWN_RESPONSIBLE_MAP[trimmed.toLowerCase()];
  if (mapped) return mapped;

  const localPart = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  if (localPart.includes('.')) {
    const parts = localPart.split('.').filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
      const last = parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1).toLowerCase();
      return `${last}, ${first}`;
    }
  }
  if (localPart.includes(' ')) {
    const parts = localPart.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts.slice(0, -1).join(' ');
      const last = parts[parts.length - 1];
      return `${last}, ${first}`;
    }
  }
  return trimmed;
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

export default function AnalyticsClient({ equipments, ruleInstances, alertsList }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bad_actors' | 'export'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [period, setPeriod] = useState<PresetPeriod>('Last week');
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [customTo, setCustomTo] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const allFpsos = useMemo(() => Array.from(new Set(ruleInstances.map(i => i.fpsoCode))).filter(Boolean).sort(), [ruleInstances]);
  const [selectedFpsos, setSelectedFpsos] = useState<string[]>([]);

  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Local column filters for Overview breakdown tables
  const [accuracyFpsoSelected, setAccuracyFpsoSelected] = useState<string[]>([]);
  const [accuracyRuleSelected, setAccuracyRuleSelected] = useState<string[]>([]);
  const [accuracyEquipSelected, setAccuracyEquipSelected] = useState<string[]>([]);
  const [accuracyPage, setAccuracyPage] = useState(1);
  const [accuracyPageSize, setAccuracyPageSize] = useState(10);
  const [fpFpsoSelected, setFpFpsoSelected] = useState<string[]>([]);
  const [fpRuleSelected, setFpRuleSelected] = useState<string[]>([]);
  const [fpEquipSelected, setFpEquipSelected] = useState<string[]>([]);
  const [fpPage, setFpPage] = useState(1);
  const [fpPageSize, setFpPageSize] = useState(10);
  const [badActorsFpsoSelected, setBadActorsFpsoSelected] = useState<string[]>([]);
  const [badActorsRuleSelected, setBadActorsRuleSelected] = useState<string[]>([]);
  const [badActorsEquipSelected, setBadActorsEquipSelected] = useState<string[]>([]);
  const [badActorsPage, setBadActorsPage] = useState(1);
  const [badActorsPageSize, setBadActorsPageSize] = useState(10);

  // Sorting state for Breakdown Tables
  const [accSortField, setAccSortField] = useState<'evaluations' | 'correct' | 'accuracy' | null>(null);
  const [accSortDir, setAccSortDir] = useState<'asc' | 'desc'>('asc');
  const [fpSortField, setFpSortField] = useState<'alerts' | 'fp' | 'fpRate' | null>(null);
  const [fpSortDir, setFpSortDir] = useState<'asc' | 'desc'>('desc');
  const [badActorsSortField, setBadActorsSortField] = useState<'accuracy' | 'fpRate' | 'alerts'>('alerts');
  const [badActorsSortDir, setBadActorsSortDir] = useState<'asc' | 'desc'>('desc');

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

  const toggleBadActorsSort = (field: 'accuracy' | 'fpRate' | 'alerts') => {
    if (badActorsSortField === field) {
      setBadActorsSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setBadActorsSortField(field);
      setBadActorsSortDir(field === 'accuracy' ? 'asc' : 'desc');
    }
  };

  // Shared time buckets & exact period boundaries for 100% mathematical synchronization
  const periodBoundaries = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    if (period === 'Custom dates' && customFrom && customTo) {
      const [fy, fm, fd] = customFrom.split('-').map(Number);
      const [ty, tm, td] = customTo.split('-').map(Number);
      const startBound = new Date(fy, fm - 1, fd, 0, 0, 0);
      const endBound = new Date(ty, tm - 1, td, 23, 59, 59);
      const diffDays = Math.max(1, Math.round((endBound.getTime() - startBound.getTime()) / 86400000) + 1);

      if (diffDays <= 45) {
        // Daily buckets across custom range
        const buckets = Array.from({ length: diffDays }, (_, idx) => {
          const targetDate = new Date(startBound.getFullYear(), startBound.getMonth(), startBound.getDate() + idx);
          const dayStr = String(targetDate.getDate()).padStart(2, '0');
          const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');
          return {
            label: `${dayStr}/${monthStr}`,
            start: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0),
            end: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59),
          };
        });
        return { buckets, periodStart: startBound, periodEnd: endBound };
      } else {
        // Monthly buckets across custom range
        const monthsDiff = Math.max(
          1,
          (endBound.getFullYear() - startBound.getFullYear()) * 12 + (endBound.getMonth() - startBound.getMonth()) + 1
        );
        const buckets = Array.from({ length: monthsDiff }, (_, idx) => {
          const targetMonth = new Date(startBound.getFullYear(), startBound.getMonth() + idx, 1);
          const mStart = idx === 0 ? startBound : new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1, 0, 0, 0);
          const mEnd =
            idx === monthsDiff - 1
              ? endBound
              : new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);
          return {
            label: monthNames[targetMonth.getMonth()],
            start: mStart,
            end: mEnd,
          };
        });
        return { buckets, periodStart: startBound, periodEnd: endBound };
      }
    }

    const isWeekly = period === 'Last week';
    const isDailyMonth = period === 'Last month';
    const is6Months = period === 'Last 6 months';
    const bucketsCount = isWeekly ? 7 : isDailyMonth ? 30 : is6Months ? 6 : 12;

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

    const periodStart = buckets[0].start;
    const periodEnd = buckets[buckets.length - 1].end;

    return { buckets, periodStart, periodEnd };
  }, [period, customFrom, customTo]);

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

  const accuracyFpsoOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.fpsoCode))).filter(Boolean).sort(), [filteredInstances]);
  const accuracyRuleOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.ruleName))).filter(Boolean).sort(), [filteredInstances]);
  const accuracyEquipOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.equipmentCode))).filter(Boolean).sort(), [filteredInstances]);
  
  const fpFpsoOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.fpsoCode))).filter(Boolean).sort(), [filteredInstances]);
  const fpRuleOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.ruleName))).filter(Boolean).sort(), [filteredInstances]);
  const fpEquipOpts = useMemo(() => Array.from(new Set(filteredInstances.map(i => i.equipmentCode))).filter(Boolean).sort(), [filteredInstances]);

  const filteredAccuracyRows = useMemo(() => {
    const rows = filteredInstances.filter(inst => {
      const matchFpso = accuracyFpsoSelected.length === 0 || accuracyFpsoSelected.length === accuracyFpsoOpts.length || accuracyFpsoSelected.includes(inst.fpsoCode);
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
      else if (accSortField === 'accuracy') { valA = a.accuracy ?? -1; valB = b.accuracy ?? -1; }
      return accSortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredInstances, accuracyFpsoSelected, accuracyFpsoOpts, accuracyRuleSelected, accuracyRuleOpts, accuracyEquipSelected, accuracyEquipOpts, accSortField, accSortDir]);

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
      if (fpSortField === 'alerts') { valA = a.totalEvaluations; valB = b.totalEvaluations; }
      else if (fpSortField === 'fp') { valA = a.falsePositives; valB = b.falsePositives; }
      else if (fpSortField === 'fpRate') {
        valA = a.fpRate ?? -1;
        valB = b.fpRate ?? -1;
      }
      return fpSortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredInstances, fpFpsoSelected, fpFpsoOpts, fpRuleSelected, fpRuleOpts, fpEquipSelected, fpEquipOpts, fpSortField, fpSortDir]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredAccuracyRows.length / accuracyPageSize));
    if (accuracyPage > totalPages) {
      setAccuracyPage(1);
    }
  }, [filteredAccuracyRows.length, accuracyPageSize, accuracyPage]);

  const paginatedAccuracyRows = useMemo(() => {
    const start = (accuracyPage - 1) * accuracyPageSize;
    return filteredAccuracyRows.slice(start, start + accuracyPageSize);
  }, [filteredAccuracyRows, accuracyPage, accuracyPageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredFpRows.length / fpPageSize));
    if (fpPage > totalPages) {
      setFpPage(1);
    }
  }, [filteredFpRows.length, fpPageSize, fpPage]);

  const paginatedFpRows = useMemo(() => {
    const start = (fpPage - 1) * fpPageSize;
    return filteredFpRows.slice(start, start + fpPageSize);
  }, [filteredFpRows, fpPage, fpPageSize]);

  const badActorsBaseRows = useMemo(() => filteredInstances.filter(inst => inst.alertsCount > 0), [filteredInstances]);
  const badActorsFpsoOpts = useMemo(() => Array.from(new Set(badActorsBaseRows.map(i => i.fpsoCode))).filter(Boolean).sort(), [badActorsBaseRows]);
  const badActorsRuleOpts = useMemo(() => Array.from(new Set(badActorsBaseRows.map(i => i.ruleName))).filter(Boolean).sort(), [badActorsBaseRows]);
  const badActorsEquipOpts = useMemo(() => Array.from(new Set(badActorsBaseRows.map(i => i.equipmentCode))).filter(Boolean).sort(), [badActorsBaseRows]);

  // Calculate all Bad Actors occurrences (paginated in UI) with local column filters & sorting, strictly respecting global filters
  const badActorsList = useMemo(() => {
    const rows = badActorsBaseRows.filter(inst => {
      const matchFpso = badActorsFpsoSelected.length === 0 || badActorsFpsoSelected.length === badActorsFpsoOpts.length || badActorsFpsoSelected.includes(inst.fpsoCode);
      const matchRule = badActorsRuleSelected.length === 0 || badActorsRuleSelected.length === badActorsRuleOpts.length || badActorsRuleSelected.includes(inst.ruleName);
      const matchEquip = badActorsEquipSelected.length === 0 || badActorsEquipSelected.length === badActorsEquipOpts.length || badActorsEquipSelected.includes(inst.equipmentCode);
      return matchFpso && matchRule && matchEquip;
    });

    return [...rows].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (badActorsSortField === 'accuracy') { valA = a.accuracy ?? -1; valB = b.accuracy ?? -1; }
      else if (badActorsSortField === 'fpRate') { valA = a.fpRate ?? -1; valB = b.fpRate ?? -1; }
      else { valA = a.alertsCount; valB = b.alertsCount; }
      return badActorsSortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [
    badActorsBaseRows,
    badActorsFpsoSelected,
    badActorsFpsoOpts,
    badActorsRuleSelected,
    badActorsRuleOpts,
    badActorsEquipSelected,
    badActorsEquipOpts,
    badActorsSortField,
    badActorsSortDir,
  ]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(badActorsList.length / badActorsPageSize));
    if (badActorsPage > totalPages) {
      setBadActorsPage(1);
    }
  }, [badActorsList.length, badActorsPageSize, badActorsPage]);

  const paginatedBadActors = useMemo(() => {
    const start = (badActorsPage - 1) * badActorsPageSize;
    return badActorsList.slice(start, start + badActorsPageSize);
  }, [badActorsList, badActorsPage, badActorsPageSize]);

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
    if (period === 'Custom dates') return `${customFrom} to ${customTo}`;
    return period;
  }, [period, customFrom, customTo]);

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
        cumCorrect,
        cumFps,
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
    return trendData.map(d => ({
      label: d.label,
      accuracy: d.accuracy,
      count: d.eligibleForEmCount,
    }));
  }, [trendData]);

  const fpChartData = useMemo(() => {
    return trendData.map(d => ({
      label: d.label,
      falsePositives: d.falsePositives,
      count: d.rejectedCount,
    }));
  }, [trendData]);

  // Horizontal Ranked Bar Data for Alerts Treated by Monitoring Rule (supports 30+ rule groups with pagination)
  const { ruleAlertsChartData, totalRuleTreatedAlerts } = useMemo(() => {
    const { periodStart, periodEnd } = periodBoundaries;

    const activeCategoryList =
      selectedCategories.length > 0 && selectedCategories.length < CATEGORIES_LIST.length
        ? selectedCategories
        : CATEGORIES_LIST;

    const categoryMap: Record<string, { eligible: number; rejected: number }> = {};
    activeCategoryList.forEach(cat => {
      categoryMap[cat] = { eligible: 0, rejected: 0 };
    });

    alertsList.forEach(a => {
      const isEligible = a.status === 'eligible_for_em' || a.status === 'validated';
      const isRejected = a.status === 'rejected';
      if (!isEligible && !isRejected) return;
      if (selectedFpsos.length > 0 && selectedFpsos.length < allFpsos.length && !selectedFpsos.includes(a.fpsoCode)) {
        return;
      }
      if (selectedEquipments.length > 0 && selectedEquipments.length < equipments.length && !selectedEquipments.includes(a.equipmentCode)) {
        return;
      }
      const friendlyCat = getRuleFriendlyCategory(a.ruleName);
      if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES_LIST.length) {
        if (!selectedCategories.includes(friendlyCat)) return;
      }
      const tTime = new Date(a.triggeredAt).getTime();
      if (tTime < periodStart.getTime() || tTime > periodEnd.getTime()) return;

      if (!categoryMap[friendlyCat]) {
        categoryMap[friendlyCat] = { eligible: 0, rejected: 0 };
      }
      if (isEligible) categoryMap[friendlyCat].eligible += 1;
      else if (isRejected) categoryMap[friendlyCat].rejected += 1;
    });

    const totalTreated = Object.values(categoryMap).reduce(
      (sum, entry) => sum + entry.eligible + entry.rejected,
      0
    );

    const rankedList = Object.entries(categoryMap)
      .map(([group, entry]) => {
        const count = entry.eligible + entry.rejected;
        const percent = totalTreated > 0 ? (count / totalTreated) * 100 : 0;
        return {
          group,
          count,
          eligible: entry.eligible,
          rejected: entry.rejected,
          percent,
        };
      })
      .sort((a, b) => b.count - a.count || a.group.localeCompare(b.group));

    return { ruleAlertsChartData: rankedList, totalRuleTreatedAlerts: totalTreated };
  }, [alertsList, periodBoundaries, selectedFpsos, allFpsos, selectedEquipments, selectedCategories, equipments]);

  // Status chart data (Both counts and percentages available for rich tooltips)
  const statusAlertsChartData = useMemo(() => {
    return trendData.map(d => {
      const total = d.newCount + d.reviewInProgressCount + d.eligibleForEmCount + d.rejectedCount;
      const newPct = total > 0 ? parseFloat(((d.newCount / total) * 100).toFixed(1)) : 0;
      const revPct = total > 0 ? parseFloat(((d.reviewInProgressCount / total) * 100).toFixed(1)) : 0;
      const eligPct = total > 0 ? parseFloat(((d.eligibleForEmCount / total) * 100).toFixed(1)) : 0;
      const rejPct = total > 0 ? parseFloat(((d.rejectedCount / total) * 100).toFixed(1)) : 0;

      return {
        timeKey: d.label,
        'New': d.newCount,
        'Review in Progress': d.reviewInProgressCount,
        'Eligible for Event Manager': d.eligibleForEmCount,
        'Rejected': d.rejectedCount,
        _counts: {
          'New': d.newCount,
          'Review in Progress': d.reviewInProgressCount,
          'Eligible for Event Manager': d.eligibleForEmCount,
          'Rejected': d.rejectedCount,
        },
        _pcts: {
          'New': newPct,
          'Review in Progress': revPct,
          'Eligible for Event Manager': eligPct,
          'Rejected': rejPct,
        },
        _total: total,
      };
    });
  }, [trendData]);

  const totalStatusAlerts = useMemo(() => {
    return trendData.reduce(
      (sum, d) => sum + d.newCount + d.reviewInProgressCount + d.eligibleForEmCount + d.rejectedCount,
      0
    );
  }, [trendData]);

  const activeFpsos = useMemo(() => {
    return selectedFpsos.length > 0 && selectedFpsos.length < allFpsos.length
      ? [...selectedFpsos].sort()
      : allFpsos;
  }, [selectedFpsos, allFpsos]);

  // Days to Treat an Alert (Average) composed chart data - per FPSO bars + Fleet weighted average line
  const daysToTreatData = useMemo(() => {
    const { buckets } = periodBoundaries;

    return buckets.map(({ label, start, end }) => {
      const bucketTreated = alertsList.filter(a => {
        if (!activeFpsos.includes(a.fpsoCode)) return false;
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

      let fleetAvg = 0;
      if (bucketTreated.length > 0) {
        const totalDays = bucketTreated.reduce((sum, a) => {
          const diffDays = Math.max(0, (new Date(a.reviewedAt!).getTime() - new Date(a.triggeredAt).getTime()) / 86400000);
          return sum + diffDays;
        }, 0);
        fleetAvg = parseFloat((totalDays / bucketTreated.length).toFixed(1));
      }

      const point: {
        label: string;
        Fleet: number;
        _counts?: Record<string, number>;
        _totalAlerts?: number;
        [fpsoCode: string]: number | string | Record<string, number> | undefined;
      } = {
        label,
        Fleet: fleetAvg,
        _counts: {},
        _totalAlerts: bucketTreated.length,
      };

      activeFpsos.forEach(fpso => {
        const fpsoAlerts = bucketTreated.filter(a => a.fpsoCode === fpso);
        point._counts![fpso] = fpsoAlerts.length;
        if (fpsoAlerts.length > 0) {
          const fpsoTotalDays = fpsoAlerts.reduce((sum, a) => {
            const diffDays = Math.max(0, (new Date(a.reviewedAt!).getTime() - new Date(a.triggeredAt).getTime()) / 86400000);
            return sum + diffDays;
          }, 0);
          point[fpso] = parseFloat((fpsoTotalDays / fpsoAlerts.length).toFixed(1));
        } else {
          point[fpso] = 0;
        }
      });

      return point;
    });
  }, [alertsList, periodBoundaries, activeFpsos, selectedEquipments, selectedCategories, equipments]);

  // Alerts per Responsible (All 4 statuses: Eligible for EM, Rejected, Review in Progress & New under 'Unassigned') stacked bar chart data
  const alertsPerResponsibleData = useMemo(() => {
    const { periodStart, periodEnd } = periodBoundaries;

    // Collect all known responsibles (defaults + any others present in the DB)
    const responsibleSet = new Set<string>(DEFAULT_RESPONSIBLES);
    alertsList.forEach(a => {
      const formatted = formatResponsibleName(a.reviewedBy);
      if (formatted && formatted !== 'Unassigned') responsibleSet.add(formatted);
    });

    const sortedResponsibles = [...Array.from(responsibleSet).sort((a, b) => a.localeCompare(b)), 'Unassigned'];
    const countsMap: Record<string, { eligible: number; rejected: number; reviewInProgress: number; newCount: number }> = {};
    sortedResponsibles.forEach(r => {
      countsMap[r] = { eligible: 0, rejected: 0, reviewInProgress: 0, newCount: 0 };
    });

    alertsList.forEach(a => {
      const isEligible = a.status === 'eligible_for_em' || a.status === 'validated';
      const isRejected = a.status === 'rejected';
      const isReviewInProgress = a.status === 'review_in_progress' || a.status === 'validation_in_progress';
      const isNew = a.status === 'new' || a.status === 'to_be_validated';
      if (!isEligible && !isRejected && !isReviewInProgress && !isNew) return;
      if (!activeFpsos.includes(a.fpsoCode)) return;
      if (selectedEquipments.length > 0 && selectedEquipments.length < equipments.length && !selectedEquipments.includes(a.equipmentCode)) {
        return;
      }
      if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES_LIST.length) {
        const friendlyCat = getRuleFriendlyCategory(a.ruleName);
        if (!selectedCategories.includes(friendlyCat)) return;
      }
      const tTime = new Date(a.triggeredAt).getTime();
      if (tTime < periodStart.getTime() || tTime > periodEnd.getTime()) return;

      const targetResponsible = isNew ? 'Unassigned' : (formatResponsibleName(a.reviewedBy) || 'Unassigned');
      if (!countsMap[targetResponsible]) {
        countsMap[targetResponsible] = { eligible: 0, rejected: 0, reviewInProgress: 0, newCount: 0 };
      }
      if (isEligible) countsMap[targetResponsible].eligible += 1;
      else if (isRejected) countsMap[targetResponsible].rejected += 1;
      else if (isReviewInProgress) countsMap[targetResponsible].reviewInProgress += 1;
      else if (isNew) countsMap[targetResponsible].newCount += 1;
    });

    return sortedResponsibles.map(responsible => {
      const entry = countsMap[responsible] || { eligible: 0, rejected: 0, reviewInProgress: 0, newCount: 0 };
      return {
        responsible,
        eligible: entry.eligible,
        rejected: entry.rejected,
        reviewInProgress: entry.reviewInProgress,
        newCount: entry.newCount,
        total: entry.eligible + entry.rejected + entry.reviewInProgress + entry.newCount,
      };
    });
  }, [alertsList, periodBoundaries, activeFpsos, selectedEquipments, selectedCategories, equipments]);

  const totalResponsibleAlerts = useMemo(() => {
    return alertsPerResponsibleData.reduce((sum, item) => sum + item.total, 0);
  }, [alertsPerResponsibleData]);

  // Alerts by System (All 4 statuses: Eligible for Event Manager, Rejected, Review in Progress, New) stacked bar chart data (sorted descending by volume)
  const alertsBySystemData = useMemo(() => {
    const { periodStart, periodEnd } = periodBoundaries;

    const systemSet = new Set<string>(DEFAULT_SYSTEMS);
    alertsList.forEach(a => {
      if (a.system) systemSet.add(a.system);
    });

    const countsMap: Record<string, { eligible: number; rejected: number; reviewInProgress: number; newCount: number }> = {};
    systemSet.forEach(s => {
      countsMap[s] = { eligible: 0, rejected: 0, reviewInProgress: 0, newCount: 0 };
    });

    alertsList.forEach(a => {
      const isEligible = a.status === 'eligible_for_em' || a.status === 'validated';
      const isRejected = a.status === 'rejected';
      const isReviewInProgress = a.status === 'review_in_progress' || a.status === 'validation_in_progress';
      const isNew = a.status === 'new' || a.status === 'to_be_validated';
      if (!isEligible && !isRejected && !isReviewInProgress && !isNew) return;
      if (!activeFpsos.includes(a.fpsoCode)) return;
      if (selectedEquipments.length > 0 && selectedEquipments.length < equipments.length && !selectedEquipments.includes(a.equipmentCode)) {
        return;
      }
      if (selectedCategories.length > 0 && selectedCategories.length < CATEGORIES_LIST.length) {
        const friendlyCat = getRuleFriendlyCategory(a.ruleName);
        if (!selectedCategories.includes(friendlyCat)) return;
      }
      const tTime = new Date(a.triggeredAt).getTime();
      if (tTime < periodStart.getTime() || tTime > periodEnd.getTime()) return;

      const sys = a.system || 'Utility System';
      if (!countsMap[sys]) {
        countsMap[sys] = { eligible: 0, rejected: 0, reviewInProgress: 0, newCount: 0 };
      }
      if (isEligible) countsMap[sys].eligible += 1;
      else if (isRejected) countsMap[sys].rejected += 1;
      else if (isReviewInProgress) countsMap[sys].reviewInProgress += 1;
      else if (isNew) countsMap[sys].newCount += 1;
    });

    return Array.from(systemSet)
      .map(system => {
        const entry = countsMap[system] || { eligible: 0, rejected: 0, reviewInProgress: 0, newCount: 0 };
        const total = entry.eligible + entry.rejected + entry.reviewInProgress + entry.newCount;
        return {
          system,
          shortLabel: SYSTEM_SHORT_LABELS[system] || system,
          eligible: entry.eligible,
          rejected: entry.rejected,
          reviewInProgress: entry.reviewInProgress,
          newCount: entry.newCount,
          total,
        };
      })
      .sort((a, b) => b.total - a.total || a.system.localeCompare(b.system));
  }, [alertsList, periodBoundaries, activeFpsos, selectedEquipments, selectedCategories, equipments]);

  const totalSystemAlerts = useMemo(() => {
    return alertsBySystemData.reduce((sum, item) => sum + item.total, 0);
  }, [alertsBySystemData]);

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
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'bg-[#1E293B] text-white font-medium shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Export
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

      {/* Global KPI Cards: Only displayed on Overview & Trends and Alerts Treated tabs */}
      {activeTab !== 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KpiCard
            title="Accuracy"
            value={globalAccuracy}
            subtitle={periodSubtitle}
            formula="(Eligible for Event Manager) / (Eligible for Event Manager + Rejected) × 100"
            tooltip="Percentage of treated alerts confirmed as true positives relative to the total number of resolved alerts."
            statusList={['Eligible for Event Manager', 'Rejected']}
          />
          <KpiCard
            title="False Positive Rate"
            value={globalFalsePositiveRate}
            subtitle={periodSubtitle}
            formula="(Rejected) / (Eligible for Event Manager + Rejected) × 100"
            tooltip="Percentage of treated alerts discarded as false positives relative to the total number of resolved alerts."
            statusList={['Rejected', 'Eligible for Event Manager']}
          />
          <KpiCard
            title="Avg. Time to Treat"
            value={avgDaysToTreat}
            subtitle={periodSubtitle}
            formula="∑(ReviewedAt - TriggeredAt) / Total Treated"
            tooltip="Average lead time in days for an operator to resolve an alert from creation to review completion."
            statusList={['Eligible for Event Manager', 'Rejected']}
          />
        </div>
      )}

      {activeTab === 'overview' && (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Accuracy Over Time */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-text-primary">Accuracy Over Time</h3>
                    <InfoTooltip
                      title="Accuracy Over Time"
                      formula="(Cumulative Eligible for Event Manager / Cumulative Total Treated) × 100"
                      description="Cumulative progression of accuracy across time intervals for the active filter."
                      statusList={['Eligible for Event Manager', 'Rejected']}
                    />
                  </div>
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
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-text-primary">False Positive Over Time</h3>
                    <InfoTooltip
                      title="False Positive Over Time"
                      formula="(Cumulative Rejected / Cumulative Total Treated) × 100"
                      description="Cumulative progression of the proportion of rejected alerts (noise) over time."
                      statusList={['Rejected', 'Eligible for Event Manager']}
                    />
                  </div>
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
            <div className="bg-bg-card border border-border-panel rounded-card">
              <div className="px-4 py-3 border-b border-border-panel flex items-center justify-between relative z-20">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-text-primary">Accuracy Breakdown by Instance</h3>
                  <InfoTooltip
                    side="bottom"
                    title="Accuracy Breakdown"
                    formula="(Eligible for Event Manager) / Total Evaluations × 100"
                    description="Individual accuracy for each monitoring rule and asset instance in the filtered period."
                    statusList={['Eligible for Event Manager', 'Rejected']}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap">
                        FPSO
                        <ColumnFilterDropdown
                          title="FPSO"
                          options={accuracyFpsoOpts}
                          selectedValues={accuracyFpsoSelected.length === 0 ? accuracyFpsoOpts : accuracyFpsoSelected}
                          onChange={setAccuracyFpsoSelected}
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
                    {paginatedAccuracyRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-muted italic bg-bg-panel/5">No instances found</td>
                      </tr>
                    ) : (
                      paginatedAccuracyRows.map(inst => (
                        <tr key={inst.id} className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors">
                          <td className="px-4 py-3 text-[#CBD5E1] font-mono">{inst.fpsoCode}</td>
                          <td className="px-4 py-3 text-[#CBD5E1] font-normal">{inst.ruleName}</td>
                          <td className="px-4 py-3 text-[#CBD5E1] font-mono">{inst.equipmentCode}</td>
                          <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{inst.totalEvaluations}</td>
                          <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{inst.correctActions}</td>
                          <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{inst.accuracy !== null ? `${inst.accuracy}%` : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredAccuracyRows.length > 0 && (
                <Pagination
                  total={filteredAccuracyRows.length}
                  page={accuracyPage}
                  pageSize={accuracyPageSize}
                  onPageChange={setAccuracyPage}
                  onPageSizeChange={setAccuracyPageSize}
                />
              )}
            </div>

            {/* False Positive Breakdown Table Card */}
            <div className="bg-bg-card border border-border-panel rounded-card">
              <div className="px-4 py-3 border-b border-border-panel flex items-center justify-between relative z-20">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-text-primary">False Positive Breakdown by Instance</h3>
                  <InfoTooltip
                    side="bottom"
                    title="False Positive Breakdown"
                    formula="FP Rate = Rejected / Total Evaluations × 100"
                    description="Breakdown of discarded alerts (false positives) and noise rate per monitoring rule and asset."
                    statusList={['Rejected', 'Eligible for Event Manager']}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
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
                    {paginatedFpRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-muted italic bg-bg-panel/5">No instances found</td>
                      </tr>
                    ) : (
                      paginatedFpRows.map(inst => (
                        <tr key={inst.id} className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors">
                          <td className="px-4 py-3 text-[#CBD5E1] font-mono">{inst.fpsoCode}</td>
                          <td className="px-4 py-3 text-[#CBD5E1] font-normal">{inst.ruleName}</td>
                          <td className="px-4 py-3 text-[#CBD5E1] font-mono">{inst.equipmentCode}</td>
                          <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{inst.totalEvaluations}</td>
                          <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{inst.falsePositives}</td>
                          <td className="px-4 py-3 text-right text-[#CBD5E1] font-mono">{inst.fpRate !== null ? `${inst.fpRate}%` : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {filteredFpRows.length > 0 && (
                <Pagination
                  total={filteredFpRows.length}
                  page={fpPage}
                  pageSize={fpPageSize}
                  onPageChange={setFpPage}
                  onPageSizeChange={setFpPageSize}
                />
              )}
            </div>
          </div>

          {/* Bottom Section: Bad Actors List Card */}
          <div className="bg-bg-card border border-border-panel rounded-card mt-6">
            <div className="px-4 py-3 border-b border-border-panel flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-text-primary">Bad Actors List</h3>
                  <InfoTooltip
                    side="bottom"
                    title="Bad Actors List"
                    formula="Top rules ranked by highest alert volume"
                    description="Ranking of rule instances with the highest trigger frequency and noise (Rejected), respecting global FPSO, period, asset, and category filters."
                    statusList={['Eligible for Event Manager', 'Rejected', 'Review in Progress', 'New']}
                  />
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">Most active rule configurations across FPSOs filtered by global criteria</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8] font-mono">
                  Total: {badActorsList.length} rules
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-panel bg-bg-panel/40 select-none sticky top-0 z-10 backdrop-blur-md">
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap w-28">
                      FPSO
                      <ColumnFilterDropdown
                        title="FPSO"
                        options={badActorsFpsoOpts}
                        selectedValues={badActorsFpsoSelected.length === 0 ? badActorsFpsoOpts : badActorsFpsoSelected}
                        onChange={setBadActorsFpsoSelected}
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap min-w-[260px]">
                      Rule
                      <ColumnFilterDropdown
                        title="Rule"
                        options={badActorsRuleOpts}
                        selectedValues={badActorsRuleSelected.length === 0 ? badActorsRuleOpts : badActorsRuleSelected}
                        onChange={setBadActorsRuleSelected}
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap w-40">
                      Asset
                      <ColumnFilterDropdown
                        title="Asset"
                        options={badActorsEquipOpts}
                        selectedValues={badActorsEquipSelected.length === 0 ? badActorsEquipOpts : badActorsEquipSelected}
                        onChange={setBadActorsEquipSelected}
                      />
                    </th>
                    <th
                      onClick={() => toggleBadActorsSort('accuracy')}
                      className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap w-24 cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group select-none"
                    >
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <span>Accuracy</span>
                        {badActorsSortField === 'accuracy' ? (
                          badActorsSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-primary" /> : <ArrowDown className="w-3 h-3 text-brand-primary" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleBadActorsSort('fpRate')}
                      className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap w-24 cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group select-none"
                    >
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <span>FP Rate</span>
                        {badActorsSortField === 'fpRate' ? (
                          badActorsSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-status-warn" /> : <ArrowDown className="w-3 h-3 text-status-warn" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => toggleBadActorsSort('alerts')}
                      className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap w-24 cursor-pointer hover:bg-bg-panel/60 hover:text-white transition-colors group select-none"
                    >
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <span>Alerts</span>
                        {badActorsSortField === 'alerts' ? (
                          badActorsSortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-brand-primary" /> : <ArrowDown className="w-3 h-3 text-brand-primary" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {paginatedBadActors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-text-muted italic bg-bg-panel/5">
                        No active bad actor rules found for the selected filters and time period.
                      </td>
                    </tr>
                  ) : (
                    paginatedBadActors.map(inst => (
                      <tr
                        key={inst.id}
                        className="border-b border-border-panel hover:bg-bg-panel/10 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-[#CBD5E1]">
                          {inst.fpsoCode}
                        </td>
                        <td className="py-3 px-4 text-[#CBD5E1] font-normal max-w-[320px] truncate" title={inst.ruleName}>
                          {inst.ruleName}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#CBD5E1]">
                          {inst.equipmentCode}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#CBD5E1]">
                          {inst.accuracy !== null ? `${inst.accuracy}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#CBD5E1]">
                          {inst.fpRate !== null ? `${inst.fpRate}%` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#CBD5E1]">
                          {inst.alertsCount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {badActorsList.length > 0 && (
              <Pagination
                total={badActorsList.length}
                page={badActorsPage}
                pageSize={badActorsPageSize}
                onPageChange={setBadActorsPage}
                onPageSizeChange={setBadActorsPageSize}
              />
            )}
          </div>
        </>
      )}

      {activeTab === 'bad_actors' && (
        <div className="space-y-6">
          {/* Top Section: Days to Treat an Alert (Average) */}
          <div className="bg-bg-card border border-border-panel rounded-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                    Days to Treat an Alert (Average)
                  </h3>
                  <InfoTooltip
                    title="Days to Treat an Alert (Average)"
                    formula="∑(ReviewedAt - TriggeredAt) / Total Treated"
                    description="Average lead time in days per FPSO and weighted Fleet average from alert creation to operator resolution."
                    statusList={['Eligible for Event Manager', 'Rejected']}
                  />
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Monthly lead time in days per FPSO and Fleet Average from creation to operator resolution
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#94A3B8] bg-[#0B0F19] px-2.5 py-1 rounded-md border border-[#1E293B]">
                  Average: <strong className="text-white">{avgDaysToTreat}</strong>
                </span>
                <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
              </div>
            </div>
            <DaysToTreatChart data={daysToTreatData} fpsos={activeFpsos} />
          </div>

          {/* Middle Section: 2 Charts Grid (Status & Rule Type) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alerts by Status */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-text-primary">Alerts by Status</h3>
                  <InfoTooltip
                    title="Alerts by Status"
                    formula="∑(All Alerts) per Status"
                    description="Distribution of alerts across official lifecycle statuses for the selected time period."
                    statusList={['Eligible for Event Manager', 'Rejected', 'Review in Progress', 'New']}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#94A3B8] bg-[#0B0F19] px-2.5 py-1 rounded-md border border-[#1E293B] whitespace-nowrap">
                    Total: <strong className="text-white">{totalStatusAlerts} alerts</strong>
                  </span>
                  <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                  <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                </div>
              </div>
              <StatusAlertsChart data={statusAlertsChartData} />
            </div>

            {/* Alerts Treated by Monitoring Rule */}
            <div className="bg-bg-card border border-border-panel rounded-card p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-text-primary">Alerts Treated by Monitoring Rule</h3>
                  <InfoTooltip
                    title="Alerts Treated by Monitoring Rule"
                    formula="∑(Eligible for Event Manager + Rejected) per Rule Group"
                    description="Volume and percentage share of treated alerts across all active monitoring rule groups."
                    statusList={['Eligible for Event Manager', 'Rejected']}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#94A3B8] bg-[#0B0F19] px-2.5 py-1 rounded-md border border-[#1E293B] whitespace-nowrap">
                    Total: <strong className="text-white">{totalRuleTreatedAlerts} alerts</strong>
                  </span>
                  <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                  <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                </div>
              </div>
              <RuleAlertsChart data={ruleAlertsChartData} />
            </div>
          </div>

          {/* Bottom Section: 2-Column Grid for Alerts by Responsible & Alerts by System */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alerts by Responsible */}
            <div className="bg-bg-card border border-border-panel rounded-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                      Alerts by Responsible
                    </h3>
                    <InfoTooltip
                      title="Alerts by Responsible"
                      formula="∑(All Alerts) per Reviewer & Unassigned"
                      description="Volume of alerts across all lifecycle statuses per responsible reviewer, with New alerts grouped under Unassigned."
                      statusList={['Eligible for Event Manager', 'Rejected', 'Review in Progress', 'New']}
                    />
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Volume of alerts per responsible reviewer and unassigned backlog across all statuses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#94A3B8] bg-[#0B0F19] px-2.5 py-1 rounded-md border border-[#1E293B] whitespace-nowrap">
                    Total: <strong className="text-white">{totalResponsibleAlerts} alerts</strong>
                  </span>
                  <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                  <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                </div>
              </div>
              <AlertsPerResponsibleChart data={alertsPerResponsibleData} />
            </div>

            {/* Alerts by System */}
            <div className="bg-bg-card border border-border-panel rounded-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary tracking-tight">
                      Alerts by System
                    </h3>
                    <InfoTooltip
                      title="Alerts by System"
                      formula="∑(All Alerts) per System"
                      description="Distribution of alerts across all lifecycle statuses grouped by monitored process system in descending order of volume."
                      statusList={['Eligible for Event Manager', 'Rejected', 'Review in Progress', 'New']}
                    />
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Volume of alerts across all statuses per monitored system
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#94A3B8] bg-[#0B0F19] px-2.5 py-1 rounded-md border border-[#1E293B] whitespace-nowrap">
                    Total: <strong className="text-white">{totalSystemAlerts} alerts</strong>
                  </span>
                  <SlidersHorizontal size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                  <Maximize2 size={14} className="text-text-muted cursor-pointer hover:text-text-primary transition-colors" />
                </div>
              </div>
              <AlertsBySystemChart data={alertsBySystemData} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="bg-bg-card border border-border-panel rounded-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-panel">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="text-brand-primary" size={20} />
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Executive Analytics Report Export
                </h3>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Generate a publication-ready PDF report summarizing surveillance performance, active filter scopes, KPI benchmarks, and bad actors.
              </p>
            </div>
            <div>
              <button
                type="button"
                disabled={isExporting}
                onClick={async () => {
                  try {
                    setIsExporting(true);
                    setExportSuccess(false);

                    const payload = {
                      filters: {
                        fpsos: selectedFpsos.length === 0 || selectedFpsos.length === allFpsos.length ? 'All FPSOs' : selectedFpsos.join(', '),
                        period: periodSubtitle,
                        equipments: selectedEquipments.length === 0 || selectedEquipments.length === equipments.length ? 'All Assets' : `${selectedEquipments.length} selected assets`,
                        categories: selectedCategories.length === 0 || selectedCategories.length === CATEGORIES_LIST.length ? 'All Categories' : selectedCategories.join(', '),
                      },
                      kpis: {
                        accuracy: globalAccuracy,
                        fpRate: globalFalsePositiveRate,
                        avgDays: avgDaysToTreat,
                      },
                      badActors: badActorsList.slice(0, 10).map(b => ({
                        fpsoCode: b.fpsoCode,
                        ruleName: b.ruleName,
                        equipmentCode: b.equipmentCode,
                        accuracy: b.accuracy,
                        fpRate: b.fpRate,
                        alertsCount: b.alertsCount,
                      })),
                      alertsBySystem: alertsBySystemData.map(s => ({
                        system: s.system,
                        eligible: s.eligible,
                        rejected: s.rejected,
                        reviewInProgress: s.reviewInProgress,
                        total: s.total,
                      })),
                    };

                    const res = await fetch('/api/export-analytics-report', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    });

                    if (!res.ok) throw new Error('Failed to download report');

                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);

                    setExportSuccess(true);
                    setTimeout(() => setExportSuccess(false), 4000);
                  } catch (err) {
                    console.error('Error generating report:', err);
                    alert('Failed to generate PDF report. Please try again.');
                  } finally {
                    setIsExporting(false);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Rendering PDF...</span>
                  </>
                ) : exportSuccess ? (
                  <>
                    <CheckCircle2 size={15} className="text-emerald-300" />
                    <span>Report Downloaded!</span>
                  </>
                ) : (
                  <>
                    <FileDown size={15} />
                    <span>Download PDF Report</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Filter Scope Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-6">
            <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5">
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1">FPSO Fleet</span>
              <span className="text-xs font-semibold text-white truncate block">
                {selectedFpsos.length === 0 || selectedFpsos.length === allFpsos.length ? 'All FPSOs' : selectedFpsos.join(', ')}
              </span>
            </div>
            <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5">
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1">Period</span>
              <span className="text-xs font-semibold text-white truncate block">
                {periodSubtitle}
              </span>
            </div>
            <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5">
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1">Monitored Assets</span>
              <span className="text-xs font-semibold text-white truncate block">
                {selectedEquipments.length === 0 || selectedEquipments.length === equipments.length ? 'All Assets' : `${selectedEquipments.length} Assets`}
              </span>
            </div>
            <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5">
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block mb-1">Rule Categories</span>
              <span className="text-xs font-semibold text-white truncate block">
                {selectedCategories.length === 0 || selectedCategories.length === CATEGORIES_LIST.length ? 'All Categories' : selectedCategories.join(', ')}
              </span>
            </div>
          </div>

          {/* Summary Preview Box */}
          <div className="bg-[#0B0F19]/60 border border-[#1E293B] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Report Content Preview</h4>
            <ul className="text-xs text-[#94A3B8] space-y-1.5 list-disc pl-4">
              <li><strong>Executive KPI Scorecard:</strong> Accuracy ({globalAccuracy}), False Positive Rate ({globalFalsePositiveRate}), and Lead Time ({avgDaysToTreat}).</li>
              <li><strong>Top 10 Bad Actor Rules:</strong> Filtered ranking by volume and nuisance alarm frequency.</li>
              <li><strong>Process System Distribution:</strong> Complete cross-tabulation across gas, water injection, utilities, crude oil, and power generation systems.</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
