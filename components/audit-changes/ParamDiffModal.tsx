'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Info } from 'lucide-react';

interface AuditEntry {
  equipmentCode: string;
  ruleName: string;
  timestamp: string;
  userEmail: string;
  beforeState: object;
  afterState: object;
  description: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  entry: AuditEntry | null;
}

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

interface StepValues {
  tags_to_apply?: string;
  period?: string;
}

interface Steps {
  abs_value?:       StepValues;
  drop_missing?:    StepValues;
  join_timeseries?: StepValues;
  round_timestamp?: StepValues;
  reason?:          string;
  enabled?:         boolean;
}

export default function ParamDiffModal({ open, onClose, entry }: Props) {
  if (!entry) return null;

  const before = (entry.beforeState as Steps) ?? {};
  const after  = (entry.afterState as Steps) ?? {};

  // Check if it is an enable/disable status change
  const isStatusChange =
    entry.description.toLowerCase().includes('enable') ||
    entry.description.toLowerCase().includes('disable') ||
    'enabled' in after;

  const absValueModified = before.abs_value?.tags_to_apply !== after.abs_value?.tags_to_apply;
  const dropMissingModified = before.drop_missing?.tags_to_apply !== after.drop_missing?.tags_to_apply;
  const joinTimeseriesModified = before.join_timeseries?.tags_to_apply !== after.join_timeseries?.tags_to_apply;
  const roundPeriodModified = before.round_timestamp?.period !== after.round_timestamp?.period;
  const roundTagsModified = before.round_timestamp?.tags_to_apply !== after.round_timestamp?.tags_to_apply;
  const roundTimestampModified = roundPeriodModified || roundTagsModified;

  const totalChanged = isStatusChange ? 0 : (
    (absValueModified ? 1 : 0) +
    (dropMissingModified ? 1 : 0) +
    (joinTimeseriesModified ? 1 : 0) +
    (roundTimestampModified ? 1 : 0)
  );

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[900px] max-h-[85vh] overflow-y-auto bg-bg-panel rounded-card border border-border-panel shadow-2xl">

          {/* ── Header ── */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border-panel">
            <div>
              <Dialog.Title className="text-base font-semibold text-text-primary mb-1.5">
                Monitoring Rule — Details
              </Dialog.Title>
              <div className="flex items-center gap-2">
                <span className="equipment-badge">{entry.equipmentCode}</span>
                <span className="text-xs font-mono text-text-primary font-semibold">{entry.ruleName}</span>
                <span className="text-xs text-text-muted">· Change record</span>
              </div>
            </div>
            <Dialog.Close className="text-text-muted hover:text-text-primary transition-colors mt-0.5">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* ── Meta bar ── */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-border-panel bg-bg-base/30">
            <p className="text-xs text-text-muted">
              {entry.timestamp}&nbsp;&bull;&nbsp;Changed by:&nbsp;
              <span className="text-text-primary font-medium">{entry.userEmail}</span>
            </p>
            {totalChanged > 0 && (
              <span className="text-xs font-semibold text-accent-blue">
                {totalChanged} section{totalChanged !== 1 ? 's' : ''} modified
              </span>
            )}
          </div>

          {/* ── Content / Parameters ── */}
          <div className="px-6 py-5">
            {isStatusChange ? (
              /* Status change banner (e.g. Enabled / Disabled with justification reason) */
              <div className="p-5 rounded-card bg-bg-banner border-l-4 border-accent-blue text-sm text-text-primary flex gap-4">
                <div className="flex-shrink-0 text-accent-blue mt-0.5">
                  <Info size={20} />
                </div>
                <div className="space-y-2.5 leading-relaxed">
                  <p className="font-semibold text-text-primary text-base">
                    {entry.description}
                  </p>
                  <div className="text-xs text-text-muted space-y-1.5">
                    <p><span className="font-medium text-text-primary">Date and time:</span> {entry.timestamp}</p>
                    <p><span className="font-medium text-text-primary">Author:</span> {entry.userEmail}</p>
                    {entry.description.toLowerCase().includes('disable') && (
                      <p><span className="font-medium text-text-primary">Reason:</span> {after.reason || 'No reason provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Parameter comparison cards */
              <div className="space-y-5">
                {/* ── Abs Value ── */}
                <div className="bg-bg-highlight border border-border-panel/80 rounded-card p-4">
                  <div className="border-b border-border-panel/40 pb-2 mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-text-primary">Abs Value</span>
                      <ParamTooltip text="Converts all selected tag values to their absolute (non-negative) form before the rule logic runs. Useful when sensor readings can be negative but only the magnitude matters for threshold comparison." />
                      {absValueModified && (
                        <span className="text-[10px] font-semibold text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded ml-2">
                          modified
                        </span>
                      )}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[34%]"></th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">Default</th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">Previous</th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">New</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-panel/40">
                      <tr className={absValueModified ? 'bg-bg-base/30' : ''}>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs font-semibold text-text-primary">
                            Tags to apply
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="font-mono text-xs text-text-muted">—</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          {absValueModified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-950 border border-red-900/40 text-red-300 font-mono text-xs line-through">
                              {before.abs_value?.tags_to_apply ?? '—'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-text-muted">{before.abs_value?.tags_to_apply ?? '—'}</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {absValueModified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-950 border border-cyan-900/40 text-cyan-300 font-mono text-xs font-semibold">
                              {after.abs_value?.tags_to_apply ?? '—'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-text-muted">{after.abs_value?.tags_to_apply ?? '—'}</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ── Drop Missing ── */}
                <div className="bg-bg-highlight border border-border-panel/80 rounded-card p-4">
                  <div className="border-b border-border-panel/40 pb-2 mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-text-primary">Drop Missing</span>
                      <ParamTooltip text="Removes data points where the selected tags have null, NaN or missing values before the rule evaluates. Prevents false alerts caused by sensor outages, communication gaps or bad-quality data frames." />
                      {dropMissingModified && (
                        <span className="text-[10px] font-semibold text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded ml-2">
                          modified
                        </span>
                      )}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[34%]"></th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">Default</th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">Previous</th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">New</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-panel/40">
                      <tr className={dropMissingModified ? 'bg-bg-base/30' : ''}>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs font-semibold text-text-primary">
                            Tags to apply
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="font-mono text-xs text-text-muted">—</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          {dropMissingModified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-950 border border-red-900/40 text-red-300 font-mono text-xs line-through">
                              {before.drop_missing?.tags_to_apply ?? '—'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-text-muted">{before.drop_missing?.tags_to_apply ?? '—'}</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {dropMissingModified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-950 border border-cyan-900/40 text-cyan-300 font-mono text-xs font-semibold">
                              {after.drop_missing?.tags_to_apply ?? '—'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-text-muted">{after.drop_missing?.tags_to_apply ?? '—'}</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ── Join Timeseries ── */}
                <div className="bg-bg-highlight border border-border-panel/80 rounded-card p-4">
                  <div className="border-b border-border-panel/40 pb-2 mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-text-primary">Join Timeseries</span>
                      <ParamTooltip text="Merges multiple timeseries into a single time-aligned dataset using an inner join on timestamps. Required when the rule compares values from different sensors that may have different sampling intervals." />
                      {joinTimeseriesModified && (
                        <span className="text-[10px] font-semibold text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded ml-2">
                          modified
                        </span>
                      )}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[34%]"></th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">Default</th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">Previous</th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">New</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-panel/40">
                      <tr className={joinTimeseriesModified ? 'bg-bg-base/30' : ''}>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs font-semibold text-text-primary">
                            Tags to apply
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="font-mono text-xs text-text-muted">—</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          {joinTimeseriesModified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-950 border border-red-900/40 text-red-300 font-mono text-xs line-through">
                              {before.join_timeseries?.tags_to_apply ?? '—'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-text-muted">{before.join_timeseries?.tags_to_apply ?? '—'}</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {joinTimeseriesModified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-950 border border-cyan-900/40 text-cyan-300 font-mono text-xs font-semibold">
                              {after.join_timeseries?.tags_to_apply ?? '—'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-text-muted">{after.join_timeseries?.tags_to_apply ?? '—'}</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ── Round Timestamp ── */}
                <div className="bg-bg-highlight border border-border-panel/80 rounded-card p-4">
                  <div className="border-b border-border-panel/40 pb-2 mb-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-text-primary">Round Timestamp</span>
                      <ParamTooltip text="Rounds all timestamps to the nearest defined interval. Ensures consistent time alignment when joining data from sensors with different sampling rates (e.g. 1-minute vs 5-minute data)." />
                      {roundTimestampModified && (
                        <span className="text-[10px] font-semibold text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded ml-2">
                          modified
                        </span>
                      )}
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[34%]"></th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">Default</th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">Previous</th>
                        <th className="text-left pb-2 text-xs font-medium text-text-muted w-[22%]">New</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-panel/40">
                      {/* Round Timestamp - Period */}
                      <tr className={roundPeriodModified ? 'bg-bg-base/30' : ''}>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs font-semibold text-text-primary">
                            Period
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="font-mono text-xs text-text-muted">—</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          {roundPeriodModified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-950 border border-red-900/40 text-red-300 font-mono text-xs line-through">
                              {before.round_timestamp?.period ?? '—'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-text-muted">{before.round_timestamp?.period ?? '—'}</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {roundPeriodModified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-950 border border-cyan-900/40 text-cyan-300 font-mono text-xs font-semibold">
                              {after.round_timestamp?.period ?? '—'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-text-muted">{after.round_timestamp?.period ?? '—'}</span>
                          )}
                        </td>
                      </tr>

                      {/* Round Timestamp - Tags to apply */}
                      <tr className={roundTagsModified ? 'bg-bg-base/30' : ''}>
                        <td className="py-2.5 pr-4">
                          <span className="text-xs font-semibold text-text-primary">
                            Tags to apply
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="font-mono text-xs text-text-muted">—</span>
                        </td>
                        <td className="py-2.5 pr-4">
                          {roundTagsModified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-950 border border-red-900/40 text-red-300 font-mono text-xs line-through">
                              {before.round_timestamp?.tags_to_apply ?? '—'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-text-muted">{before.round_timestamp?.tags_to_apply ?? '—'}</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          {roundTagsModified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-950 border border-cyan-900/40 text-cyan-300 font-mono text-xs font-semibold">
                              {after.round_timestamp?.tags_to_apply ?? '—'}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-text-muted">{after.round_timestamp?.tags_to_apply ?? '—'}</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-end px-6 py-4 border-t border-border-panel">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded border border-border-panel text-text-muted hover:text-text-primary hover:border-accent-blue transition-colors"
            >
              Close
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
