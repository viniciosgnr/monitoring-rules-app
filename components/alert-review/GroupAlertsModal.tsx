'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Layers, AlertCircle } from 'lucide-react';
import EquipmentBadge from '@/components/ui/EquipmentBadge';

interface AlertRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  ruleName: string;
  timeseries?: string;
  [key: string]: unknown;
}

interface GroupAlertsModalProps {
  open: boolean;
  onClose: () => void;
  selectedAlerts: AlertRow[];
  generatedEventId: string;
  onConfirm: (eventId: string, description: string) => Promise<void>;
}

export default function GroupAlertsModal({
  open,
  onClose,
  selectedAlerts,
  generatedEventId,
  onConfirm,
}: GroupAlertsModalProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide an event description to complete the grouping.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(generatedEventId, description.trim());
      setDescription('');
      onClose();
    } catch {
      setError('An error occurred while grouping alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError(null);
    setDescription('');
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 z-50 backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[720px] max-w-[94vw] bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none text-white outline-none font-sans">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
                <Layers size={16} />
              </div>
              <div>
                <Dialog.Title className="text-base font-semibold text-white">
                  Group Validated Alerts
                </Dialog.Title>
                <Dialog.Description className="text-xs text-[#94A3B8]">
                  Group selected alerts under a common Event ID and description.
                </Dialog.Description>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-[#64748B] hover:text-white transition-colors cursor-pointer p-1"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Generated Event ID preview */}
            <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold block mb-0.5">
                  Generated Event ID
                </span>
                <span className="font-mono text-base font-bold text-[#3B82F6]">
                  {generatedEventId}
                </span>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full bg-[#1E293B] border border-[#334155]/40 text-[#E2E8F0] text-xs font-semibold">
                  {selectedAlerts.length} alert{selectedAlerts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Selected Alerts Mini-Table: Asset | AlertId | Time series list | Rules */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[#94A3B8]">Selected Alerts for Grouping</span>
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#070A10]/70 border-b border-[#1E293B] text-[#94A3B8] text-[11px] font-medium sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2.5">Asset</th>
                      <th className="px-3.5 py-2.5">Alert ID</th>
                      <th className="px-3.5 py-2.5">Time series list</th>
                      <th className="px-3.5 py-2.5">Rules</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]/60">
                    {selectedAlerts.map(alert => (
                      <tr key={alert.id} className="hover:bg-[#151D2E] transition-colors">
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <EquipmentBadge code={alert.equipmentCode} />
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap font-mono text-xs font-medium text-white">
                          ALT-{alert.id}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-xs text-[#94A3B8] max-w-[200px] truncate" title={alert.timeseries}>
                          {alert.timeseries || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap font-mono text-xs text-white">
                          {alert.ruleName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mandatory Event Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white flex items-center gap-1">
                  <span>Event Description</span>
                  <span className="text-red-400">*</span>
                </label>
                <span className="text-[11px] text-[#94A3B8]">Required</span>
              </div>
              <textarea
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                rows={3}
                placeholder="Provide a detailed description or root cause justification for grouping these validated alerts..."
                className={`w-full bg-[#0B0F19] border rounded-xl p-3 text-xs text-white placeholder-[#64748B] outline-none transition-colors resize-none ${
                  error
                    ? 'border-red-500 ring-1 ring-red-500/40'
                    : 'border-[#1E293B] focus:border-[#3B82F6]'
                }`}
              />
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-5 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-xs rounded-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-medium transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                {loading ? 'Grouping...' : 'Confirm Grouping'}
              </button>
            </div>
          </form>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
