type Status = 'accepted' | 'rejected' | 'pending';

const MAP: Record<Status, { dot: string; label: string }> = {
  accepted: { dot: 'bg-status-ok',    label: 'Accepted' },
  rejected: { dot: 'bg-status-error', label: 'Rejected' },
  pending:  { dot: 'bg-status-warn',  label: 'Pending'  },
};

export default function StatusBadge({ status }: { status: Status }) {
  const { dot, label } = MAP[status];
  return (
    <span className="status-badge">
      <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
      {label}
    </span>
  );
}
