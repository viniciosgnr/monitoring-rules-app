'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, SlidersHorizontal, ChevronDown, ExternalLink } from 'lucide-react';
import SeverityBadge from '@/components/ui/SeverityBadge';

interface AlertRow {
  id: number;
  fpso: string;
  equipmentCode: string;
  ruleName: string;
  timeseries?: string;
  eventRef?: string | null;
  [key: string]: unknown;
}

interface GroupAlertsModalProps {
  open: boolean;
  onClose: () => void;
  selectedAlerts: AlertRow[];
  generatedEventId: string;
  onConfirm?: (eventId: string, description: string, severity: string) => Promise<void>;
  mode?: 'create' | 'view';
  initialSeverity?: string;
  initialTier?: string;
  initialDescription?: string;
}

export default function GroupAlertsModal({
  open,
  onClose,
  selectedAlerts,
  generatedEventId,
  onConfirm,
  mode = 'create',
  initialSeverity,
  initialTier,
  initialDescription,
}: GroupAlertsModalProps) {
  const [description, setDescription] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('Select');
  const [error, setError] = useState<string | null>(null);
  const [severityError, setSeverityError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setDescription(initialDescription || '');
      setSelectedSeverity(initialSeverity || initialTier || 'Select');
      setError(null);
      setSeverityError(null);
    }
  }, [open, initialSeverity, initialTier, initialDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') {
      onClose();
      return;
    }
    if (!onConfirm) return;

    let hasError = false;
    if (!selectedSeverity || selectedSeverity === 'Select' || selectedSeverity === 'Select tier') {
      setSeverityError('Please select a Severity before releasing alerts.');
      hasError = true;
    }
    if (!description.trim()) {
      setError('Please provide an event description to complete the release.');
      hasError = true;
    }
    if (hasError) return;

    setError(null);
    setSeverityError(null);
    setLoading(true);
    try {
      await onConfirm(generatedEventId, description.trim(), selectedSeverity);
      setDescription('');
      setSelectedSeverity('Select');
      onClose();
    } catch {
      setError('An error occurred while releasing alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError(null);
    setSeverityError(null);
    setDescription('');
    setSelectedSeverity('Select');
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/75 z-50 backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[960px] max-w-[95vw] max-h-[90vh] bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none text-white outline-none font-sans overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] shrink-0">
            <div className="flex items-center gap-2.5">
              <Dialog.Title className="text-base font-semibold text-white">
                Release to Event Manager
              </Dialog.Title>
              <span className="px-2 py-0.5 rounded-md bg-[#1E293B] border border-[#334155]/40 text-[#94A3B8] text-xs font-medium font-sans">
                {selectedAlerts.length} alert{selectedAlerts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-[#64748B] hover:text-white transition-colors cursor-pointer p-1"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden mt-4">
            {/* 2-Column Responsive Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-y-auto pr-1">
              
              {/* Left Column (cols 1-7): Selected Alerts Table */}
              <div className="lg:col-span-7 space-y-2">
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="text-[#94A3B8] text-xs font-normal border-b border-[#1E293B] sticky top-0 bg-[#111827]">
                      <tr>
                        <th className="py-2.5 pr-3 font-normal whitespace-nowrap">Asset</th>
                        <th className="py-2.5 px-3 font-normal whitespace-nowrap">Alert Ref.</th>
                        <th className="py-2.5 px-3 font-normal whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>Timeseries list</span>
                            <div className="flex items-center gap-1.5">
                              <span className="w-8 h-px bg-[#1E293B]" />
                              <SlidersHorizontal size={12} className="text-[#64748B]" />
                            </div>
                          </div>
                        </th>
                        <th className="py-2.5 pl-3 font-normal whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>Rules</span>
                            <div className="flex items-center gap-1.5">
                              <span className="w-8 h-px bg-[#1E293B]" />
                              <SlidersHorizontal size={12} className="text-[#64748B]" />
                            </div>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]/60">
                      {selectedAlerts.map(alert => (
                        <tr key={alert.id} className="hover:bg-[#151D2E]/60 transition-colors">
                          <td className="py-3 pr-3 font-mono text-white text-xs whitespace-nowrap">
                            {alert.equipmentCode}
                          </td>
                          <td className="py-3 px-3 font-mono text-white text-xs whitespace-nowrap">
                            ALT-{alert.id}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-[#94A3B8] max-w-[170px] truncate" title={alert.timeseries}>
                            {alert.timeseries || '—'}
                          </td>
                          <td className="py-3 pl-3 font-mono text-xs text-white whitespace-nowrap">
                            {alert.ruleName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column (cols 8-12): Metadata & Inputs */}
              <div className="lg:col-span-5 space-y-4 pl-0 lg:pl-5 lg:border-l border-[#1E293B]">
                {/* Generated Group Ref. */}
                <div>
                  <span className="text-xs text-[#94A3B8] block mb-1">Generated Group Ref.:</span>
                  <span className="font-mono text-sm font-semibold text-[#60A5FA]">
                    {generatedEventId}
                  </span>
                </div>

                {/* Event Ref. */}
                <div>
                  <span className="text-xs text-[#94A3B8] block mb-1">Event Ref.:</span>
                  <span className="font-mono text-xs">
                    {mode === 'view' && selectedAlerts[0]?.eventRef ? (
                      <span className="text-[#60A5FA] flex items-center gap-1 font-medium">
                        <ExternalLink size={12} />
                        <span>{selectedAlerts[0].eventRef}</span>
                      </span>
                    ) : (
                      <span className="text-white text-xs">Pending sync</span>
                    )}
                  </span>
                </div>

                {/* Severity */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[#94A3B8] block">
                    Severity <span className="text-[#60A5FA]">*</span>
                  </label>
                  {mode === 'view' ? (
                    <div className="py-1">
                      <SeverityBadge severity={selectedSeverity && selectedSeverity !== 'Select' ? selectedSeverity : 'Medium'} />
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedSeverity}
                        onChange={e => {
                          setSelectedSeverity(e.target.value);
                          if (e.target.value !== 'Select') {
                            setSeverityError(null);
                          }
                        }}
                        disabled={loading}
                        className={`w-full bg-[#0B0F19] border rounded-lg px-3 py-2 text-xs text-white outline-none appearance-none transition-colors cursor-pointer ${
                          severityError
                            ? 'border-red-500'
                            : 'border-[#1E293B] hover:border-[#3B82F6] focus:border-[#3B82F6]'
                        }`}
                      >
                        <option value="Select" disabled className="bg-[#111827] text-[#64748B]">
                          Select
                        </option>
                        <option value="Low" className="bg-[#111827] text-white">Low</option>
                        <option value="Medium" className="bg-[#111827] text-white">Medium</option>
                        <option value="High" className="bg-[#111827] text-white">High</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-2.5 text-[#94A3B8] pointer-events-none" />
                    </div>
                  )}
                  {severityError && (
                    <span className="text-[11px] text-red-400 block">{severityError}</span>
                  )}
                </div>

                {/* Event Description */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[#94A3B8] block">
                    Event Description<span className="text-[#60A5FA]">*</span>
                  </label>
                  {mode === 'view' ? (
                    <div className="text-xs text-[#E2E8F0] leading-relaxed py-1 whitespace-pre-wrap">
                      {description || 'The probability of failure of the equipment is increasing, because no maintenance has been done recently.'}
                    </div>
                  ) : (
                    <textarea
                      value={description}
                      onChange={e => {
                        setDescription(e.target.value);
                        if (error) setError(null);
                      }}
                      disabled={loading}
                      rows={4}
                      placeholder="Provide a detailed description or root cause justification for grouping these validatd alerts..."
                      className={`w-full bg-[#0B0F19] border rounded-lg p-3 text-xs text-white placeholder-[#64748B] outline-none transition-colors resize-none ${
                        error ? 'border-red-500' : 'border-[#1E293B] focus:border-[#3B82F6]'
                      }`}
                    />
                  )}
                  {error && (
                    <span className="text-[11px] text-red-400 block">{error}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B] shrink-0 mt-4">
              {mode === 'view' ? (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:border-[#3B82F6] font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              ) : (
                <>
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
                    className="px-5 py-2 text-xs rounded-full bg-[#60A5FA] hover:bg-[#3B82F6] disabled:opacity-50 text-[#0B0F19] font-medium transition-all shadow-sm cursor-pointer"
                  >
                    {loading ? 'Releasing...' : 'Release to Event Manager'}
                  </button>
                </>
              )}
            </div>
          </form>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
