interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
}

export default function KpiCard({ title, value, subtitle }: KpiCardProps) {
  return (
    <div className="bg-bg-card border border-border-panel rounded-card p-4 flex-1 min-w-[180px]">
      <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{title}</p>
      <p className="text-3xl font-semibold text-text-primary mt-1">{value}</p>
      <div className="kpi-bar" />
      <p className="text-xs text-text-muted">{subtitle}</p>
    </div>
  );
}
