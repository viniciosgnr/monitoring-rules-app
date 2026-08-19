type Status = 'to_be_validated' | 'validation_in_progress' | 'validated' | 'rejected' | 'closed';

const MAP: Record<Status, { dot: string; label: string }> = {
  to_be_validated:        { dot: 'bg-amber-400',       label: 'To Be Validated'        },
  validation_in_progress: { dot: 'bg-[#3B82F6]',       label: 'Validation in Progress' },
  validated:              { dot: 'bg-emerald-400',     label: 'Validated (New)'        },
  rejected:               { dot: 'bg-red-400',         label: 'Rejected'               },
  closed:                 { dot: 'bg-gray-400',        label: 'Closed'                 },
};

export type { Status };

export default function StatusBadge({ status }: { status: Status }) {
  const { dot, label } = MAP[status] ?? MAP.closed;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1E293B] border border-[#334155]/40 text-[#E2E8F0] text-xs font-normal whitespace-nowrap">
      <span className={`w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
      {label}
    </span>
  );
}
