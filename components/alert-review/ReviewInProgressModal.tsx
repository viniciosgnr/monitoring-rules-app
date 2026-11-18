'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface ReviewInProgressModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}

export default function ReviewInProgressModal({
  open,
  onClose,
  onSubmit,
}: ReviewInProgressModalProps) {
  const [comment, setComment] = useState('');

  const handleClose = () => {
    setComment('');
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setComment('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[460px] max-w-[92vw] bg-[#1F2436] rounded-2xl border border-[#2B3347] p-6 shadow-2xl select-none text-white outline-none font-sans">
          <Dialog.Title className="text-base font-semibold text-white mb-2.5">
            Review in Progress
          </Dialog.Title>

          <p className="text-xs text-[#A0AEC0] leading-relaxed mb-4">
            Are you sure you want to move this alert to Review in Progress? Please provide a comment describing the ongoing review.
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A0AEC0] mb-2">
                Comment <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                value={comment}
                onChange={e => {
                  if (e.target.value.length <= 200) {
                    setComment(e.target.value);
                  }
                }}
                placeholder="Enter a comment"
                rows={4}
                autoFocus
                className="w-full bg-[#131722] border border-[#384259] focus:border-[#3B82F6] rounded-xl p-3 text-xs text-white placeholder-[#718096] outline-none resize-none transition-colors"
              />
              <div className="text-right text-[10px] text-[#A0AEC0] mt-1 font-mono">
                {comment.length}/200
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 rounded-full bg-[#131722] border border-[#384259] text-white text-xs font-semibold hover:border-[#3B82F6] transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!comment.trim()}
                className="px-6 py-2 rounded-full bg-[#485268] hover:bg-[#3B82F6] disabled:opacity-45 disabled:hover:bg-[#485268] text-white text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed shadow-sm"
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

