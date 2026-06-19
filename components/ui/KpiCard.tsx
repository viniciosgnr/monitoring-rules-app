'use client';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  tooltip?: string;
}

export default function KpiCard({ title, value, subtitle, tooltip }: KpiCardProps) {
  return (
    <div className="bg-bg-card border border-border-panel rounded-card p-4 flex-1 min-w-[180px]">
      <div className="flex items-center gap-1.5">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{title}</p>
        {tooltip && (
          <span className="relative group cursor-help">
            {/* Trigger icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12" height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-text-muted group-hover:text-accent-blue transition-colors"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>

            {/* Tooltip panel */}
            <span
              className="
                absolute left-1/2 -translate-x-1/2 bottom-full mb-2
                w-60 bg-bg-panel border border-border-panel rounded-card
                shadow-xl px-3 py-2.5 text-xs text-text-muted leading-relaxed
                opacity-0 pointer-events-none
                group-hover:opacity-100 group-hover:pointer-events-auto
                transition-opacity duration-150 z-50
                whitespace-normal text-left
              "
            >
              {tooltip}
              {/* Arrow */}
              <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-border-panel" />
            </span>
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold text-text-primary mt-1">{value}</p>
      <div className="kpi-bar" />
      <p className="text-xs text-text-muted">{subtitle}</p>
    </div>
  );
}
