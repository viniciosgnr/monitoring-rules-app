'use client';
import React, { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { X, Info, Wrench, ChevronDown } from 'lucide-react';
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

// Master sample time series raw values (37 data points across time window)
const MASTER_CHART_VALUES = [
  45, 38, 52, 42, 68, 40, 55, 35, 60, 48, 72, 40, 50,
  30, 42, 25, 38, 30, 40, 22, 35, 48, 30, 62, 40,
  28, 35, 20, 30, 25, 35, 28, 42, 30, 25, 32, 28
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

  // Drag-to-pan horizontal state
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);

  React.useEffect(() => {
    if (alert) {
      setCommentText((alert.comment as string) || '');
      setCommentError(null);
      setPanOffset(0);
    }
  }, [alert]);

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
  const { startMs, endMs, durationMs } = useMemo(() => {
    if (!alert) {
      const now = Date.now();
      return { startMs: now - 86400000, endMs: now, durationMs: 86400000 };
    }
    const s = new Date(alert.triggeredAtRaw || alert.triggeredAt).getTime();
    const e = new Date(alert.endDateRaw || alert.endDate).getTime();
    const validStart = !isNaN(s) ? s : Date.now() - 86400000;
    let validEnd = !isNaN(e) ? e : validStart + 86400000;
    if (validEnd <= validStart) {
      validEnd = validStart + 86400000;
    }
    const rawDuration = validEnd - validStart;
    const duration = Math.max(rawDuration, 86400000);
    return { startMs: validStart, endMs: validStart + duration, durationMs: duration };
  }, [alert]);

  if (!alert) return null;

  const ruleId = alert.ruleName || 'COCE_GEN_SPK_01';
  const timeseriesTag = alert.timeseries ? `pi:${alert.timeseries}` : `pi:${alert.fpso}:FPSO:771-PI-1868_A`;
  const failureMode = alert.ruleDescription || 'HH vibration or HH temperatures on gearbox component';
  const formattedStartDate = formatUtcDateTime(alert.triggeredAtRaw || alert.triggeredAt);
  const formattedEndDate = formatUtcDateTime(alert.endDateRaw || alert.endDate);

  // Threshold info for reference line
  const thresholdInfo = getRuleThresholdInfo(alert);
  const thresholdSvgY = Math.round(100 * thresholdInfo.yRatio);

  // Mouse drag handlers for timeseries panning into the past
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX - panOffset);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newOffset = e.clientX - dragStartX;
    // Limit panning: 0 (current alert window) to 300px into past
    setPanOffset(Math.max(0, Math.min(300, newOffset)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Generate continuous wave points shifted by panOffset to simulate scrolling into past
  const svgWidth = 520;
  const numPoints = 48;
  const chartPoints: [number, number][] = [];
  const shift = Math.round(panOffset / 10);
  const masterLen = MASTER_CHART_VALUES.length;
  for (let i = 0; i < numPoints; i++) {
    const x = (i / (numPoints - 1)) * svgWidth;
    // Base wave pattern: dragging to the right shifts points to the right (revealing older data from left 1:1 with mouse)
    const shiftedIdx = ((i - shift) % masterLen + masterLen) % masterLen;
    const baseVal = MASTER_CHART_VALUES[shiftedIdx] || 25;
    // Map base value into Y SVG range (0 to 100)
    const y = Math.max(10, Math.min(92, 100 - baseVal));
    chartPoints.push([x, y]);
  }
  const pathD = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  // Compute displayed dynamic dates based on pan offset (panning into past)
  const shiftMs = (panOffset / 520) * durationMs;
  const shiftedStartMs = startMs - shiftMs;
  const shiftedEndMs = endMs - shiftMs;

  const t0 = shiftedStartMs;
  const t1 = shiftedStartMs + durationMs * (1 / 3);
  const t2 = shiftedStartMs + durationMs * (2 / 3);
  const t3 = shiftedEndMs;

  const d0 = new Date(t0);
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  const d3 = new Date(t3);

  const day0Str = d0.toISOString().slice(0, 10);
  const day3Str = d3.toISOString().slice(0, 10);

  const tick0Str = day0Str;
  const tick1Str = d1.toISOString().slice(11, 16);
  const tick2Str = d2.toISOString().slice(11, 16);
  const tick3Str = day3Str === day0Str ? (d3.toISOString().slice(11, 16) === '00:00' ? '24:00' : d3.toISOString().slice(11, 16)) : day3Str;

  return (
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

              {/* Alert Time Series Box - SLB Layout & Visual Identity */}
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-white">Alert Time Series</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {panOffset > 0 && (
                      <button
                        type="button"
                        onClick={() => setPanOffset(0)}
                        className="text-[11px] text-[#3B82F6] hover:underline cursor-pointer font-medium"
                      >
                        Reset to Trigger
                      </button>
                    )}
                    <span className="text-[11px] font-mono text-[#94A3B8]">Latest: <span className="text-white">0.19</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-[#3B82F6] mb-1">
                  <span>{timeseriesTag}</span>
                  <Info size={13} className="text-[#64748B] cursor-pointer" />
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed mb-3">
                  {getTimeseriesDescription(timeseriesTag, alert.equipmentCode, alert.ruleDescription)}
                </p>

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
                      {/* Rotated Timeseries Tag Name */}
                      <div className="w-4 flex items-center justify-center">
                        <span className="text-[9px] font-mono text-[#64748B] tracking-wider -rotate-90 whitespace-nowrap">
                          {timeseriesTag.replace(/^pi:/, '')}
                        </span>
                      </div>
                      {/* Y-Axis Scale Values */}
                      <div className="h-36 flex flex-col justify-between text-[10px] font-mono text-[#94A3B8] text-right w-6 py-0.5">
                        <span>1</span>
                        <span>0.8</span>
                        <span>0.6</span>
                        <span>0.4</span>
                        <span>0.2</span>
                        <span>0</span>
                      </div>
                    </div>

                    {/* SVG Chart Surface */}
                    <div className="flex-1 pl-2 relative flex flex-col">
                      <div className="relative w-full">
                        <svg className="w-full h-36 overflow-visible" viewBox="0 0 520 100" preserveAspectRatio="none">
                          {/* Horizontal Grid lines matching Y-axis ticks */}
                          <line x1="0" y1="5" x2="520" y2="5" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="24" x2="520" y2="24" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="43" x2="520" y2="43" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="62" x2="520" y2="62" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="81" x2="520" y2="81" stroke="#1E293B" strokeWidth="1" />
                          <line x1="0" y1="98" x2="520" y2="98" stroke="#1E293B" strokeWidth="1" />

                          {/* Subtle Vertical Grid lines aligned with tick 1 and tick 2 */}
                          <line x1="173.3" y1="0" x2="173.3" y2="100" stroke="#1E293B" strokeWidth="1" />
                          <line x1="346.7" y1="0" x2="346.7" y2="100" stroke="#1E293B" strokeWidth="1" />

                          {/* Rule Threshold Reference Line (Dashed only, no badge or label) */}
                          <line
                            x1="0"
                            y1={thresholdSvgY}
                            x2="520"
                            y2={thresholdSvgY}
                            stroke="#F59E0B"
                            strokeWidth="1.5"
                            strokeDasharray="5 4"
                          />

                          {/* Blue Signal Plot Line */}
                          <path d={pathD} fill="none" stroke="#38BDF8" strokeWidth="1.75" />
                        </svg>
                      </div>

                      {/* X-Axis Labels matching SLB styling */}
                      <div className="relative w-full text-[10px] font-mono text-[#94A3B8] pt-2 border-t border-[#1E293B] h-7 select-none">
                        <span className="absolute left-0 top-2">{tick0Str}</span>
                        <span className="absolute left-1/3 -translate-x-1/2 top-2">{tick1Str}</span>
                        <span className="absolute left-2/3 -translate-x-1/2 top-2">{tick2Str}</span>
                        <span className="absolute right-0 top-2">{tick3Str}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pan Hint text */}
                  <div className="flex justify-end items-center text-[10px] text-[#64748B] pt-1">
                    <span>Drag chart horizontally to explore past alerts</span>
                  </div>
                </div>
              </div>

              {/* ── Simplified Alert History Section (Clean Text Format) ── */}
              <div className="border-t border-[#1E293B] pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-semibold text-white">
                    Alert History ({alert.equipmentCode} • {ruleId})
                  </h3>
                </div>

                {alertHistory.length === 0 ? (
                  <div className="text-xs text-[#64748B] italic">
                    No past alerts recorded for this Monitoring Rule on asset <span className="font-mono text-[#94A3B8]">{alert.equipmentCode}</span>.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {alertHistory.map(histAlert => {
                      const startDateStr = formatUtcDateTime(histAlert.triggeredAtRaw || histAlert.triggeredAt);
                      const endDateDisplay = formatUtcDateTime(histAlert.endDateRaw || histAlert.endDate);

                      return (
                        <div key={histAlert.id} className="text-xs text-[#94A3B8] leading-relaxed">
                          <span className="text-[#E2E8F0] font-mono">{startDateStr}</span>
                          <span className="text-[#64748B]"> → </span>
                          <span className="text-[#E2E8F0] font-mono">{endDateDisplay}</span>
                          <span className="text-[#64748B]"> · </span>
                          <span className="font-mono text-white font-medium">ALT-{histAlert.id}</span>
                          <span className="text-[#64748B]"> · </span>
                          <span className="text-white">{getAlertType(histAlert)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">LOD</span>
                  <span className="font-semibold text-white tracking-wider">PREDICT</span>
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
                  <span className="font-mono text-[#94A3B8]">{alert.reviewedAt || '—'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Validation By</span>
                  <span className="text-[#94A3B8] font-mono">{alert.reviewedBy || '—'}</span>
                </div>

                {/* Validation Comment Field */}
                <div>
                  {(() => {
                    const isReadOnly = statusScope === 'validated_alerts' || alert.status === 'validated' || alert.status === 'rejected';
                    return (
                      <>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-[#64748B] text-[11px]">Comment</span>
                          {!isReadOnly && (
                            <span className="text-red-400 text-[11px] font-bold">*</span>
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
                        {ALL_STATUSES.map(s => (
                          <DropdownMenu.Item
                            key={s}
                            onSelect={async () => {
                              if (alert && onStatusChange) {
                                if (s === 'validated') {
                                  if (!commentText.trim()) {
                                    setCommentError('Please enter a comment before validating the alert');
                                    return;
                                  }
                                  setCommentError(null);
                                  await onStatusChange(alert.id, s, commentText.trim());
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

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
