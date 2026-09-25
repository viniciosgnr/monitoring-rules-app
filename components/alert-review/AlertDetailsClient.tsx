'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wrench, ChevronDown, Info, AlertCircle, Check, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import StatusBadge, { Status } from '@/components/ui/StatusBadge';
import EquipmentBadge from '@/components/ui/EquipmentBadge';
import RejectEventModal from '@/components/alert-review/RejectEventModal';
import { updateAlertStatus } from '@/app/actions/alerts';

export interface AlertDetailData {
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
  eventRef?: string | null;
  processingSteps?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface AlertHistoryItem {
  id: number;
  endDate: string;
  endDateRaw?: string;
  triggeredAt: string;
  triggeredAtRaw?: string;
  status: Status;
}

interface AlertDetailsClientProps {
  alert: AlertDetailData;
  alertHistory: AlertHistoryItem[];
  fromTab?: 'for_validation' | 'validated_alerts';
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

export function getAlertType(alert: AlertDetailData): string {
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

export function getRuleThresholdInfo(alert: AlertDetailData): { value: number; label: string; yRatio: number } {
  const name = (alert.ruleName || '').toUpperCase();
  const ps = alert.processingSteps as Record<string, unknown> | undefined;

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

const SLB_CHART_VALUES = [
  44, 50, 56, 96, 28, 33, 38, 9, 36, 30, 54, 58, 72,
  46, 52, 60, 42, 38, 92, 40, 25, 12, 34, 48, 64, 55,
  40, 45, 50, 88, 30, 35, 11, 29, 52, 61, 68
];

export default function AlertDetailsClient({
  alert: initialAlert,
  alertHistory,
  fromTab = 'for_validation',
}: AlertDetailsClientProps) {
  const router = useRouter();
  const [currentAlert, setCurrentAlert] = useState<AlertDetailData>(initialAlert);
  const [commentText, setCommentText] = useState<string>((initialAlert.comment as string) || '');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSavingComment, setIsSavingComment] = useState<boolean>(false);
  const [commentSavedFeedback, setCommentSavedFeedback] = useState<boolean>(false);

  // Validation confirmation modal (image 5)
  const [showValidateConfirm, setShowValidateConfirm] = useState<boolean>(false);

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);

  // Drag-to-pan horizontal state
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);

  // Time Range Selection State (matching image 2)
  const [customRangeStart, setCustomRangeStart] = useState<string>('');
  const [customRangeEnd, setCustomRangeEnd] = useState<string>('');
  const [appliedRangeStart, setAppliedRangeStart] = useState<number | null>(null);
  const [appliedRangeEnd, setAppliedRangeEnd] = useState<number | null>(null);
  const [isTimeRangeOpen, setIsTimeRangeOpen] = useState<boolean>(false);
  const timeRangeRef = useRef<HTMLDivElement>(null);

  // Surveillance Tier Info tooltip
  const [showTierTooltip, setShowTierTooltip] = useState<boolean>(false);

  // Base timeframe from alert dates
  const { alertStartMs, alertEndMs } = useMemo(() => {
    const s = new Date(currentAlert.triggeredAtRaw || currentAlert.triggeredAt).getTime();
    const e = new Date(currentAlert.endDateRaw || currentAlert.endDate).getTime();
    const validStart = !isNaN(s) ? s : Date.now() - 4 * 86400000;
    let validEnd = !isNaN(e) ? e : validStart + 4 * 86400000;
    if (validEnd <= validStart) {
      validEnd = validStart + 4 * 86400000;
    }
    return { alertStartMs: validStart, alertEndMs: validEnd };
  }, [currentAlert]);

  // Sync custom range input fields when base dates are available
  useEffect(() => {
    if (alertStartMs && alertEndMs) {
      setCustomRangeStart(new Date(alertStartMs).toISOString().slice(0, 16));
      setCustomRangeEnd(new Date(alertEndMs).toISOString().slice(0, 16));
    }
  }, [alertStartMs, alertEndMs]);

  // Close time range popover on click outside
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

