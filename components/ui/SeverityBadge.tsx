import React from 'react';

export type Severity = 'Low' | 'Medium' | 'High' | string;

const SEVERITY_CONFIG: Record<string, { label: string; badge: string }> = {
  Low: {
    label: 'Low',
    badge: 'bg-[#62DE3A] text-black',
  },
  Medium: {
    label: 'Medium',
    badge: 'bg-[#FFA332] text-black',
  },
  High: {
    label: 'High',
    badge: 'bg-[#FF5F64] text-black',
  },
};

export default function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity || severity === '—') {
    return <span className="text-[#64748B] text-xs font-mono">—</span>;
  }

  // Normalize case (e.g., 'low', 'LOW', 'Low')
  const key = severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
  const config = SEVERITY_CONFIG[key] || {
    label: severity,
    badge: 'bg-[#94A3B8] text-black',
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-semibold font-sans ${config.badge}`}
    >
      {config.label}
    </span>
  );
}
