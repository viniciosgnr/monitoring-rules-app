'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
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
  instanceId?: number;
  enabled?: boolean;
}

const inputCls =
  'w-full mt-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#64748B] outline-none focus:border-[#3B82F6] transition-colors';

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
        w-80 bg-[#131927] border border-[#1E2E48] rounded-xl
        shadow-2xl px-3.5 py-2.5 text-xs text-[#94A3B8] leading-relaxed
        whitespace-normal text-left
      `}>
        <span className="space-y-1 block">
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith('•');
            const content = isBullet ? trimmed.substring(1).trim() : line;
            
            const parts = content.split('**');
            const parsed = parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="font-semibold text-white">{part}</strong> : part
            );

            if (isBullet) {
              return (
                <span key={idx} className="flex items-start gap-1">
                  <span className="text-[#3B82F6] select-none mt-0.5">•</span>
                  <span className="flex-1">{parsed}</span>
                </span>
              );
            }
            return <span key={idx} className="block">{parsed}</span>;
          })}
        </span>
        {isUp ? (
          <span className={`absolute ${arrowClass} top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#1E2E48]`} />
        ) : (
          <span className={`absolute ${arrowClass} bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-[#1E2E48]`} />
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
      <Info size={13} className="text-[#64748B] hover:text-[#3B82F6] transition-colors" />
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
      <label className="flex items-center text-xs text-[#94A3B8] font-normal min-h-[16px]">
        {label || '\u00A0'}
        {tooltip && <ParamTooltip text={tooltip} />}
      </label>
      {children}
      {hint && <p className="text-xs text-[#64748B] mt-1">{hint}</p>}
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
    <p className="text-sm font-medium text-white mb-3 flex items-center">
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

interface ProcessingStepsConfig {
  rule_trigger_params?: {
    threshold_comparison?: {
      value?: number;
      operator?: string;
      tags_to_apply?: string[];
    };
    spike_detection?: {
      height?: number | null;
      threshold?: number | null;
      distance?: number;
      prominence?: number;
      tags_to_apply?: string[];
      exclude_tags?: string[];
    };
  }[];
  event_trigger_params?: unknown;
  round_timestamp?: {
    period?: string;
    tags_to_apply?: string;
  };
}

interface AuditLogEntry {
  id: number;
  userEmail: string;
  description: string;
  beforeState: unknown;
  afterState: unknown;
  createdAt: Date;
}

export default function EditRuleModal({
  open,
  onClose,
  ruleId,
  ruleName,
  equipmentCode,
  steps,
  instanceId,
  enabled,
}: Props) {
  const { role } = useUserRole();
  const isViewer = role === 'viewer';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [s, setS]           = useState<any>(steps || {});
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [initialSteps]      = useState<ProcessingStepsConfig>(steps || {});

  useEffect(() => {
    if (open && instanceId) {
      import('@/app/actions/ruleInstances').then(({ getAuditLogsForInstance }) => {
        getAuditLogsForInstance(instanceId).then(logs => {
          setHistory((logs as unknown as AuditLogEntry[]).filter(l => 
            l.description === 'Update rule parameters' || 
            l.description === 'Updated rule parameters'
          ));
        });
      });
    }
  }, [open, instanceId]);

  function getDiffElements(beforeState: unknown, afterState: unknown, ruleCategory: string) {
    const diffs: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const before = (beforeState as { processingSteps?: any }) || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const after = (afterState as { processingSteps?: any }) || {};
    if (ruleCategory === 'surge') {
      const vBefore = before.processingSteps?.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;
      const vAfter = after.processingSteps?.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;
      if (vBefore !== vAfter) {
        diffs.push(`Threshold Value: ${vBefore} → ${vAfter}`);
      }
    } else if (ruleCategory === 'spike') {
      const sdBefore = before.processingSteps?.rule_trigger_params?.[0]?.spike_detection || {};
      const sdAfter = after.processingSteps?.rule_trigger_params?.[0]?.spike_detection || {};
      if (sdBefore.height !== sdAfter.height) {
        diffs.push(`Height: ${sdBefore.height ?? 'null'} → ${sdAfter.height ?? 'null'}`);
      }
      if (sdBefore.threshold !== sdAfter.threshold) {
        diffs.push(`Threshold: ${sdBefore.threshold ?? 'null'} → ${sdAfter.threshold ?? 'null'}`);
      }
      if (sdBefore.distance !== sdAfter.distance) {
        diffs.push(`Distance: ${sdBefore.distance ?? '—'} → ${sdAfter.distance ?? '—'}`);
      }
      if (sdBefore.prominence !== sdAfter.prominence) {
        diffs.push(`Prominence: ${sdBefore.prominence ?? '—'} → ${sdAfter.prominence ?? '—'}`);
      }
    } else {
      const absBefore = before.processingSteps?.abs_value?.tags_to_apply;
      const absAfter = after.processingSteps?.abs_value?.tags_to_apply;
      if (absBefore !== absAfter && absBefore !== undefined && absAfter !== undefined) {
        diffs.push(`Abs Value Tags: ${absBefore} → ${absAfter}`);
      }
      const rtBefore = before.processingSteps?.round_timestamp?.period;
      const rtAfter = after.processingSteps?.round_timestamp?.period;
      if (rtBefore !== rtAfter && rtBefore !== undefined && rtAfter !== undefined) {
        diffs.push(`Round period: ${rtBefore} → ${rtAfter}`);
      }
      const dmBefore = before.processingSteps?.drop_missing?.tags_to_apply;
      const dmAfter = after.processingSteps?.drop_missing?.tags_to_apply;
      if (dmBefore !== dmAfter && dmBefore !== undefined && dmAfter !== undefined) {
        diffs.push(`Drop Missing Tags: ${dmBefore} → ${dmAfter}`);
      }
      const jtBefore = before.processingSteps?.join_timeseries?.tags_to_apply;
      const jtAfter = after.processingSteps?.join_timeseries?.tags_to_apply;
      if (jtBefore !== jtAfter && jtBefore !== undefined && jtAfter !== undefined) {
        diffs.push(`Join Tags: ${jtBefore} → ${jtAfter}`);
      }
    }
    return diffs;
  }

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
    await updateProcessingSteps(ruleId, finalS, instanceId);
    setSaving(false);
    onClose();
  }

  // Surge initial
  const initialThresholdValue = initialSteps.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;

  // Surge values helper extraction
  const thresholdValue = s.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;

  // Spike initial
  const initialHeightSpike = initialSteps.rule_trigger_params?.[0]?.spike_detection?.hasOwnProperty('height')
    ? initialSteps.rule_trigger_params[0].spike_detection.height
    : '';
  const initialThresholdSpike = initialSteps.rule_trigger_params?.[0]?.spike_detection?.hasOwnProperty('threshold')
    ? initialSteps.rule_trigger_params[0].spike_detection.threshold
    : '';
  const initialDistanceSpike = initialSteps.rule_trigger_params?.[0]?.spike_detection?.distance ?? 60;
  const initialProminenceSpike = initialSteps.rule_trigger_params?.[0]?.spike_detection?.prominence ?? 1.0;

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
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[820px] max-h-[88vh] overflow-y-auto bg-[#111827] rounded-2xl border border-[#1E293B] p-6 shadow-2xl select-none">

          {/* ── Header matching Figma Specs ── */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <Dialog.Title className="text-base font-semibold text-white">
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
                <span className="px-2.5 py-0.5 rounded-md bg-[#1E293B] border border-[#334155]/40 text-[#94A3B8] font-mono text-xs font-medium">
                  {equipmentCode}
                </span>
              </div>
              <p className="text-xs font-normal text-[#94A3B8] mt-1">
                {getFriendlyRuleName(ruleName)} ({ruleName}) · {category === 'generic' ? 'Data Processing Steps' : 'Rule Config'}
              </p>
            </div>
            <Dialog.Close className="text-[#64748B] hover:text-white transition-colors cursor-pointer mt-0.5">
              <X size={18} />
            </Dialog.Close>
          </div>

          <div className="border-t border-[#1E293B] mb-5" />

          {enabled === false && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
              <Info size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold block mb-0.5 text-amber-300">Monitoring Rule Instance is Disabled</span>
                This instance is currently disabled. Modifications to these parameters will be saved, but the rule execution scheduler is paused for this asset.
              </div>
            </div>
          )}

          {/* ── Descriptions & Forms depending on category ── */}
          {category === 'surge' && (
            <div className="space-y-6">
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 text-xs text-[#94A3B8] leading-relaxed">
                <strong className="text-white">Description:</strong> This rule monitors the surge margin by checking if the equipment operates in a condition lower than the minimum threshold limit. An alert is raised if the equipment operates for more than 50% of the last day in such a condition.
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
                    <span className="text-xs text-[#64748B] mt-1.5 block">
                      Previous value: <span className="text-[#94A3B8]">{initialThresholdValue}</span>
                    </span>
                  </FieldBlock>
                </div>
              </div>
            </div>
          )}

          {category === 'spike' && (
            <div className="space-y-6">
              <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-3.5 text-xs text-[#94A3B8] leading-relaxed">
                <strong className="text-white">Description:</strong> This rule monitors equipment for spikes in timeseries data and filters detected spikes based on operational status.
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
                    <span className="text-xs text-[#64748B] mt-1.5 block">
                      Previous value: <span className="text-[#94A3B8]">{initialHeightSpike === '' ? 'null' : initialHeightSpike}</span>
                    </span>
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
                    <span className="text-xs text-[#64748B] mt-1.5 block">
                      Previous value: <span className="text-[#94A3B8]">{initialThresholdSpike === '' ? 'null' : initialThresholdSpike}</span>
                    </span>
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
                    <span className="text-xs text-[#64748B] mt-1.5 block">
                      Previous value: <span className="text-[#94A3B8]">{initialDistanceSpike}</span>
                    </span>
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
                    <span className="text-xs text-[#64748B] mt-1.5 block">
                      Previous value: <span className="text-[#94A3B8]">{initialProminenceSpike}</span>
                    </span>
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
                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
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
                  <div className="w-full mt-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs font-mono text-[#94A3B8] select-none">
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
                  <div className="w-full mt-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs font-mono text-[#94A3B8] select-none">
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
                  <div className="w-full mt-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs font-mono text-[#94A3B8] select-none">
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
                    <div className="w-full mt-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs font-mono text-[#94A3B8] select-none">
                      {s.round_timestamp?.tags_to_apply || '—'}
                    </div>
                  </FieldBlock>
                </div>
              </div>
            </div>
          )}

          {/* Parameter Change History */}
          <div className="border-t border-[#1E293B] mt-6 pt-5">
            <h3 className="text-xs font-semibold text-white mb-3">Parameter Change History</h3>
            {history.length === 0 ? (
              <div className="text-xs text-[#64748B] italic">No past parameter updates recorded for this instance.</div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {history.map(log => {
                  const diffs = getDiffElements(log.beforeState, log.afterState, category);
                  if (diffs.length === 0) return null;
                  return (
                    <div key={log.id} className="text-xs text-[#94A3B8] leading-relaxed">
                      <span className="text-[#E2E8F0]">
                        {new Date(log.createdAt).toLocaleDateString('pt-BR')}{' '}
                        {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>{' '}
                      by <span className="text-[#E2E8F0] font-normal">{log.userEmail}</span> ·{' '}
                      <span className="text-white font-medium">{diffs.join(', ')}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 border-t border-[#1E293B] pt-4 mt-6">
            {isViewer ? (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors cursor-pointer"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs rounded-full border border-[#1E293B] text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-xs rounded-full bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] disabled:opacity-50 transition-colors cursor-pointer"
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
