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
  const lines = text.split('\n');
  return (
    <span className="relative group cursor-help inline-flex ml-1.5 align-middle">
      <Info size={12} className="text-text-muted group-hover:text-accent-blue transition-colors" />
      <span className="
        absolute left-1/2 -translate-x-1/2 bottom-full mb-2
        w-80 bg-bg-panel border border-border-panel rounded-card
        shadow-xl px-3 py-2.5 text-xs text-text-muted leading-relaxed
        opacity-0 pointer-events-none
        group-hover:opacity-100 group-hover:pointer-events-auto
        transition-opacity duration-150 z-[60]
        whitespace-normal text-left
      ">
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
        <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-border-panel" />
      </span>
    </span>
  );
}

function getRuleCategory(ruleName: string): 'surge' | 'spike' | 'generic' {
  const name = ruleName.toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'spike';
  if (name.includes('SURG') || name.includes('THR') || name.includes('TME_NRS')) return 'surge';
  return 'generic';
}

const renderPrevVal = (isMod: boolean, v: unknown) => {
  const display = v === null || v === undefined ? 'null' : String(v);
  return isMod ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-950 border border-red-900/40 text-red-300 font-mono text-xs line-through">
      {display}
    </span>
  ) : (
    <span className="font-mono text-xs text-text-muted">{display}</span>
  );
};

const renderNewVal = (isMod: boolean, v: unknown) => {
  const display = v === null || v === undefined ? 'null' : String(v);
  return isMod ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-950 border border-cyan-900/40 text-cyan-300 font-mono text-xs font-semibold">
      {display}
    </span>
  ) : (
    <span className="font-mono text-xs text-text-muted">{display}</span>
  );
};

