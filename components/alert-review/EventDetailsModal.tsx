'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { X, Info, Wrench, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import StatusBadge, { Status } from '@/components/ui/StatusBadge';

const ALL_STATUSES: Status[] = ['to_be_validated', 'validation_in_progress', 'validated', 'rejected'];

interface AlertRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  ruleName: string;
  ruleDescription?: string | null;
  timeseries?: string;
  type?: string;
  source?: string;
  endDate: string;
  endDateRaw?: string;
  triggeredAt: string;
  triggeredAtRaw?: string;
  reviewedAt: string;
  reviewedBy: string;
  status: Status;
  tier?: string | null;
  eventId?: string | null;
  eventDescription?: string | null;
  comment?: string | null;
  processingSteps?: Record<string, unknown> | null;
  [key: string]: unknown;
}

interface EventDetailsModalProps {
  open: boolean;
  onClose: () => void;
  alert: AlertRow | null;
  allAlerts?: AlertRow[];
  statusScope?: 'for_validation' | 'validated_alerts';
  onStatusChange?: (id: number, newStatus: Status, comment?: string, tier?: string) => Promise<void>;
}

export function getTimeseriesDescription(
  timeseriesTag?: string,
  _equipmentCode?: string,
  ruleDescription?: string | null
): string {
  if (!timeseriesTag) return 'Compressor Continuous Condition Monitoring Sensor';
  const tagUpper = timeseriesTag.toUpperCase();

  // Vibration
  if (tagUpper.includes('-VI-') || tagUpper.includes('_VI_') || tagUpper.includes('VIB')) {
    const axis = tagUpper.endsWith('_X') ? ' (Radial X-Axis)' : tagUpper.endsWith('_Y') ? ' (Radial Y-Axis)' : tagUpper.endsWith('_Z') ? ' (Axial Z-Axis)' : '';
    return `Compressor Drive End Radial Vibration Sensor${axis}`;
  }

  // Differential Pressure
  if (tagUpper.includes('-PDIT-') || tagUpper.includes('-PDI-') || tagUpper.includes('DP') || tagUpper.includes('DIFF_PRESS')) {
    return 'Duplex Coalescent Filter Differential Pressure Transmitter';
  }

  // Pressure
  if (tagUpper.includes('-PI-') || tagUpper.includes('-PIT-') || tagUpper.includes('PRESS')) {
    return 'First Stage Discharge Pressure Transmitter';
  }

  // Temperature
  if (tagUpper.includes('-TI-') || tagUpper.includes('-TIT-') || tagUpper.includes('TEMP')) {
    return 'Seal Gas Heater Process Temperature Sensor';
  }

  // Flow
  if (tagUpper.includes('-FI-') || tagUpper.includes('-FIT-') || tagUpper.includes('FLOW')) {
    return 'Suction Process Gas Flow Transmitter';
  }

  if (ruleDescription && ruleDescription.length > 5 && !ruleDescription.toLowerCase().includes('gearbox')) {
    return ruleDescription;
  }

  return 'Compressor Continuous Condition Monitoring Sensor';
}

export function getAlertType(alert: AlertRow): string {
  if (alert.source === 'Seeq') return 'Seeq Analytics Alert';
  if (alert.source === 'Pre Warnings Ops' || alert.source === 'PreWarningOps') return 'Pre-Warning Operational Alert';

  const name = (alert.ruleName || '').toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'Spike Detection Alert';
  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR') || name.includes('MGN')) return 'Surge Margin Alert';
  if (name.includes('TRND') || name.includes('TREND') || name.includes('DEV') || name.includes('TEMP_DEV')) return 'Trend Analysis Alert';
  if (name.includes('FOUL') || name.includes('DP') || name.includes('HTEX') || name.includes('NORM')) return 'Normalized dP Alert';
  if (name.includes('DRFT') || name.includes('DRIFT')) return 'Drift Detection Alert';
  if (name.includes('ML') || name.includes('AI')) return 'AI/ML Anomaly Alert';

  return (alert.type && alert.type !== 'Surge Margin Alert') ? alert.type : 'Monitoring Alert';
}

