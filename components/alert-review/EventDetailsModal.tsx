'use client';
import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { X, FileText, ExternalLink, Info, Wrench, ChevronDown } from 'lucide-react';
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
  triggeredAt: string;
  triggeredAtRaw?: string;
  reviewedAt: string;
  reviewedBy: string;
  status: Status;
  eventId?: string;
  [key: string]: unknown;
}

interface EventDetailsModalProps {
  open: boolean;
  onClose: () => void;
  alert: AlertRow | null;
  onStatusChange?: (id: number, newStatus: Status, comment?: string) => Promise<void>;
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

export default function EventDetailsModal({
  open,
  onClose,
  alert,
  onStatusChange,
}: EventDetailsModalProps) {
  const [selectedTier, setSelectedTier] = React.useState<string>('Select tier');
  const [showTierTooltip, setShowTierTooltip] = React.useState<boolean>(false);

  if (!alert) return null;

  const eventRef = alert.eventId || `UNY26-MA${alert.id}`;
  const ruleId = alert.ruleName || 'COCE_GEN_SPK_01';
  const timeseriesTag = alert.timeseries ? `pi:${alert.timeseries}` : `pi:${alert.fpso}:FPSO:771-PI-1868_A`;
  const failureMode = alert.ruleDescription || 'HH vibration or HH temperatures on gearbox component';
  const startDate = alert.triggeredAt ? alert.triggeredAt.split(',')[0] : '2026-05-13';
  const endDateStr = alert.endDate ? alert.endDate.split(',')[0] : '2026-05-15';

  // Generate mock SVG path for timeseries line chart matching Figma Image 1
  const chartPoints = [
    [0, 45], [15, 38], [30, 52], [45, 42], [60, 68], [75, 40], [90, 55],
    [105, 35], [120, 60], [135, 48], [150, 72], [165, 40], [180, 50],
    [195, 30], [210, 42], [225, 25], [240, 38], [255, 30], [270, 40],
    [285, 22], [300, 35], [315, 48], [330, 30], [345, 62], [360, 40],
    [375, 28], [390, 35], [405, 20], [420, 30], [435, 25], [450, 35],
    [465, 28], [480, 42], [495, 30], [510, 25], [525, 32], [540, 28]
  ];
  const pathD = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[950px] max-h-[92vh] overflow-y-auto bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none text-white">
          
          {/* ── Modal Header ── */}
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <Dialog.Title className="text-base font-semibold text-white">
                Alert Details: <span className="font-mono text-blue-400">{eventRef}</span> - {alert.source || 'Monitoring Rules Engine'}
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
            
            {/* Left Main Section (2 Cols): Metadata Grid + Time Series Chart */}
            <div className="col-span-2 space-y-5">
              
              {/* Metadata Grid */}
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4 space-y-2.5 text-xs">
                <h3 className="text-xs font-semibold text-white mb-2">Monitoring Alert</h3>
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Alert type</span>
                  <span className="col-span-2 text-white font-medium">{getAlertType(alert)}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Alert description</span>
                  <span className="col-span-2 text-[#E2E8F0] leading-relaxed">
                    Seal Gas Duplex Coalescent Filter Differential Pressure, External Seal Gas line 2 Temperature, Seal Gas Heater 3 Temperature, Seal Gas Heater Temperature
                  </span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Monitoring rule ID</span>
                  <span className="col-span-2 font-mono text-white">{ruleId}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">Start date</span>
                  <span className="col-span-2 font-mono text-white">{startDate}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5 border-b border-[#1E293B]/60">
                  <span className="text-[#94A3B8]">End date</span>
                  <span className="col-span-2 font-mono text-white">{endDateStr}</span>
                </div>
                <div className="grid grid-cols-3 py-1.5">
                  <span className="text-[#94A3B8]">Recommendations</span>
                  <span className="col-span-2 text-[#E2E8F0] leading-relaxed">{failureMode}</span>
                </div>
              </div>

              {/* Alert Time Series Box */}
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-white">Alert Time Series</h3>
                  <span className="text-[11px] font-mono text-[#94A3B8]">Latest: <span className="text-white">-0.36</span></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#3B82F6] mb-3">
                  <span>{timeseriesTag}</span>
                  <Info size={13} className="text-[#64748B] cursor-pointer" />
                </div>

                {/* SVG Time Series Chart Graph */}
                <div className="bg-[#070A10] border border-[#1E293B] rounded-lg p-3 relative h-48 flex flex-col justify-between">
                  <svg className="w-full h-36 overflow-visible" viewBox="0 0 540 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="540" y2="20" stroke="#1E293B" strokeDasharray="3 3" />
                    <line x1="0" y1="40" x2="540" y2="40" stroke="#1E293B" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="540" y2="60" stroke="#1E293B" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="540" y2="80" stroke="#1E293B" strokeDasharray="3 3" />

                    {/* Plot Line */}
                    <path d={pathD} fill="none" stroke="#38BDF8" strokeWidth="1.5" />
                  </svg>
                  {/* X-Axis labels */}
                  <div className="flex justify-between text-[10px] font-mono text-[#64748B] pt-2 border-t border-[#1E293B]">
                    <span>{startDate}</span>
                    <span>08:00</span>
                    <span>16:00</span>
                    <span>{endDateStr}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Sidebar Section (1 Col): Sidebar Info + Action Buttons */}
            <div className="border-l border-[#1E293B] pl-5 flex flex-col justify-between text-xs">
              <div className="space-y-4">
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Created On</span>
                  <span className="font-mono text-white text-xs">{alert.triggeredAt || '2026-07-10 22:36:33'}</span>
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

                {/* Surveillance Tier Input with English Criteria Tooltip */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[#64748B] text-[11px]">Tier</span>
                    <span className="text-red-400 text-[11px] font-bold">*</span>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setShowTierTooltip(!showTierTooltip)}
                        className="text-[#64748B] hover:text-[#3B82F6] transition-colors cursor-pointer p-0.5"
                        title="Surveillance Tier Criteria Info"
                      >
                        <Info size={13} />
                      </button>

                      {showTierTooltip && (
                        <div className="absolute right-0 top-6 w-[320px] bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl p-3.5 z-50 select-none text-left">
                          <div className="flex items-center justify-between border-b border-[#1E293B] pb-2 mb-2.5">
                            <span className="text-xs font-semibold text-white">Surveillance Tier Criteria</span>
                            <button
                              type="button"
                              onClick={() => setShowTierTooltip(false)}
                              className="text-[#64748B] hover:text-white transition-colors cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          
                          <div className="space-y-2 text-xs leading-relaxed text-[#94A3B8]">
                            <div>
                              <span className="font-semibold text-white">Tier 4:</span> No abnormality detected; no deviation from monitored parameters
                            </div>
                            <div>
                              <span className="font-semibold text-white">Tier 3:</span> Slight deviation observed; trends not yet significant
                            </div>
                            <div>
                              <span className="font-semibold text-white">Tier 2:</span> Confirmed anomaly; equipment operable in degraded mode
                            </div>
                            <div>
                              <span className="font-semibold text-white">Tier 1:</span> Confirmed anomaly close to failure limits
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <select
                    value={selectedTier}
                    onChange={e => setSelectedTier(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer hover:border-[#3B82F6] transition-colors"
                  >
                    <option value="Select tier" disabled className="bg-[#111827] text-[#64748B]">Select tier</option>
                    <option value="Good - Tier 4" className="bg-[#111827] text-white">Good - Tier 4</option>
                    <option value="Good - Tier 3" className="bg-[#111827] text-white">Good - Tier 3</option>
                    <option value="Degraded - Tier 2" className="bg-[#111827] text-white">Degraded - Tier 2</option>
                    <option value="Critical - Tier 1" className="bg-[#111827] text-white">Critical - Tier 1</option>
                  </select>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Validation Date</span>
                  <span className="font-mono text-[#94A3B8]">{alert.reviewedAt || '—'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Validated by</span>
                  <span className="text-[#94A3B8] font-mono">{alert.reviewedBy || '—'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Comment</span>
                  <span className="text-[#94A3B8] text-xs font-mono">{alert.reviewedBy ? 'Alert verified by surveillance engineer.' : '—'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Closure Date</span>
                  <span className="text-[#94A3B8]">—</span>
                </div>
              </div>

              {/* Action Buttons Column matching SLB FAST design */}
              <div className="space-y-2.5 pt-6 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => window.alert('Generating Alert Report PDF...')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-medium hover:border-[#3B82F6] transition-colors cursor-pointer"
                >
                  <FileText size={13} />
                  Generate Alert Report
                </button>

                <button
                  type="button"
                  onClick={() => window.alert('Opening in Canvas...')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-medium hover:border-[#3B82F6] transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} />
                  Analyze in Canvas
                </button>

                <button
                  type="button"
                  onClick={() => window.alert('Opening Workbench...')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-medium hover:border-[#3B82F6] transition-colors cursor-pointer"
                >
                  <Wrench size={13} />
                  Open Workbench
                </button>

                {/* Change Status Dropdown Button matching SLB OptiSite black pill design */}
                {onStatusChange && (
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
                              if (alert) {
                                await onStatusChange(alert.id, s);
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
