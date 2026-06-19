'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Info } from 'lucide-react';
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
  equipmentCode: string;
  steps: Steps;
}

const inputCls =
  'w-full mt-1 bg-bg-input border border-border-panel rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors';

/* ─── Inline tooltip ───────────────────────────────────────────────── */
function ParamTooltip({ text }: { text: string }) {
  return (
    <span className="relative group cursor-help inline-flex ml-1.5 align-middle">
      <Info size={12} className="text-text-muted group-hover:text-accent-blue transition-colors" />
      <span className="
        absolute left-1/2 -translate-x-1/2 bottom-full mb-2
        w-64 bg-bg-panel border border-border-panel rounded-card
        shadow-xl px-3 py-2.5 text-xs text-text-muted leading-relaxed
        opacity-0 pointer-events-none
        group-hover:opacity-100 group-hover:pointer-events-auto
        transition-opacity duration-150 z-[60]
        whitespace-normal text-left
      ">
        {text}
        <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-border-panel" />
      </span>
    </span>
  );
}

/* ─── Field row wrapper ────────────────────────────────────────────── */
function FieldBlock({
  label,
  tooltip,
  hint,
  children,
}: {
  label: string;
  tooltip?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center text-xs text-text-muted">
        {label}
        {tooltip && <ParamTooltip text={tooltip} />}
      </label>
      {children}
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

/* ─── Section header ───────────────────────────────────────────────── */
function SectionTitle({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <p className="text-sm font-medium text-text-primary mb-3 flex items-center">
      {label}
      <ParamTooltip text={tooltip} />
    </p>
  );
}

export default function EditRuleModal({
  open, onClose, ruleId, ruleName, equipmentCode, steps,
}: Props) {
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

          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="text-base font-semibold text-text-primary mb-1">
                Monitoring Rule — Details
              </Dialog.Title>
              {/* Selected rule identity */}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="equipment-badge">{equipmentCode}</span>
                <span className="text-xs font-mono text-text-primary font-semibold">{ruleName}</span>
                <span className="text-xs text-text-muted">· Data Processing Steps</span>
              </div>
            </div>
            <Dialog.Close className="text-text-muted hover:text-text-primary transition-colors mt-0.5">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="border-t border-border-panel mb-6" />

          {/* ── Abs Value ── */}
          <div className="mb-6">
            <SectionTitle
              label="Abs Value"
              tooltip="Converts all selected tag values to their absolute (non-negative) form before the rule logic runs. Useful when sensor readings can be negative but only the magnitude matters for threshold comparison."
            />
            <FieldBlock
              label="Tags to apply"
              hint="Comma-separated list · e.g. RUN, Surge Margin Actual"
            >
              <input
                value={s.abs_value?.tags_to_apply ?? ''}
                onChange={e => setS({ ...s, abs_value: { tags_to_apply: e.target.value } })}
                className={inputCls}
              />
            </FieldBlock>
          </div>

          {/* ── Drop Missing ── */}
          <div className="mb-6">
            <SectionTitle
              label="Drop Missing"
              tooltip="Removes data points where the selected tags have null, NaN or missing values before the rule evaluates. Prevents false alerts caused by sensor outages, communication gaps or bad-quality data frames."
            />
            <FieldBlock
              label="Tags to apply"
              hint="Comma-separated list · e.g. RUN, all"
            >
              <input
                value={s.drop_missing?.tags_to_apply ?? ''}
                onChange={e => setS({ ...s, drop_missing: { tags_to_apply: e.target.value } })}
                className={inputCls}
              />
            </FieldBlock>
          </div>

          {/* ── Join Timeseries ── */}
          <div className="mb-6">
            <SectionTitle
              label="Join Timeseries"
              tooltip="Merges multiple timeseries into a single time-aligned dataset using an inner join on timestamps. Required when the rule compares values from different sensors that may have different sampling intervals."
            />
            <FieldBlock
              label="Tags to apply"
              hint="Comma-separated list · e.g. all"
            >
              <input
                value={s.join_timeseries?.tags_to_apply ?? ''}
                onChange={e => setS({ ...s, join_timeseries: { tags_to_apply: e.target.value } })}
                className={inputCls}
              />
            </FieldBlock>
          </div>

          {/* ── Round Timestamp ── */}
          <div className="mb-6">
            <SectionTitle
              label="Round Timestamp"
              tooltip="Rounds all timestamps to the nearest defined interval. Ensures consistent time alignment when joining data from sensors with different sampling rates (e.g. 1-minute vs 5-minute data)."
            />
            <div className="grid grid-cols-2 gap-4">
              <FieldBlock
                label="Period"
                hint="e.g. min · 5min · h"
              >
                <input
                  value={s.round_timestamp?.period ?? ''}
                  onChange={e => setS({
                    ...s,
                    round_timestamp: {
                      period:         e.target.value,
                      tags_to_apply:  s.round_timestamp?.tags_to_apply ?? '',
                    },
                  })}
                  className={inputCls}
                />
              </FieldBlock>
              <FieldBlock
                label="Tags to apply"
                hint="Comma-separated list · e.g. all"
              >
                <input
                  value={s.round_timestamp?.tags_to_apply ?? ''}
                  onChange={e => setS({
                    ...s,
                    round_timestamp: {
                      period:        s.round_timestamp?.period ?? '',
                      tags_to_apply: e.target.value,
                    },
                  })}
                  className={inputCls}
                />
              </FieldBlock>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 border-t border-border-panel pt-4">
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
