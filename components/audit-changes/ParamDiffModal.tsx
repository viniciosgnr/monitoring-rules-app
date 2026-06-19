'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronRight } from 'lucide-react';

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

/** snake_case / camelCase → Title Case readable label */
function humanize(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function isPrimitive(v: unknown): v is string | number | boolean | null | undefined {
  return v === null || v === undefined || typeof v !== 'object';
}

/** Count how many leaf-level fields differ between two subtrees */
function countChanges(before: unknown, after: unknown): number {
  if (isPrimitive(before) && isPrimitive(after)) {
    return String(before ?? '') !== String(after ?? '') ? 1 : 0;
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const len = Math.max(before.length, after.length);
    let n = 0;
    for (let i = 0; i < len; i++) n += countChanges(before[i], after[i]);
    return n;
  }
  if (before && after && typeof before === 'object' && typeof after === 'object') {
    const keys = new Set([...Object.keys(before as object), ...Object.keys(after as object)]);
    let n = 0;
    keys.forEach(k => {
      n += countChanges((before as Record<string, unknown>)[k], (after as Record<string, unknown>)[k]);
    });
    return n;
  }
  return JSON.stringify(before) !== JSON.stringify(after) ? 1 : 0;
}

/* ─── Leaf value row ─────────────────────────────────────────────── */
function ValueRow({ label, before, after }: { label: string; before: string; after: string }) {
  const changed = before !== after;
  return (
    <div className={`flex items-start gap-3 py-1.5 px-2 rounded-sm ${changed ? 'bg-bg-base/60' : ''}`}>
      <span className={`text-xs w-36 shrink-0 font-medium ${changed ? 'text-text-primary' : 'text-text-muted'}`}>
        {humanize(label)}
      </span>
      {changed ? (
        <span className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-950 border border-red-900/40 text-red-300 font-mono text-xs line-through">
            {before || '—'}
          </span>
          <ChevronRight size={12} className="text-text-muted shrink-0" />
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-950 border border-cyan-900/40 text-cyan-300 font-mono text-xs font-semibold">
            {after || '—'}
          </span>
          <span className="text-[10px] font-semibold text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded">
            changed
          </span>
        </span>
      ) : (
        <span className="font-mono text-xs text-text-muted">{before || '—'}</span>
      )}
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────────────── */
function SectionHeader({ label, depth, hasChanges }: { label: string; depth: number; hasChanges: boolean }) {
  const sizes = ['text-sm font-semibold', 'text-xs font-semibold', 'text-xs font-medium'];
  const colors = ['text-text-primary', 'text-text-primary', 'text-text-muted'];
  const sz = Math.min(depth, sizes.length - 1);
  return (
    <div className={`flex items-center gap-2 mt-${depth === 0 ? '4' : '2'} mb-1`}>
      <span className={`${sizes[sz]} ${colors[sz]}`}>{humanize(label)}</span>
      {hasChanges && (
        <span className="text-[10px] font-semibold text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded">
          modified
        </span>
      )}
    </div>
  );
}

/* ─── Recursive diff node ────────────────────────────────────────── */
function DiffNode({
  before,
  after,
  label,
  depth = 0,
}: {
  before: unknown;
  after: unknown;
  label: string;
  depth?: number;
}) {
  // Both primitives → value row
  if (isPrimitive(before) && isPrimitive(after)) {
    return (
      <ValueRow
        label={label}
        before={String(before ?? '')}
        after={String(after ?? '')}
      />
    );
  }

  // Both arrays
  if (Array.isArray(before) || Array.isArray(after)) {
    const bArr = Array.isArray(before) ? before : [before];
    const aArr = Array.isArray(after)  ? after  : [after];
    const len  = Math.max(bArr.length, aArr.length);
    const changed = countChanges(before, after) > 0;

    return (
      <div className={depth > 0 ? 'ml-3' : ''}>
        <SectionHeader label={label} depth={depth} hasChanges={changed} />
        <div className="border-l border-border-panel pl-3 ml-1 space-y-0.5">
          {Array.from({ length: len }, (_, i) => (
            <DiffNode
              key={i}
              before={bArr[i]}
              after={aArr[i]}
              // Only show "Item N" label when there are multiple items
              label={len > 1 ? `Item ${i + 1}` : ''}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    );
  }

  // Both objects (or one is object)
  if (typeof before === 'object' || typeof after === 'object') {
    const bObj = (before && typeof before === 'object' && !Array.isArray(before))
      ? (before as Record<string, unknown>) : {};
    const aObj = (after  && typeof after  === 'object' && !Array.isArray(after))
      ? (after  as Record<string, unknown>) : {};

    const keys    = Array.from(new Set([...Object.keys(bObj), ...Object.keys(aObj)]));
    const changed = countChanges(before, after) > 0;

    // If label is empty (single-item array shortcut), skip the section header
    return (
      <div className={depth > 0 && label ? 'ml-3' : ''}>
        {label && <SectionHeader label={label} depth={depth} hasChanges={changed} />}
        <div className={`${label ? 'border-l border-border-panel pl-3 ml-1' : ''} space-y-0.5`}>
          {keys.map(k => (
            <DiffNode
              key={k}
              before={bObj[k]}
              after={aObj[k]}
              label={k}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <ValueRow
      label={label}
      before={JSON.stringify(before)}
      after={JSON.stringify(after)}
    />
  );
}

/* ─── Modal ──────────────────────────────────────────────────────── */
export default function ParamDiffModal({ open, onClose, entry }: Props) {
  if (!entry) return null;

  const totalChanged = countChanges(entry.beforeState, entry.afterState);

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[640px] max-h-[85vh] overflow-y-auto bg-bg-panel rounded-card border border-border-panel shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div className="flex items-center gap-3">
              <Dialog.Title className="text-base font-semibold text-text-primary">
                Parameter Changes
              </Dialog.Title>
              <span className="equipment-badge">{entry.equipmentCode}</span>
              <span className="text-xs font-mono text-text-muted">{entry.ruleName}</span>
            </div>
            <Dialog.Close className="text-text-muted hover:text-text-primary transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Subtitle */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-border-panel">
            <p className="text-xs text-text-muted">
              {entry.timestamp}&nbsp;&bull;&nbsp;Changed by:&nbsp;
              <span className="text-text-primary">{entry.userEmail}</span>
            </p>
            {totalChanged > 0 && (
              <span className="text-xs font-semibold text-accent-blue">
                {totalChanged} field{totalChanged !== 1 ? 's' : ''} changed
              </span>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 px-6 py-2.5 border-b border-border-panel bg-bg-base/40">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Before
            </span>
            <ChevronRight size={11} className="text-text-muted" />
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              After
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text-muted ml-2">
              <span className="w-2 h-2 rounded-full bg-[#1e2a3a] inline-block border border-[#334155]" />
              Unchanged (shown for context)
            </span>
          </div>

          {/* Hierarchical diff */}
          <div className="px-6 py-4">
            {Object.keys(entry.beforeState).length === 0 && Object.keys(entry.afterState).length === 0 ? (
              <p className="py-8 text-center text-text-muted text-sm">No parameter data available</p>
            ) : (
              <DiffNode
                before={entry.beforeState}
                after={entry.afterState}
                label=""
                depth={0}
              />
            )}
          </div>

          {/* Footer */}
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
