'use client';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tooltip?: string;
}

export default function KpiCard({ title, value, subtitle, tooltip }: KpiCardProps) {
  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 flex-1 min-w-[180px] shadow-sm">
      <div className="flex items-center gap-1.5">
        <p className="text-xs text-[#94A3B8] font-normal tracking-wide">{title}</p>
        {tooltip && (
          <span className="relative group cursor-help">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12" height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#64748B] group-hover:text-[#3B82F6] transition-colors"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>

            <span
              className="
                absolute left-1/2 -translate-x-1/2 bottom-full mb-2
                w-60 bg-[#1A2234] border border-[#2B3B55] rounded-xl
                shadow-xl px-3 py-2.5 text-xs text-[#94A3B8] leading-relaxed
                opacity-0 pointer-events-none
                group-hover:opacity-100 group-hover:pointer-events-auto
                transition-opacity duration-150 z-50
                whitespace-normal text-left
              "
            >
              {tooltip}
              <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#2B3B55]" />
            </span>
          </span>
        )}
      </div>
      <p className="text-2xl font-medium text-white mt-1.5">{value}</p>
      {subtitle && <p className="text-xs text-[#64748B] mt-1">{subtitle}</p>}
    </div>
  );
}
