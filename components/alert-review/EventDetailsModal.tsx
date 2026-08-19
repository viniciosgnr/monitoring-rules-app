'use client';
import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileText, ExternalLink, Calendar, Info } from 'lucide-react';
import StatusBadge, { Status } from '@/components/ui/StatusBadge';

interface AlertRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  ruleName: string;
  ruleDescription?: string | null;
  timeseries?: string;
  type: string;
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
  onStatusChange: (id: number, newStatus: Status, comment?: string) => Promise<void>;
}

export default function EventDetailsModal({
  open,
  onClose,
  alert,
  onStatusChange,
}: EventDetailsModalProps) {
  const [comment, setComment] = useState('Alert verified by surveillance engineer.');
  const [updating, setUpdating] = useState(false);

  if (!alert) return null;

  const eventRef = alert.eventId || `UNY26-MA${alert.id}`;
  const ruleId = alert.ruleName || 'COCE_GEN_SPK_01';
  const timeseriesTag = alert.timeseries ? `pi:${alert.timeseries}` : `pi:${alert.fpso}:FPSO:771-PI-1868_A`;
  const failureMode = alert.ruleDescription || 'HH vibration or HH temperatures on gearbox component';
  const startDate = alert.triggeredAt ? alert.triggeredAt.split(',')[0] : '2026-05-13';
  const endDateStr = alert.endDate ? alert.endDate.split(',')[0] : '2026-05-15';

  async function handleValidate() {
    if (!alert) return;
    setUpdating(true);
    await onStatusChange(alert.id, 'validated', comment);
    setUpdating(false);
    onClose();
  }

  async function handleCloseEvent() {
    if (!alert) return;
    setUpdating(true);
    await onStatusChange(alert.id, 'closed', comment);
    setUpdating(false);
    onClose();
  }

  // Generate mock SVG path for timeseries line chart matching Figma Image 1
  const chartPoints = [
    [0, 45], [15, 38], [30, 52], [45, 42], [60, 68], [75, 40], [90, 55],
    [105, 35], [120, 60], [135, 48], [150, 72], [165, 40], [180, 50],
    [195, 30], [210, 42], [225, 25], [240, 38], [255, 30], [270, 40],
    [285, 22], [300, 35], [315, 48], [330, 30], [345, 62], [360, 40],
    [375, 52], [390, 38], [405, 45], [420, 32], [435, 58], [450, 42],
    [465, 50], [480, 45], [495, 65], [510, 35], [525, 48], [540, 40]
  ];
  const pathD = chartPoints.reduce((acc, [x, y], idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`, '');

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[950px] max-h-[92vh] overflow-y-auto bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none text-white">
          
          {/* ── Modal Header ── */}
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <Dialog.Title className="text-base font-semibold text-white">
                Event Details: <span className="font-mono text-blue-400">{eventRef}</span> - Monitoring alert triggered
              </Dialog.Title>
              <StatusBadge status={alert.status} />
            </div>
            <Dialog.Close className="text-[#64748B] hover:text-white transition-colors cursor-pointer">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* ── Main 2-Column Body Layout ── */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Left Section (2 Cols): Metadata Table + Time Series Chart */}
            <div className="col-span-2 space-y-5">
              
              {/* Metadata Grid */}
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4 space-y-3 text-xs">
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
                  <span className="text-[#94A3B8]">Failure Mode</span>
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
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Validation Date</span>
                  <span className="font-mono text-[#94A3B8]">{alert.reviewedAt || '2026-07-21 12:03:50'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Validated by</span>
                  <span className="text-blue-400 font-mono">{alert.reviewedBy || 'operator@slb.com'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-1">Comment</span>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full bg-[#0B0F19] border border-[#1E293B] rounded-lg p-2 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#3B82F6] transition-colors h-16 resize-none"
                  />
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px] mb-0.5">Closure Date</span>
                  <span className="text-[#94A3B8]">—</span>
                </div>
              </div>

              {/* Action Buttons Column matching Figma Image 1 */}
              <div className="space-y-2.5 pt-6 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => window.alert('Generating Event Report PDF...')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-normal rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
                >
                  <FileText size={13} />
                  Generate Event Report
                </button>

                <button
                  type="button"
                  onClick={() => window.alert('Opening in Canvas...')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-normal rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} />
                  Analyze in Canvas
                </button>

                {alert.status !== 'closed' && alert.status !== 'validated' ? (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={handleValidate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-full bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Calendar size={13} />
                    {updating ? 'Validating…' : 'Validate Event'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={handleCloseEvent}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-full bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Calendar size={13} />
                    {updating ? 'Closing…' : 'Close Event'}
                  </button>
                )}
              </div>

            </div>

          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
