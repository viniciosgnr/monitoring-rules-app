'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Info } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { updateProcessingSteps } from '@/app/actions/ruleInstances';
import { useUserRole } from '@/components/context/UserRoleContext';

interface Props {
  open: boolean;
  onClose: () => void;
  ruleId: number;
  ruleName: string;
  equipmentCode: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steps: any;
}

const inputCls =
  'w-full mt-1 bg-bg-input border border-border-panel rounded px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-blue transition-colors';


/* ─── Inline tooltip ───────────────────────────────────────────────── */
function ParamTooltip({
  text,
  direction = 'down',
  align = 'center',
}: {
  text: string;
  direction?: 'up' | 'down';
  align?: 'center' | 'left' | 'right';
}) {
  const lines = text.split('\n');
  const isUp = direction === 'up';
  
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let left = 0;
    if (align === 'left') {
      left = rect.left + window.scrollX;
    } else if (align === 'right') {
      left = rect.right + window.scrollX;
    } else {
      left = rect.left + rect.width / 2 + window.scrollX;
    }

    const top = isUp
      ? rect.top + window.scrollY
      : rect.bottom + window.scrollY;

    setCoords({ top, left });
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const alignClass = align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';
  const arrowClass = align === 'left' ? 'left-2.5' : align === 'right' ? 'right-2.5' : 'left-1/2 -translate-x-1/2';

  const tooltipContent = isOpen && (
    <div
      style={{
        position: 'absolute',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: 0,
        height: 0,
        zIndex: 9999,
      }}
    >
      <span className={`
        absolute ${alignClass}
        ${isUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'}
        w-80 bg-bg-panel border border-border-panel rounded-card
        shadow-xl px-3 py-2.5 text-xs text-text-muted leading-relaxed
        whitespace-normal text-left
      `}>
        <span className="space-y-1 block">
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith('•');
            const content = isBullet ? trimmed.substring(1).trim() : line;
            
            const parts = content.split('**');
            const parsed = parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="font-semibold text-text-primary">{part}</strong> : part
            );

            if (isBullet) {
              return (
                <span key={idx} className="flex items-start gap-1">
                  <span className="text-accent-blue select-none mt-0.5">•</span>
                  <span className="flex-1">{parsed}</span>
                </span>
              );
            }
            return <span key={idx} className="block">{parsed}</span>;
          })}
        </span>
        {isUp ? (
          <span className={`absolute ${arrowClass} top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-border-panel`} />
        ) : (
          <span className={`absolute ${arrowClass} bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-border-panel`} />
        )}
      </span>
    </div>
  );

  return (
    <span
      className="relative cursor-help inline-flex ml-1.5 align-middle"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Info size={12} className="text-text-muted hover:text-accent-blue transition-colors" />
      {isOpen && typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
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
      <label className="flex items-center text-xs text-text-muted min-h-[16px]">
        {label || '\u00A0'}
        {tooltip && <ParamTooltip text={tooltip} />}
      </label>
      {children}
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

/* ─── Section header ───────────────────────────────────────────────── */
function SectionTitle({
  label,
  tooltip,
  tooltipDirection = 'down',
  tooltipAlign = 'center',
}: {
  label: string;
  tooltip?: string;
  tooltipDirection?: 'up' | 'down';
  tooltipAlign?: 'center' | 'left' | 'right';
}) {
  return (
    <p className="text-sm font-medium text-text-primary mb-3 flex items-center">
      {label}
      {tooltip && <ParamTooltip text={tooltip} direction={tooltipDirection} align={tooltipAlign} />}
    </p>
  );
}

function getFriendlyRuleName(ruleName: string): string {
  const name = ruleName.toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'Spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR')) return 'Surge (Threshold)';
  if (name.includes('TRND') || name.includes('TREND') || name.includes('DEV') || name.includes('TEMP_DEV')) return 'Trend';
  if (name.includes('FOUL') || name.includes('DP') || name.includes('HTEX')) return 'Normalized dP ( step change, spike, trend)';
  if (name.includes('DRFT') || name.includes('DRIFT')) return 'Drift';
  if (name.includes('ML') || name.includes('AI')) return 'AI/ML';
  return ruleName;
}

function getRuleCategory(ruleName: string): 'surge' | 'spike' | 'generic' {
  const name = ruleName.toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('TME_NRS')) return 'surge';
  return 'generic';
}

