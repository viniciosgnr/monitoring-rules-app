'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
import { updateProcessingSteps } from '@/app/actions/ruleInstances';

interface Steps {
  abs_value?:       { tags_to_apply: string };
  drop_missing?:    { tags_to_apply: string };
  join_timeseries?: { tags_to_apply: string };
  round_timestamp?: { period: string; tags_to_apply: string };
}

interface Props {
  open: boolean;
  onClose: () => void;
  ruleId: number;
  ruleName: string;
  steps: Steps;
}

const inputCls =
  'w-full mt-1 bg-[#0b0f1a] border border-border-panel rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors';

export default function EditRuleModal({ open, onClose, ruleId, steps }: Props) {
  const [s, setS]           = useState<Steps>(steps);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateProcessingSteps(ruleId, s);
    setSaving(false);
    onClose();
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[900px] max-h-[85vh] overflow-y-auto bg-bg-panel rounded-card border border-border-panel p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-base font-semibold text-text-primary">
              Monitoring Rules — Details
            </Dialog.Title>
            <Dialog.Close className="text-text-muted hover:text-text-primary transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="border-b border-border-panel pb-3 mb-5 flex items-center justify-between cursor-pointer">
            <p className="text-sm font-medium text-text-primary">Data Processing Steps</p>
            <span className="text-text-muted text-xs">▲</span>
          </div>

          {/* Abs Value */}
          <div className="mb-5">
            <p className="text-sm font-medium text-text-primary mb-2">Abs Value</p>
            <label className="text-xs text-text-muted">Tags to apply</label>
            <input
              value={s.abs_value?.tags_to_apply ?? ''}
              onChange={e => setS({ ...s, abs_value: { tags_to_apply: e.target.value } })}
              className={inputCls}
            />
            <p className="text-xs text-text-muted mt-1">Comma-separated list</p>
          </div>

          {/* Drop Missing */}
          <div className="mb-5">
            <p className="text-sm font-medium text-text-primary mb-2">Drop Missing</p>
            <label className="text-xs text-text-muted">Tags to apply</label>
            <input
              value={s.drop_missing?.tags_to_apply ?? ''}
              onChange={e => setS({ ...s, drop_missing: { tags_to_apply: e.target.value } })}
              className={inputCls}
            />
            <p className="text-xs text-text-muted mt-1">Comma-separated list</p>
          </div>

          {/* Join Timeseries */}
          <div className="mb-5">
            <p className="text-sm font-medium text-text-primary mb-2">Join Timeseries</p>
            <label className="text-xs text-text-muted">Tags to apply</label>
            <input
              value={s.join_timeseries?.tags_to_apply ?? ''}
              onChange={e => setS({ ...s, join_timeseries: { tags_to_apply: e.target.value } })}
              className={inputCls}
            />
            <p className="text-xs text-text-muted mt-1">Comma-separated list</p>
          </div>

          {/* Round Timestamp */}
          <div className="mb-5">
            <p className="text-sm font-medium text-text-primary mb-2">Round Timestamp</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted">Period</label>
                <input
                  value={s.round_timestamp?.period ?? ''}
                  onChange={e => setS({
                    ...s,
                    round_timestamp: {
                      period: e.target.value,
                      tags_to_apply: s.round_timestamp?.tags_to_apply ?? '',
                    },
                  })}
                  className={inputCls}
                />
                <p className="text-xs text-text-muted mt-1">Comma-separated list</p>
              </div>
              <div>
                <label className="text-xs text-text-muted">Tags to apply</label>
                <input
                  value={s.round_timestamp?.tags_to_apply ?? ''}
                  onChange={e => setS({
                    ...s,
                    round_timestamp: {
                      period: s.round_timestamp?.period ?? '',
                      tags_to_apply: e.target.value,
                    },
                  })}
                  className={inputCls}
                />
                <p className="text-xs text-text-muted mt-1">Comma-separated list</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 border-t border-border-panel pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded border border-border-panel text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm rounded bg-accent-blue text-white font-medium hover:bg-accent-blue-dark disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
