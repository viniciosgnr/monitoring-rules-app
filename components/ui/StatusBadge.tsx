type Status = 'to_be_validated' | 'validation_in_progress' | 'validated' | 'rejected' | 'closed';

const MAP: Record<Status, { dot: string; label: string }> = {
  to_be_validated:       { dot: 'bg-amber-400',       label: 'To Be Validated'        },
  validation_in_progress:{ dot: 'bg-accent-blue',     label: 'Validation in Progress' },
  validated:             { dot: 'bg-status-ok',       label: 'Validated'              },
  rejected:              { dot: 'bg-status-error',    label: 'Rejected'               },
  closed:                { dot: 'bg-[#4b5563]',       label: 'Closed'                 },
};

export type { Status };

export default function StatusBadge({ status }: { status: Status }) {
  const { dot, label } = MAP[status] ?? MAP.closed;
  return (
    <span className="status-badge">
      <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
      {label}
    </span>
  );
}