export function formatUtcDateTime(raw?: string | null): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export function formatDateTimeSecond(ms: number | string): string {
  if (!ms) return '—';
  const d = new Date(ms);
  if (isNaN(d.getTime())) return String(ms);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

/** Extract threshold numerical value and human-readable label from rule processingSteps or fallback heuristics */
export function getRuleThresholdInfo(alert: AlertRow): { value: number; label: string; yRatio: number } {
  const name = (alert.ruleName || '').toUpperCase();
  const ps = alert.processingSteps as Record<string, unknown> | undefined;

  // Check processingSteps JSON structure if available
  if (ps) {
    const triggerParams = (ps.rule_trigger_params as Array<Record<string, unknown>>) || [];
    if (triggerParams.length > 0) {
      const p = triggerParams[0];
      if (p.threshold_comparison) {
        const tc = p.threshold_comparison as { value?: number; operator?: string };
        if (tc.value !== undefined && tc.value !== null) {
          return {
            value: tc.value,
            label: `Threshold (${tc.operator === 'gt' ? '>' : tc.operator === 'lt' ? '<' : '≥'} ${tc.value})`,
            yRatio: 0.35,
          };
        }
      }
      if (p.spike_detection) {
        const sd = p.spike_detection as { threshold?: number };
        if (sd.threshold !== undefined && sd.threshold !== null) {
          return {
            value: sd.threshold,
            label: `Spike Threshold (${sd.threshold})`,
            yRatio: 0.30,
          };
        }
      }
    }
    if (typeof ps.threshold === 'number') {
      return {
        value: ps.threshold,
        label: `Threshold (${ps.threshold})`,
        yRatio: 0.35,
      };
    }
  }

  // Fallback default threshold based on rule name pattern
  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR')) {
    return { value: 150, label: 'Threshold (150 mm/s)', yRatio: 0.35 };
  }
  if (name.includes('SPK') || name.includes('SPIKE')) {
    return { value: 2.5, label: 'Spike Threshold (2.5σ)', yRatio: 0.30 };
  }
  if (name.includes('TEMP') || name.includes('TRND')) {
    return { value: 85, label: 'Trend Threshold (85°C)', yRatio: 0.40 };
  }
  if (name.includes('DP') || name.includes('NORM')) {
    return { value: 1.8, label: 'dP Limit (1.8 bar)', yRatio: 0.32 };
  }

  return { value: 10, label: 'Threshold (10.0)', yRatio: 0.35 };
}

// Official SLB sample time series raw values (matches waveform in reference image)
const SLB_CHART_VALUES = [
  44, 50, 56, 96, 28, 33, 38, 9, 36, 30, 54, 58, 72,
  46, 52, 60, 42, 38, 92, 40, 25, 12, 34, 48, 64, 55,
  40, 45, 50, 88, 30, 35, 11, 29, 52, 61, 68
];