export default function ParamDiffModal({ open, onClose, entry }: Props) {
  if (!entry) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const before = (entry.beforeState as any) ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const after  = (entry.afterState as any) ?? {};

  const category = getRuleCategory(entry.ruleName);

  // Check if it is an enable/disable status change
  const isStatusChange =
    entry.description.toLowerCase().includes('enable') ||
    entry.description.toLowerCase().includes('disable') ||
    'enabled' in after;

  // Generic Parameters
  const absValueModified = before.abs_value?.tags_to_apply !== after.abs_value?.tags_to_apply;
  const dropMissingModified = before.drop_missing?.tags_to_apply !== after.drop_missing?.tags_to_apply;
  const joinTimeseriesModified = before.join_timeseries?.tags_to_apply !== after.join_timeseries?.tags_to_apply;
  const roundPeriodModified = before.round_timestamp?.period !== after.round_timestamp?.period;
  const roundTagsModified = before.round_timestamp?.tags_to_apply !== after.round_timestamp?.tags_to_apply;
  const roundTimestampModified = roundPeriodModified || roundTagsModified;

  // Surge Parameters
  const prevThresholdSurge = before.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;
  const newThresholdSurge  = after.rule_trigger_params?.[0]?.threshold_comparison?.value ?? 10;
  const thresholdSurgeModified = prevThresholdSurge !== newThresholdSurge;

  const prevOperatorSurge = before.rule_trigger_params?.[0]?.threshold_comparison?.operator ?? 'gt';
  const newOperatorSurge  = after.rule_trigger_params?.[0]?.threshold_comparison?.operator ?? 'gt';
  const operatorSurgeModified = prevOperatorSurge !== newOperatorSurge;

  const prevRuleLogicSurge = before.event_trigger_params?.[0]?.time_totalization?.rule ?? '0&1';
  const newRuleLogicSurge  = after.event_trigger_params?.[0]?.time_totalization?.rule ?? '0&1';
  const ruleLogicSurgeModified = prevRuleLogicSurge !== newRuleLogicSurge;

  const prevEventValueSurge = before.event_trigger_params?.[0]?.time_totalization?.value ?? 50;
  const newEventValueSurge  = after.event_trigger_params?.[0]?.time_totalization?.value ?? 50;
  const eventValueSurgeModified = prevEventValueSurge !== newEventValueSurge;

  const prevEventOperatorSurge = before.event_trigger_params?.[0]?.time_totalization?.operator ?? 'gt';
  const newEventOperatorSurge  = after.event_trigger_params?.[0]?.time_totalization?.operator ?? 'gt';
  const eventOperatorSurgeModified = prevEventOperatorSurge !== newEventOperatorSurge;

  const prevTimePeriodSurge = before.event_trigger_params?.[0]?.time_totalization?.time_period ?? 24;
  const newTimePeriodSurge  = after.event_trigger_params?.[0]?.time_totalization?.time_period ?? 24;
  const timePeriodSurgeModified = prevTimePeriodSurge !== newTimePeriodSurge;

  const prevTimePeriodUnitSurge = before.event_trigger_params?.[0]?.time_totalization?.time_period_unit ?? 'h';
  const newTimePeriodUnitSurge  = after.event_trigger_params?.[0]?.time_totalization?.time_period_unit ?? 'h';
  const timePeriodUnitSurgeModified = prevTimePeriodUnitSurge !== newTimePeriodUnitSurge;

  const surgeRuleTriggerModified = thresholdSurgeModified || operatorSurgeModified;
  const surgeEventTriggerModified = ruleLogicSurgeModified || eventValueSurgeModified || eventOperatorSurgeModified || timePeriodSurgeModified || timePeriodUnitSurgeModified;

  // Spike Parameters
  const prevHeightSpike = before.rule_trigger_params?.[0]?.spike_detection?.hasOwnProperty('height') ? before.rule_trigger_params[0].spike_detection.height : null;
  const newHeightSpike  = after.rule_trigger_params?.[0]?.spike_detection?.hasOwnProperty('height') ? after.rule_trigger_params[0].spike_detection.height : null;
  const heightSpikeModified = prevHeightSpike !== newHeightSpike;

  const prevThresholdSpike = before.rule_trigger_params?.[0]?.spike_detection?.hasOwnProperty('threshold') ? before.rule_trigger_params[0].spike_detection.threshold : null;
  const newThresholdSpike  = after.rule_trigger_params?.[0]?.spike_detection?.hasOwnProperty('threshold') ? after.rule_trigger_params[0].spike_detection.threshold : null;
  const thresholdSpikeModified = prevThresholdSpike !== newThresholdSpike;

  const prevDistanceSpike = before.rule_trigger_params?.[0]?.spike_detection?.distance ?? 60;
  const newDistanceSpike  = after.rule_trigger_params?.[0]?.spike_detection?.distance ?? 60;
  const distanceSpikeModified = prevDistanceSpike !== newDistanceSpike;

  const prevProminenceSpike = before.rule_trigger_params?.[0]?.spike_detection?.prominence ?? 1.0;
  const newProminenceSpike  = after.rule_trigger_params?.[0]?.spike_detection?.prominence ?? 1.0;
  const prominenceSpikeModified = prevProminenceSpike !== newProminenceSpike;

  const prevTimedeltaSpike = before.rule_trigger_params?.[0]?.filter_spikes_near_filter_false?.timedelta_minutes ?? 480;
  const newTimedeltaSpike  = after.rule_trigger_params?.[0]?.filter_spikes_near_filter_false?.timedelta_minutes ?? 480;
  const timedeltaSpikeModified = prevTimedeltaSpike !== newTimedeltaSpike;

  const prevStatusCheckSpike = before.rule_trigger_params?.[0]?.status_check?.value ?? 1;
  const newStatusCheckSpike  = after.rule_trigger_params?.[0]?.status_check?.value ?? 1;
  const statusCheckSpikeModified = prevStatusCheckSpike !== newStatusCheckSpike;

  const spikeRuleTriggerModified = heightSpikeModified || thresholdSpikeModified || distanceSpikeModified || prominenceSpikeModified || timedeltaSpikeModified || statusCheckSpikeModified;

  let totalChanged = 0;
  if (isStatusChange) {
    totalChanged = 0;
  } else if (category === 'surge') {
    totalChanged = (surgeRuleTriggerModified ? 1 : 0) + (surgeEventTriggerModified ? 1 : 0);
  } else if (category === 'spike') {
    totalChanged = (spikeRuleTriggerModified ? 1 : 0);
  } else {
    totalChanged = (absValueModified ? 1 : 0) + (dropMissingModified ? 1 : 0) + (joinTimeseriesModified ? 1 : 0) + (roundTimestampModified ? 1 : 0);
  }

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
          <div className="px-6 py-5 space-y-5">
            {/* Status change banner */}
            {entry.description.toLowerCase().includes('disable') && (
              <div className="p-4 rounded-card bg-amber-500/10 border-l-4 border-amber-500 text-sm text-text-primary flex gap-3">
                <div className="flex-shrink-0 text-amber-500 mt-0.5">
                  <Info size={18} />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-text-primary">Rule Deactivation Info</p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    <span className="font-semibold text-text-primary">Disable Reason:</span>{' '}
                    <span className="text-amber-500 font-semibold">{after.reason || 'No reason provided'}</span>
                  </p>
                </div>
              </div>
            )}

            {entry.description.toLowerCase().includes('enable') && (
              <div className="p-4 rounded-card bg-green-500/10 border-l-4 border-green-500 text-sm text-text-primary flex gap-3">
                <div className="flex-shrink-0 text-green-500 mt-0.5">
                  <Info size={18} />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-text-primary">Rule Activation Info</p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    The rule instance was successfully enabled.
                  </p>
                </div>
              </div>
            )}

            {/* Parameter comparison cards */}
            <div className="space-y-5">
              {category === 'surge' && (
                <>
                  {/* ── Surge Rule Trigger Parameters ── */}
                  <div className="bg-bg-highlight border border-border-panel rounded-card p-4">
                    <div className="border-b border-border-panel pb-2 mb-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-text-primary">Rule Trigger Parameters</span>
                        <ParamTooltip text={"• **Threshold Value**: Minimum required surge margin limit (default: 10).\n• **Operator**: Comparison logic (fixed to 'gt')."} />
                        {surgeRuleTriggerModified && (
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
                      <tbody className="divide-y divide-border-panel">
                        <tr className={thresholdSurgeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Threshold Value</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">10</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(thresholdSurgeModified, prevThresholdSurge)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(thresholdSurgeModified, newThresholdSurge)}
                          </td>
                        </tr>
                        <tr className={operatorSurgeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Operator</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">gt</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(operatorSurgeModified, prevOperatorSurge)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(operatorSurgeModified, newOperatorSurge)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* ── Surge Event Trigger Parameters ── */}
                  <div className="bg-bg-highlight border border-border-panel rounded-card p-4">
                    <div className="border-b border-border-panel pb-2 mb-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-text-primary">Event Trigger Parameters</span>
                        <ParamTooltip text={"• **Rule Logic**: Combination logic rule (fixed to '0&1').\n• **Alert Value Threshold (%)**: Percentage of the window violating threshold (default: 50).\n• **Operator**: Comparison logic (fixed to 'gt').\n• **Time Period**: Duration of evaluation window (default: 24).\n• **Unit**: Unit of the time period (default: 'h')."} />
                        {surgeEventTriggerModified && (
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
                      <tbody className="divide-y divide-border-panel">
                        <tr className={ruleLogicSurgeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Rule Logic</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">0&1</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(ruleLogicSurgeModified, prevRuleLogicSurge)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(ruleLogicSurgeModified, newRuleLogicSurge)}
                          </td>
                        </tr>
                        <tr className={eventValueSurgeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Alert Value Threshold (%)</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">50</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(eventValueSurgeModified, prevEventValueSurge)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(eventValueSurgeModified, newEventValueSurge)}
                          </td>
                        </tr>
                        <tr className={eventOperatorSurgeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Operator</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">gt</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(eventOperatorSurgeModified, prevEventOperatorSurge)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(eventOperatorSurgeModified, newEventOperatorSurge)}
                          </td>
                        </tr>
                        <tr className={timePeriodSurgeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Time Period</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">24</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(timePeriodSurgeModified, prevTimePeriodSurge)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(timePeriodSurgeModified, newTimePeriodSurge)}
                          </td>
                        </tr>
                        <tr className={timePeriodUnitSurgeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Unit</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">h</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(timePeriodUnitSurgeModified, prevTimePeriodUnitSurge)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(timePeriodUnitSurgeModified, newTimePeriodUnitSurge)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {category === 'spike' && (
                <>
                  {/* ── Spike Rule Trigger Parameters ── */}
                  <div className="bg-bg-highlight border border-border-panel rounded-card p-4">
                    <div className="border-b border-border-panel pb-2 mb-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm font-bold text-text-primary">Rule Trigger Parameters</span>
                        <ParamTooltip text={"• **Height**: Absolute minimum signal value to accept a peak (keep empty if unknown).\n• **Threshold**: Required vertical jump versus nearby points.\n• **Distance**: Minimum spacing between spikes (in samples) (default: 60).\n• **Prominence**: Minimum height peak stands out from baseline (default: 1.0).\n• **Timedelta**: Time in minutes to ignore startup/shutdown noise (default: 480).\n• **Status Check Value**: Minimal running state threshold value (default: 1)."} />
                        {spikeRuleTriggerModified && (
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
                      <tbody className="divide-y divide-border-panel">
                        <tr className={heightSpikeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Height</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">null</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(heightSpikeModified, prevHeightSpike)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(heightSpikeModified, newHeightSpike)}
                          </td>
                        </tr>
                        <tr className={thresholdSpikeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Threshold</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">null</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(thresholdSpikeModified, prevThresholdSpike)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(thresholdSpikeModified, newThresholdSpike)}
                          </td>
                        </tr>
                        <tr className={distanceSpikeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Distance</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">60</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(distanceSpikeModified, prevDistanceSpike)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(distanceSpikeModified, newDistanceSpike)}
                          </td>
                        </tr>
                        <tr className={prominenceSpikeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Prominence</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">1.0</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(prominenceSpikeModified, prevProminenceSpike)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(prominenceSpikeModified, newProminenceSpike)}
                          </td>
                        </tr>
                        <tr className={timedeltaSpikeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Timedelta (minutes)</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">480</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(timedeltaSpikeModified, prevTimedeltaSpike)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(timedeltaSpikeModified, newTimedeltaSpike)}
                          </td>
                        </tr>
                        <tr className={statusCheckSpikeModified ? 'bg-bg-base/30' : ''}>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-semibold text-text-primary">Status Check Value</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="font-mono text-xs text-text-muted">1</span>
                          </td>
                          <td className="py-2.5 pr-4">
                            {renderPrevVal(statusCheckSpikeModified, prevStatusCheckSpike)}
                          </td>
                          <td className="py-2.5">
                            {renderNewVal(statusCheckSpikeModified, newStatusCheckSpike)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>


                </>
              )}

              {category === 'generic' && (
                <>
                  {/* ── Abs Value ── */}
                  <div className="bg-bg-highlight border border-border-panel rounded-card p-4">
                    <div className="border-b border-border-panel pb-2 mb-3 flex items-center justify-between">
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
                      <tbody className="divide-y divide-border-panel">
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
                  <div className="bg-bg-highlight border border-border-panel rounded-card p-4">
                    <div className="border-b border-border-panel pb-2 mb-3 flex items-center justify-between">
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
                      <tbody className="divide-y divide-border-panel">
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
                  <div className="bg-bg-highlight border border-border-panel rounded-card p-4">
                    <div className="border-b border-border-panel pb-2 mb-3 flex items-center justify-between">
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
                      <tbody className="divide-y divide-border-panel">
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
                  <div className="bg-bg-highlight border border-border-panel rounded-card p-4">
                    <div className="border-b border-border-panel pb-2 mb-3 flex items-center justify-between">
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
                      <tbody className="divide-y divide-border-panel">
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
                </>
              )}
            </div>
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
