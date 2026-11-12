'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: {
    timeKey: string;
    'New': number;
    'Review in Progress': number;
    'Eligible for Event Manager': number;
    'Rejected': number;
    _counts?: Record<string, number>;
    _pcts?: Record<string, number>;
    _total?: number;
  }[];
  mode?: 'count' | 'percent';
}

// Official Figma Semantics:
// Green: Validated / Eligible for Event Manager (#22C55E)
// Orange: Review in Progress (#F59E0B)
// Red: Rejected (#EF4444)
// Blue: New (#3B82F6)
const STATUS_SERIES = [
  { key: 'Eligible for Event Manager', color: '#22C55E' },
  { key: 'Rejected', color: '#EF4444' },
  { key: 'Review in Progress', color: '#F59E0B' },
  { key: 'New', color: '#3B82F6' },
] as const;

export default function StatusAlertsChart({ data, mode = 'count' }: Props) {
  const isPercent = mode === 'percent';

  return (
    <div>
      {/* Official SLB Optisite Left-Aligned Legend */}
      <div className="flex items-center flex-wrap gap-x-5 gap-y-2 mb-4 select-none">
        {STATUS_SERIES.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-[3px] inline-block shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-[#CBD5E1]">{item.key}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 10 }}>
          <XAxis
            dataKey="timeKey"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: '#1E293B' }}
            tickLine={false}
            minTickGap={15}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={isPercent}
            domain={isPercent ? [0, 100] : [0, 'auto']}
            unit={isPercent ? '%' : ''}
          />
          <Tooltip
            cursor={{ fill: '#1E293B', opacity: 0.25 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0]?.payload as (Props['data'][0] | undefined);
              if (!point) return null;

              const total = point._total ?? STATUS_SERIES.reduce((sum, s) => sum + (Number(point[s.key]) || 0), 0);

              return (
                <div className="bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2.5 text-xs text-[#E2E8F0] shadow-lg space-y-1.5 min-w-[200px]">
                  <div className="font-semibold text-white pb-1 border-b border-[#1E293B]">
                    {label}
                  </div>
                  {STATUS_SERIES.map(s => {
                    const count = point._counts ? point._counts[s.key] : (point[s.key] || 0);
                    const pct = point._pcts
                      ? point._pcts[s.key]
                      : (total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0);

                    return (
                      <div key={s.key} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-[#CBD5E1]">
                          <span
                            className="w-2.5 h-2.5 rounded-[2px] inline-block shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.key} :
                        </span>
                        <span className="font-mono text-white">
                          {count} alerts ({pct}%)
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
          {STATUS_SERIES.map(item => (
            <Bar
              key={item.key}
              dataKey={item.key}
              stackId="a"
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