export default function EventDetailsModal({
  open,
  onClose,
  alert,
  allAlerts = [],
  statusScope = 'for_validation',
  onStatusChange,
}: EventDetailsModalProps) {
  const [commentText, setCommentText] = React.useState<string>('');
  const [commentError, setCommentError] = React.useState<string | null>(null);
  const [showValidateConfirm, setShowValidateConfirm] = useState<boolean>(false);

  // Drag-to-pan horizontal state
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);

  // Time Range Selection State
  const [customRangeStart, setCustomRangeStart] = useState<string>('');
  const [customRangeEnd, setCustomRangeEnd] = useState<string>('');
  const [appliedRangeStart, setAppliedRangeStart] = useState<number | null>(null);
  const [appliedRangeEnd, setAppliedRangeEnd] = useState<number | null>(null);
  const [isTimeRangeOpen, setIsTimeRangeOpen] = useState<boolean>(false);
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(false);
  const timeRangeRef = useRef<HTMLDivElement>(null);

  // Close time range popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (timeRangeRef.current && !timeRangeRef.current.contains(e.target as Node)) {
        setIsTimeRangeOpen(false);
      }
    }
    if (isTimeRangeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTimeRangeOpen]);

  // Alert History: Up to 5 previous alerts for this rule and asset
  const alertHistory = useMemo(() => {
    if (!alert) return [];
    return allAlerts
      .filter(a => a.id !== alert.id && a.equipmentCode === alert.equipmentCode && a.ruleName === alert.ruleName)
      .sort((a, b) => {
        const timeA = new Date(a.triggeredAtRaw || a.triggeredAt).getTime() || 0;
        const timeB = new Date(b.triggeredAtRaw || b.triggeredAt).getTime() || 0;
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [allAlerts, alert]);

  // Base timeframe from alert dates
  const { alertStartMs, alertEndMs } = useMemo(() => {
    if (!alert) {
      const now = Date.now();
      return { alertStartMs: now - 4 * 86400000, alertEndMs: now };
    }
    const s = new Date(alert.triggeredAtRaw || alert.triggeredAt).getTime();
    const e = new Date(alert.endDateRaw || alert.endDate).getTime();
    const validStart = !isNaN(s) ? s : Date.now() - 4 * 86400000;
    let validEnd = !isNaN(e) ? e : validStart + 4 * 86400000;
    if (validEnd <= validStart) {
      validEnd = validStart + 4 * 86400000;
    }
    return { alertStartMs: validStart, alertEndMs: validEnd };
  }, [alert]);

  React.useEffect(() => {
    if (alert) {
      setCommentText((alert.comment as string) || '');
      setCommentError(null);
      setShowValidateConfirm(false);
      setPanOffset(0);
      setAppliedRangeStart(null);
      setAppliedRangeEnd(null);
      setCustomRangeStart(new Date(alertStartMs).toISOString().slice(0, 16));
      setCustomRangeEnd(new Date(alertEndMs).toISOString().slice(0, 16));
      setIsTimeRangeOpen(false);
      setIsChartExpanded(false);
    }
  }, [alert, alertStartMs, alertEndMs]);

  // Resolve selected timeframe [rangeStartMs, rangeEndMs]
  const { rangeStartMs, rangeEndMs, rangeDurationMs, rangeLabel } = useMemo(() => {
    const s = appliedRangeStart !== null ? appliedRangeStart : alertStartMs;
    const e = appliedRangeEnd !== null ? appliedRangeEnd : alertEndMs;
    const duration = Math.max(e - s, 3600000);
    const label = `${formatDateTimeSecond(s)} - ${formatDateTimeSecond(e)}`;
    return { rangeStartMs: s, rangeEndMs: e, rangeDurationMs: duration, rangeLabel: label };
  }, [appliedRangeStart, appliedRangeEnd, alertStartMs, alertEndMs]);

  if (!alert) return null;

  const ruleId = alert.ruleName || 'COCE_GEN_SPK_01';
  const timeseriesTag = alert.timeseries ? `pi:${alert.timeseries}` : `pi:${alert.fpso}:FPSO:771-PI-1868_A`;
  const failureMode = alert.ruleDescription || 'HH vibration or HH temperatures on gearbox component';
  const formattedStartDate = formatUtcDateTime(alert.triggeredAtRaw || alert.triggeredAt);
  const formattedEndDate = formatUtcDateTime(alert.endDateRaw || alert.endDate);

  const validationDateDisplay = (alert.status === 'validated' || alert.status === 'rejected')
    ? (alert.reviewedAt || '—')
    : '—';
  const validationByDisplay = (alert.status === 'validation_in_progress' || alert.status === 'validated' || alert.status === 'rejected')
    ? (alert.reviewedBy || '—')
    : '—';

  const availableStatuses: Status[] = useMemo(() => {
    if (alert.status === 'to_be_validated') {
      return ['validation_in_progress', 'validated', 'rejected'];
    }
    if (alert.status === 'validation_in_progress') {
      return ['validated', 'rejected'];
    }
    return ALL_STATUSES.filter(s => s !== alert.status);
  }, [alert.status]);

  // Mouse drag handlers for timeseries panning into the past
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX - panOffset);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newOffset = e.clientX - dragStartX;
    // Limit panning: 0 (current window) to 520px into past
    setPanOffset(Math.max(0, Math.min(520, newOffset)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Dynamic dates based on pan offset (panning into past)
  const shiftMs = (panOffset / 520) * rangeDurationMs;
  const shiftedStartMs = rangeStartMs - shiftMs;
  const shiftedEndMs = rangeEndMs - shiftMs;

  const startDateLabel = new Date(shiftedStartMs).toISOString().slice(0, 10);
  const endDateLabel = new Date(shiftedEndMs).toISOString().slice(0, 10);

  // Generate continuous wave points matching SLB waveform
  const svgWidth = 520;
  const numPoints = 14;
  const chartPoints: [number, number][] = [];
  const shift = Math.round(panOffset / 15);
  const masterLen = SLB_CHART_VALUES.length;
  for (let i = 0; i < numPoints; i++) {
    const x = (i / (numPoints - 1)) * svgWidth;
    const shiftedIdx = ((i - shift) % masterLen + masterLen) % masterLen;
    const baseVal = SLB_CHART_VALUES[shiftedIdx] || 50;
    const y = Math.max(4, Math.min(96, 100 - baseVal));
    chartPoints.push([x, y]);
  }
  const pathD = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  // Expanded points for full-width modal view
  const expandedPoints: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const x = (i / (numPoints - 1)) * 800;
    const shiftedIdx = ((i - shift) % masterLen + masterLen) % masterLen;
    const baseVal = SLB_CHART_VALUES[shiftedIdx] || 50;
    const y = Math.max(4, Math.min(96, 100 - baseVal));
    expandedPoints.push([x, y]);
  }
  const pathDExpanded = expandedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  return (
    <>
      <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[1020px] max-h-[92vh] overflow-y-auto bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none text-white">
          
          {/* ── Modal Header ── */}
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <Dialog.Title className="text-base font-semibold text-white">
                Alert Details: ALT-{alert.id} - {alert.source || 'Monitoring Rules Engine'}
              </Dialog.Title>
              <span className="px-2.5 py-1 rounded bg-[#1E293B] border border-[#334155]/40 text-[#E2E8F0] text-xs font-medium">
                {alert.status === 'to_be_validated' ? 'To Be Validated' : alert.status === 'validation_in_progress' ? 'Validation in Progress' : alert.status === 'validated' ? 'Validated' : alert.status === 'rejected' ? 'Rejected' : 'Closed'}
              </span>
            </div>
            <Dialog.Close className="text-[#64748B] hover:text-white transition-colors cursor-pointer">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* ── Modal Body Grid: 2 Cols Main Content + 1 Col Right Sidebar ── */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Left Main Section (2 Cols): Metadata Grid + Time Series Chart + Alert History */}
            <div className="col-span-2 space-y-5">
              
              {/* Metadata Grid */}
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4 space-y-2.5 text-xs">
                <h3 className="text-xs font-semibold text-white mb-2">Monitoring Alert</h3>
                
                {/* Asset Field (Single clean display, no duplication) */}
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Asset</span>
                  <span className="col-span-2 font-mono text-white font-medium">{alert.equipmentCode}</span>
                </div>

                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Alert type</span>
                  <span className="col-span-2 text-white font-medium">{getAlertType(alert)}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Alert Ref.</span>
                  <span className="col-span-2 font-mono text-white">ALT-{alert.id}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Event ID</span>
                  <span className="col-span-2 font-mono">
                    {alert.eventId ? (
                      <span className="text-white">{alert.eventId}</span>
                    ) : (
                      <span className="text-[#64748B]">—</span>
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Alert description</span>
                  <span className="col-span-2 text-[#E2E8F0] leading-relaxed">
                    Seal Gas Duplex Coalescent Filter Differential Pressure, External Seal Gas line 2 Temperature, Seal Gas Heater 3 Temperature, Seal Gas Heater Temperature
                  </span>
                </div>

                {/* Replaced Rule with Monitoring Rule ID */}
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Monitoring Rule ID</span>
                  <span className="col-span-2 font-mono text-white font-medium">{ruleId}</span>
                </div>

                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Start date</span>
                  <span className="col-span-2 font-mono text-white">{formattedStartDate}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">End date</span>
                  <span className="col-span-2 font-mono text-white">{formattedEndDate}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5">
                  <span className="text-[#94A3B8]">Recommendations</span>
                  <span className="col-span-2 text-[#E2E8F0] leading-relaxed">{failureMode}</span>
                </div>
              </div>

              {/* Alert Time Series Box - Official SLB Layout & Visual Identity */}
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4">
                {/* Header & Top Controls matching SLB */}
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-semibold text-white">Alert Timeseries</h3>
                  
                  <div className="flex items-center gap-2.5 relative">
                    {panOffset > 0 && (
                      <button
                        type="button"
                        onClick={() => setPanOffset(0)}
                        className="text-[11px] text-[#0284C7] hover:underline cursor-pointer font-medium"
                      >
                        Reset to Trigger
                      </button>
                    )}
                    
                    <span className="text-[11px] font-mono text-[#94A3B8]">
                      Latest: <span className="text-white">-0,36</span>
                    </span>

                    {/* Time Range Selector Button & Popover */}
                    <div className="relative" ref={timeRangeRef}>
                      <button
                        type="button"
                        onClick={() => setIsTimeRangeOpen(prev => !prev)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#070A10] border border-[#1E293B] hover:border-[#334155] text-[11px] font-mono text-[#E2E8F0] shadow-sm transition-colors cursor-pointer"
                      >
                        <span className="truncate max-w-[200px]">{rangeLabel}</span>
                        <ChevronDown size={12} className="text-[#64748B]" />
                      </button>

                      {isTimeRangeOpen && (
                        <div className="absolute right-0 top-full mt-1.5 z-40 w-72 bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 shadow-2xl space-y-3 text-xs">
                          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                            <span className="font-semibold text-white">Select Time Range</span>
                            <button
                              type="button"
                              onClick={() => setIsTimeRangeOpen(false)}
                              className="text-[#64748B] hover:text-white cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {/* Custom Range Inputs (No Presets) */}
                          <div className="space-y-3 pt-1">
                            <div className="space-y-2">
                              <div>
                                <label className="text-[10px] text-[#94A3B8] block mb-1">Start Date & Time</label>
                                <input
                                  type="datetime-local"
                                  value={customRangeStart}
                                  onChange={e => setCustomRangeStart(e.target.value)}
                                  className="w-full bg-[#070A10] border border-[#1E293B] focus:border-[#0284C7] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-[#94A3B8] block mb-1">End Date & Time</label>
                                <input
                                  type="datetime-local"
                                  value={customRangeEnd}
                                  onChange={e => setCustomRangeEnd(e.target.value)}
                                  className="w-full bg-[#070A10] border border-[#1E293B] focus:border-[#0284C7] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white outline-none"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (customRangeStart && customRangeEnd) {
                                  const parsedS = new Date(customRangeStart).getTime();
                                  const parsedE = new Date(customRangeEnd).getTime();
                                  if (!isNaN(parsedS) && !isNaN(parsedE) && parsedE > parsedS) {
                                    setAppliedRangeStart(parsedS);
                                    setAppliedRangeEnd(parsedE);
                                    setPanOffset(0);
                                    setIsTimeRangeOpen(false);
                                  }
                                }
                              }}
                              className="w-full mt-1 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0284C7]/90 text-white font-medium text-xs shadow-md transition-colors cursor-pointer"
                            >
                              Apply Range
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Maximize / Expand Button */}
                    <button
                      type="button"
                      onClick={() => setIsChartExpanded(true)}
                      title="Expand Timeseries Chart"
                      className="p-1.5 rounded-lg bg-[#070A10] border border-[#1E293B] hover:border-[#334155] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    >
                      <Maximize2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Official SLB Legend Row */}
                <div className="flex items-center gap-4 text-xs select-none mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-[#0284C7] inline-block shadow-sm" />
                    <span className="font-mono text-white font-medium text-[11px]">{timeseriesTag}</span>
                    <span
                      className="inline-flex items-center text-[#64748B] hover:text-[#94A3B8] cursor-pointer"
                      title={getTimeseriesDescription(timeseriesTag, alert.equipmentCode, alert.ruleDescription)}
                    >
                      <Info size={13} />
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-sm border border-dashed border-[#EF4444] bg-[#EF4444]/15 inline-block" />
                    <span className="text-[#EF4444] font-medium text-[11px]">Critical Threshold</span>
                  </div>
                </div>

                {/* SLB Timeseries Chart Container with Y-Axis and Click-and-Drag Pan */}
                <div
                  className={`bg-[#070A10] border border-[#1E293B] rounded-lg p-3 relative flex flex-col justify-between select-none ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="flex">
                    {/* Left Y-Axis Area matching SLB timeseries */}
                    <div className="flex items-center gap-1.5 pr-2 border-r border-[#1E293B]/70 select-none">
                      {/* Rotated MSCF/d Unit */}
                      <div className="w-5 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-[#94A3B8] tracking-wider -rotate-90 whitespace-nowrap">
                          MSCF/d
                        </span>
                      </div>
                      {/* Y-Axis Scale Values 100 to 0 */}
                      <div className="h-36 flex flex-col justify-between text-[10px] font-mono text-[#94A3B8] text-right w-6 py-0.5">
                        <span>100</span>
                        <span>80</span>
                        <span>60</span>
                        <span>40</span>
                        <span>20</span>
                        <span>0</span>
                      </div>
                    </div>

                    {/* SVG Chart Surface */}
                    <div className="flex-1 pl-2 relative flex flex-col">
                      <div className="relative w-full">
                        <svg className="w-full h-36 overflow-visible" viewBox="0 0 520 100" preserveAspectRatio="none">
                          {/* Horizontal Grid lines matching Y-axis ticks */}
                          <line x1="0" y1="20" x2="520" y2="20" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="40" x2="520" y2="40" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="60" x2="520" y2="60" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="80" x2="520" y2="80" stroke="#1E293B" strokeWidth="1" />

                          {/* Subtle Vertical Grid lines */}
                          <line x1="130" y1="0" x2="130" y2="100" stroke="#1E293B" strokeWidth="1" />
                          <line x1="260" y1="0" x2="260" y2="100" stroke="#1E293B" strokeWidth="1" />
                          <line x1="390" y1="0" x2="390" y2="100" stroke="#1E293B" strokeWidth="1" />

                          {/* Upper Critical Threshold Shaded Zone (>= 90, y: 0 to 10) */}
                          <rect x="0" y="0" width="520" height="10" fill="rgba(239, 68, 68, 0.09)" />
                          <line x1="0" y1="10" x2="520" y2="10" stroke="#EF4444" strokeWidth="1.25" strokeDasharray="4 4" />

                          {/* Lower Critical Threshold Shaded Zone (<= 14, y: 86 to 100) */}
                          <rect x="0" y="86" width="520" height="14" fill="rgba(239, 68, 68, 0.09)" />
                          <line x1="0" y1="86" x2="520" y2="86" stroke="#EF4444" strokeWidth="1.25" strokeDasharray="4 4" />

                          {/* Blue Signal Plot Line matching SLB */}
                          <path d={pathD} fill="none" stroke="#0284C7" strokeWidth="1.8" />
                        </svg>
                      </div>

                      {/* X-Axis Labels matching SLB styling */}
                      <div className="flex justify-between items-center text-[10px] font-mono text-[#94A3B8] pt-2 border-t border-[#1E293B] select-none">
                        <span>{startDateLabel}</span>
                        <span>{endDateLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pan Hint text */}
                  <div className="flex justify-end items-center text-[10px] text-[#64748B] pt-1">
                    <span>Drag chart horizontally to explore past alerts</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Sidebar Section (1 Col): Sidebar Info + Action Buttons */}
            <div className="border-l border-[#1E293B] pl-5 flex flex-col justify-between text-xs">
              <div className="space-y-4">
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Created On</span>
                  <span className="font-mono text-white text-xs">{formattedStartDate}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Description</span>
                  <p className="text-[#E2E8F0] text-xs leading-relaxed">
                    A monitoring alert has been triggered, potentially indicating a failure.
                  </p>
                </div>

                {/* Surveillance Tier Metadata (only shown when alert belongs to an event) */}
                {alert.eventId && (
                  <div>
                    <span className="text-[#64748B] block text-[11px] mb-0.5">Surveillance Tier</span>
                    <span className="font-semibold text-white text-xs">{alert.tier || '—'}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Validation Date</span>
                  <span className="font-mono text-[#94A3B8]">{validationDateDisplay}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Validation By</span>
                  <span className="text-[#94A3B8] font-mono">{validationByDisplay}</span>
                </div>

                {/* Validation Comment Field */}
                <div>
                  {(() => {
                    const isReadOnly = statusScope === 'validated_alerts' || alert.status === 'validated' || alert.status === 'rejected';
                    return (
                      <>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[#64748B] text-[11px]">Comment</span>
                          {!isReadOnly && alert.status === 'to_be_validated' && (
                            <span className="text-[#94A3B8] text-[10px] font-normal">(required for In Progress)</span>
                          )}
                        </div>

                        {isReadOnly ? (
                          <div className="w-full min-h-[56px] max-h-32 overflow-y-auto bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-[#E2E8F0] leading-relaxed select-text whitespace-pre-wrap">
                            {(alert.comment as string) || '—'}
                          </div>
                        ) : (
                          <>
                            <textarea
                              value={commentText}
                              onChange={e => {
                                setCommentText(e.target.value);
                                if (e.target.value.trim()) {
                                  setCommentError(null);
                                }
                              }}
                              placeholder="Add validation comments or operational notes..."
                              rows={3}
                              className={`w-full bg-[#0B0F19] border rounded-xl px-3 py-2 text-xs text-white placeholder-[#64748B] outline-none transition-colors resize-none ${
                                commentError
                                  ? 'border-red-500 ring-1 ring-red-500/40'
                                  : 'border-[#1E293B] focus:border-[#3B82F6]'
                              }`}
                            />
                            {commentError && (
                              <p className="text-[11px] text-red-400 mt-1.5 font-medium leading-tight">
                                {commentError}
                              </p>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* ── Alert History Section (Clean minimalist format) ── */}
                <div className="border-t border-[#1E293B] pt-3">
                  <h3 className="text-xs font-semibold text-white mb-2">Alert History</h3>

                  {alertHistory.length === 0 ? (
                    <div className="text-xs text-[#64748B] italic">
                      No past alerts recorded.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {alertHistory.map(histAlert => {
                        const startDateStr = formatUtcDateTime(histAlert.triggeredAtRaw || histAlert.triggeredAt);
                        const endDateDisplay = formatUtcDateTime(histAlert.endDateRaw || histAlert.endDate);

                        return (
                          <div key={histAlert.id} className="text-xs font-mono leading-tight space-y-0.5">
                            <div className="text-[#94A3B8] text-[11px]">{startDateStr}</div>
                            <div className="text-white text-[11px] font-medium">{endDateDisplay}</div>
                            <div className="text-white text-[11px]">
                              ALT {histAlert.id}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Column matching SLB FAST design */}
              <div className="space-y-2.5 pt-6 border-t border-[#1E293B]">


                <button
                  type="button"
                  onClick={() => window.alert('Opening Workbench...')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-medium hover:border-[#3B82F6] transition-colors cursor-pointer"
                >
                  <Wrench size={13} />
                  Open Workbench
                </button>

                {/* Change Status Dropdown Button (only visible on For Validation tab) */}
                {onStatusChange && statusScope === 'for_validation' && (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-medium hover:border-[#3B82F6] transition-colors cursor-pointer">
                        <span>Change Status</span>
                        <ChevronDown size={12} className="text-[#94A3B8]" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="z-[100] bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl p-1.5 min-w-[210px] select-none"
                        sideOffset={4}
                      >
                        {availableStatuses.map(s => (
                          <DropdownMenu.Item
                            key={s}
                            onSelect={async () => {
                              if (alert && onStatusChange) {
                                if (s === 'validation_in_progress') {
                                  if (!commentText.trim()) {
                                    setCommentError('Please enter a comment before setting Validation in Progress');
                                    return;
                                  }
                                  setCommentError(null);
                                  await onStatusChange(alert.id, s, commentText.trim());
                                } else if (s === 'validated') {
                                  setCommentError(null);
                                  setShowValidateConfirm(true);
                                } else {
                                  setCommentError(null);
                                  await onStatusChange(alert.id, s, commentText.trim() || undefined);
                                }
                              }
                            }}
                            className="px-3 py-2 rounded-xl cursor-pointer hover:bg-[#1E293B] outline-none transition-colors"
                          >
                            <StatusBadge status={s} />
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                )}
              </div>

            </div>

          </div>

          {/* ── Expanded Chart Modal View ── */}
          {isChartExpanded && (
            <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 select-none">
              <div className="w-[1100px] max-w-full bg-[#0B0F19] border border-[#1E293B] rounded-2xl p-6 shadow-2xl space-y-4 text-white">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-white">Alert Timeseries — Expanded View</h2>
                    <span className="font-mono text-xs text-[#94A3B8] bg-[#1E293B] px-2 py-0.5 rounded">
                      {alert.equipmentCode} • {ruleId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChartExpanded(false)}
                    className="text-[#94A3B8] hover:text-white p-1.5 rounded-lg hover:bg-[#1E293B] transition-colors cursor-pointer"
                  >
                    <Minimize2 size={18} />
                  </button>
                </div>

                {/* Expanded Controls & Legend */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-sm bg-[#0284C7] inline-block shadow-sm" />
                      <span className="font-mono text-white font-medium text-xs">{timeseriesTag}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-sm border border-dashed border-[#EF4444] bg-[#EF4444]/15 inline-block" />
                      <span className="text-[#EF4444] font-medium text-xs">Critical Threshold</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#94A3B8]">Latest: <span className="text-white">-0,36</span></span>
                    <span className="text-xs font-mono text-[#38BDF8] bg-[#070A10] border border-[#1E293B] px-3 py-1 rounded-lg">
                      {rangeLabel}
                    </span>
                  </div>
                </div>

                {/* Expanded Chart Surface */}
                <div
                  className={`bg-[#070A10] border border-[#1E293B] rounded-xl p-4 relative flex flex-col justify-between ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="flex">
                    <div className="flex items-center gap-2 pr-3 border-r border-[#1E293B]/70 select-none">
                      <div className="w-6 flex items-center justify-center">
                        <span className="text-xs font-mono text-[#94A3B8] tracking-wider -rotate-90 whitespace-nowrap">
                          MSCF/d
                        </span>
                      </div>
                      <div className="h-72 flex flex-col justify-between text-xs font-mono text-[#94A3B8] text-right w-8 py-1">
                        <span>100</span>
                        <span>80</span>
                        <span>60</span>
                        <span>40</span>
                        <span>20</span>
                        <span>0</span>
                      </div>
                    </div>

                    <div className="flex-1 pl-4 relative flex flex-col">
                      <div className="relative w-full">
                        <svg className="w-full h-72 overflow-visible" viewBox="0 0 800 100" preserveAspectRatio="none">
                          <line x1="0" y1="20" x2="800" y2="20" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="40" x2="800" y2="40" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="60" x2="800" y2="60" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="80" x2="800" y2="80" stroke="#1E293B" strokeWidth="1" />

                          <line x1="200" y1="0" x2="200" y2="100" stroke="#1E293B" strokeWidth="1" />
                          <line x1="400" y1="0" x2="400" y2="100" stroke="#1E293B" strokeWidth="1" />
                          <line x1="600" y1="0" x2="600" y2="100" stroke="#1E293B" strokeWidth="1" />

                          <rect x="0" y="0" width="800" height="10" fill="rgba(239, 68, 68, 0.09)" />
                          <line x1="0" y1="10" x2="800" y2="10" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" />

                          <rect x="0" y="86" width="800" height="14" fill="rgba(239, 68, 68, 0.09)" />
                          <line x1="0" y1="86" x2="800" y2="86" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" />

                          <path d={pathDExpanded} fill="none" stroke="#0284C7" strokeWidth="2.5" />
                        </svg>
                      </div>

                      <div className="flex justify-between items-center text-xs font-mono text-[#94A3B8] pt-3 border-t border-[#1E293B] select-none">
                        <span>{startDateLabel}</span>
                        <span>{endDateLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-[#64748B] pt-2">
                    <span>Drag horizontally to pan through time</span>
                    <button
                      type="button"
                      onClick={() => setIsChartExpanded(false)}
                      className="text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      Close Expanded View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {/* Validate Alert Confirmation Modal */}
    <Dialog.Root open={showValidateConfirm} onOpenChange={setShowValidateConfirm}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[70] backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[450px] max-w-[92vw] bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none text-white outline-none font-sans">
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="text-base font-semibold text-white">
              Validate Alert
            </Dialog.Title>
            <button
              type="button"
              onClick={() => setShowValidateConfirm(false)}
              className="text-[#64748B] hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-xs text-[#94A3B8] mb-6 leading-relaxed">
            Are you sure you want to validate alert <span className="font-mono font-semibold text-white">ALT-{alert.id}</span>? Once validated, it will move to the <span className="font-medium text-white">Validated Alerts</span> tab.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => setShowValidateConfirm(false)}
              className="px-4 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                setShowValidateConfirm(false);
                if (alert && onStatusChange) {
                  await onStatusChange(alert.id, 'validated', commentText.trim() || undefined);
                }
              }}
              className="px-4 py-2 text-xs rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors cursor-pointer"
            >
              Yes, validate
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>
  );
}