export default function EditRuleModal({
  open, onClose, ruleId, ruleName, equipmentCode, steps,
}: Props) {
  const { role } = useUserRole();
  const isViewer = role === 'viewer';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [s, setS]           = useState<any>(steps || {});
  const [saving, setSaving] = useState(false);

  const category = getRuleCategory(ruleName);

  async function handleSave() {
    setSaving(true);
    const finalS = { ...s };
    if (category === 'spike' && finalS.rule_trigger_params?.[0]) {
      const { spike_detection } = finalS.rule_trigger_params[0];
      finalS.rule_trigger_params = [{ spike_detection }];
    } else if (category === 'surge') {
      delete finalS.event_trigger_params;
      if (finalS.rule_trigger_params?.[0]?.threshold_comparison) {
        const restThresholdComparison = { ...finalS.rule_trigger_params[0].threshold_comparison };
        delete restThresholdComparison.operator;
        finalS.rule_trigger_params = [{
          ...finalS.rule_trigger_params[0],
          threshold_comparison: restThresholdComparison
        }];
      }
    }
    await updateProcessingSteps(ruleId, finalS);
    setSaving(false);
    onClose();
  }

  // Surge values helper extraction
  const thresholdValue = s.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;

  // Spike values helper extraction
  const heightSpike = s.rule_trigger_params?.[0]?.spike_detection?.hasOwnProperty('height')
    ? s.rule_trigger_params[0].spike_detection.height
    : '';
  const thresholdSpike = s.rule_trigger_params?.[0]?.spike_detection?.hasOwnProperty('threshold')
    ? s.rule_trigger_params[0].spike_detection.threshold
    : '';
  const distanceSpike = s.rule_trigger_params?.[0]?.spike_detection?.distance ?? 60;
  const prominenceSpike = s.rule_trigger_params?.[0]?.spike_detection?.prominence ?? 1.0;

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[900px] max-h-[85vh] overflow-y-auto bg-bg-panel rounded-card border border-border-panel p-6 shadow-2xl">

          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="text-base font-semibold text-text-primary mb-1">
                {isViewer
                  ? category === 'surge'
                    ? 'View Surge Margin Parameters'
                    : category === 'spike'
                    ? 'View Spike Detection Parameters'
                    : 'Monitoring Rule — Details'
                  : category === 'surge'
                  ? 'Surge Margin Parameters'
                  : category === 'spike'
                  ? 'Spike Detection Parameters'
                  : 'Monitoring Rule — Details'}
              </Dialog.Title>
              {/* Selected rule identity */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="equipment-badge">{equipmentCode}</span>
                <span className="text-xs font-semibold text-text-primary">
                  {getFriendlyRuleName(ruleName)}
                </span>
                <span className="text-xs font-mono text-text-muted">({ruleName})</span>
                <span className="text-xs text-text-muted">· {category === 'generic' ? 'Data Processing Steps' : 'Rule Config'}</span>
              </div>
            </div>
            <Dialog.Close className="text-text-muted hover:text-text-primary transition-colors mt-0.5">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="border-t border-border-panel mb-6" />

          {/* ── Descriptions & Forms depending on category ── */}
          {category === 'surge' && (
            <div className="space-y-6">
              <div className="bg-bg-panel/40 border border-border-panel rounded p-3 text-xs text-text-muted leading-relaxed">
                <strong>Description:</strong> This rule monitors the surge margin by checking if the equipment operates in a condition lower than the minimum threshold limit. An alert is raised if the equipment operates for more than 50% of the last day in such a condition.
              </div>

              {/* Rule Trigger Parameters */}
              <div>
                <SectionTitle
                  label="Rule Trigger Parameters"
                  tooltip={"• **Threshold Value**: Minimum required surge margin limit (default: 10)."}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FieldBlock label="Threshold Value">
                    <input
                      type="number"
                      value={thresholdValue}
                      disabled={isViewer}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const arr = [...(s.rule_trigger_params || [{ threshold_comparison: {}, status_check: { value: 1 } }])];
                        arr[0] = {
                          ...arr[0],
                          threshold_comparison: {
                            ...arr[0]?.threshold_comparison,
                            value: isNaN(val) ? 0 : val,
                            operator: 'gt',
                            tags_to_apply: arr[0]?.threshold_comparison?.tags_to_apply ?? ["Surge Margin Actual"]
                          }
                        };
                        setS({ ...s, rule_trigger_params: arr });
                      }}
                      className={inputCls}
                    />
                  </FieldBlock>
                </div>
              </div>
            </div>
          )}

          {category === 'spike' && (
            <div className="space-y-6">
              <div className="bg-bg-panel/40 border border-border-panel rounded p-3 text-xs text-text-muted leading-relaxed">
                <strong>Description:</strong> This rule monitors equipment for spikes in timeseries data and filters detected spikes based on operational status.
              </div>

              {/* Rule Trigger Params */}
              <div>
                <SectionTitle
                  label="Rule Trigger Parameters"
                  tooltip={"• **Height**: Absolute minimum signal value to accept a peak (keep empty if unknown).\n• **Threshold**: Required vertical jump versus nearby points.\n• **Distance**: Minimum spacing between spikes (in samples) (default: 60).\n• **Prominence**: Minimum height peak stands out from baseline (default: 1.0)."}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FieldBlock label="Height">
                    <input
                      type="number"
                      value={heightSpike ?? ''}
                      disabled={isViewer}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseFloat(e.target.value);
                        const arr = [...(s.rule_trigger_params || [{ spike_detection: {}, filter_spikes_near_filter_false: {}, status_check: {} }])];
                        arr[0] = {
                          ...arr[0],
                          spike_detection: {
                            ...arr[0]?.spike_detection,
                            height: val,
                            distance: arr[0]?.spike_detection?.distance ?? 60,
                            prominence: arr[0]?.spike_detection?.prominence ?? 1.0,
                            tags_to_apply: arr[0]?.spike_detection?.tags_to_apply ?? ["all"],
                            exclude_tags: arr[0]?.spike_detection?.exclude_tags ?? ["RUN"]
                          }
                        };
                        setS({ ...s, rule_trigger_params: arr });
                      }}
                      placeholder="null"
                      className={inputCls}
                    />
                  </FieldBlock>

                  <FieldBlock label="Threshold">
                    <input
                      type="number"
                      value={thresholdSpike ?? ''}
                      disabled={isViewer}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseFloat(e.target.value);
                        const arr = [...(s.rule_trigger_params || [{ spike_detection: {}, filter_spikes_near_filter_false: {}, status_check: {} }])];
                        arr[0] = {
                          ...arr[0],
                          spike_detection: {
                            ...arr[0]?.spike_detection,
                            threshold: val,
                            distance: arr[0]?.spike_detection?.distance ?? 60,
                            prominence: arr[0]?.spike_detection?.prominence ?? 1.0,
                            tags_to_apply: arr[0]?.spike_detection?.tags_to_apply ?? ["all"],
                            exclude_tags: arr[0]?.spike_detection?.exclude_tags ?? ["RUN"]
                          }
                        };
                        setS({ ...s, rule_trigger_params: arr });
                      }}
                      placeholder="null"
                      className={inputCls}
                    />
                  </FieldBlock>

                  <FieldBlock label="Distance">
                    <input
                      type="number"
                      value={distanceSpike}
                      disabled={isViewer}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const arr = [...(s.rule_trigger_params || [{ spike_detection: {}, filter_spikes_near_filter_false: {}, status_check: {} }])];
                        arr[0] = {
                          ...arr[0],
                          spike_detection: {
                            ...arr[0]?.spike_detection,
                            distance: isNaN(val) ? 0 : val,
                            height: arr[0]?.spike_detection?.height,
                            threshold: arr[0]?.spike_detection?.threshold,
                            prominence: arr[0]?.spike_detection?.prominence ?? 1.0,
                            tags_to_apply: arr[0]?.spike_detection?.tags_to_apply ?? ["all"],
                            exclude_tags: arr[0]?.spike_detection?.exclude_tags ?? ["RUN"]
                          }
                        };
                        setS({ ...s, rule_trigger_params: arr });
                      }}
                      className={inputCls}
                    />
                  </FieldBlock>

                  <FieldBlock label="Prominence">
                    <input
                      type="number"
                      step="0.1"
                      value={prominenceSpike}
                      disabled={isViewer}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        const arr = [...(s.rule_trigger_params || [{ spike_detection: {}, filter_spikes_near_filter_false: {}, status_check: {} }])];
                        arr[0] = {
                          ...arr[0],
                          spike_detection: {
                            ...arr[0]?.spike_detection,
                            prominence: isNaN(val) ? 0 : val,
                            height: arr[0]?.spike_detection?.height,
                            threshold: arr[0]?.spike_detection?.threshold,
                            distance: arr[0]?.spike_detection?.distance ?? 60,
                            tags_to_apply: arr[0]?.spike_detection?.tags_to_apply ?? ["all"],
                            exclude_tags: arr[0]?.spike_detection?.exclude_tags ?? ["RUN"]
                          }
                        };
                        setS({ ...s, rule_trigger_params: arr });
                      }}
                      className={inputCls}
                    />
                  </FieldBlock>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <SectionTitle
                  label="Recommendations"
                  tooltip={"Use these as a first iteration, then tune with real data.\n\n• **Sensitive** (find more spikes; more false positives risk)\n  - height: null\n  - threshold: 0.2\n  - distance: 20\n  - prominence: 0.1\n\n• **Balanced** (recommended starting point)\n  - height: null\n  - threshold: 0.5\n  - distance: 60\n  - prominence: 0.3\n\n• **Conservative** (alerts only for strong events)\n  - height: 0.6\n  - threshold: 0.9\n  - distance: 120\n  - prominence: 0.8"}
                  tooltipDirection="up"
                  tooltipAlign="left"
                />
                <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                  Hover over the tooltip icon above to view suggested preset values for Sensitive, Balanced, and Conservative configurations.
                </p>
              </div>
            </div>
          )}

          {category === 'generic' && (
            <div className="space-y-6">
              {/* ── Abs Value ── */}
              <div>
                <SectionTitle
                  label="Abs Value"
                  tooltip="Converts all selected tag values to their absolute (non-negative) form before the rule logic runs. Useful when sensor readings can be negative but only the magnitude matters for threshold comparison."
                />
                <FieldBlock
                  label=""
                  hint="Comma-separated list · e.g. RUN, Surge Margin Actual"
                >
                  <div className="w-full mt-1 bg-bg-highlight border border-border-panel/50 rounded px-3 py-2 text-xs font-mono text-text-muted select-none">
                    {s.abs_value?.tags_to_apply || '—'}
                  </div>
                </FieldBlock>
              </div>

              {/* ── Drop Missing ── */}
              <div>
                <SectionTitle
                  label="Drop Missing"
                  tooltip="Removes data points where the selected tags have null, NaN or missing values before the rule evaluates. Prevents false alerts caused by sensor outages, communication gaps or bad-quality data frames."
                />
                <FieldBlock
                  label=""
                  hint="Comma-separated list · e.g. RUN, all"
                >
                  <div className="w-full mt-1 bg-bg-highlight border border-border-panel/50 rounded px-3 py-2 text-xs font-mono text-text-muted select-none">
                    {s.drop_missing?.tags_to_apply || '—'}
                  </div>
                </FieldBlock>
              </div>

              {/* ── Join Timeseries ── */}
              <div>
                <SectionTitle
                  label="Join Timeseries"
                  tooltip="Merges multiple timeseries into a single time-aligned dataset using an inner join on timestamps. Required when the rule compares values from different sensors that may have different sampling intervals."
                />
                <FieldBlock
                  label=""
                  hint="Comma-separated list · e.g. all"
                >
                  <div className="w-full mt-1 bg-bg-highlight border border-border-panel/50 rounded px-3 py-2 text-xs font-mono text-text-muted select-none">
                    {s.join_timeseries?.tags_to_apply || '—'}
                  </div>
                </FieldBlock>
              </div>

              {/* ── Round Timestamp ── */}
              <div>
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
                      disabled={isViewer}
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
                    label=""
                    hint="Comma-separated list · e.g. all"
                  >
                    <div className="w-full mt-1 bg-bg-highlight border border-border-panel/50 rounded px-3 py-2 text-xs font-mono text-text-muted select-none">
                      {s.round_timestamp?.tags_to_apply || '—'}
                    </div>
                  </FieldBlock>
                </div>
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 border-t border-border-panel pt-4 mt-6">
            {isViewer ? (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded bg-accent-blue text-white font-medium hover:bg-accent-blue-dark transition-colors cursor-pointer"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="Marcos px-4 py-2 text-sm rounded border border-border-panel text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
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
              </>
            )}
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
