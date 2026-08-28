'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface RejectEventModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reasons: string[], comment: string) => void;
}

type ReasonKey = 'falsePositive' | 'alertResolvedLocally' | 'duplicate' | 'other';

export default function RejectEventModal({
  open,
  onClose,
  onSubmit,
}: RejectEventModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReasonKey | null>(null);
  const [comment, setComment] = useState('');

  const handleSelectReason = (key: ReasonKey) => {
    setSelectedReason(prev => (prev === key ? null : key));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedReasons: string[] = [];
    if (selectedReason === 'falsePositive') selectedReasons.push('False positive');
    if (selectedReason === 'alertResolvedLocally') selectedReasons.push('Alert resolved locally');
    if (selectedReason === 'duplicate') selectedReasons.push('Duplicate');
    if (selectedReason === 'other') selectedReasons.push('Other');

    onSubmit(selectedReasons, comment);
    // Reset state
    setSelectedReason(null);
    setComment('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[460px] max-w-[92vw] bg-[#1F2436] rounded-2xl border border-[#2B3347] p-6 shadow-2xl select-none text-white outline-none font-sans">
          
          {/* Header Title */}
          <Dialog.Title className="text-base font-semibold text-white mb-2.5">
            Reject Event
          </Dialog.Title>

          {/* Warning & Description */}
          <p className="text-xs text-[#A0AEC0] leading-relaxed mb-4">
            Are you sure you want to reject this event? This action cannot be undone. Please provide a reason for rejection
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* Reason(s) Options (Single Selection Only) */}
            <div className="space-y-3">
              <span className="block text-xs font-medium text-[#A0AEC0]">Reason(s):</span>
              
              <div className="space-y-2.5 text-xs text-white font-semibold">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedReason === 'falsePositive'}
                    onChange={() => handleSelectReason('falsePositive')}
                    className="w-4 h-4 rounded bg-[#131722] border-[#384259] text-blue-500 focus:ring-0 cursor-pointer accent-[#3B82F6]"
                  />
                  <span>False positive</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedReason === 'alertResolvedLocally'}
                    onChange={() => handleSelectReason('alertResolvedLocally')}
                    className="w-4 h-4 rounded bg-[#131722] border-[#384259] text-blue-500 focus:ring-0 cursor-pointer accent-[#3B82F6]"
                  />
                  <span>Alert resolved locally</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedReason === 'duplicate'}
                    onChange={() => handleSelectReason('duplicate')}
                    className="w-4 h-4 rounded bg-[#131722] border-[#384259] text-blue-500 focus:ring-0 cursor-pointer accent-[#3B82F6]"
                  />
                  <span>Duplicate</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedReason === 'other'}
                    onChange={() => handleSelectReason('other')}
                    className="w-4 h-4 rounded bg-[#131722] border-[#384259] text-blue-500 focus:ring-0 cursor-pointer accent-[#3B82F6]"
                  />
                  <span>Other</span>
                </label>
              </div>
            </div>

            {/* Comment Box (Only visible when 'Other' is selected) */}
            {selectedReason === 'other' && (
              <div className="pt-1">
                <div className="relative">
                  <textarea
                    value={comment}
                    onChange={e => {
                      if (e.target.value.length <= 200) {
                        setComment(e.target.value);
                      }
                    }}
                    placeholder="Enter a comment"
                    rows={3}
                    className="w-full bg-[#131722] border border-amber-500 ring-1 ring-amber-500/40 rounded-xl p-3 text-xs text-white placeholder-[#718096] outline-none resize-none transition-colors"
                  />
                </div>
                <div className="text-right text-[10px] text-[#A0AEC0] mt-1 font-mono">
                  {comment.length}/200
                </div>
              </div>
            )}

            {/* Action Buttons (Capsule Pills) */}
            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-full bg-[#131722] border border-[#384259] text-white text-xs font-semibold hover:border-[#3B82F6] transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-[#485268] hover:bg-[#3B82F6] text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              >
                Submit
              </button>
            </div>

          </form>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