  // Resolve selected timeframe [rangeStartMs, rangeEndMs]
  const { rangeStartMs, rangeEndMs, rangeDurationMs, rangeLabel } = useMemo(() => {
    const s = appliedRangeStart !== null ? appliedRangeStart : alertStartMs;
    const e = appliedRangeEnd !== null ? appliedRangeEnd : alertEndMs;
    const duration = Math.max(e - s, 3600000);
    const label = `${formatDateTimeSecond(s)} - ${formatDateTimeSecond(e)}`;
    return { rangeStartMs: s, rangeEndMs: e, rangeDurationMs: duration, rangeLabel: label };
  }, [appliedRangeStart, appliedRangeEnd, alertStartMs, alertEndMs]);

  // Mouse drag handlers for timeseries panning into the past
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX - panOffset);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newOffset = e.clientX - dragStartX;
    setPanOffset(Math.max(0, Math.min(600, newOffset)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const shiftMs = (panOffset / 600) * rangeDurationMs;
  const shiftedStartMs = rangeStartMs - shiftMs;
  const shiftedEndMs = rangeEndMs - shiftMs;
  const startDateLabel = new Date(shiftedStartMs).toISOString().slice(0, 10);
  const endDateLabel = new Date(shiftedEndMs).toISOString().slice(0, 10);

  // SVG wave points
  const svgWidth = 650;
  const numPoints = 16;
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

  const ruleId = currentAlert.ruleName || 'COCE_GEN_SPK_01';
  const timeseriesTag = currentAlert.timeseries ? `pi:${currentAlert.timeseries}` : `pi:${currentAlert.fpso}:FPSO:771-PI-1868_A`;
  const failureMode = currentAlert.ruleDescription || 'HH vibration or HH temperatures on gearbox component';
  const formattedStartDate = formatUtcDateTime(currentAlert.triggeredAtRaw || currentAlert.triggeredAt);
  const formattedEndDate = formatUtcDateTime(currentAlert.endDateRaw || currentAlert.endDate);

  const validationDateDisplay = (currentAlert.status === 'validated' || currentAlert.status === 'rejected')
    ? (currentAlert.reviewedAt || '—')
    : '—';
  const validationByDisplay = (currentAlert.status === 'validation_in_progress' || currentAlert.status === 'validated' || currentAlert.status === 'rejected')
    ? (currentAlert.reviewedBy || '—')
    : '—';

  // Read-only state for validated or rejected alerts (approval workflow respect)
  const isReadOnly = currentAlert.status === 'validated' || currentAlert.status === 'rejected' || fromTab === 'validated_alerts';

  // Forward-only valid transitions (cannot revert to previous steps)
  const availableStatuses: Status[] = currentAlert.status === 'to_be_validated'
    ? ['validation_in_progress', 'validated', 'rejected']
    : currentAlert.status === 'validation_in_progress'
    ? ['validated', 'rejected']
    : [];

  const handleStatusSelect = async (newStatus: Status) => {
    if (newStatus === 'rejected') {
      setShowRejectModal(true);
      return;
    }

    if (newStatus === 'validated') {
      setShowValidateConfirm(true);
      return;
    }

    if (newStatus === 'validation_in_progress' && !commentText.trim()) {
      setCommentError('Comment is mandatory when setting status to Validation in Progress');
      return;
    }

    setCommentError(null);
    const updatedReviewer = 'Jon Doe';
    const updatedDate = '—';

    setCurrentAlert(prev => ({
      ...prev,
      status: newStatus,
      reviewedBy: updatedReviewer,
      reviewedAt: updatedDate,
      comment: commentText,
    }));

    await updateAlertStatus(currentAlert.id, newStatus, currentAlert.tier || undefined, commentText);
  };

  const handleConfirmValidation = async () => {
    setShowValidateConfirm(false);
    setCommentError(null);
    const updatedReviewer = 'Jon Doe';
    const updatedDate = new Date().toLocaleString('pt-BR');

    setCurrentAlert(prev => ({
      ...prev,
      status: 'validated',
      reviewedBy: updatedReviewer,
      reviewedAt: updatedDate,
    }));

    await updateAlertStatus(currentAlert.id, 'validated', currentAlert.tier || undefined, commentText.trim() || undefined);
  };

  const handleConfirmRejection = async (reasons: string[], reasonComment: string) => {
    setShowRejectModal(false);
    setCommentError(null);
    const updatedReviewer = 'Jon Doe';
    const updatedDate = new Date().toLocaleString('pt-BR');
    const fullComment = reasons.length > 0 ? `${reasons.join(', ')}${reasonComment ? ` - ${reasonComment}` : ''}` : reasonComment;

    setCurrentAlert(prev => ({
      ...prev,
      status: 'rejected',
      reviewedBy: updatedReviewer,
      reviewedAt: updatedDate,
      comment: fullComment,
    }));
    setCommentText(fullComment);

    await updateAlertStatus(currentAlert.id, 'rejected', currentAlert.tier || undefined, fullComment);
  };

  const handleSaveComment = async () => {
    if (!commentText.trim()) return;
    setIsSavingComment(true);
    setCommentError(null);
    try {
      await updateAlertStatus(currentAlert.id, currentAlert.status, currentAlert.tier || undefined, commentText.trim());
      setCurrentAlert(prev => ({ ...prev, comment: commentText.trim() }));
      setCommentSavedFeedback(true);
      setTimeout(() => setCommentSavedFeedback(false), 2500);
    } catch {
      setCommentError('Failed to save comment. Please try again.');
    } finally {
      setIsSavingComment(false);
    }
  };

  const isAlertValidated = currentAlert.status === 'validated';
  const effectiveBackTab = (isAlertValidated || fromTab === 'validated_alerts') ? 'validated_alerts' : 'for_validation';
  const backUrl = `/alert-review?from=${effectiveBackTab}`;

  return (
    <>
      <Topbar breadcrumb={`Alert Review / ALT-${currentAlert.id}`} />
      <NavTabs title="Alert Review" />

      <main className="px-6 py-5 space-y-5 max-w-[1600px] mx-auto select-none">
        
        {/* Navigation & Header Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                router.push(backUrl);
                router.refresh();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#111827] border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer text-xs font-medium"
            >
              <ArrowLeft size={14} />
              <span>Back to Alert Review</span>
            </button>

            <div className="h-5 w-px bg-[#1E293B]" />

            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-white font-mono">
                ALT-{currentAlert.id}
              </h1>
              <EquipmentBadge code={currentAlert.equipmentCode} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#1E293B] text-[#94A3B8] border border-[#334155]/40 font-semibold">
                {currentAlert.fpso}
              </span>
              <StatusBadge status={currentAlert.status} />
            </div>
          </div>

          <div className="text-xs text-[#94A3B8]">
            Source: <span className="text-white font-medium">{currentAlert.source || 'Monitoring Rules Engine'}</span>
          </div>
        </div>

        {/* Validation success feedback notification */}
        {isAlertValidated && fromTab === 'for_validation' && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <div className="flex items-center gap-2">
              <Check size={14} className="stroke-[3]" />
              <span>Alerta validado com sucesso! Ele agora pertence à aba <strong>Validated Alerts</strong>.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                router.push('/alert-review?from=validated_alerts');
                router.refresh();
              }}
              className="underline hover:text-emerald-300 font-medium cursor-pointer"
            >
              Ver na aba Validated Alerts →
            </button>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── Left Column (~70% width: cols 1-8) ── */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Metadata Grid Card */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Alert Specifications & Metadata
                </h2>
              </div>

              <div className="text-xs text-[#E2E8F0] space-y-0.5">
                {/* Clean Asset Row: No duplicated code */}
                <div className="grid grid-cols-3 py-2 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Asset</span>
                  <span className="col-span-2 font-mono text-white font-medium">
                    <EquipmentBadge code={currentAlert.equipmentCode} />
                  </span>
                </div>

                <div className="grid grid-cols-3 py-2 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Alert type</span>
                  <span className="col-span-2 text-white font-medium">{getAlertType(currentAlert)}</span>
                </div>

                <div className="grid grid-cols-3 py-2 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Alert Ref.</span>
                  <span className="col-span-2 font-mono text-[#3B82F6] font-bold">ALT-{currentAlert.id}</span>
                </div>

                <div className="grid grid-cols-3 py-2 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Alert description</span>
                  <span className="col-span-2 text-[#E2E8F0] leading-relaxed">
                    Seal Gas Duplex Coalescent Filter Differential Pressure, External Seal Gas line 2 Temperature, Seal Gas Heater 3 Temperature, Seal Gas Heater Temperature
                  </span>
                </div>

                <div className="grid grid-cols-3 py-2 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Monitoring Rule ID</span>
                  <span className="col-span-2 font-mono text-white font-medium">{ruleId}</span>
                </div>

                <div className="grid grid-cols-3 py-2 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Start date</span>
                  <span className="col-span-2 font-mono text-white">{formattedStartDate}</span>
                </div>

                <div className="grid grid-cols-3 py-2 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">End date</span>
                  <span className="col-span-2 font-mono text-white">{formattedEndDate}</span>
                </div>

                <div className="grid grid-cols-3 py-2 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Recommendations</span>
                  <span className="col-span-2 text-[#E2E8F0] leading-relaxed">{failureMode}</span>
                </div>

                {/* Group Ref. and Event Ref. below Recommendations */}
                <div className="grid grid-cols-3 py-2 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Group Ref.</span>
                  <span className="col-span-2 font-mono">
                    {currentAlert.eventId ? (
                      <span className="text-white font-medium bg-[#0B0F19] px-2 py-0.5 rounded border border-[#1E293B]">
                        {currentAlert.eventId}
                      </span>
                    ) : (
                      <span className="text-[#64748B]">—</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 py-2">
                  <span className="text-[#94A3B8]">Event Ref.</span>
                  <span className="col-span-2 font-mono">
                    {currentAlert.eventRef ? (
                      <span className="text-white font-medium bg-[#0B0F19] px-2 py-0.5 rounded border border-[#1E293B]">
                        {currentAlert.eventRef}
                      </span>
                    ) : (
                      <span className="text-[#64748B] italic">Pending sync (—)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Alert Timeseries Chart Card */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-white">Alert Timeseries</h3>
                  <span className="text-[11px] font-mono text-[#94A3B8]">{timeseriesTag}</span>
                </div>

                <div className="flex items-center gap-2.5 relative flex-wrap">
                  {panOffset > 0 && (
                    <button
                      type="button"
                      onClick={() => setPanOffset(0)}
                      className="text-xs text-[#0284C7] hover:underline cursor-pointer font-medium"
                    >
                      Reset to Trigger
                    </button>
                  )}
                  <span className="text-[11px] font-mono text-[#94A3B8]">
                    Latest: <span className="text-white">-0,36</span>
                  </span>

                  {/* Time Range Selector Button & Popover (matching image 2) */}
                  <div className="relative" ref={timeRangeRef}>
                    <button
                      type="button"
                      onClick={() => setIsTimeRangeOpen(prev => !prev)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#070A10] border border-[#1E293B] hover:border-[#334155] text-[11px] font-mono text-[#E2E8F0] shadow-sm transition-colors cursor-pointer"
                    >
                      <span className="truncate max-w-[210px]">{rangeLabel}</span>
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
                </div>
              </div>

              {/* Chart Plot Area */}
              <div
                className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4 select-none cursor-ew-resize"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <div className="flex items-stretch">
                  {/* Y-Axis Ticks */}
                  <div className="w-10 flex flex-col justify-between text-[10px] font-mono text-[#64748B] text-right pr-2 py-0 select-none">
                    <span>100</span>
                    <span>80</span>
                    <span>60</span>
                    <span>40</span>
                    <span>20</span>
                    <span>0</span>
                  </div>

                  {/* SVG Plot Canvas */}
                  <div className="flex-1 pl-2 relative flex flex-col">
                    <svg className="w-full h-44 overflow-visible" viewBox="0 0 650 100" preserveAspectRatio="none">
                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="20" x2="650" y2="20" stroke="#1E293B" strokeWidth="1" />
                      <line x1="0" y1="40" x2="650" y2="40" stroke="#1E293B" strokeWidth="1" />
                      <line x1="0" y1="60" x2="650" y2="60" stroke="#1E293B" strokeWidth="1" />
                      <line x1="0" y1="80" x2="650" y2="80" stroke="#1E293B" strokeWidth="1" />

                      {/* Vertical Grid lines */}
                      <line x1="162" y1="0" x2="162" y2="100" stroke="#1E293B" strokeWidth="1" />
                      <line x1="325" y1="0" x2="325" y2="100" stroke="#1E293B" strokeWidth="1" />
                      <line x1="487" y1="0" x2="487" y2="100" stroke="#1E293B" strokeWidth="1" />

                      {/* Upper Critical Threshold Shaded Zone (>= 90) */}
                      <rect x="0" y="0" width="650" height="10" fill="rgba(239, 68, 68, 0.09)" />
                      <line x1="0" y1="10" x2="650" y2="10" stroke="#EF4444" strokeWidth="1.25" strokeDasharray="4 4" />

                      {/* Lower Critical Threshold Shaded Zone (<= 14) */}
                      <rect x="0" y="86" width="650" height="14" fill="rgba(239, 68, 68, 0.09)" />
                      <line x1="0" y1="86" x2="650" y2="86" stroke="#EF4444" strokeWidth="1.25" strokeDasharray="4 4" />

                      {/* Signal Plot Line */}
                      <path d={pathD} fill="none" stroke="#0284C7" strokeWidth="2" />
                    </svg>

                    {/* X-Axis Labels */}
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#94A3B8] pt-2 border-t border-[#1E293B]">
                      <span>{startDateLabel}</span>
                      <span>{endDateLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end items-center text-[10px] text-[#64748B] pt-2">
                  <span>Drag chart horizontally to explore past timeseries</span>
                </div>
              </div>
            </div>

          </div>

          {/* ── Right Column (~30% width: cols 9-12) ── */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Status & Validation Action Card */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Workflow & Validation
                </h3>
                <StatusBadge status={currentAlert.status} />
              </div>

              {/* Status Selector dropdown: Only render if not read-only and transitions exist */}
              {!isReadOnly && availableStatuses.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-[#94A3B8] font-medium">Status Transition</span>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-medium hover:border-[#3B82F6] transition-colors cursor-pointer">
                        <span>Change Status</span>
                        <ChevronDown size={14} className="text-[#94A3B8]" />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="z-[100] bg-[#111827] border border-[#1E293B] rounded-2xl shadow-2xl p-1.5 min-w-[220px] select-none text-xs"
                        sideOffset={4}
                      >
                        {availableStatuses.map(s => (
                          <DropdownMenu.Item
                            key={s}
                            onSelect={() => handleStatusSelect(s)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-white hover:bg-[#1E293B] cursor-pointer outline-none transition-colors"
                          >
                            <StatusBadge status={s} />
                          </DropdownMenu.Item>
                        ))}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              )}

              {/* Operator info fields */}
              <div className="space-y-2.5 pt-2 text-xs border-t border-[#1E293B]">
                {/* Changed Start Date to Created On */}
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

                {/* Surveillance Tier Metadata */}
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[#64748B] text-[11px]">Surveillance Tier</span>
                    <button
                      type="button"
                      onClick={() => setShowTierTooltip(!showTierTooltip)}
                      className="text-[#64748B] hover:text-[#3B82F6] cursor-pointer"
                      title="Tier Info"
                    >
                      <Info size={12} />
                    </button>
                  </div>
                  <span className="font-semibold text-white text-xs">{currentAlert.tier || '—'}</span>

                  {showTierTooltip && (
                    <div className="mt-2 bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3 text-[11px] text-[#94A3B8] space-y-1.5">
                      <div><strong className="text-white">Tier 4:</strong> No abnormality detected</div>
                      <div><strong className="text-white">Tier 3:</strong> Slight deviation observed</div>
                      <div><strong className="text-white">Tier 2:</strong> Confirmed anomaly; operable in degraded mode</div>
                      <div><strong className="text-white">Tier 1:</strong> Critical; close to failure limits</div>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Validation Date</span>
                  <span className="font-mono text-[#94A3B8]">{validationDateDisplay}</span>
                </div>

                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Validation By</span>
                  <span className="text-[#94A3B8] font-mono">{validationByDisplay}</span>
                </div>
              </div>

              {/* Comment Section: Read-only for validated/rejected alerts */}
              <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8] font-medium">Validation Comment</span>
                  {commentSavedFeedback && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Check size={12} /> Saved
                    </span>
                  )}
                </div>

                {isReadOnly ? (
                  <div className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3 text-xs text-[#E2E8F0] leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {currentAlert.comment || '—'}
                  </div>
                ) : (
                  <>
                    <textarea
                      value={commentText}
                      onChange={e => {
                        setCommentText(e.target.value);
                        if (commentError) setCommentError(null);
                      }}
                      rows={3}
                      placeholder="Add operator notes or validation justifications..."
                      className={`w-full bg-[#0B0F19] border rounded-xl p-3 text-xs text-white placeholder-[#64748B] outline-none transition-colors resize-none ${
                        commentError ? 'border-red-500' : 'border-[#1E293B] focus:border-[#3B82F6]'
                      }`}
                    />
                    {commentError && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400">
                        <AlertCircle size={13} className="shrink-0" />
                        <span>{commentError}</span>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveComment}
                        disabled={isSavingComment || !commentText.trim()}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#1E293B] text-white hover:bg-[#334155] disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isSavingComment ? 'Saving...' : 'Save Note'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Action Button: Workbench */}
              <div className="pt-2 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => alert('Opening Workbench...')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-medium hover:border-[#3B82F6] transition-colors cursor-pointer"
                >
                  <Wrench size={13} />
                  <span>Open Workbench</span>
                </button>
              </div>
            </div>

            {/* Alert History Card (Only validated alerts, no status badge) */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Alert History
                </h3>
                <span className="text-[11px] text-[#64748B] font-mono">
                  {alertHistory.length} validated
                </span>
              </div>

              {alertHistory.length === 0 ? (
                <div className="text-xs text-[#64748B] italic py-2">
                  No previous validated alerts recorded for this asset and rule.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alertHistory.map(histAlert => {
                    const startStr = formatUtcDateTime(histAlert.triggeredAtRaw || histAlert.triggeredAt);
                    const endStr = formatUtcDateTime(histAlert.endDateRaw || histAlert.endDate);

                    return (
                      <Link
                        key={histAlert.id}
                        href={`/alert-review/${histAlert.id}?from=${fromTab}`}
                        className="block p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] hover:border-[#3B82F6] transition-colors group cursor-pointer"
                      >
                        <div className="mb-1">
                          <span className="font-mono text-xs font-semibold text-[#3B82F6] group-hover:underline">
                            ALT-{histAlert.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8] font-mono">
                          Start: {startStr}
                        </div>
                        <div className="text-[11px] text-white font-mono">
                          End: {endStr}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Validate Alert Confirmation Modal (matching image 5) */}
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
              Are you sure you want to validate alert <span className="font-mono font-semibold text-white">ALT-{currentAlert.id}</span>? Once validated, it will move to the <span className="font-medium text-white">Validated Alerts</span> tab.
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
                onClick={handleConfirmValidation}
                className="px-4 py-2 text-xs rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors cursor-pointer"
              >
                Yes, validate
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Reject Event Modal */}
      <RejectEventModal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onSubmit={handleConfirmRejection}
      />
    </>
  );
}
