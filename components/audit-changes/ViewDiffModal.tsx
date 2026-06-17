'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface AuditEntry {
  equipmentCode: string;
  ruleName: string;
  timestamp: string;
  userEmail: string;
  beforeState: object;
  afterState: object;
}

interface Props {
  open: boolean;
  onClose: () => void;
  entry: AuditEntry | null;
}

export default function ViewDiffModal({ open, onClose, entry }: Props) {
  if (!entry) return null;

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[900px] max-h-[85vh] overflow-y-auto bg-bg-panel rounded-card border border-border-panel p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Dialog.Title className="text-base font-semibold text-text-primary">
                Parameter Changes
              </Dialog.Title>
              <span className="equipment-badge">{entry.equipmentCode}</span>
            </div>
            <Dialog.Close className="text-text-muted hover:text-text-primary transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Subtitle */}
          <p className="text-xs text-text-muted mb-5">
            {entry.ruleName} &bull; {entry.timestamp} &bull; Changed by: {entry.userEmail}
          </p>

          {/* Diff panels */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-red-900/50 bg-[#180a0a] p-4 overflow-auto max-h-[500px]">
              <p className="text-sm font-semibold text-red-400 mb-3">Before</p>
              <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(entry.beforeState, null, 2)}
              </pre>
            </div>
            <div className="rounded border border-green-900/50 bg-[#0a180a] p-4 overflow-auto max-h-[500px]">
              <p className="text-sm font-semibold text-green-400 mb-3">After</p>
              <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(entry.afterState, null, 2)}
              </pre>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
