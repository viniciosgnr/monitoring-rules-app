type Status =
  | 'to_be_validated'
  | 'validation_in_progress'
  | 'validated'
  | 'rejected'
  | 'new'
  | 'review_in_progress'
  | 'eligible_for_em';

const MAP: Record<string, { dot: string; label: string }> = {
  to_be_validated:        { dot: 'bg-amber-400',       label: 'New' },
  new:                    { dot: 'bg-amber-400',       label: 'New' },
  validation_in_progress: { dot: 'bg-[#3B82F6]',       label: 'Review in Progress' },
  review_in_progress:     { dot: 'bg-[#3B82F6]',       label: 'Review in Progress' },
  validated:              { dot: 'bg-emerald-400',     label: 'Eligible for Event Manager' },
  eligible_for_em:        { dot: 'bg-emerald-400',     label: 'Eligible for Event Manager' },
  rejected:               { dot: 'bg-red-400',         label: 'Rejected' },
};

export type { Status };

export default function StatusBadge({ status }: { status: Status }) {
  const { label } = MAP[status] ?? { dot: 'bg-amber-400', label: status };
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-md bg-[#1E293B] border border-[#334155]/40 text-[#E2E8F0] text-xs font-semibold whitespace-nowrap">
      {label}
    </span>
  );
}
