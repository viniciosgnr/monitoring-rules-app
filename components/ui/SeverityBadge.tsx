import React from 'react';

export type Severity = 'Low' | 'Medium' | 'High' | string;

const SEVERITY_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  Low: {
    label: 'Low',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-400',
  },
  Medium: {
    label: 'Medium',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    dot: 'bg-amber-400',
  },
  High: {
    label: 'High',
    badge: 'bg-red-500/10 text-red-400 border-red-500/25',
    dot: 'bg-red-400',
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
    badge: 'bg-slate-500/10 text-slate-300 border-slate-500/25',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium font-sans ${config.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
