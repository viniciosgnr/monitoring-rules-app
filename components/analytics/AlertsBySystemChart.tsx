'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface SystemAlertPoint {
  system: string;
  shortLabel: string;
  eligible: number;
  rejected: number;
  reviewInProgress: number;
  newCount: number;
  total: number;
}

interface Props {
  data: SystemAlertPoint[];
}

// Standardized Semantic Status Palette:
// Eligible for Event Manager: #22C55E (Green)
// Rejected: #EF4444 (Red)
// Review in Progress: #F59E0B (Amber/Orange)
// New: #3B82F6 (Blue)
const SYSTEM_STATUS_SERIES = [
  { key: 'eligible', label: 'Eligible for Event Manager', color: '#22C55E' },
  { key: 'rejected', label: 'Rejected', color: '#EF4444' },
  { key: 'reviewInProgress', label: 'Review in Progress', color: '#F59E0B' },
  { key: 'newCount', label: 'New', color: '#3B82F6' },
] as const;

export default function AlertsBySystemChart({ data }: Props) {
  const totals = (data || []).map(d => d.total).filter(v => typeof v === 'number' && !isNaN(v));
  const maxVal = totals.length > 0 ? Math.max(...totals) : 10;
  const yMax = Math.max(10, Math.ceil((maxVal * 1.15) / 5) * 5);

  return (
    <div>
      {/* Official SLB Optisite Left-Aligned Legend */}
      <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mb-4 select-none">
        {SYSTEM_STATUS_SERIES.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-[3px] inline-block shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-[#CBD5E1]">{item.label}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 15, left: -15, bottom: 10 }}
        >
          <XAxis
            dataKey="shortLabel"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#1E293B' }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, yMax]}
          />
          <Tooltip
            cursor={{ fill: '#1E293B', opacity: 0.25 }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0]?.payload as SystemAlertPoint | undefined;
              if (!point) return null;

              const total = point.total || 0;
              const pct = (val: number) => (total > 0 ? ((val / total) * 100).toFixed(1) : '0.0');

              return (
                <div className="bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2.5 text-xs text-[#E2E8F0] shadow-lg space-y-1.5">
                  <div className="font-semibold text-white pb-1 border-b border-[#1E293B]">
                    {point.system}
                  </div>
                  {SYSTEM_STATUS_SERIES.map(s => {
                    const countVal = point[s.key];
                    return (
                      <div key={s.key} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                          <span
                            className="w-2.5 h-2.5 rounded-[2px] inline-block"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.label} :
                        </span>
                        <span className="font-mono text-white">
                          {countVal} alerts ({pct(countVal)}%)
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#1E293B]/80 text-[#94A3B8]">
                    <span>Total Alerts :</span>
                    <span className="font-mono font-semibold text-white">
                      {total} alerts
                    </span>
                  </div>
                </div>
              );
            }}
          />
          {SYSTEM_STATUS_SERIES.map(item => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stackId="system"
              fill={item.color}
              radius={[0, 0, 0, 0]}
              barSize={24}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
